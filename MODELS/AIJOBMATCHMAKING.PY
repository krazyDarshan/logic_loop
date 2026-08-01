from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Set
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


# ============================================================================
# 1. Skill Taxonomy Configuration
# ============================================================================

SKILL_TAXONOMY: Set[str] = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php", "ruby",
    # Frontend & Backend Frameworks
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "fastapi", "flask",
    # Machine Learning & AI
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow",
    "scikit-learn", "pandas", "numpy",
    # Databases & Storage
    "sql", "postgresql", "mysql", "mongodb", "redis", "dynamodb",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "git",
    # Architecture & Practices
    "system design", "microservices", "rest api", "graphql", "agile", "scrum", "data analysis"
}


@dataclass
class EvaluationReport:
    status: str  # "ACCEPTED" or "REJECTED"
    match_percentage: float
    match_level: str
    detected_experience: str
    candidate_skills: List[str]
    job_required_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    rejection_reasons: List[str] = field(default_factory=list)


# ============================================================================
# 2. Path & Input Utilities
# ============================================================================

def sanitize_and_resolve_path(raw_path: str) -> Path:
    """Strips quotes/spaces, expands user directories (~), and checks file path."""
    clean_str = raw_path.strip().strip("'\"").strip()
    return Path(clean_str).expanduser().resolve()


def read_text_file(path: Path) -> str:
    """Reads raw text from standard .txt files."""
    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to read text file at {path}: {e}")


def read_pdf_file(path: Path) -> str:
    """Extracts text content from PDF documents."""
    try:
        reader = PdfReader(str(path))
        pages = [p.extract_text() for p in reader.pages if p.extract_text()]
        if not pages:
            raise ValueError("No readable text found inside the PDF file.")
        return " ".join(pages)
    except Exception as e:
        raise RuntimeError(f"Error extracting PDF file content: {e}")


# ============================================================================
# 3. Core Evaluation AI Engine
# ============================================================================

class CVEvaluatorModel:
    """AI Engine for extracting attributes and scoring CVs against Job Descriptions."""

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        min_match_threshold: float = 60.0,
        min_skill_coverage: float = 50.0,
        min_tech_skills_required: int = 2,  # Rejects non-technical CVs below this threshold
        require_experience_stated: bool = False
    ):
        self.encoder = SentenceTransformer(model_name)
        self.min_match_threshold = min_match_threshold
        self.min_skill_coverage = min_skill_coverage
        self.min_tech_skills_required = min_tech_skills_required
        self.require_experience_stated = require_experience_stated

    def extract_skills(self, text: str) -> List[str]:
        """Scans input text against the taxonomy list using pattern matching."""
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
        """Calculates similarity and skill matching score with rejection checks."""
        cv_clean = re.sub(r"\s+", " ", cv_text).strip()
        jd_clean = re.sub(r"\s+", " ", jd_text).strip()

        # Extract Skills & Experience
        cv_skills = self.extract_skills(cv_clean)
        jd_skills = self.extract_skills(jd_clean)
        detected_exp = self.extract_experience(cv_clean)

        matched_skills = sorted(list(set(cv_skills).intersection(set(jd_skills))))
        missing_skills = sorted(list(set(jd_skills) - set(cv_skills)))

        # 1. Semantic Embedding Score (60% Weight)
        embeddings = self.encoder.encode([cv_clean, jd_clean], normalize_embeddings=True)
        semantic_sim = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
        semantic_score = max(0.0, semantic_sim) * 100

        # 2. Skill Coverage Score (40% Weight)
        coverage_ratio = (len(matched_skills) / len(jd_skills)) if jd_skills else 1.0
        coverage_percentage = coverage_ratio * 100
        skill_score = coverage_percentage

        # Hybrid Score
        final_percentage = round((0.60 * semantic_score) + (0.40 * skill_score), 2)

        # Rejection Logic Evaluation
        rejection_reasons = []

        # Criterion 1: Non-technical CV Check (MUST have minimum required technical skills)
        if len(cv_skills) < self.min_tech_skills_required:
            rejection_reasons.append(
                f"REJECTED: Non-technical profile detected. Found {len(cv_skills)} technical skills "
                f"(Minimum required: {self.min_tech_skills_required})."
            )

        # Criterion 2: Minimum overall match score threshold
        if final_percentage < self.min_match_threshold:
            rejection_reasons.append(
                f"Overall match score ({final_percentage}%) is below required threshold ({self.min_match_threshold}%)."
            )

        # Criterion 3: Skill coverage threshold
        if jd_skills and coverage_percentage < self.min_skill_coverage:
            rejection_reasons.append(
                f"Matched only {round(coverage_percentage, 1)}% of required skills (Minimum required: {self.min_skill_coverage}%)."
            )

        # Criterion 4: Missing essential skills check
        if missing_skills and jd_skills:
            if len(missing_skills) > (len(jd_skills) / 2):
                rejection_reasons.append(
                    f"Candidate lacks critical required skills: {', '.join(missing_skills[:5])}..."
                )

        # Criterion 5: Unstated experience (if mandatory)
        if self.require_experience_stated and detected_exp == "Not Explicitly Stated":
            rejection_reasons.append("No explicit work experience timeline found in the CV.")

        # Determine Final Application Status
        if rejection_reasons:
            status = "REJECTED"
            match_level = "DOES NOT MEET REQUIREMENTS"
        else:
            status = "ACCEPTED"
            if final_percentage >= 75.0:
                match_level = "STRONG MATCH"
            else:
                match_level = "MODERATE MATCH"

        return EvaluationReport(
            status=status,
            match_percentage=final_percentage,
            match_level=match_level,
            detected_experience=detected_exp,
            candidate_skills=cv_skills,
            job_required_skills=jd_skills,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            rejection_reasons=rejection_reasons
        )


