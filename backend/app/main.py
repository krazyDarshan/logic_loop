from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import analyze, candidates, interview
from app.db.database import engine, Base

# Create DB tables (Gracefully handle dummy connection strings)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database to create tables. Ensure DATABASE_URL is set in .env. Error: {e}")

app = FastAPI(title="SkillNova API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])

@app.get("/")
def read_root():
    return {"message": "SkillNova Backend is running"}
