import os
import json
import psycopg2
from dataclasses import dataclass
from typing import List, Dict, Any
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types

# ============================================================================
# 1. Configuration & Global Setup
# ============================================================================

# Database Connection Credentials
DB_CONFIG = {
    "dbname": "hackathon_db",  # Update to your DB name
    "user": "postgres",        # Update to your DB username
    "password": "your_password",# Update to your DB password
    "host": "localhost",
    "port": 5432
}

# Initialize Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize Sentence Transformer Embedding Model (384 Dimensions)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


@dataclass
class ProjectAnalysisResult:
    code_quality_score: float
    innovation_score: float
    documentation_score: float
    overall_score: float
    technical_stack: List[str]
    innovation_summary: str
    recruiter_summary: str
    combined_embedding: List[float]


# ============================================================================
# 2. Pipeline Core Functions
# ============================================================================

def parse_pdf_pitch_deck(pdf_path: str) -> str:
    """Extracts text content from presentation slides/PDF pitch decks."""
    if not pdf_path or not os.path.exists(pdf_path):
        return "No pitch deck provided."
    try:
        reader = PdfReader(pdf_path)
        deck_text = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(deck_text) if deck_text else "No extractable text in pitch deck."
    except Exception as e:
        print(f"[Warning] PDF Parsing error: {e}")
        return "Failed to parse pitch deck."


def analyze_project_with_ai(repo_url: str, pitch_deck_text: str, readme_text: str) -> Dict[str, Any]:
    """Uses LLM (Gemini 2.5 Flash) to analyze the project performance & quality."""
    
    prompt = f"""
    You are a Senior Technical Recruiter evaluating a hackathon submission.

    ### PROJECT INPUTS:
    - Repository URL: {repo_url}
    - README Content: {readme_text[:2000]}
    - Pitch Deck Content: {pitch_deck_text[:2000]}

    ### EVALUATION TASK:
    Analyze this project and generate a JSON response with the exact structure below:
    {{
        "code_quality_score": <number 0-100>,
        "innovation_score": <number 0-100>,
        "documentation_score": <number 0-100>,
        "overall_score": <number 0-100>,
        "technical_stack": ["<skill1>", "<skill2>", ...],
        "innovation_summary": "<2 sentence overview of uniqueness>",
        "recruiter_summary": "<Short recruiter profile summary highlighting strengths>"
    }}
    """

    response = ai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )

    return json.loads(response.text)


def process_hackathon_submission(
    candidate_id: int,
    project_name: str,
    repo_url: str,
    pitch_deck_path: str = None,
    readme_text: str = ""
) -> ProjectAnalysisResult:
    """Inbound Pipeline: Ingests -> Evaluates via LLM -> Embeds -> Stores in PostgreSQL."""
    
    print(f"\n[*] Processing Project: '{project_name}'...")
    
    # 1. Parse Pitch Deck
    deck_text = parse_pdf_pitch_deck(pitch_deck_path) if pitch_deck_path else "No pitch deck."

    # 2. Run AI Analysis
    ai_metrics = analyze_project_with_ai(repo_url, deck_text, readme_text)

    # 3. Create Vector Embedding
    searchable_text = (
        f"Project: {project_name}. "
        f"Tech Stack: {', '.join(ai_metrics['technical_stack'])}. "
        f"Innovation: {ai_metrics['innovation_summary']} "
        f"Recruiter Notes: {ai_metrics['recruiter_summary']}"
    )
    vector = embedding_model.encode(searchable_text).tolist()

    result = ProjectAnalysisResult(
        code_quality_score=ai_metrics["code_quality_score"],
        innovation_score=ai_metrics["innovation_score"],
        documentation_score=ai_metrics["documentation_score"],
        overall_score=ai_metrics["overall_score"],
        technical_stack=ai_metrics["technical_stack"],
        innovation_summary=ai_metrics["innovation_summary"],
        recruiter_summary=ai_metrics["recruiter_summary"],
        combined_embedding=vector
    )

    # 4. Save to PostgreSQL
    save_to_database(candidate_id, project_name, repo_url, result)
    return result


