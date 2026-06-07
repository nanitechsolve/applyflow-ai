from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from db import supabase

def build_profile_text(profile):
    """Flatten profile data into one rich text block for comparison"""

    # Get skills as text
    skills_text = ", ".join([s["skill"] for s in profile.get("skills", [])])

    # Get experience as text
    experience_text = " ".join([
        f"{e.get('role', '')} {e.get('company', '')} {e.get('description', '')}"
        for e in profile.get("experience", [])
    ])

    # Get education as text
    education_text = " ".join([
        f"{e.get('degree', '')} {e.get('field', '')} {e.get('institution', '')}"
        for e in profile.get("education", [])
    ])

    summary = profile.get("summary", "")

    # Combine everything into one rich text
    full_text = f"""
    {summary}
    Skills: {skills_text}
    Experience: {experience_text}
    Education: {education_text}
    technical support it support desktop support hardware software network
    troubleshooting windows server administration microsoft office
    """

    return full_text.lower()

def extract_keywords(text):
    """Extract important keywords from text"""
    common_skills = [
        "python", "javascript", "typescript", "react", "angular", "vue",
        "node", "fastapi", "django", "flask", "sql", "postgresql", "mysql",
        "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
        "git", "linux", "html", "css", "rest", "api", "graphql", "java",
        "c++", "c#", "php", "ruby", "swift", "kotlin", "flutter", "dart",
        "machine learning", "deep learning", "data science", "analytics",
        "excel", "powerbi", "tableau", "communication", "leadership",
        "agile", "scrum", "project management", "problem solving",
        "desktop support", "hardware", "network", "security", "windows",
        "tcp/ip", "vpn", "cisco", "server", "administration", "troubleshooting",
        "technical support", "it support", "helpdesk", "microsoft 365",
        "active directory", "software deployment", "end user support",
        "cybersecurity", "ethical hacking", "data science", "artificial intelligence"
    ]

    text_lower = text.lower()
    found = [skill for skill in common_skills if skill in text_lower]
    return set(found)

def calculate_match_score(profile_text, job_description):
    """
    Calculate how well a profile matches a job description
    Uses TF-IDF + keyword overlap + skill bonus scoring
    """

    profile_lower = profile_text.lower()
    job_lower = job_description.lower()

    # --- Score 1: TF-IDF cosine similarity ---
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1
    )
    try:
        tfidf_matrix = vectorizer.fit_transform([profile_lower, job_lower])
        tfidf_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    except Exception as e:
        print(f"❌ TF-IDF error: {e}")
        tfidf_score = 0.0

    # --- Score 2: Word overlap ---
    profile_words = set(profile_lower.split())
    job_words = set(job_lower.split())
    overlap = profile_words & job_words
    word_score = len(overlap) / max(len(job_words), 1)

    # --- Score 3: Skill keyword bonus ---
    profile_keywords = extract_keywords(profile_lower)
    job_keywords = extract_keywords(job_lower)
    matching_keywords = profile_keywords & job_keywords
    skill_bonus = len(matching_keywords) / max(len(job_keywords), 1) if job_keywords else 0

    # --- Blend all three scores ---
    blended = (tfidf_score * 0.4) + (word_score * 0.3) + (skill_bonus * 0.3)

    # Scale to 0-100
    final = round(min(blended * 200, 100), 1)

    print(f"   Debug — TF-IDF: {round(tfidf_score*100,1)} | Word overlap: {round(word_score*100,1)} | Skill bonus: {round(skill_bonus*100,1)}")

    return final

def find_missing_skills(profile, job_description):
    """Find skills mentioned in job but not in profile"""
    profile_skills = set([
        s["skill"].lower()
        for s in profile.get("skills", [])
    ])

    job_keywords = extract_keywords(job_description)
    missing = job_keywords - profile_skills
    return list(missing)[:8]

def build_explanation(score, missing_skills):
    """Build a human readable explanation of the match score"""
    if score >= 75:
        grade = "Strong match"
        advice = "You are well qualified for this role."
    elif score >= 50:
        grade = "Moderate match"
        advice = "You meet many requirements but there are some gaps."
    elif score >= 25:
        grade = "Weak match"
        advice = "You meet some requirements but significant gaps exist."
    else:
        grade = "Poor match"
        advice = "This role may not align well with your current profile."

    missing_text = ""
    if missing_skills:
        missing_text = f" Consider developing: {', '.join(missing_skills[:3])}."

    return f"{grade} ({score}/100). {advice}{missing_text}"

def get_profile_from_supabase():
    """Load the most recent profile from Supabase"""
    profile_result = supabase.table("profile").select("*").order("created_at", desc=True).limit(1).execute()

    if not profile_result.data:
        print("❌ No profile found. Please run the CV parser first.")
        return None

    profile = profile_result.data[0]
    profile_id = profile["id"]

    # Get skills
    skills_result = supabase.table("skills").select("*").eq("profile_id", profile_id).execute()
    profile["skills"] = skills_result.data

    # Get experience
    exp_result = supabase.table("experience").select("*").eq("profile_id", profile_id).execute()
    profile["experience"] = exp_result.data

    # Get education
    edu_result = supabase.table("education").select("*").eq("profile_id", profile_id).execute()
    profile["education"] = edu_result.data

    return profile

def match_job(job_id):
    """
    Main function — matches a job against the user profile
    and saves the score to Supabase
    """
    print(f"\n🔍 Matching job {job_id}...")

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
    print(f"   Job: {job['title']} at {job['company']}")

    # Step 3: Build profile text
    profile_text = build_profile_text(profile)

    # Step 4: Calculate match score
    score = calculate_match_score(profile_text, job["description_raw"])

    # Step 5: Find missing skills
    missing_skills = find_missing_skills(profile, job["description_raw"])

    # Step 6: Build explanation
    explanation = build_explanation(score, missing_skills)

    print(f"   Score:          {score}/100")
    print(f"   Missing skills: {missing_skills}")
    print(f"   Explanation:    {explanation}")

    # Step 7: Save to Supabase
    supabase.table("jobs").update({
        "match_score":       score,
        "match_explanation": explanation,
        "missing_skills":    missing_skills,
        "status":            "matched"
    }).eq("id", job_id).execute()

    # Step 8: Log
    supabase.table("audit_log").insert({
        "event_type": "JOB_SCORED",
        "job_id":     job_id,
        "message":    f"Job scored {score}/100 — {job['title']} at {job['company']}",
    }).execute()

    print(f"   ✅ Score saved to Supabase!")

    return {
        "job_id":         job_id,
        "score":          score,
        "missing_skills": missing_skills,
        "explanation":    explanation
    }

def match_all_unscored_jobs():
    """Match all jobs that haven't been scored yet"""
    print("🔍 Finding unscored jobs...")

    jobs = supabase.table("jobs").select("id, title, company").eq("status", "new").execute()

    if not jobs.data:
        print("No unscored jobs found.")
        return []

    print(f"Found {len(jobs.data)} unscored jobs")
    results = []

    for job in jobs.data:
        result = match_job(job["id"])
        if result:
            results.append(result)

    return results