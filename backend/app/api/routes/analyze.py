from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import List, Optional
import json
from app.services.resume_analyzer import extract_text_from_pdf, analyze_resume_text
from app.services.github_analyzer import analyze_github_profile
from app.schemas.candidate import ResumeAnalyzeRequest, GitHubAnalyzeRequest, FullAnalyzeRequest

router = APIRouter()

@router.post("/resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None)
):
    if not file.filename.endswith('.pdf' or '.docx'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    try:
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        
        parsed_keywords = None
        if keywords:
            parsed_keywords = json.loads(keywords)
            
        analysis = analyze_resume_text(text, job_role=job_role, keywords=parsed_keywords)
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
            
        return {"filename": file.filename, "analysis": analysis}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Keywords must be a valid JSON array, e.g. [\"Python\", \"FastAPI\"]")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/github")
async def analyze_github(request: GitHubAnalyzeRequest):
    analysis = analyze_github_profile(request.username, job_role=request.job_role, keywords=request.keywords)
    if "error" in analysis:
        raise HTTPException(status_code=500, detail=analysis["error"])
        
    return {"username": request.username, "analysis": analysis}

@router.post("/full")
async def analyze_full(
    file: UploadFile = File(...),
    github_username: str = Form(...),
    job_role: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None)
):
    """
    Analyze both a resume PDF and a GitHub profile together.
    Returns individual scores plus a combined total_score.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Parse keywords
        parsed_keywords = None
        if keywords:
            parsed_keywords = json.loads(keywords)

        # --- Resume Analysis ---
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        resume_analysis = analyze_resume_text(text, job_role=job_role, keywords=parsed_keywords)
        if "error" in resume_analysis:
            raise HTTPException(status_code=500, detail=f"Resume analysis failed: {resume_analysis['error']}")

        # --- GitHub Analysis ---
        github_analysis = analyze_github_profile(github_username, job_role=job_role, keywords=parsed_keywords)
        if "error" in github_analysis:
            raise HTTPException(status_code=500, detail=f"GitHub analysis failed: {github_analysis['error']}")

        # --- Compute Combined Total Score ---
        resume_score = resume_analysis.get("resume_total_score", 50)
        github_score = github_analysis.get("github_total_score", 50)
        
        # Weighted: Resume 60%, GitHub 40%
        combined_total = round(resume_score * 0.60 + github_score * 0.40)

        return {
            "filename": file.filename,
            "github_username": github_username,
            "job_role": job_role,
            "resume_analysis": resume_analysis,
            "github_analysis": github_analysis,
            "scores_summary": {
                "resume_total_score": resume_score,
                "github_total_score": github_score,
                "combined_total_score": combined_total,
                "weight_split": "Resume 60% | GitHub 40%"
            }
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Keywords must be a valid JSON array, e.g. [\"Python\", \"FastAPI\"]")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
