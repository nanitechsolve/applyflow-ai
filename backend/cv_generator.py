import os
from dotenv import load_dotenv
from db import supabase

from pathlib import Path
load_dotenv(Path(__file__).parent.parent / ".env")

# We will use this once you have API credits
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

def build_cv_prompt(profile, job):
    """Build the prompt we will send to Claude"""
    skills = ", ".join([s["skill"] for s in profile.get("skills", [])])
    
    experience = "\n".join([
        f"- {e.get('role')} at {e.get('company')}: {e.get('description', '')}"
        for e in profile.get("experience", [])
    ])
    
    education = "\n".join([
        f"- {e.get('degree')} in {e.get('field')} at {e.get('institution')} ({e.get('year', '')})"
        for e in profile.get("education", [])
    ])

    return f"""
You are an expert CV writer. Tailor this candidate's CV to match the job description below.

STRICT RULES:
- Never fabricate skills or experience not already listed
- Only reframe existing experience using keywords from the job description
- Keep all facts, dates, companies and titles exactly the same
- Make it ATS friendly by naturally including job keywords

CANDIDATE PROFILE:
Name: {profile.get('name')}
Summary: {profile.get('summary')}
Skills: {skills}
Experience:
{experience}
Education:
{education}

JOB TITLE: {job.get('title')}
COMPANY: {job.get('company')}
JOB DESCRIPTION:
{job.get('description_raw', '')[:2000]}

Write a tailored CV summary and rewrite the experience bullet points to align with this job.
Output as plain text.
"""

def build_cover_letter_prompt(profile, job, match_score):
    """Build the cover letter prompt"""
    skills = ", ".join([s["skill"] for s in profile.get("skills", [])][:10])

    return f"""
Write a compelling and authentic cover letter for this job application.

CANDIDATE:
Name: {profile.get('name')}
Summary: {profile.get('summary')}
Top Skills: {skills}

JOB: {job.get('title')} at {job.get('company')}
MATCH SCORE: {match_score}/100

JOB DESCRIPTION:
{job.get('description_raw', '')[:1500]}

RULES:
- 3 paragraphs: opening hook + evidence + closing
- Reference the company by name
- Mention 2-3 real achievements from the candidate profile
- Never fabricate anything
- Professional but human tone
- Maximum 300 words

Write only the cover letter text.
"""

def generate_with_claude(prompt):
    """Call the Claude API to generate content"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return message.content[0].text
    
    except Exception as e:
        print(f"⚠️  Claude API not available: {e}")
        print("   Using placeholder text instead.")
        return None

def generate_placeholder_cv(profile, job):
    """Placeholder CV when API is not available"""
    skills = ", ".join([s["skill"] for s in profile.get("skills", [])][:10])
    return f"""
TAILORED CV SUMMARY FOR: {job.get('title')} at {job.get('company')}
Generated for: {profile.get('name')}

PROFESSIONAL SUMMARY:
Results-driven IT professional with experience in {skills}.
Applying for {job.get('title')} role at {job.get('company')}.

[Full AI-generated content will appear here once Anthropic API credits are added]

RELEVANT SKILLS:
{skills}

EXPERIENCE:
""" + "\n".join([
        f"- {e.get('role')} at {e.get('company')}"
        for e in profile.get("experience", [])
    ])

def generate_placeholder_cover_letter(profile, job):
    """Placeholder cover letter when API is not available"""
    return f"""
Dear Hiring Manager,

I am writing to express my interest in the {job.get('title')} position at {job.get('company')}.

With my background in IT support and technical expertise, I believe I would be a strong 
contributor to your team. My experience at Siyakholwa Development Foundation supporting 
55+ users has prepared me well for this role.

[Full AI-generated cover letter will appear here once Anthropic API credits are added]

Kind regards,
{profile.get('name')}
"""

def get_profile_from_supabase():
    """Load the most recent profile from Supabase"""
    profile_result = supabase.table("profile").select("*").order("created_at", desc=True).limit(1).execute()

    if not profile_result.data:
        print("❌ No profile found.")
        return None

    profile = profile_result.data[0]
    profile_id = profile["id"]

    skills_result = supabase.table("skills").select("*").eq("profile_id", profile_id).execute()
    profile["skills"] = skills_result.data

    exp_result = supabase.table("experience").select("*").eq("profile_id", profile_id).execute()
    profile["experience"] = exp_result.data

    edu_result = supabase.table("education").select("*").eq("profile_id", profile_id).execute()
    profile["education"] = edu_result.data

    return profile

def generate_documents(job_id):
    """
    Main function — generates tailored CV and cover letter for a job
    Saves both to Supabase
    """
    print(f"\n✍️  Generating documents for job {job_id}...")

    # Step 1: Load profile
    profile = get_profile_from_supabase()
    if not profile:
        return None

    # Step 2: Load job
    job_result = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job_result.data:
        print(f"❌ Job not found: {job_id}")
        return None

    job = job_result.data[0]
    match_score = job.get("match_score", 0)

    print(f"   Job: {job['title']} at {job['company']}")
    print(f"   Match score: {match_score}/100")

    # Step 3: Generate tailored CV
    print("\n   📄 Generating tailored CV...")
    cv_prompt = build_cv_prompt(profile, job)
    cv_content = generate_with_claude(cv_prompt)

    if not cv_content:
        cv_content = generate_placeholder_cv(profile, job)
        print("   ⚠️  Using placeholder CV")
    else:
        print("   ✅ CV generated with Claude!")

    # Step 4: Save CV to Supabase
    cv_result = supabase.table("generated_docs").insert({
        "job_id":    job_id,
        "doc_type":  "cv",
        "version":   1,
        "content":   cv_content
    }).execute()
    cv_id = cv_result.data[0]["id"]
    print(f"   ✅ CV saved with ID: {cv_id}")

    # Step 5: Generate cover letter
    print("\n   📝 Generating cover letter...")
    cl_prompt = build_cover_letter_prompt(profile, job, match_score)
    cl_content = generate_with_claude(cl_prompt)

    if not cl_content:
        cl_content = generate_placeholder_cover_letter(profile, job)
        print("   ⚠️  Using placeholder cover letter")
    else:
        print("   ✅ Cover letter generated with Claude!")

    # Step 6: Save cover letter to Supabase
    cl_result = supabase.table("generated_docs").insert({
        "job_id":   job_id,
        "doc_type": "cover_letter",
        "version":  1,
        "content":  cl_content
    }).execute()
    cl_id = cl_result.data[0]["id"]
    print(f"   ✅ Cover letter saved with ID: {cl_id}")

    # Step 7: Update job status
    supabase.table("jobs").update({
        "status": "generating"
    }).eq("id", job_id).execute()

    # Step 8: Log action
    supabase.table("audit_log").insert({
        "event_type": "DOC_GENERATED",
        "job_id":     job_id,
        "message":    f"CV and cover letter generated for {job['title']} at {job['company']}",
    }).execute()

    print(f"\n🎉 Documents generated and saved!")

    return {
        "cv_id":      cv_id,
        "cl_id":      cl_id,
        "cv_content": cv_content,
        "cl_content": cl_content
    }