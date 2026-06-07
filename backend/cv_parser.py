import pdfplumber
import docx
import re
from db import supabase

def extract_text_from_pdf(file_path):
    """Read all text from a PDF file"""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def extract_text_from_docx(file_path):
    """Read all text from a Word document"""
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def extract_email(text):
    """Find email address in text"""
    match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", text)
    return match.group(0) if match else None

def extract_phone(text):
    """Find phone number in text"""
    match = re.search(r"(\+?[\d\s\-().]{10,16})", text)
    return match.group(0).strip() if match else None

def extract_skills(lines):
    """Extract skills section from CV lines"""
    skills = []
    in_skills_section = False

    for line in lines:
        line_lower = line.lower().strip()

        # Detect skills section header
        if any(word in line_lower for word in ["skills", "technologies", "competencies"]):
            in_skills_section = True
            continue

        # Stop when we hit another section
        if in_skills_section and any(word in line_lower for word in ["experience", "education", "projects", "certifications"]):
            break

        # Extract skills from the section
        if in_skills_section and line.strip():
            # Skills can be comma separated or on separate lines
            items = re.split(r"[,•·\|]", line)
            for item in items:
                item = item.strip()
                if item and len(item) > 1:
                    skills.append(item)

    return skills[:30]  # max 30 skills

def extract_experience(lines):
    """Extract work experience section from CV lines"""
    experience = []
    in_experience_section = False
    current_job = None

    for line in lines:
        line_lower = line.lower().strip()

        # Detect experience section header
        if any(word in line_lower for word in ["experience", "employment", "work history"]):
            in_experience_section = True
            continue

        # Stop when we hit another section
        if in_experience_section and any(word in line_lower for word in ["education", "skills", "certifications", "projects"]):
            break

        if in_experience_section and line.strip():
            # Detect year patterns like 2020-2023 or 2022 - Present
            if re.search(r"\d{4}", line):
                if current_job:
                    experience.append(current_job)
                current_job = {
                    "role": line.strip(),
                    "company": "",
                    "description": "",
                    "is_current": "present" in line_lower
                }
            elif current_job:
                if not current_job["company"]:
                    current_job["company"] = line.strip()
                else:
                    current_job["description"] += " " + line.strip()

    if current_job:
        experience.append(current_job)

    return experience[:10]  # max 10 jobs

def extract_education(lines):
    """Extract education section from CV lines"""
    education = []
    in_education_section = False
    current_edu = None

    for line in lines:
        line_lower = line.lower().strip()

        # Detect education section header
        if any(word in line_lower for word in ["education", "academic", "qualifications"]):
            in_education_section = True
            continue

        # Stop when we hit another section
        if in_education_section and any(word in line_lower for word in ["experience", "skills", "projects"]):
            break

        if in_education_section and line.strip():
            if re.search(r"\d{4}", line):
                if current_edu:
                    education.append(current_edu)
                current_edu = {
                    "institution": line.strip(),
                    "degree": "",
                    "field": "",
                    "year": None
                }
                # Try to extract year
                year_match = re.search(r"\d{4}", line)
                if year_match:
                    current_edu["year"] = int(year_match.group(0))
            elif current_edu:
                if not current_edu["degree"]:
                    current_edu["degree"] = line.strip()
                else:
                    current_edu["field"] = line.strip()

    if current_edu:
        education.append(current_edu)

    return education

def parse_cv(file_path):
    """
    Main function — parses a CV file and returns structured data
    Supports PDF and DOCX
    """
    print(f"📄 Parsing CV: {file_path}")

    # Step 1: Extract raw text based on file type
    if file_path.endswith(".pdf"):
        text = extract_text_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        text = extract_text_from_docx(file_path)
    else:
        raise ValueError("❌ Unsupported file type. Please use PDF or DOCX.")

    # Step 2: Split into lines for section parsing
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Step 3: Extract each piece of information
    name    = lines[0] if lines else "Unknown"
    email   = extract_email(text)
    phone   = extract_phone(text)
    skills  = extract_skills(lines)
    experience = extract_experience(lines)
    education  = extract_education(lines)

    # Step 4: Build the profile summary (first 3 lines after name)
    summary = " ".join(lines[1:4]) if len(lines) > 3 else ""

    profile = {
        "name":       name,
        "email":      email,
        "phone":      phone,
        "summary":    summary,
        "skills":     skills,
        "experience": experience,
        "education":  education
    }

    print(f"✅ CV parsed successfully!")
    print(f"   Name:       {name}")
    print(f"   Email:      {email}")
    print(f"   Phone:      {phone}")
    print(f"   Skills:     {len(skills)} found")
    print(f"   Experience: {len(experience)} jobs found")
    print(f"   Education:  {len(education)} entries found")

    return profile

def save_profile_to_supabase(profile):
    """Save the parsed CV data into Supabase"""
    print("\n💾 Saving profile to Supabase...")

    # Save main profile
    result = supabase.table("profile").insert({
        "name":     profile["name"],
        "email":    profile["email"],
        "phone":    profile["phone"],
        "summary":  profile["summary"],
    }).execute()

    profile_id = result.data[0]["id"]
    print(f"   ✅ Profile saved with ID: {profile_id}")

    # Save skills
    if profile["skills"]:
        skills_data = [
            {"profile_id": profile_id, "skill": skill, "level": "intermediate"}
            for skill in profile["skills"]
        ]
        supabase.table("skills").insert(skills_data).execute()
        print(f"   ✅ {len(skills_data)} skills saved")

    # Save experience
    if profile["experience"]:
        exp_data = [
            {
                "profile_id":  profile_id,
                "company":     exp.get("company", ""),
                "role":        exp.get("role", ""),
                "description": exp.get("description", ""),
                "is_current":  exp.get("is_current", False)
            }
            for exp in profile["experience"]
        ]
        supabase.table("experience").insert(exp_data).execute()
        print(f"   ✅ {len(exp_data)} experience entries saved")

    # Save education
    if profile["education"]:
        edu_data = [
            {
                "profile_id":  profile_id,
                "institution": edu.get("institution", ""),
                "degree":      edu.get("degree", ""),
                "field":       edu.get("field", ""),
                "year":        edu.get("year")
            }
            for edu in profile["education"]
        ]
        supabase.table("education").insert(edu_data).execute()
        print(f"   ✅ {len(edu_data)} education entries saved")

    print(f"\n🎉 Profile fully saved to Supabase!")
    return profile_id