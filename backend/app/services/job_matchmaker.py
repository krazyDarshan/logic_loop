from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from typing import List, Set, Optional, Dict, Any
from pypdf import PdfReader
from io import BytesIO

# Lazy-load the heavy ML model to avoid slow cold starts
_encoder = None

def _get_encoder():
    global _encoder
    if _encoder is None:
        from sentence_transformers import SentenceTransformer
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    return _encoder


# ============================================================================
# 1. Skill Taxonomy Configuration
# ============================================================================

SKILL_TAXONOMY: Set[str] = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php", "ruby",
    "kotlin", "swift", "scala", "r", "matlab", "dart", "lua", "perl", "shell", "bash",
    # Frontend & Backend Frameworks
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "fastapi", "flask",
    "spring boot", "laravel", "svelte", "nuxt.js", "remix", "astro",
    # Machine Learning & AI
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow",
    "scikit-learn", "pandas", "numpy", "keras", "opencv", "hugging face", "transformers",
    "langchain", "llm", "rag", "reinforcement learning", "generative ai",
    # Data Engineering
    "spark", "hadoop", "airflow", "kafka", "dbt", "snowflake", "databricks",
    "data analysis", "data engineering", "etl", "data pipeline",
    # Databases & Storage
    "sql", "postgresql", "mysql", "mongodb", "redis", "dynamodb", "sqlite", "elasticsearch",
    "neo4j", "cassandra", "firebase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "git",
    "jenkins", "github actions", "ansible", "prometheus", "grafana",
    # Architecture & Practices
    "system design", "microservices", "rest api", "graphql", "agile", "scrum",
    "design patterns", "solid principles", "tdd", "clean architecture",
    # Mobile
    "react native", "flutter", "android", "ios", "swiftui",
    # Security
    "cybersecurity", "penetration testing", "owasp", "encryption",
}


@dataclass
class EvaluationReport:
    status: str  # "ACCEPTED" or "REJECTED"
    match_percentage: float
    match_level: str
    semantic_score: float
    skill_coverage_score: float
    detected_experience: str
    candidate_skills: List[str]
    job_required_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    rejection_reasons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ============================================================================
# 2. Core ML Evaluation Engine
# ============================================================================

class CVEvaluatorModel:
    """
    AI Engine for scoring CVs against Job Descriptions.
    Uses Sentence Transformer embeddings (real ML model) + skill taxonomy matching.
    
    Scoring Formula:
      final_score = (semantic_similarity * 0.60) + (skill_coverage * 0.40)
    """

    def __init__(
        self,
        min_match_threshold: float = 60.0,
        min_skill_coverage: float = 50.0,
        min_tech_skills_required: int = 2,
        require_experience_stated: bool = False
    ):
        self.min_match_threshold = min_match_threshold
        self.min_skill_coverage = min_skill_coverage
        self.min_tech_skills_required = min_tech_skills_required
        self.require_experience_stated = require_experience_stated

    def extract_skills(self, text: str) -> List[str]:
        """Scans input text against the taxonomy using regex pattern matching."""
        text_lower = text.lower()
        found = set()
        for skill in SKILL_TAXONOMY:
            pattern = r"(?:\b|_)" + re.escape(skill) + r"(?:\b|_)"
            if re.search(pattern, text_lower):
                found.add(skill.title())
        return sorted(list(found))

    def extract_experience(self, text: str) -> str:
        """Finds experience patterns like '5+ years' or '3 yrs of experience'."""
        pattern = r"(\d+\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|work)?)"
        matches = re.findall(pattern, text, re.IGNORECASE)
        return ", ".join(set(matches[:2])) if matches else "Not Explicitly Stated"

    def evaluate(self, cv_text: str, jd_text: str) -> EvaluationReport:
        """Calculates semantic similarity + skill coverage with rejection logic."""
        from sklearn.metrics.pairwise import cosine_similarity

        encoder = _get_encoder()
        cv_clean = re.sub(r"\s+", " ", cv_text).strip()
        jd_clean = re.sub(r"\s+", " ", jd_text).strip()

        # Extract Skills & Experience
        cv_skills = self.extract_skills(cv_clean)
        jd_skills = self.extract_skills(jd_clean)
        detected_exp = self.extract_experience(cv_clean)

        matched_skills = sorted(list(set(cv_skills).intersection(set(jd_skills))))
        missing_skills = sorted(list(set(jd_skills) - set(cv_skills)))

        # 1. Semantic Embedding Score (60% Weight)
        embeddings = encoder.encode([cv_clean, jd_clean], normalize_embeddings=True)
        semantic_sim = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
        semantic_score = round(max(0.0, semantic_sim) * 100, 2)

        # 2. Skill Coverage Score (40% Weight)
        coverage_ratio = (len(matched_skills) / len(jd_skills)) if jd_skills else 1.0
        coverage_percentage = round(coverage_ratio * 100, 2)

        # Hybrid Score
        final_percentage = round((0.60 * semantic_score) + (0.40 * coverage_percentage), 2)

        # Rejection Logic
        rejection_reasons = []

        if len(cv_skills) < self.min_tech_skills_required:
            rejection_reasons.append(
                f"Non-technical profile detected. Found {len(cv_skills)} technical skills "
                f"(Minimum required: {self.min_tech_skills_required})."
            )

        if final_percentage < self.min_match_threshold:
            rejection_reasons.append(
                f"Overall match score ({final_percentage}%) is below threshold ({self.min_match_threshold}%)."
            )

        if jd_skills and coverage_percentage < self.min_skill_coverage:
            rejection_reasons.append(
                f"Matched only {coverage_percentage}% of required skills (Minimum: {self.min_skill_coverage}%)."
            )

        if missing_skills and jd_skills:
            if len(missing_skills) > (len(jd_skills) / 2):
                rejection_reasons.append(
                    f"Candidate lacks critical skills: {', '.join(missing_skills[:5])}"
                )

        if self.require_experience_stated and detected_exp == "Not Explicitly Stated":
            rejection_reasons.append("No explicit work experience timeline found in CV.")

        # Final Status
        if rejection_reasons:
            status = "REJECTED"
            match_level = "DOES NOT MEET REQUIREMENTS"
        else:
            status = "ACCEPTED"
            match_level = "STRONG MATCH" if final_percentage >= 75.0 else "MODERATE MATCH"

        return EvaluationReport(
            status=status,
            match_percentage=final_percentage,
            match_level=match_level,
            semantic_score=semantic_score,
            skill_coverage_score=coverage_percentage,
            detected_experience=detected_exp,
            candidate_skills=cv_skills,
            job_required_skills=jd_skills,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            rejection_reasons=rejection_reasons
        )


# ============================================================================
# 3. Public API Functions
# ============================================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "
        return text.strip()
    except Exception:
        return ""


def evaluate_cv_against_jd(
    cv_text: str,
    jd_text: str,
    min_score: float = 60.0,
    min_skills: float = 50.0,
    min_tech: int = 2
) -> Dict[str, Any]:
    """
    Main entry point: evaluate a CV against a Job Description.
    Returns a dict with match scores, skills analysis, and accept/reject decision.
    """
    if not cv_text.strip():
        return {"error": "CV text is empty or could not be extracted."}
    if not jd_text.strip():
        return {"error": "Job description text is empty."}

    evaluator = CVEvaluatorModel(
        min_match_threshold=min_score,
        min_skill_coverage=min_skills,
        min_tech_skills_required=min_tech
    )
    report = evaluator.evaluate(cv_text, jd_text)
    return report.to_dict()
