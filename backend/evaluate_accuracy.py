import os
import json
import time
from app.services.github_analyzer import analyze_github_profile
from app.services.interview_agent import generate_interview_questions

# Dummy Test Cases for Hackathon Evaluation Proof
TEST_CASES = {
    "github_profiles": [
        {
            "username": "torvalds",  
            "role": "Senior Systems Engineer",
            "keywords": ["C", "Linux", "Kernel"],
            "expected_high_score": True, 
        },
        {
            "username": "octocat",  # Dummy github account
            "role": "Senior Systems Engineer",
            "keywords": ["C", "Linux", "Kernel"],
            "expected_high_score": False,
        }
    ],
    "interview_roles": [
        {
            "role": "Data Scientist",
            "skills": ["Python", "Pandas", "Machine Learning"]
        },
        {
            "role": "React Frontend Developer",
            "skills": ["JavaScript", "React", "Redux"]
        }
    ]
}

def print_banner(text):
    print(f"\n{'='*50}\n{text}\n{'='*50}")

def run_github_benchmarks():
    print_banner("RUNNING GITHUB ANALYZER BENCHMARKS")
    passed = 0
    total = len(TEST_CASES["github_profiles"])
    
    for case in TEST_CASES["github_profiles"]:
        print(f"\n[Testing] Username: {case['username']}")
        print(f"Target Role: {case['role']}")
        start_time = time.time()
        
        result = analyze_github_profile(case["username"], job_role=case["role"], keywords=case["keywords"])
        
        elapsed = time.time() - start_time
        if "error" in result:
            print(f"❌ FAILED: {result['error']}")
            continue
            
        score = result.get("github_total_score", 0)
        confidence = result.get("confidence_score", 0)
        print(f"Total Score: {score}/100")
        print(f"Confidence: {confidence}/100")
        print(f"Role Match Reason: {result.get('job_role_match_reason')}")
        
        if case["expected_high_score"] and score > 70:
            print("✅ PASSED: High score achieved as expected for a strong profile.")
            passed += 1
        elif not case["expected_high_score"] and score < 50:
            print("✅ PASSED: Low score achieved as expected for a weak/empty profile.")
            passed += 1
        else:
            print(f"❌ FAILED: Unexpected score {score} for this profile.")
            
        print(f"Latency: {elapsed:.2f} seconds")

    print(f"\nGitHub Benchmark Results: {passed}/{total} Passed")

def run_interview_benchmarks():
    print_banner("RUNNING INTERVIEW AGENT BENCHMARKS")
    passed = 0
    total = len(TEST_CASES["interview_roles"])
    
    for case in TEST_CASES["interview_roles"]:
        print(f"\n[Testing] Role: {case['role']}")
        start_time = time.time()
        
        result = generate_interview_questions(job_role=case["role"], skills=case["skills"])
        
        elapsed = time.time() - start_time
        if "error" in result:
            print(f"❌ FAILED: {result['error']}")
            continue
            
        mcq = result.get("mcq_questions", [])
        obj = result.get("objective_questions", [])
        
        if len(mcq) == 5 and len(obj) == 5:
            print(f"✅ PASSED: Successfully generated 5 MCQs and 5 Objective questions.")
            passed += 1
            print(f"Sample Question 1: {mcq[0]['question']}")
        else:
            print(f"❌ FAILED: Generated {len(mcq)} MCQs and {len(obj)} Objective questions (Expected 5 and 5).")
            
        print(f"Latency: {elapsed:.2f} seconds")

    print(f"\nInterview Benchmark Results: {passed}/{total} Passed")

if __name__ == "__main__":
    print("Starting AI Accuracy Benchmarks (Proof of Concept for Hackathon)\n")
    if not os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEY") == "dummy":
        print("⚠️ WARNING: GROQ_API_KEY is missing or dummy. API calls will fail.")
        
    run_github_benchmarks()
    run_interview_benchmarks()
    print_banner("BENCHMARKS COMPLETE")
