import logging
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas import AnalysisResult
from app.services.gemini import GeminiError, analyze_cv
from app.services.job_fetcher import JobFetchError, fetch_job_description
from app.services.pdf_parser import PdfParseError, extract_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])

ALLOWED_LANGUAGES = {"pl", "en"}
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/octet-stream", ""}


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    cv_file: UploadFile = File(...),
    job_description: str = Form(""),
    job_url: str = Form(""),
    language: str = Form("en"),
) -> AnalysisResult:
    started = time.monotonic()

    if language not in ALLOWED_LANGUAGES:
        logger.warning("Rejected request: invalid language %r", language)
        raise HTTPException(status_code=422, detail="language must be 'pl' or 'en'")

    filename = (cv_file.filename or "").lower()
    if not filename.endswith(".pdf"):
        logger.warning("Rejected request: non-PDF filename %r", cv_file.filename)
        raise HTTPException(status_code=422, detail="cv_file must be a PDF")

    job_description = job_description.strip()
    job_url = job_url.strip()

    if job_url:
        if not job_url.lower().startswith(("http://", "https://")):
            logger.warning("Rejected request: invalid job_url %r", job_url)
            raise HTTPException(
                status_code=422, detail="job_url must start with http:// or https://"
            )
        logger.info("Fetching job description from URL %r", job_url)
        try:
            job_description = fetch_job_description(job_url)
        except JobFetchError as exc:
            logger.warning("Job URL fetch failed: %s", exc)
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    elif not job_description:
        logger.warning("Rejected request: no job_description or job_url")
        raise HTTPException(
            status_code=422, detail="job_description or job_url is required"
        )

    content = await cv_file.read()
    logger.info(
        "Analyze request filename=%r bytes=%d job_chars=%d language=%s",
        cv_file.filename,
        len(content),
        len(job_description),
        language,
    )

    try:
        cv_text = extract_text(content)
    except PdfParseError as exc:
        logger.warning("PDF extraction failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result = analyze_cv(cv_text, job_description, language)
    except GeminiError as exc:
        logger.error("Gemini analysis failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    logger.info(
        "Analyze completed score=%s elapsed=%.2fs",
        result.get("score"),
        time.monotonic() - started,
    )
    return AnalysisResult(**result)
