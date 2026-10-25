from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas import AnalysisResult
from app.services.gemini import GeminiError, analyze_cv
from app.services.pdf_parser import PdfParseError, extract_text

router = APIRouter(prefix="/api", tags=["analyze"])

ALLOWED_LANGUAGES = {"pl", "en"}
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/octet-stream", ""}


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    cv_file: UploadFile = File(...),
    job_description: str = Form(...),
    language: str = Form("en"),
) -> AnalysisResult:
    if language not in ALLOWED_LANGUAGES:
        raise HTTPException(status_code=422, detail="language must be 'pl' or 'en'")

    job_description = job_description.strip()
    if not job_description:
        raise HTTPException(status_code=422, detail="job_description is required")

    filename = (cv_file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=422, detail="cv_file must be a PDF")

    content = await cv_file.read()

    try:
        cv_text = extract_text(content)
    except PdfParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result = analyze_cv(cv_text, job_description, language)
    except GeminiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return AnalysisResult(**result)
