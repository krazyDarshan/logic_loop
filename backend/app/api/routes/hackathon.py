from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from app.schemas.hackathon import HackathonEvaluateRequest
from app.services.hackathon_evaluator import evaluate_hackathon_project, parse_pdf_bytes

router = APIRouter()


@router.post("/evaluate")
async def evaluate_project(request: HackathonEvaluateRequest):
    """
    Evaluate a hackathon project submission.
    
    Accepts:
    - project_name: Name of the project
    - repo_url: GitHub repository URL
    - readme_text: (optional) README content
    - pitch_deck_text: (optional) Pitch deck content as text
    
    Returns scores for code quality, innovation, documentation,
    plus a recruiter summary and detected tech stack.
    """
    result = evaluate_hackathon_project(
        project_name=request.project_name,
        repo_url=request.repo_url,
        readme_text=request.readme_text or "",
        pitch_deck_text=request.pitch_deck_text or ""
    )
    return result


@router.post("/evaluate-with-deck")
async def evaluate_project_with_deck(
    project_name: str = Form(...),
    repo_url: str = Form(...),
    readme_text: Optional[str] = Form(""),
    pitch_deck: Optional[UploadFile] = File(None, description="Upload pitch deck PDF")
):
    """
    Same as /evaluate but allows uploading a pitch deck PDF file.
    """
    pitch_text = ""
    if pitch_deck:
        file_bytes = await pitch_deck.read()
        pitch_text = parse_pdf_bytes(file_bytes)

    result = evaluate_hackathon_project(
        project_name=project_name,
        repo_url=repo_url,
        readme_text=readme_text or "",
        pitch_deck_text=pitch_text
    )
    return result
