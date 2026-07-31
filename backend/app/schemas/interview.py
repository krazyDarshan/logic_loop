from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class GenerateQuestionsRequest(BaseModel):
    """Request to generate interview questions for a specific role."""
    job_role: str
    skills: Optional[List[str]] = None


class SubmitAnswersRequest(BaseModel):
    """
    Request to submit answers for evaluation.
    
    Usage flow:
      1. Call /api/interview/generate with a job_role to get questions.
      2. Copy the mcq_questions and objective_questions arrays from the response.
      3. Fill in mcq_answers (e.g. {"1": "B", "2": "A"}) and
         objective_answers (e.g. {"6": "My answer...", "7": "..."}).
      4. POST everything to /api/interview/evaluate.
    """
    job_role: str
    mcq_questions: List[Dict[str, Any]]
    mcq_answers: Dict[str, str]          # e.g. {"1": "B", "2": "A", "3": "C", "4": "D", "5": "A"}
    objective_questions: List[Dict[str, Any]]
    objective_answers: Dict[str, str]     # e.g. {"6": "Answer text", "7": "Answer text", ...}
