<div align="center">

# SkillNova — AI Talent Intelligence Platform

**Proof over paperwork. Evidence over keywords.**

An AI-powered talent intelligence platform that replaces traditional résumé screening with verified, explainable candidate evaluations. SkillNova analyzes resumes, GitHub profiles, and hackathon performance to generate trust-scored candidate profiles — then matches them to jobs using semantic AI.


</div>

---

## 📖 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Usage Guide](#-usage-guide)
- [ML Models](#-ml-models)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 For Candidates
- **AI Resume Analysis** — Upload a PDF resume and receive a scored breakdown of skills, experience, projects, and certifications
- **GitHub Intelligence** — Connect your GitHub username for automated analysis of repositories, commit patterns, code quality, and contribution history
- **Explainable Talent Score** — A transparent, seven-dimension scoring model (Coding, Projects, Problem Solving, Consistency, Leadership, Innovation, Community)
- **Smart Job Matching** — AI-ranked job opportunities based on semantic relevance (60%) and explicit skill coverage (40%)
- **Skill Gap Analysis** — Personalized 90-day roadmap to close gaps for your top-matched roles
- **Verification Dashboard** — Track which skills are backed by evidence vs. self-claimed
- **PDF Resume & Portfolio Export** — Generate recruiter-ready documents from your verified profile

### 🏢 For Recruiters
- **Candidate Intelligence Dashboard** — Search, filter, and compare candidates with evidence-backed profiles
- **Job Posting & Management** — Create job listings with required skills, salary ranges, and location preferences
- **AI Matchmaking** — Automatically rank candidates against job requirements using ML-powered scoring
- **Application Tracking** — View all applicants per job with direct access to uploaded resumes (PDF) and GitHub profiles
- **Trust Scoring** — Assess candidate authenticity through cross-referenced evidence signals
- **Hackathon Hiring Pipeline** — Evaluate candidates based on real hackathon project performance

### 🤖 AI-Powered Services
- **Interview Agent** — Generates role-specific interview questions (MCQ + objective) using Groq/Llama 3.3
- **Job Matchmaker** — Semantic similarity matching using sentence-transformers and scikit-learn
- **Resume Analyzer** — PDF parsing and structured skill extraction
- **GitHub Analyzer** — Repository quality, commit consistency, and contribution scoring
- **Hackathon Evaluator** — Project-based candidate assessment pipeline

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                   │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Firebase    │  │  Candidate   │  │    Recruiter     │ │
│  │  Auth (Login │  │  Dashboard   │  │    Dashboard     │ │
│  │  /Signup)    │  │              │  │                  │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │           │
└─────────┼─────────────────┼────────────────────┼───────────┘
          │                 │                    │
          │        REST API (HTTP fetch)         │
          │                 │                    │
┌─────────┼─────────────────┼────────────────────┼───────────┐
│         ▼                 ▼                    ▼           │
│                   Backend (FastAPI)                        │
│                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐ │
│  │  Resume    │ │  GitHub    │ │  Interview │ │  Job   │  │
│  │  Analyzer  │ │  Analyzer  │ │  Agent     │ │  Match │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───┬────┘ │
│        │              │              │             │      │
│        ▼              ▼              ▼             ▼      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Neon PostgreSQL (Cloud Database)           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Groq LLM API │  │ GitHub API    │  │ Static Files  │  │
│  │ (Llama 3.3)  │  │               │  │ (/uploads)    │  │
│  └──────────────┘  └───────────────┘  └───────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer        | Technology                                   |
|--------------|----------------------------------------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Vite       |
| **Styling**  | Vanilla CSS with glassmorphism & animations   |
| **Auth**     | Firebase Authentication (Email/Password)      |
| **Backend**  | FastAPI (Python 3.10+), Uvicorn               |
| **Database** | Neon PostgreSQL (Serverless)                  |
| **ORM**      | SQLAlchemy 2.0 with Pydantic schemas          |
| **AI/ML**    | Groq API (Llama 3.3), sentence-transformers, scikit-learn |
| **PDF**      | pypdf (server-side), jsPDF (client-side)      |

---

## 📁 Project Structure

```
logic_loop/
├── .gitignore
├── README.md
│
├── backend/                     # FastAPI backend
│   ├── .env                     # Environment variables (NOT committed)
│   ├── requirements.txt         # Python dependencies
│   ├── cli.py                   # CLI tool for testing
│   ├── evaluate_accuracy.py     # Model accuracy evaluation
│   ├── uploads/                 # Uploaded resume PDFs (auto-created)
│   └── app/
│       ├── main.py              # FastAPI app entry point
│       ├── api/routes/          # API route handlers
│       │   ├── analyze.py       # Resume & GitHub analysis endpoints
│       │   ├── candidates.py    # Candidate CRUD endpoints
│       │   ├── interview.py     # AI interview generation endpoints
│       │   ├── jobs.py          # Job posting & application endpoints
│       │   ├── matchmaker.py    # AI matchmaking endpoints
│       │   └── hackathon.py     # Hackathon evaluation endpoints
│       ├── db/
│       │   ├── database.py      # SQLAlchemy engine & session
│       │   └── models.py        # ORM models (Candidate, Job, Application)
│       ├── schemas/             # Pydantic request/response schemas
│       │   ├── candidate.py
│       │   ├── job.py
│       │   ├── interview.py
│       │   ├── hackathon.py
│       │   └── matchmaker.py
│       └── services/            # Core AI/ML services
│           ├── resume_analyzer.py
│           ├── github_analyzer.py
│           ├── interview_agent.py
│           ├── job_matchmaker.py
│           └── hackathon_evaluator.py
│
├── frontend2/                   # Next.js frontend (active)
│   ├── .env.local               # Frontend env variables (NOT committed)
│   ├── package.json
│   ├── app/
│   │   ├── page.tsx             # Main app (Auth + Recruiter Dashboard)
│   │   ├── candidate-dashboard.tsx  # Candidate workspace
│   │   ├── talent-engine.ts     # Scoring & matching algorithms
│   │   ├── evidence-client.ts   # Resume/GitHub evidence extraction
│   │   ├── account-types.ts     # TypeScript type definitions
│   │   ├── globals.css          # Full design system
│   │   └── layout.tsx           # Root layout with SEO metadata
│   └── lib/
│       └── firebase.ts          # Firebase initialization
│
├── MODELS/                      # Standalone ML model scripts
│   ├── AIJOBMATCHMAKING.PY      # Job matchmaking model
│   ├── HiringtoHackthon.py      # Hackathon hiring pipeline
│   └── requirement.txt          # ML model dependencies
│
└── frontend/                    # Legacy frontend (branch1, not active)
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.10 or higher — [Download](https://www.python.org/downloads/)
- **Node.js** 22.13.0 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

You will also need accounts for:

- **Neon PostgreSQL** (free tier) — [neon.tech](https://neon.tech/)
- **Firebase** (free tier) — [firebase.google.com](https://firebase.google.com/)
- **Groq** (free tier) — [console.groq.com](https://console.groq.com/)
- **GitHub** (for a personal access token) — [github.com/settings/tokens](https://github.com/settings/tokens)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/logic_loop.git
cd logic_loop
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create a Python virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend2

# Install Node.js dependencies
npm install
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require
GROQ_API_KEY=gsk_your_groq_api_key_here
GITHUB_TOKEN=ghp_your_github_token_here
```

| Variable       | Description                                                                 | Where to Get It                                                  |
|----------------|-----------------------------------------------------------------------------|------------------------------------------------------------------|
| `DATABASE_URL` | Neon PostgreSQL connection string                                           | [Neon Dashboard](https://console.neon.tech/) → Connection Details |
| `GROQ_API_KEY` | API key for Groq LLM (powers interview generation & AI analysis)           | [Groq Console](https://console.groq.com/keys)                    |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for analyzing candidate GitHub profiles)      | [GitHub Settings → Tokens](https://github.com/settings/tokens)   |

### Frontend (`frontend2/.env.local`)

Create a `.env.local` file inside the `frontend2/` directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

| Variable                                     | Description                          | Where to Get It                                                                |
|----------------------------------------------|--------------------------------------|--------------------------------------------------------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY`               | Firebase Web API Key                 | [Firebase Console](https://console.firebase.google.com/) → Project Settings    |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`           | Firebase Auth domain                 | Same as above                                                                  |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`            | Firebase Project ID                  | Same as above                                                                  |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`        | Firebase Storage bucket              | Same as above                                                                  |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`   | Firebase Cloud Messaging Sender ID   | Same as above                                                                  |
| `NEXT_PUBLIC_FIREBASE_APP_ID`                | Firebase App ID                      | Same as above                                                                  |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`        | Google Analytics Measurement ID      | Same as above                                                                  |

> **How to find your Firebase config:**
> 1. Go to the [Firebase Console](https://console.firebase.google.com/)
> 2. Select your project (or create one)
> 3. Click the ⚙️ gear icon → **Project Settings**
> 4. Scroll to **"Your apps"** → Select the Web app (`</>`)
> 5. Copy the `firebaseConfig` values into your `.env.local`

> ⚠️ **Important:** Make sure **Email/Password** sign-in is enabled in Firebase Console → Authentication → Sign-in method.

---

## ▶️ Running the Application

You need **two terminals** — one for the backend and one for the frontend.

### Terminal 1: Start the Backend

```bash
cd backend

# Activate virtual environment (if not already active)
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: **http://localhost:8000**

You can view the interactive API docs at: **http://localhost:8000/docs**

### Terminal 2: Start the Frontend

```bash
cd frontend2

npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

## 📡 API Endpoints

| Method | Endpoint                         | Description                              |
|--------|----------------------------------|------------------------------------------|
| `GET`  | `/`                              | Health check                             |
| `POST` | `/api/analyze/resume`            | Upload & analyze a PDF resume            |
| `POST` | `/api/analyze/github`            | Analyze a GitHub profile                 |
| `GET`  | `/api/candidates/`               | List all candidates                      |
| `GET`  | `/api/candidates/{id}`           | Get a specific candidate                 |
| `POST` | `/api/candidates/`               | Create a new candidate                   |
| `PUT`  | `/api/candidates/{id}`           | Update a candidate                       |
| `POST` | `/api/interview/generate`        | Generate AI interview questions          |
| `POST` | `/api/interview/evaluate`        | Evaluate interview responses             |
| `POST` | `/api/matchmaker/match`          | AI-powered candidate-job matching        |
| `GET`  | `/api/jobs/`                     | List all job postings                    |
| `POST` | `/api/jobs/`                     | Create a new job posting                 |
| `POST` | `/api/jobs/{id}/apply`           | Apply to a job (with resume PDF upload)  |
| `GET`  | `/api/jobs/{id}/applications`    | Get all applications for a job           |
| `POST` | `/api/hackathon/evaluate`        | Evaluate hackathon submissions           |

> 📚 Full interactive API documentation is auto-generated at **http://localhost:8000/docs** (Swagger UI)

---

## 📘 Usage Guide

### As a Candidate

1. **Sign Up / Log In** — Create an account using Email & Password on the auth screen
2. **Complete Onboarding** — Enter your name, professional title, skills, and experience
3. **Upload Resume** — Go to "My Talent Profile" and upload your PDF resume for AI analysis
4. **Connect GitHub** — Enter your GitHub username to pull live repository and contribution data
5. **View Your Score** — Check your seven-dimension Talent Score and Evidence Blend
6. **Browse Jobs** — Navigate to "Job Matches" to see AI-ranked opportunities
7. **Apply** — Click "Apply for Role", upload your resume PDF, and provide your GitHub link
8. **Close Gaps** — Use the "Career Gaps" tab for a personalized 90-day learning roadmap

### As a Recruiter

1. **Sign Up / Log In** — Create a recruiter account on the auth screen
2. **Create Jobs** — Post new job listings with title, company, location, salary, and required skills
3. **View Candidates** — Browse the candidate intelligence dashboard with search and filtering
4. **Review Applications** — Click on any job to see applicants, their uploaded resumes, and GitHub links
5. **AI Matchmaking** — Use the built-in ML matchmaker to rank candidates against your job requirements
6. **Conduct Interviews** — Generate AI-powered interview questions tailored to the role

---

## 🤖 ML Models

The `MODELS/` directory contains standalone ML scripts that can be run independently:

### AI Job Matchmaking (`AIJOBMATCHMAKING.PY`)
Semantic similarity-based job matching using sentence-transformers.

```bash
# Install dependencies
pip install pypdf sentence-transformers scikit-learn torch

# Run with arguments
python MODELS/AIJOBMATCHMAKING.PY --cv path/to/resume.pdf --jd path/to/job_description.txt

# Or run in interactive mode
python MODELS/AIJOBMATCHMAKING.PY
```

### Hackathon Hiring Pipeline (`HiringtoHackthon.py`)
Evaluates hackathon participants and stores results in PostgreSQL.

```bash
# Install dependencies
pip install pypdf sentence-transformers psycopg2-binary google-genai

# Set your Gemini API key
# Windows CMD:
set GEMINI_API_KEY=your_gemini_key_here
# PowerShell:
$env:GEMINI_API_KEY="your_gemini_key_here"

# Run the pipeline
python MODELS/HiringtoHackthon.py
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

> **Note:** Never commit `.env` or `.env.local` files. All secrets must be loaded from environment variables.

---
