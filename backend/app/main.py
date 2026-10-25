from fastapi import FastAPI
 
from app.routers import  health

app = FastAPI(
    title="CV Analyzer API",
    version="0.1.0",
    description="Analyze a CV against a job description using Gemini.",
)


app.include_router(health.router)
 

@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CV Analyzer API", "docs": "/docs"}
