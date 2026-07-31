from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models
from app.schemas import candidate

router = APIRouter()

@router.get("/", response_model=List[candidate.CandidateResponse])
def get_candidates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).offset(skip).limit(limit).all()
    return candidates

@router.post("/", response_model=candidate.CandidateResponse)
def create_candidate(cand: candidate.CandidateCreate, db: Session = Depends(get_db)):
    db_cand = db.query(models.Candidate).filter(models.Candidate.id == cand.id).first()
    if db_cand:
        raise HTTPException(status_code=400, detail="Candidate already exists")
    
    new_cand = models.Candidate(**cand.model_dump())
    db.add(new_cand)
    db.commit()
    db.refresh(new_cand)
    return new_cand
