import json
import logging

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiError(Exception):
    """Raised when the model cannot return a usable analysis."""


_PROMPT_TEMPLATE = """You are an expert career coach and technical recruiter.

Compare the candidate's CV with the given job description. Assess the fit and provide honest, helpful feedback.

Rules:
- Respond in {language_name}. Every text field must be written in {language_name}.
- score: an overall fit score from 0 to 100.
- summary: a short paragraph summarizing the overall match.
- strengths: the candidate's assets that are relevant to this job.
- gaps: missing or weak requirements for this job.
- suggestions: concrete, actionable steps to improve the application.
- matched_keywords: keywords from the job description that are present in the CV.
- missing_keywords: important keywords from the job description that are missing from the CV.

CV:
{cv_text}

JOB DESCRIPTION:
{job_description}
"""

_RESPONSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "score": types.Schema(type=types.Type.INTEGER),
        "summary": types.Schema(type=types.Type.STRING),
        "strengths": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "gaps": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "suggestions": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "matched_keywords": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "missing_keywords": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
    },
    required=[
        "score",
        "summary",
        "strengths",
        "gaps",
        "suggestions",
        "matched_keywords",
        "missing_keywords",
    ],
)


def analyze_cv(cv_text: str, job_description: str, language: str) -> dict:
    if not settings.google_api_key:
        raise GeminiError("GOOGLE_API_KEY is not configured on the server.")

    language_name = "Polish" if language == "pl" else "English"
    prompt = _PROMPT_TEMPLATE.format(
        language_name=language_name,
        cv_text=cv_text,
        job_description=job_description,
    )

    logger.info(
        "Calling Gemini model=%s language=%s cv_chars=%d job_chars=%d",
        settings.model_name,
        language,
        len(cv_text),
        len(job_description),
    )

    client = genai.Client(api_key=settings.google_api_key)

    try:
        response = client.models.generate_content(
            model=settings.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                temperature=0.2,
            ),
        )
    except Exception as exc:  # noqa: BLE001 - log any model/network/auth failure
        logger.exception(
            "Gemini API call failed (model=%s): %s", settings.model_name, exc
        )
        raise GeminiError(f"Gemini API call failed: {exc}") from exc

    try:
        data = json.loads(response.text)
    except (json.JSONDecodeError, AttributeError) as exc:
        logger.warning(
            "Failed to parse Gemini response as JSON: %r",
            getattr(response, "text", None),
        )
        raise GeminiError("Failed to parse the model response as JSON.") from exc

    try:
        data["score"] = int(data["score"])
    except (KeyError, TypeError, ValueError):
        data["score"] = 0

    logger.info("Gemini analysis completed score=%s", data.get("score"))
    return data
