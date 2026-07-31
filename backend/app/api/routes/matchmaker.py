from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from app.schemas.matchmaker import MatchmakerTextRequest
from app.services.job_matchmaker import evaluate_cv_against_jd, extract_text_from_pdf

router = APIRouter()


@router.post("/evaluate")
async def evaluate_cv_pdf(
    cv_file: UploadFile = File(..., description="Upload candidate resume/CV as PDF"),
    jd_text: str = Form(..., description="Paste the job description text"),
    min_score: Optional[float] = Form(60.0),
    min_skills: Optional[float] = Form(50.0),
    min_tech: Optional[int] = Form(2)
):
    """
    Upload a resume PDF and a job description text.
    Returns ACCEPTED/REJECTED with match percentage, matched/missing skills,
    semantic similarity score, and rejection reasons.
    
    Uses SentenceTransformer embeddings (real ML model) — NOT an LLM.
    """
    file_bytes = await cv_file.read()
    cv_text = extract_text_from_pdf(file_bytes)
    
    if not cv_text:
        return {"error": "Could not extract text from the uploaded PDF."}
    
    result = evaluate_cv_against_jd(
        cv_text=cv_text,
        jd_text=jd_text,
        min_score=min_score,
        min_skills=min_skills,
        min_tech=min_tech
    )
    return result


@router.post("/evaluate-text")
async def evaluate_cv_text(request: MatchmakerTextRequest):
    """
    Same as /evaluate but accepts raw text instead of file uploads.
    Useful for testing and CLI integrations.
    """
    result = evaluate_cv_against_jd(
        cv_text=request.cv_text,
        jd_text=request.jd_text,
        min_score=request.min_score,
        min_skills=request.min_skills,
        min_tech=request.min_tech
    )
    return result
