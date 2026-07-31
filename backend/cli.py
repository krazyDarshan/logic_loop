import argparse
import json
import asyncio
from app.services.resume_analyzer import extract_text_from_pdf, analyze_resume_text
from app.services.github_analyzer import analyze_github_profile
from app.services.interview_agent import generate_interview_questions

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

def main():
    parser = argparse.ArgumentParser(description="SkillNova CLI Runner")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Resume Parser
    resume_parser = subparsers.add_parser("resume", help="Analyze a resume PDF")
    resume_parser.add_argument("pdf_path", type=str, help="Path to the PDF file")
    resume_parser.add_argument("--role", type=str, default="", help="Target job role")
    resume_parser.add_argument("--keywords", type=str, default="", help="Comma-separated keywords")
    resume_parser.set_defaults(func=run_resume)

    # GitHub Parser
    github_parser = subparsers.add_parser("github", help="Analyze a GitHub profile")
    github_parser.add_argument("username", type=str, help="GitHub username")
    github_parser.add_argument("--role", type=str, default="", help="Target job role")
    github_parser.add_argument("--keywords", type=str, default="", help="Comma-separated keywords")
    github_parser.set_defaults(func=run_github)

    # Interview Generator
    interview_parser = subparsers.add_parser("interview", help="Generate interview questions")
    interview_parser.add_argument("role", type=str, help="Target job role")
    interview_parser.add_argument("--skills", type=str, default="", help="Comma-separated skills to test")
    interview_parser.set_defaults(func=run_interview)

    args = parser.parse_args()
    if args.command:
        args.func(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
