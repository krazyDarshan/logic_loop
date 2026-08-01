from sqlalchemy import (
    Column, Integer, String, Float, Text, ForeignKey,
    TIMESTAMP, ARRAY, CheckConstraint, Index, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    initials = Column(String(10))

    # Merged in from teammate's schema
    email = Column(String(255), unique=True, index=True)
    linkedin_url = Column(String(255))
    github_handle = Column(String(100), index=True)  # fast lookup/join; full analysis stays in `github` JSONB

    role = Column(String(255))
    location = Column(String(255))
    experience = Column(Integer)
    availability = Column(String(50))
    summary = Column(Text)

    skills = Column(JSONB, default=list)
    github = Column(JSONB, default=dict)
    resume = Column(JSONB, default=dict)
    # hackathons info is NOT duplicated here — hackathon_projects (below) is the
    # single source of truth. Use the `hackathon_projects` relationship, or the
    # `candidate_hackathon_summary` SQL view for fast rollups without a manual join.
    interview = Column(JSONB, default=dict)
    trust = Column(JSONB, default=dict)

    score_total = Column(Float, default=0.0)
    score_confidence = Column(Float, default=0.0)
    score_dimensions = Column(JSONB, default=dict)

    source = Column(String(50), default="live")
    created_at = Column(TIMESTAMP(timezone=False), server_default=func.now())

    hackathon_projects = relationship(
        "HackathonProject", back_populates="candidate", cascade="all, delete-orphan"
    )


class HackathonProject(Base):
    __tablename__ = "hackathon_projects"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        String(64), ForeignKey("candidates.id", ondelete="CASCADE"), index=True
    )

    project_name = Column(String(255), nullable=False)
    github_repo_url = Column(String(500), nullable=False)
    hackathon_name = Column(String(255))

    code_quality_score = Column(Float)
    innovation_score = Column(Float)
    documentation_score = Column(Float)
    overall_score = Column(Float)

    technical_stack = Column(ARRAY(String))
    innovation_summary = Column(Text)
    recruiter_summary = Column(Text)

    # 384 dims matches all-MiniLM-L6-v2 — change if the embedding model changes
    project_embedding = Column(Vector(384))

    created_at = Column(TIMESTAMP(timezone=False), server_default=func.now())

    candidate = relationship("Candidate", back_populates="hackathon_projects")

    __table_args__ = (
        CheckConstraint("code_quality_score BETWEEN 0 AND 100", name="ck_code_quality_score"),
        CheckConstraint("innovation_score BETWEEN 0 AND 100", name="ck_innovation_score"),
        CheckConstraint("documentation_score BETWEEN 0 AND 100", name="ck_documentation_score"),
        CheckConstraint("overall_score BETWEEN 0 AND 100", name="ck_overall_score"),
    )


# Note: the HNSW vector index (`vector_cosine_ops`) is best created via the raw
# SQL migration in schema.sql — HNSW option support in SQLAlchemy depends on
# your installed pgvector-python version, so the migration is the reliable path.
Index("idx_hackathon_projects_candidate_id", HackathonProject.candidate_id)

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    mode = Column(String(50))
    salary = Column(String(100))
    description = Column(Text)
    created_at = Column(TIMESTAMP(timezone=False), server_default=func.now())
    
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(String(64), primary_key=True, index=True)
    job_id = Column(String(64), ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), index=True)
    
    resume_url = Column(String(500))
    github_link = Column(String(500))
    
    status = Column(String(50), default="applied")
    match_score = Column(Float)
    
    created_at = Column(TIMESTAMP(timezone=False), server_default=func.now())
    
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate")