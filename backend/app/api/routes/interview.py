from fastapi import APIRouter, HTTPException
from app.services.interview_agent import generate_interview_questions, evaluate_interview_answers
from app.schemas.interview import GenerateQuestionsRequest, SubmitAnswersRequest

router = APIRouter()


@router.post("/generate")
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate 10 role-specific interview questions (5 MCQ + 5 Objective).
    Accepts a job_role and optionally a list of candidate skills to tailor questions.
    """
    result = generate_interview_questions(
        job_role=request.job_role,
        skills=request.skills
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.post("/evaluate")
async def evaluate_answers(request: SubmitAnswersRequest):
    """
    Submit candidate answers for evaluation.
    MCQs are scored deterministically, objective answers are scored by Llama 3.3.
    Returns individual feedback + a combined interview_total_score.
    """
    result = evaluate_interview_answers(
        job_role=request.job_role,
        mcq_questions=request.mcq_questions,
        mcq_answers=request.mcq_answers,
        objective_questions=request.objective_questions,
        objective_answers=request.objective_answers,
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result
