from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    mode: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    job_id: str
    candidate_id: str
    resume_url: Optional[str] = None
    github_link: Optional[str] = None
    status: Optional[str] = "applied"
    match_score: Optional[float] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationWithCandidate(ApplicationResponse):
    candidate: dict # Simplified candidate payload for recruiter view

    class Config:
        from_attributes = True
