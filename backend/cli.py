import argparse
import json
from app.services.resume_analyzer import extract_text_from_pdf, analyze_resume_text
from app.services.github_analyzer import analyze_github_profile
from app.services.interview_agent import generate_interview_questions
from app.services.job_matchmaker import evaluate_cv_against_jd
from app.services.job_matchmaker import extract_text_from_pdf as matchmaker_extract_pdf
from app.services.hackathon_evaluator import evaluate_hackathon_project

def print_json(data):
    print(json.dumps(data, indent=2))

def run_resume(args):
    print(f"Reading {args.pdf_path}...")
    with open(args.pdf_path, "rb") as f:
        file_bytes = f.read()
    
    text = extract_text_from_pdf(file_bytes)
    if not text:
        print("Error: Could not extract text from PDF.")
        return

    keywords = [k.strip() for k in args.keywords.split(",")] if args.keywords else None
    print(f"Analyzing resume for role '{args.role}' with keywords {keywords}...")
    
    result = analyze_resume_text(text, job_role=args.role, keywords=keywords)
    print_json(result)

def run_github(args):
    keywords = [k.strip() for k in args.keywords.split(",")] if args.keywords else None
    print(f"Analyzing GitHub profile for '{args.username}' (role: '{args.role}', keywords: {keywords})...")
    
    result = analyze_github_profile(args.username, job_role=args.role, keywords=keywords)
    print_json(result)

def run_interview(args):
    skills = [s.strip() for s in args.skills.split(",")] if args.skills else None
    print(f"Generating interview questions for role '{args.role}' (skills: {skills})...")
    
    result = generate_interview_questions(job_role=args.role, skills=skills)
    print_json(result)

def run_matchmaker(args):
    print(f"Reading CV from {args.cv_path}...")
    with open(args.cv_path, "rb") as f:
        cv_text = matchmaker_extract_pdf(f.read())
    
    if not cv_text:
        print("Error: Could not extract text from CV PDF.")
        return

    # Read JD from file or use the text directly
    if args.jd_file:
        print(f"Reading JD from {args.jd_file}...")
        with open(args.jd_file, "r", encoding="utf-8") as f:
            jd_text = f.read()
    else:
        jd_text = args.jd_text

    if not jd_text:
        print("Error: Provide a job description via --jd-text or --jd-file.")
        return

    print(f"Evaluating CV against Job Description (min_score={args.min_score})...")
    result = evaluate_cv_against_jd(
        cv_text=cv_text,
        jd_text=jd_text,
        min_score=args.min_score,
        min_skills=args.min_skills,
        min_tech=args.min_tech
    )
    print_json(result)

def run_hackathon(args):
    readme = args.readme or ""
    if args.readme_file:
        with open(args.readme_file, "r", encoding="utf-8") as f:
            readme = f.read()

    print(f"Evaluating hackathon project '{args.project_name}'...")
    result = evaluate_hackathon_project(
        project_name=args.project_name,
        repo_url=args.repo_url,
        readme_text=readme,
        pitch_deck_text=args.pitch_text or ""
    )
    print_json(result)

def main():
    parser = argparse.ArgumentParser(description="SkillNova CLI Runner")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Resume Parser
    resume_parser = subparsers.add_parser("resume", help="Analyze a resume PDF using Groq AI")
    resume_parser.add_argument("pdf_path", type=str, help="Path to the PDF file")
    resume_parser.add_argument("--role", type=str, default="", help="Target job role")
    resume_parser.add_argument("--keywords", type=str, default="", help="Comma-separated keywords")
    resume_parser.set_defaults(func=run_resume)

    # GitHub Parser
    github_parser = subparsers.add_parser("github", help="Analyze a GitHub profile using Groq AI")
    github_parser.add_argument("username", type=str, help="GitHub username")
    github_parser.add_argument("--role", type=str, default="", help="Target job role")
    github_parser.add_argument("--keywords", type=str, default="", help="Comma-separated keywords")
    github_parser.set_defaults(func=run_github)

    # Interview Generator
    interview_parser = subparsers.add_parser("interview", help="Generate interview questions using Groq AI")
    interview_parser.add_argument("role", type=str, help="Target job role")
    interview_parser.add_argument("--skills", type=str, default="", help="Comma-separated skills to test")
    interview_parser.set_defaults(func=run_interview)

    # Job Matchmaker (ML-based)
    match_parser = subparsers.add_parser("matchmaker", help="Match CV against Job Description using ML embeddings")
    match_parser.add_argument("cv_path", type=str, help="Path to candidate CV/Resume PDF")
    match_parser.add_argument("--jd-text", type=str, default="", help="Job description as text")
    match_parser.add_argument("--jd-file", type=str, default="", help="Path to job description .txt file")
    match_parser.add_argument("--min-score", type=float, default=60.0, help="Min overall score to pass")
    match_parser.add_argument("--min-skills", type=float, default=50.0, help="Min skill coverage to pass")
    match_parser.add_argument("--min-tech", type=int, default=2, help="Min technical skills required")
    match_parser.set_defaults(func=run_matchmaker)

    # Hackathon Evaluator
    hack_parser = subparsers.add_parser("hackathon", help="Evaluate a hackathon project using Groq AI")
    hack_parser.add_argument("project_name", type=str, help="Name of the project")
    hack_parser.add_argument("repo_url", type=str, help="GitHub repository URL")
    hack_parser.add_argument("--readme", type=str, default="", help="README text (inline)")
    hack_parser.add_argument("--readme-file", type=str, default="", help="Path to README.md file")
    hack_parser.add_argument("--pitch-text", type=str, default="", help="Pitch deck text (inline)")
    hack_parser.set_defaults(func=run_hackathon)

    args = parser.parse_args()
    if args.command:
        args.func(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
