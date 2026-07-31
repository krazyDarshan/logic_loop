from pydantic import BaseModel
from typing import Optional


class HackathonEvaluateRequest(BaseModel):
    """Evaluate a hackathon project submission."""
    project_name: str
    repo_url: str
    readme_text: Optional[str] = ""
    pitch_deck_text: Optional[str] = ""


class HackathonSearchRequest(BaseModel):
    """Semantic search for hackathon projects."""
    query: str
    top_k: Optional[int] = 5
