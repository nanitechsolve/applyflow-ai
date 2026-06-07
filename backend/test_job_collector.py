from job_collector import collect_job

# Paste any job URL you find online
# For example a job from LinkedIn, Indeed, Glassdoor etc.
url = "https://www.pnet.co.za/jobs--FACILITIES-IT-SUPPORT-Kempton-Park-Kay-Solomon-Recruitment--4209749-inline.html?rltr=1_1_25_seorl_m_0_0_0_0_0_0"

job_id = collect_job(url)

if job_id:
    print(f"\n🎉 Job successfully collected!")
    print(f"Job ID: {job_id}")
else:
    print("\n❌ Failed to collect job")