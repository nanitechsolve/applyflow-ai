from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from pathlib import Path

from cv_parser import parse_cv, save_profile_to_supabase
from job_collector import collect_job
from job_matcher import match_job, match_all_unscored_jobs
from cv_generator import generate_documents
from db import supabase

# Create FastAPI app
app = FastAPI(
    title="ApplyFlow AI",
    description="Semi-automated job application assistant",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads folder if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ─── MODELS ───────────────────────────────────────────────
class JobURL(BaseModel):
    url: str

class JobID(BaseModel):
    job_id: str


# ─── HEALTH CHECK ─────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "✅ ApplyFlow AI is running"}


# ─── PROFILE ENDPOINTS ────────────────────────────────────
@app.post("/profile/upload")
async def upload_cv(file: UploadFile = File(...)):
    """Upload and parse a CV file"""
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse the CV
        profile = parse_cv(str(file_path))

        # Save to Supabase
        profile_id = save_profile_to_supabase(profile)

        return {
            "success":    True,
            "profile_id": profile_id,
            "name":       profile["name"],
            "email":      profile["email"],
            "skills":     len(profile["skills"]),
            "experience": len(profile["experience"]),
            "education":  len(profile["education"])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profile")
def get_profile():
    """Get the most recent profile"""
    try:
        profile = supabase.table("profile").select("*").order("created_at", desc=True).limit(1).execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="No profile found")

        profile_id = profile.data[0]["id"]

        skills = supabase.table("skills").select("*").eq("profile_id", profile_id).execute()
        experience = supabase.table("experience").select("*").eq("profile_id", profile_id).execute()
        education = supabase.table("education").select("*").eq("profile_id", profile_id).execute()

        return {
            "profile":    profile.data[0],
            "skills":     skills.data,
            "experience": experience.data,
            "education":  education.data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── JOB ENDPOINTS ────────────────────────────────────────
@app.post("/jobs/collect")
def collect_job_endpoint(body: JobURL):
    """Collect a job from a URL"""
    try:
        job_id = collect_job(body.url)

        if not job_id:
            raise HTTPException(status_code=400, detail="Failed to collect job")

        return {
            "success": True,
            "job_id":  job_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs")
def get_all_jobs():
    """Get all jobs from the database"""
    try:
        jobs = supabase.table("jobs").select("*").order("fetched_at", desc=True).execute()
        return {"jobs": jobs.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    """Get a single job by ID"""
    try:
        job = supabase.table("jobs").select("*").eq("id", job_id).execute()

        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")

        return {"job": job.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── MATCHING ENDPOINTS ───────────────────────────────────
@app.post("/jobs/match/{job_id}")
def match_single_job(job_id: str):
    """Match a single job against the profile"""
    try:
        result = match_job(job_id)

        if not result:
            raise HTTPException(status_code=400, detail="Matching failed")

        return {"success": True, "result": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/jobs/match-all")
def match_all_jobs():
    """Match all unscored jobs"""
    try:
        results = match_all_unscored_jobs()
        return {"success": True, "matched": len(results), "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── GENERATOR ENDPOINTS ──────────────────────────────────
@app.post("/jobs/generate/{job_id}")
def generate_job_documents(job_id: str):
    """Generate tailored CV and cover letter for a job"""
    try:
        result = generate_documents(job_id)

        if not result:
            raise HTTPException(status_code=400, detail="Generation failed")

        return {
            "success": True,
            "cv_id":   result["cv_id"],
            "cl_id":   result["cl_id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/{job_id}")
def get_documents(job_id: str):
    """Get all generated documents for a job"""
    try:
        docs = supabase.table("generated_docs").select("*").eq("job_id", job_id).execute()
        return {"documents": docs.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── AUDIT LOG ENDPOINTS ──────────────────────────────────
@app.get("/logs")
def get_logs():
    """Get all audit logs"""
    try:
        logs = supabase.table("audit_log").select("*").order("created_at", desc=True).limit(50).execute()
        return {"logs": logs.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── DASHBOARD STATS ──────────────────────────────────────
@app.get("/stats")
def get_stats():
    """Get dashboard statistics"""
    try:
        total_jobs   = supabase.table("jobs").select("id", count="exact").execute()
        matched_jobs = supabase.table("jobs").select("id", count="exact").gte("match_score", 60).execute()
        docs         = supabase.table("generated_docs").select("id", count="exact").execute()
        applications = supabase.table("applications").select("id", count="exact").eq("outcome", "submitted").execute()

        return {
            "total_jobs":        total_jobs.count,
            "matched_jobs":      matched_jobs.count,
            "documents_created": docs.count,
            "submitted":         applications.count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))