def save_to_database(candidate_id: int, project_name: str, repo_url: str, result: ProjectAnalysisResult):
    """Inserts project report and vector embedding into database."""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    query = """
    INSERT INTO hackathon_projects (
        candidate_id, project_name, github_repo_url, code_quality_score,
        innovation_score, documentation_score, overall_score, technical_stack,
        innovation_summary, recruiter_summary, project_embedding
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """

    cur.execute(query, (
        candidate_id, project_name, repo_url,
        result.code_quality_score, result.innovation_score,
        result.documentation_score, result.overall_score,
        result.technical_stack, result.innovation_summary,
        result.recruiter_summary, str(result.combined_embedding)
    ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"[+] Candidate project '{project_name}' stored successfully.")


# ============================================================================
# 3. Recruiter Search Discovery Module
# ============================================================================

def discover_top_candidates(search_query: str, top_k: int = 5, min_score: float = 60.0) -> List[Dict[str, Any]]:
    """Performs semantic vector matching against candidate profiles."""
    query_vector = embedding_model.encode(search_query).tolist()

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    sql = """
    SELECT 
        c.full_name, c.email, c.github_handle,
        p.project_name, p.overall_score, p.technical_stack, p.recruiter_summary,
        1 - (p.project_embedding <=> %s::vector) AS similarity_score
    FROM hackathon_projects p
    JOIN candidates c ON c.id = p.candidate_id
    WHERE p.overall_score >= %s
    ORDER BY similarity_score DESC
    LIMIT %s;
    """

    cur.execute(sql, (str(query_vector), min_score, top_k))
    rows = cur.fetchall()

    results = []
    for r in rows:
        results.append({
            "candidate_name": r[0],
            "email": r[1],
            "github_handle": r[2],
            "project_name": r[3],
            "overall_score": r[4],
            "technical_stack": r[5],
            "recruiter_summary": r[6],
            "match_percentage": round(r[7] * 100, 2)
        })

    cur.close()
    conn.close()
    return results


# ============================================================================
# 4. Main Execution
# ============================================================================

if __name__ == "__main__":
    # --- STEP A: Add Mock Candidate to DB ---
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO candidates (id, full_name, email, github_handle)
            VALUES (1, 'Sarah Jenkins', 'sarah@example.com', 'sarah-j-dev')
            ON CONFLICT (email) DO NOTHING;
        """)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database error while seeding user: {e}")

    # --- STEP B: Process a Hackathon Submission ---
    sample_readme = """
    # HealthAI Assistant
    A fast medical diagnosis system leveraging PyTorch CNNs and FastAPI.
    It takes pulmonary X-rays and generates instant screening reports.
    Built with Python, PyTorch, FastAPI, Next.js, and PostgreSQL.
    """

    process_hackathon_submission(
        candidate_id=1,
        project_name="HealthAI Assistant",
        repo_url="https://github.com/sarah-j-dev/health-ai",
        readme_text=sample_readme
    )

    # --- STEP C: Recruiter Semantic Query Search ---
    print("\n" + "="*60)
    print(" RECRUITER TALENT SEARCH DEMO")
    print("="*60)

    recruiter_query = "Looking for PyTorch AI engineers with FastAPI backend experience"
    print(f"Search Query: '{recruiter_query}'\n")

    matches = discover_top_candidates(search_query=recruiter_query, top_k=3)

    for idx, candidate in enumerate(matches, start=1):
        print(f"Match #{idx}: {candidate['candidate_name']} ({candidate['match_percentage']}% Match)")
        print(f" • Project: {candidate['project_name']} (Overall Score: {candidate['overall_score']})")
        print(f" • Stack: {', '.join(candidate['technical_stack'])}")
        print(f" • Recruiter Summary: {candidate['recruiter_summary']}")
        print("-" * 60)