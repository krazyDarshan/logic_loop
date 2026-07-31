from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SkillSignal(BaseModel):
    name: str
    level: int
    verified: bool
    sources: List[str]

class CandidateBase(BaseModel):
    id: str
    name: str
    initials: str
    role: str
    location: str
    experience: int
    availability: str
    summary: str
    skills: List[SkillSignal]
    github: Dict[str, Any]
    resume: Dict[str, Any]
    hackathons: Dict[str, Any]
    interview: Dict[str, Any]
    trust: Dict[str, Any]
    source: str

class CandidateCreate(CandidateBase):
    score_total: float
    score_confidence: float
    score_dimensions: Dict[str, Any]

class CandidateResponse(CandidateCreate):
    class Config:
        from_attributes = True

class ResumeAnalyzeRequest(BaseModel):
    job_role: Optional[str] = None
    keywords: Optional[List[str]] = None

class GitHubAnalyzeRequest(BaseModel):
    username: str
    job_role: Optional[str] = None
    keywords: Optional[List[str]] = None

class FullAnalyzeRequest(BaseModel):
    """Request schema for analyzing both resume + GitHub together."""
    github_username: str
    job_role: Optional[str] = None
    keywords: Optional[List[str]] = None
