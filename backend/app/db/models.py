from sqlalchemy import Column, Integer, String, Float, JSON
from .database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    initials = Column(String)
    role = Column(String)
    location = Column(String)
    experience = Column(Integer)
    availability = Column(String)
    summary = Column(String)
    
    skills = Column(JSON, default=list)
    github = Column(JSON, default=dict)
    resume = Column(JSON, default=dict)
    hackathons = Column(JSON, default=dict)
    interview = Column(JSON, default=dict)
    trust = Column(JSON, default=dict)
    
    score_total = Column(Float, default=0.0)
    score_confidence = Column(Float, default=0.0)
    score_dimensions = Column(JSON, default=dict)
    
    source = Column(String, default="live")
