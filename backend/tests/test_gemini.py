import json
from unittest.mock import MagicMock, patch

import pytest

from app.services.gemini import GeminiError, analyze_cv


def _empty_payload() -> dict:
    return {
        "score": 0,
        "summary": "",
        "strengths": [],
        "gaps": [],
        "suggestions": [],
        "matched_keywords": [],
        "missing_keywords": [],
    }


def _make_response(text: str) -> MagicMock:
    response = MagicMock()
    response.text = text
    return response


def test_analyze_cv_returns_parsed_result_and_coerces_score():
    payload = _empty_payload()
    payload["score"] = "90"
    payload["summary"] = "Great fit"

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _make_response(json.dumps(payload))

    with patch("app.services.gemini.settings") as settings:
        settings.google_api_key = "test-key"
        settings.model_name = "gemini-2.5-flash"
        with patch("app.services.gemini.genai.Client", return_value=fake_client):
            result = analyze_cv("cv text", "job text", "pl")

    assert result["score"] == 90
    assert result["summary"] == "Great fit"


def test_analyze_cv_uses_polish_in_prompt():
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _make_response(json.dumps(_empty_payload()))

    with patch("app.services.gemini.settings") as settings:
        settings.google_api_key = "k"
        settings.model_name = "m"
        with patch("app.services.gemini.genai.Client", return_value=fake_client):
            analyze_cv("cv", "job", "pl")

    contents = fake_client.models.generate_content.call_args.kwargs["contents"]
    assert "Polish" in contents
    assert "English" not in contents


def test_analyze_cv_missing_api_key_raises():
    with patch("app.services.gemini.settings") as settings:
        settings.google_api_key = ""
        with pytest.raises(GeminiError):
            analyze_cv("cv", "job", "en")


def test_analyze_cv_invalid_json_raises():
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = _make_response("not json at all")

    with patch("app.services.gemini.settings") as settings:
        settings.google_api_key = "k"
        settings.model_name = "m"
        with patch("app.services.gemini.genai.Client", return_value=fake_client):
            with pytest.raises(GeminiError):
                analyze_cv("cv", "job", "en")
