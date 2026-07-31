import os
from dotenv import load_dotenv
load_dotenv()

from groq import Groq
import json
from typing import List, Optional, Dict, Any

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy"))


def generate_interview_questions(job_role: str, skills: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Generates 10 role-specific interview questions using Llama 3.3:
      - 5 MCQ questions (4 options each, 1 correct)
      - 5 Objective/short-answer questions
    """

    skills_prompt = ""
    if skills:
        skills_prompt = f"""
The candidate claims to have these skills: {', '.join(skills)}.
Tailor some questions to verify these specific skills in the context of the "{job_role}" role.
"""

    prompt = f"""
You are an expert technical interviewer and skill verification specialist.
Generate exactly 10 interview questions for the role: **{job_role}**.

{skills_prompt}

The questions MUST be domain-specific and challenging enough to verify real expertise.
For example, if the role is "ML Engineer", ask about ML algorithms, data preprocessing,
deep learning architectures, model evaluation metrics, etc.
If the role is "Frontend Developer", ask about React, CSS specificity, browser rendering, etc.

RULES:
- Questions 1-5 must be MCQ (multiple choice) with exactly 4 options (A, B, C, D) and one correct answer.
- Questions 6-10 must be Objective/Short-answer questions that require a brief written response (1-3 sentences).
- Each MCQ must have a clear, unambiguous correct answer.
- Vary the difficulty: 2 easy, 4 medium, 4 hard.

Return the output strictly as a JSON object with this schema:
{{
  "job_role": "{job_role}",
  "mcq_questions": [
    {{
      "id": 1,
      "question": "The question text",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct_answer": "B",
      "difficulty": "easy | medium | hard",
      "topic": "e.g. Data Preprocessing"
    }}
  ],
  "objective_questions": [
    {{
      "id": 6,
      "question": "The question text",
      "expected_answer_hint": "Brief hint of what a correct answer should contain",
      "difficulty": "easy | medium | hard",
      "topic": "e.g. Deep Learning"
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer. You output only valid JSON. Generate challenging, domain-specific questions."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}


def evaluate_interview_answers(
    job_role: str,
    mcq_questions: List[Dict[str, Any]],
    mcq_answers: Dict[str, str],
    objective_questions: List[Dict[str, Any]],
    objective_answers: Dict[str, str]
) -> Dict[str, Any]:
    """
    Evaluates a candidate's answers to both MCQ and Objective questions.
    
    - mcq_answers: e.g. {"1": "B", "2": "A", ...}
    - objective_answers: e.g. {"6": "Answer text...", "7": "Answer text...", ...}
    """

    # ---- Score MCQs locally (deterministic) ----
    mcq_results = []
    mcq_correct = 0
    for q in mcq_questions:
        qid = str(q["id"])
        candidate_answer = mcq_answers.get(qid, "")
        correct = q.get("correct_answer", "")
        is_correct = candidate_answer.upper().strip() == correct.upper().strip()
        if is_correct:
            mcq_correct += 1
        mcq_results.append({
            "id": q["id"],
            "question": q["question"],
            "your_answer": candidate_answer,
            "correct_answer": correct,
            "is_correct": is_correct,
            "topic": q.get("topic", ""),
        })

    mcq_score = round((mcq_correct / max(len(mcq_questions), 1)) * 100)

    # ---- Score Objective questions via AI ----
    obj_qa_pairs = []
    for q in objective_questions:
        qid = str(q["id"])
        candidate_answer = objective_answers.get(qid, "No answer provided")
        obj_qa_pairs.append({
            "id": q["id"],
            "question": q["question"],
            "expected_hint": q.get("expected_answer_hint", ""),
            "candidate_answer": candidate_answer,
            "topic": q.get("topic", ""),
        })

    eval_prompt = f"""
You are an expert technical interviewer evaluating a candidate for the role: **{job_role}**.

Below are 5 objective/short-answer questions, the expected answer hints, and the candidate's actual answers.
Evaluate each answer for correctness, depth, and accuracy.

Questions and Answers:
{json.dumps(obj_qa_pairs, indent=2)}

Return the output strictly as a JSON object with this schema:
{{
  "objective_results": [
    {{
      "id": 6,
      "question": "The question",
      "candidate_answer": "What they answered",
      "score": 0-10,
      "feedback": "Brief feedback on their answer",
      "topic": "Topic area"
    }}
  ],
  "objective_total_score": 0-100
}}

Scoring rules:
- Each question is scored 0-10 (10 = perfect, 0 = completely wrong/blank).
- "objective_total_score" = sum of all individual scores * 2 (to scale to 0-100).
- Be fair but strict. Partial credit is fine for partially correct answers.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert evaluator. You output only valid JSON. Be fair but thorough in grading."},
                {"role": "user", "content": eval_prompt}
            ],
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        obj_evaluation = json.loads(content)
    except Exception as e:
        obj_evaluation = {
            "objective_results": [],
            "objective_total_score": 0,
            "error": str(e)
        }

    # ---- Compute final combined score ----
    objective_score = obj_evaluation.get("objective_total_score", 0)
    # MCQ 50% weight + Objective 50% weight
    interview_total_score = round(mcq_score * 0.50 + objective_score * 0.50)

    return {
        "job_role": job_role,
        "mcq_results": mcq_results,
        "mcq_score": mcq_score,
        "mcq_correct_count": mcq_correct,
        "mcq_total_count": len(mcq_questions),
        "objective_results": obj_evaluation.get("objective_results", []),
        "objective_score": objective_score,
        "interview_total_score": interview_total_score,
        "score_breakdown": {
            "mcq_weight": "50%",
            "objective_weight": "50%",
            "mcq_score": mcq_score,
            "objective_score": objective_score,
            "interview_total_score": interview_total_score,
        }
    }
