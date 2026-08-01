import os
from dotenv import load_dotenv
load_dotenv()

import requests
from groq import Groq
import json
from typing import List, Optional, Dict, Any

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy"))

GITHUB_HEADERS = {"Accept": "application/vnd.github.v3+json"}
token = os.getenv("GITHUB_TOKEN")
if token:
    GITHUB_HEADERS["Authorization"] = f"Bearer {token}"


def fetch_github_profile(username: str) -> Optional[Dict[str, Any]]:
    """Fetch the user's public GitHub profile (bio, followers, etc.)."""
    url = f"https://api.github.com/users/{username}"
    try:
        response = requests.get(url, headers=GITHUB_HEADERS)
        if response.status_code == 200:
            data = response.json()
            return {
                "name": data.get("name"),
                "bio": data.get("bio"),
                "company": data.get("company"),
                "location": data.get("location"),
                "blog": data.get("blog"),
                "public_repos": data.get("public_repos"),
                "public_gists": data.get("public_gists"),
                "followers": data.get("followers"),
                "following": data.get("following"),
                "created_at": data.get("created_at"),
                "hireable": data.get("hireable"),
            }
        return None
    except:
        return None


def fetch_github_repos(username: str, per_page: int = 30) -> List[Dict[str, Any]]:
    """Fetch the user's public repositories sorted by most recently pushed."""
    url = f"https://api.github.com/users/{username}/repos?per_page={per_page}&sort=pushed"
    try:
        response = requests.get(url, headers=GITHUB_HEADERS)
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []


def fetch_repo_languages(username: str, repo_name: str) -> Dict[str, int]:
    """Fetch language breakdown (bytes of code) for a specific repo."""
    url = f"https://api.github.com/repos/{username}/{repo_name}/languages"
    try:
        response = requests.get(url, headers=GITHUB_HEADERS)
        if response.status_code == 200:
            return response.json()
        return {}
    except:
        return {}


def fetch_contribution_stats(username: str) -> Dict[str, Any]:
    """Fetch recent contribution events to gauge activity level."""
    url = f"https://api.github.com/users/{username}/events/public?per_page=100"
    try:
        response = requests.get(url, headers=GITHUB_HEADERS)
        if response.status_code == 200:
            events = response.json()
            push_events = sum(1 for e in events if e.get("type") == "PushEvent")
            pr_events = sum(1 for e in events if e.get("type") == "PullRequestEvent")
            issue_events = sum(1 for e in events if e.get("type") == "IssuesEvent")
            create_events = sum(1 for e in events if e.get("type") == "CreateEvent")
            return {
                "total_recent_events": len(events),
                "push_events": push_events,
                "pull_request_events": pr_events,
                "issue_events": issue_events,
                "create_events": create_events,
            }
        return {}
    except:
        return {}


