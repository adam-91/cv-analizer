from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):

    score: int = Field(..., ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    suggestions: list[str]
    matched_keywords: list[str]
    missing_keywords: list[str]
