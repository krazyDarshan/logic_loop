from pydantic import BaseModel
from typing import Optional


class MatchmakerTextRequest(BaseModel):
    """Evaluate CV text against a Job Description text."""
    cv_text: str
    jd_text: str
    min_score: Optional[float] = 60.0
    min_skills: Optional[float] = 50.0
    min_tech: Optional[int] = 2