def analyze_github_profile(username: str, job_role: Optional[str] = None, keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    # ---- Fetch all data in parallel-ish fashion ----
    profile = fetch_github_profile(username)
    if not profile:
        return {"error": f"GitHub user '{username}' does not exist or API limit reached."}
        
    repos = fetch_github_repos(username, per_page=30)
    contributions = fetch_contribution_stats(username)
    
    # ---- Build rich repo summaries (top 15 for token efficiency) ----
    repo_summaries = []
    all_languages = {}
    total_stars = 0
    total_forks = 0
    forked_count = 0
    original_count = 0

    for r in repos[:15]:
        is_fork = r.get("fork", False)
        stars = r.get("stargazers_count", 0)
        forks = r.get("forks_count", 0)
        total_stars += stars
        total_forks += forks
        if is_fork:
            forked_count += 1
        else:
            original_count += 1

        lang = r.get("language")
        if lang:
            all_languages[lang] = all_languages.get(lang, 0) + 1

        repo_summaries.append({
            "name": r.get("name"),
            "description": r.get("description"),
            "language": lang,
            "stars": stars,
            "forks": forks,
            "open_issues": r.get("open_issues_count", 0),
            "is_fork": is_fork,
            "has_wiki": r.get("has_wiki", False),
            "has_pages": r.get("has_pages", False),
            "topics": r.get("topics", []),
            "license": r.get("license", {}).get("spdx_id") if r.get("license") else None,
            "updated_at": r.get("pushed_at"),
        })

    # ---- Fetch detailed language breakdown for top 5 repos ----
    detailed_languages = {}
    for r in repos[:5]:
        repo_langs = fetch_repo_languages(username, r.get("name", ""))
        for lang, bytes_count in repo_langs.items():
            detailed_languages[lang] = detailed_languages.get(lang, 0) + bytes_count

    # ---- Build aggregated stats ----
    stats = {
        "total_public_repos": profile.get("public_repos", len(repos)) if profile else len(repos),
        "total_stars_earned": total_stars,
        "total_forks_earned": total_forks,
        "original_repos": original_count,
        "forked_repos": forked_count,
        "followers": profile.get("followers", 0) if profile else 0,
        "following": profile.get("following", 0) if profile else 0,
        "account_age": profile.get("created_at", "unknown") if profile else "unknown",
        "languages_by_repo_count": all_languages,
        "languages_by_bytes": detailed_languages,
        "recent_activity": contributions,
    }

    # ---- Build the AI prompt ----
    job_role_prompt = ""
    if job_role:
        job_role_prompt = f"""
The recruiter is hiring for the role: **{job_role}**.
Score how well this GitHub profile matches that specific role on a scale of 0-100 as "job_role_match_score".
Explain why in 1-2 sentences as "job_role_match_reason".
"""

    keyword_prompt = ""
    if keywords:
        keyword_prompt = f"""
The recruiter wants candidates with these specific skills/keywords: {', '.join(keywords)}.
For each keyword, check if it appears in repo names, descriptions, topics, or languages.
Return "keyword_matches": {{"keyword": "found | not_found", ...}}.
Give a "keyword_match_score" from 0-100.
"""

    prompt = f"""
You are an expert technical recruiter performing a deep analysis of a candidate's GitHub profile.

=== PROFILE INFO ===
{json.dumps(profile, indent=2) if profile else "Profile not available"}

=== AGGREGATED STATS ===
{json.dumps(stats, indent=2)}

=== TOP REPOSITORIES (most recently active) ===
{json.dumps(repo_summaries, indent=2)}

{job_role_prompt}
{keyword_prompt}

Perform a thorough evaluation and return the output strictly as a JSON object with this schema:
{{
  "profile_summary": "2-3 sentence summary of who this developer is based on their profile and repos",
  "languages": ["All languages detected, ordered by usage"],
  "primary_domain": "e.g. Frontend, Backend, Full-Stack, ML/AI, DevOps, Mobile, etc.",
  "tech_stack": ["Inferred frameworks/tools from repo names, descriptions, and topics"],
  "strengths": ["Top 3-4 technical strengths"],
  "weaknesses": ["Top 2-3 areas where profile is lacking"],
  "quality_score": 0-100,
  "consistency_score": 0-100,
  "documentation_score": 0-100,
  "originality_score": 0-100,
  "community_engagement_score": 0-100,
  "job_role_match_score": 0-100,
  "job_role_match_reason": "Why they match or don't match the role",
  "keyword_match_score": 0-100,
  "keyword_matches": {{}},
  "github_total_score": 0-100,
  "confidence_score": 0-100,
  "citations": [
    {{
      "claim": "A specific claim made in the evaluation (e.g. 'Highly active in open source')",
      "evidence": "An exact detail from the provided stats or repo list proving the claim"
    }}
  ]
}}

IMPORTANT scoring rules:
- "quality_score": Code quality inferred from stars, descriptions, topics, and licenses (0-100).
- "consistency_score": How actively and regularly they commit/push code. Use recent_activity data (0-100).
- "documentation_score": Do repos have descriptions, wikis, pages, licenses? (0-100).
- "originality_score": Ratio of original vs forked repos, uniqueness of projects (0-100).
- "community_engagement_score": Followers, stars, forks, PRs, issues activity (0-100).
- "job_role_match_score": Fit for the target role (0-100). If no role specified, default to 50.
- "keyword_match_score": How many recruiter keywords are present (0-100). If none specified, default to 50.
- "github_total_score": Weighted average = (quality_score * 0.25) + (consistency_score * 0.20) + (documentation_score * 0.10) + (originality_score * 0.15) + (community_engagement_score * 0.10) + (job_role_match_score * 0.15) + (keyword_match_score * 0.05). Round to nearest integer.
- "confidence_score": Your confidence in this evaluation (0-100). Reduce if there is very little public data or repos.
- "citations": Provide at least 3 citations proving your evaluation. Evidence must strictly reference data provided in the prompt.
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
        result = json.loads(content)
        # Attach raw stats so the frontend can use them too
        result["raw_stats"] = stats
        result["repo_count"] = len(repos)
        return result
    except Exception as e:
        return {"error": str(e)}
