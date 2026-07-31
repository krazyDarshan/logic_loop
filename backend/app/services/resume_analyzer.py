import os
from dotenv import load_dotenv
load_dotenv()

from pypdf import PdfReader
from io import BytesIO
from groq import Groq
import json
from typing import List, Optional, Dict, Any

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy"))

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return ""

def analyze_resume_text(text: str, job_role: Optional[str] = None, keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    if not text.strip():
        return {"error": "No text provided or unable to extract text."}
    
    job_role_prompt = ""
    if job_role:
        job_role_prompt = f"""
The recruiter is hiring for the role: **{job_role}**.
Score how well this resume matches that specific role on a scale of 0-100 as "job_role_match_score".
Also explain why in 1-2 sentences as "job_role_match_reason".
"""

    keyword_prompt = ""
    if keywords:
        keyword_prompt = f"""
The recruiter wants candidates with these specific keywords/skills: {', '.join(keywords)}.
For each keyword, indicate whether it was found in the resume and at what level (beginner/intermediate/expert).
Return this as "keyword_matches": {{"keyword": "found | not_found", ...}}.
Also give a "keyword_match_score" from 0-100 based on how many keywords matched and at what depth.
"""

    prompt = f"""
You are an expert AI recruiter. Analyze the following resume text thoroughly.
{job_role_prompt}
{keyword_prompt}

Resume Text:
{text}

Provide the output strictly as a JSON object with this schema:
{{
  "skills": ["List", "of", "all", "technical", "and", "soft", "skills"],
  "experience_years": 0,
  "education": "Brief description of highest education",
  "projects_count": 0,
  "certifications": ["List of certifications if any"],
  "summary": "A 2-3 sentence summary of the candidate's profile",
  "strengths": ["Top 3 strengths"],
  "weaknesses": ["Top 2 areas of improvement"],
  "skills_score": 0-100,
  "experience_score": 0-100,
  "education_score": 0-100,
  "job_role_match_score": 0-100,
  "job_role_match_reason": "Why they match or don't match the role",
  "keyword_match_score": 0-100,
  "keyword_matches": {{}},
  "resume_total_score": 0-100,
  "confidence_score": 0-100,
  "citations": [
    {{
      "claim": "A specific claim made in the evaluation (e.g. 'Has 5 years of Python experience')",
      "evidence": "An exact quote from the resume text proving the claim"
    }}
  ]
}}

IMPORTANT scoring rules:
- "skills_score": Rate the breadth and depth of their skills (0-100).
- "experience_score": Rate years + quality of experience (0-100).
- "education_score": Rate relevance and level of education (0-100).
- "job_role_match_score": How well the candidate fits the target role (0-100). If no role was specified, default to 50.
- "keyword_match_score": How many recruiter keywords are present (0-100). If no keywords were specified, default to 50.
- "resume_total_score": A weighted average = (skills_score * 0.30) + (experience_score * 0.25) + (education_score * 0.15) + (job_role_match_score * 0.20) + (keyword_match_score * 0.10). Round to nearest integer.
- "confidence_score": Your confidence in this evaluation (0-100). Reduce if the resume is messy, ambiguous, or lacks detail.
- "citations": Provide at least 3 citations for key claims (like years of experience, primary skills, or role match). The 'evidence' MUST be an exact substring from the resume text.
"""
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert recruiter AI. You output only valid JSON. Be fair but thorough in scoring."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}
