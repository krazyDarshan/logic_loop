import os
import json
from dotenv import load_dotenv
load_dotenv()

from groq import Groq
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict, field

# Lazy-load the heavy ML model
_encoder = None

def _get_encoder():
    global _encoder
    if _encoder is None:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    return _encoder

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy"))


@dataclass
class ProjectAnalysisResult:
    code_quality_score: float
    innovation_score: float
    documentation_score: float
    overall_score: float
    technical_stack: List[str]
    innovation_summary: str
    recruiter_summary: str
    combined_embedding: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        # Don't expose the raw 384-dim embedding vector to the user
        d.pop("combined_embedding", None)
        return d


# ============================================================================
# 1. PDF Parsing
# ============================================================================

def parse_pdf_pitch_deck(pdf_path: str) -> str:
    """Extracts text content from a pitch deck PDF."""
    if not pdf_path or not os.path.exists(pdf_path):
        return "No pitch deck provided."
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        deck_text = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(deck_text) if deck_text else "No extractable text in pitch deck."
    except Exception as e:
        return f"Failed to parse pitch deck: {e}"


def parse_pdf_bytes(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes (for API uploads)."""
    try:
        from pypdf import PdfReader
        from io import BytesIO
        reader = PdfReader(BytesIO(file_bytes))
        pages = [p.extract_text() for p in reader.pages if p.extract_text()]
        return "\n".join(pages) if pages else ""
    except Exception:
        return ""


# ============================================================================
# 2. AI Project Analysis (Groq / Llama 3.3)
# ============================================================================

def analyze_project_with_ai(repo_url: str, pitch_deck_text: str, readme_text: str) -> Dict[str, Any]:
    """Uses Groq (Llama 3.3) to evaluate a hackathon project submission."""

    prompt = f"""
You are a Senior Technical Recruiter evaluating a hackathon submission.

### PROJECT INPUTS:
- Repository URL: {repo_url}
- README Content: {readme_text[:3000]}
- Pitch Deck Content: {pitch_deck_text[:2000]}

### EVALUATION TASK:
Analyze this project and generate a JSON response with this exact structure:
{{
    "code_quality_score": <number 0-100>,
    "innovation_score": <number 0-100>,
    "documentation_score": <number 0-100>,
    "overall_score": <number 0-100>,
    "technical_stack": ["skill1", "skill2", ...],
    "innovation_summary": "<2 sentence overview of what makes this project unique>",
    "recruiter_summary": "<Short recruiter-facing summary highlighting the candidate's strengths>"
}}

Scoring Rules:
- code_quality_score: Infer from tech stack complexity, architecture choices, and README quality.
- innovation_score: How unique/creative is the project idea? Is it solving a real problem?
- documentation_score: How well documented is the project? Does README explain setup, usage, architecture?
- overall_score: Weighted average = (code_quality * 0.35) + (innovation * 0.35) + (documentation * 0.30).
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert hackathon judge and technical recruiter. Output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        return {
            "code_quality_score": 0,
            "innovation_score": 0,
            "documentation_score": 0,
            "overall_score": 0,
            "technical_stack": [],
            "innovation_summary": f"Error during analysis: {str(e)}",
            "recruiter_summary": "Analysis failed."
        }


# ============================================================================
# 3. Public API Functions
# ============================================================================

def evaluate_hackathon_project(
    project_name: str,
    repo_url: str,
    readme_text: str = "",
    pitch_deck_text: str = ""
) -> Dict[str, Any]:
    """
    Main entry point: Evaluate a hackathon project.
    Returns scores, tech stack, and recruiter summary.
    Optionally generates an embedding for semantic search.
    """
    if not repo_url.strip():
        return {"error": "Repository URL is required."}

    # 1. Run AI Analysis
    ai_metrics = analyze_project_with_ai(repo_url, pitch_deck_text, readme_text)

    # 2. Create Vector Embedding for semantic search
    searchable_text = (
        f"Project: {project_name}. "
        f"Tech Stack: {', '.join(ai_metrics.get('technical_stack', []))}. "
        f"Innovation: {ai_metrics.get('innovation_summary', '')} "
        f"Recruiter Notes: {ai_metrics.get('recruiter_summary', '')}"
    )
    
    try:
        encoder = _get_encoder()
        vector = encoder.encode(searchable_text).tolist()
    except Exception:
        vector = []

    result = ProjectAnalysisResult(
        code_quality_score=ai_metrics.get("code_quality_score", 0),
        innovation_score=ai_metrics.get("innovation_score", 0),
        documentation_score=ai_metrics.get("documentation_score", 0),
        overall_score=ai_metrics.get("overall_score", 0),
        technical_stack=ai_metrics.get("technical_stack", []),
        innovation_summary=ai_metrics.get("innovation_summary", ""),
        recruiter_summary=ai_metrics.get("recruiter_summary", ""),
        combined_embedding=vector
    )

    return result.to_dict()


def semantic_search_projects(query: str, stored_projects: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Performs semantic search against a list of stored project embeddings.
    Each stored_project must have a 'combined_embedding' key.
    Returns top_k most similar projects sorted by match percentage.
    """
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    encoder = _get_encoder()
    query_vector = encoder.encode(query)

    results = []
    for project in stored_projects:
        embedding = project.get("combined_embedding", [])
        if not embedding:
            continue
        sim = float(cosine_similarity([query_vector], [embedding])[0][0])
        results.append({
            **{k: v for k, v in project.items() if k != "combined_embedding"},
            "match_percentage": round(sim * 100, 2)
        })

    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results[:top_k]
