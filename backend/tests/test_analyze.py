from unittest.mock import patch

from app.services.gemini import GeminiError
from app.services.job_fetcher import JobFetchError


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


async def test_analyze_with_job_url(client, sample_pdf):
    fake_result = {
        "score": 70,
        "summary": "ok",
        "strengths": [],
        "gaps": [],
        "suggestions": [],
        "matched_keywords": [],
        "missing_keywords": [],
    }

    with patch(
        "app.routers.analyze.fetch_job_description", return_value="Fetched job text"
    ), patch("app.routers.analyze.analyze_cv", return_value=fake_result) as analyze_mock:
        response = await client.post(
            "/api/analyze",
            data={"job_url": "https://example.com/job", "language": "en"},
            files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
        )

    assert response.status_code == 200
    assert response.json()["score"] == 70
    analyze_mock.assert_called_once_with("Hello CV content", "Fetched job text", "en")


async def test_analyze_job_url_takes_precedence_over_text(client, sample_pdf):
    fake_result = {
        "score": 70,
        "summary": "ok",
        "strengths": [],
        "gaps": [],
        "suggestions": [],
        "matched_keywords": [],
        "missing_keywords": [],
    }

    with patch(
        "app.routers.analyze.fetch_job_description", return_value="From URL"
    ), patch("app.routers.analyze.analyze_cv", return_value=fake_result) as analyze_mock:
        response = await client.post(
            "/api/analyze",
            data={
                "job_description": "From text field",
                "job_url": "https://example.com/job",
                "language": "en",
            },
            files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
        )

    assert response.status_code == 200
    analyze_mock.assert_called_once_with("Hello CV content", "From URL", "en")


async def test_analyze_invalid_job_url(client, sample_pdf):
    response = await client.post(
        "/api/analyze",
        data={"job_url": "ftp://example.com/job", "language": "en"},
        files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
    )

    assert response.status_code == 422
    assert "http:// or https://" in response.json()["detail"]


async def test_analyze_job_url_fetch_error(client, sample_pdf):
    with patch(
        "app.routers.analyze.fetch_job_description",
        side_effect=JobFetchError("boom"),
    ):
        response = await client.post(
            "/api/analyze",
            data={"job_url": "https://example.com/job", "language": "en"},
            files={"cv_file": ("cv.pdf", sample_pdf, "application/pdf")},
        )

    assert response.status_code == 502
    assert response.json()["detail"] == "boom"
