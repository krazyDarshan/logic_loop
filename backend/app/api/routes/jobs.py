from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.db import models
from app.schemas import job, candidate

router = APIRouter()

@router.get("/", response_model=List[job.JobResponse])
def get_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = db.query(models.Job).offset(skip).limit(limit).all()
    return jobs

@router.post("/", response_model=job.JobResponse)
def create_job(job_data: job.JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(
        id=str(uuid.uuid4()),
        **job_data.model_dump()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.post("/{id}/apply", response_model=job.ApplicationResponse)
def apply_to_job(id: str, app_data: job.ApplicationCreate, db: Session = Depends(get_db)):
    job_record = db.query(models.Job).filter(models.Job.id == id).first()
    if not job_record:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidate_record = db.query(models.Candidate).filter(models.Candidate.id == app_data.candidate_id).first()
    if not candidate_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Check if already applied
    existing_app = db.query(models.JobApplication).filter(
        models.JobApplication.job_id == id,
        models.JobApplication.candidate_id == app_data.candidate_id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="Candidate already applied to this job")
        
    new_app = models.JobApplication(
        id=str(uuid.uuid4()),
        job_id=id,
        candidate_id=app_data.candidate_id,
        resume_url=app_data.resume_url,
        github_link=app_data.github_link,
        status="applied",
        match_score=app_data.match_score
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("/{id}/applications", response_model=List[job.ApplicationWithCandidate])
def get_job_applications(id: str, db: Session = Depends(get_db)):
    applications = db.query(models.JobApplication).filter(models.JobApplication.job_id == id).all()
    
    results = []
    for app in applications:
        cand = db.query(models.Candidate).filter(models.Candidate.id == app.candidate_id).first()
        if cand:
            # Manually construct response to inject candidate payload
            app_dict = {
                "id": app.id,
                "job_id": app.job_id,
                "candidate_id": app.candidate_id,
                "resume_url": app.resume_url,
                "github_link": app.github_link,
                "status": app.status,
                "match_score": app.match_score,
                "created_at": app.created_at,
                "candidate": {
                    "id": cand.id,
                    "name": cand.name,
                    "role": cand.role,
                    "location": cand.location,
                    "score_total": cand.score_total,
                    "github_handle": cand.github_handle,
                    "email": cand.email
                }
            }
            results.append(app_dict)
    return results
