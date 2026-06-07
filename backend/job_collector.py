import httpx
from bs4 import BeautifulSoup
from db import supabase

def fetch_page(url):
    """Visit a URL and return the page HTML"""
    print(f"🌐 Fetching: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"❌ Failed to fetch page: {e}")
        return None

def extract_job_details(html, url):
    """Extract job title, company and description from a job page"""
    soup = BeautifulSoup(html, "html.parser")

    # Remove scripts and styles (we don't need those)
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    # Try to get job title
    title = None
    for selector in ["h1", "h2", ".job-title", ".position-title", '[class*="title"]']:
        element = soup.select_one(selector)
        if element and len(element.get_text(strip=True)) > 3:
            title = element.get_text(strip=True)
            break

    # Try to get company name
    company = None
    for selector in [".company-name", ".employer", '[class*="company"]', '[class*="employer"]']:
        element = soup.select_one(selector)
        if element:
            company = element.get_text(strip=True)
            break

    # Get the full page text as job description
    description = soup.get_text(separator="\n", strip=True)

    # Clean up description - remove very short lines
    lines = [line.strip() for line in description.splitlines() if len(line.strip()) > 30]
    description_clean = "\n".join(lines[:100])  # keep first 100 meaningful lines

    return {
        "title":           title or "Unknown Title",
        "company":         company or "Unknown Company",
        "description_raw": description_clean,
        "url":             url,
        "source":          "manual_url"
    }

def save_job_to_supabase(job):
    """Save a job to the jobs table in Supabase"""
    print(f"💾 Saving job to Supabase...")

    # Check if job already exists
    existing = supabase.table("jobs").select("id").eq("url", job["url"]).execute()
    if existing.data:
        print(f"⚠️  Job already exists in database, skipping.")
        return existing.data[0]["id"]

    result = supabase.table("jobs").insert({
        "url":             job["url"],
        "title":           job["title"],
        "company":         job["company"],
        "description_raw": job["description_raw"],
        "source":          job["source"],
        "status":          "new"
    }).execute()

    job_id = result.data[0]["id"]
    print(f"✅ Job saved with ID: {job_id}")

    # Log this action
    supabase.table("audit_log").insert({
        "event_type": "JOB_FOUND",
        "job_id":     job_id,
        "message":    f"Job found: {job['title']} at {job['company']}",
    }).execute()

    return job_id

def collect_job(url):
    """
    Main function — takes a job URL and saves it to Supabase
    """
    # Step 1: Fetch the page
    html = fetch_page(url)
    if not html:
        return None

    # Step 2: Extract job details
    job = extract_job_details(html, url)

    print(f"\n📋 Job details found:")
    print(f"   Title:   {job['title']}")
    print(f"   Company: {job['company']}")
    print(f"   Description length: {len(job['description_raw'])} characters")

    # Step 3: Save to Supabase
    job_id = save_job_to_supabase(job)

    return job_id