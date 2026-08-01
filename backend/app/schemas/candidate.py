from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class SkillSignal(BaseModel):
    name: str
    level: int
    verified: bool
    sources: List[str]


class CandidateBase(BaseModel):
    id: str
    name: str
    initials: str
    email: Optional[EmailStr] = None
    linkedin_url: Optional[str] = None
    github_handle: Optional[str] = None
    role: str
    location: str
    experience: int
    availability: str
    summary: str
    skills: List[SkillSignal]
    github: Dict[str, Any]
    resume: Dict[str, Any]
    # hackathons info now lives only in hackathon_projects (see
    # HackathonProjectResponse below) — no duplicated field here.
    interview: Dict[str, Any]
    trust: Dict[str, Any]
    source: str


class CandidateCreate(CandidateBase):
    score_total: float
    score_confidence: float
    score_dimensions: Dict[str, Any]


class CandidateResponse(CandidateCreate):
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Hackathon project schemas (RAG / pgvector) ---

class HackathonProjectBase(BaseModel):
    project_name: str
    github_repo_url: str
    hackathon_name: Optional[str] = None
    code_quality_score: Optional[float] = None
    innovation_score: Optional[float] = None
    documentation_score: Optional[float] = None
    overall_score: Optional[float] = None
    technical_stack: Optional[List[str]] = None
    innovation_summary: Optional[str] = None
    recruiter_summary: Optional[str] = None


class HackathonProjectCreate(HackathonProjectBase):
    candidate_id: str
    project_embedding: Optional[List[float]] = None  # 384-dim vector


class HackathonProjectResponse(HackathonProjectBase):
    id: int
    candidate_id: str
    created_at: Optional[datetime] = None

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