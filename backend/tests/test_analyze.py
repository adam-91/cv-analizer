from unittest.mock import patch

from app.services.gemini import GeminiError


async def test_analyze_missing_cv_file(client):
    response = await client.post(
        "/api/analyze",
        data={"job_description": "Python developer", "language": "en"},
    )

    assert response.status_code == 422


async def test_analyze_missing_job_description(client, sample_pdf):
    response = await client.post(
        "/api/analyze",
        data={"language": "en"},
        files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
    )

    assert response.status_code == 422


async def test_analyze_invalid_language(client, sample_pdf):
    response = await client.post(
        "/api/analyze",
        data={"job_description": "Python developer", "language": "de"},
        files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
    )

    assert response.status_code == 422


async def test_analyze_rejects_non_pdf_filename(client):
    response = await client.post(
        "/api/analyze",
        data={"job_description": "Python developer", "language": "en"},
        files={"cv_file": ("cv.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 422


async def test_analyze_success(client, sample_pdf):
    fake_result = {
        "score": 88,
        "summary": "Good match",
        "strengths": ["Python"],
        "gaps": ["Docker"],
        "suggestions": ["Add Docker"],
        "matched_keywords": ["Python"],
        "missing_keywords": ["Docker"],
    }

    with patch("app.routers.analyze.analyze_cv", return_value=fake_result):
        response = await client.post(
            "/api/analyze",
            data={"job_description": "Python developer", "language": "pl"},
            files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 88
    assert body["summary"] == "Good match"
    assert body["strengths"] == ["Python"]


async def test_analyze_gemini_error(client, sample_pdf):
    with patch("app.routers.analyze.analyze_cv", side_effect=GeminiError("boom")):
        response = await client.post(
            "/api/analyze",
            data={"job_description": "Python developer", "language": "en"},
            files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == "boom"
