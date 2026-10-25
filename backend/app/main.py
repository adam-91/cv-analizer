from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analyze, health

app = FastAPI(
    title="CV Analyzer API",
    version="0.1.0",
    description="Analyze a CV against a job description using Gemini.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CV Analyzer API", "docs": "/docs"}