# ============================================================================
# 4. Input Handler & Execution Pipeline
# ============================================================================

def get_input_content(prompt_label: str) -> str:
    """Interactively prompts the user to either drag/drop a file OR paste raw text."""
    print(f"\n--- {prompt_label.upper()} ---")
    print("Option A: Paste a file path (.pdf or .txt)")
    print("Option B: Type/Paste text manually (Type 'END' on a new line when finished)")

    user_input = input("\nEnter Path or hit [Enter] to paste manual text: ").strip()

    if user_input:
        path = sanitize_and_resolve_path(user_input)
        if not path.is_file():
            print(f"[Error]: File does not exist at path: {path}")
            return get_input_content(prompt_label)

        if path.suffix.lower() == ".pdf":
            return read_pdf_file(path)
        else:
            return read_text_file(path)
    else:
        print(f"Paste your {prompt_label} text below. Type 'END' on a new line when done:")
        lines = []
        while True:
            line = input()
            if line.strip().upper() == "END":
                break
            lines.append(line)

        raw_text = "\n".join(lines).strip()
        if not raw_text:
            print("[Error]: Provided text cannot be empty!")
            return get_input_content(prompt_label)
        return raw_text


def print_report(report: EvaluationReport):
    """Outputs the formatted evaluation report with clear rejection feedback."""
    print("\n" + "=" * 65)
    print("                 CANDIDATE EVALUATION REPORT")
    print("=" * 65)
    print(f" APPLICATION STATUS : [{report.status}]")
    print(f" MATCH PERCENTAGE   : {report.match_percentage}%")
    print(f" MATCH STATUS       : {report.match_level}")
    print(f" DETECTED EXPERIENCE: {report.detected_experience}")
    print("-" * 65)
    print(f" REQUIRED SKILLS    : {', '.join(report.job_required_skills) if report.job_required_skills else 'None'}")
    print(f" MATCHED SKILLS     : {', '.join(report.matched_skills) if report.matched_skills else 'None'}")
    print(f" MISSING SKILL GAPS : {', '.join(report.missing_skills) if report.missing_skills else 'None'}")

    if report.rejection_reasons:
        print("-" * 65)
        print(" REJECTION REASONS  :")
        for reason in report.rejection_reasons:
            print(f"  • {reason}")

    print("=" * 65 + "\n")


def main():
    parser = argparse.ArgumentParser(description="AI Resume & CV Evaluator")
    parser.add_argument("--cv", type=str, help="Path to CV file (.pdf or .txt)")
    parser.add_argument("--jd", type=str, help="Path to Job Description file (.pdf or .txt)")
    parser.add_argument("--min-score", type=float, default=60.0, help="Minimum overall score %% to avoid rejection")
    parser.add_argument("--min-skills", type=float, default=50.0, help="Minimum skill match %% to avoid rejection")
    parser.add_argument("--min-tech", type=int, default=2, help="Minimum technical skills required in CV")
    args = parser.parse_args()

    # Initialize evaluator with non-technical rejection logic
    evaluator = CVEvaluatorModel(
        min_match_threshold=args.min_score,
        min_skill_coverage=args.min_skills,
        min_tech_skills_required=args.min_tech
    )

    # Process CV Input
    if args.cv:
        cv_path = sanitize_and_resolve_path(args.cv)
        cv_text = read_pdf_file(cv_path) if cv_path.suffix.lower() == ".pdf" else read_text_file(cv_path)
    else:
        cv_text = get_input_content("Candidate CV / Resume")

    # Process Job Description Input
    if args.jd:
        jd_path = sanitize_and_resolve_path(args.jd)
        jd_text = read_pdf_file(jd_path) if jd_path.suffix.lower() == ".pdf" else read_text_file(jd_path)
    else:
        jd_text = get_input_content("Job Description")

    print("\nAnalyzing vector embeddings & matching skill taxonomies...")
    report = evaluator.evaluate(cv_text, jd_text)
    print_report(report)


if __name__ == "__main__":
    main()