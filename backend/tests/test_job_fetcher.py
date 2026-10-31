import urllib.error
from unittest.mock import MagicMock, patch

import pytest

from app.services.job_fetcher import JobFetchError, fetch_job_description


def _urlopen_mock(html_bytes: bytes, charset: str = "utf-8") -> MagicMock:
    """Build a fake urlopen() result that supports the context manager protocol."""
    response = MagicMock()
    response.headers.get_content_charset.return_value = charset
    response.read.return_value = html_bytes

    handle = MagicMock()
    handle.__enter__.return_value = response
    handle.__exit__.return_value = False
    return handle


def test_fetch_job_description_strips_html_and_extracts_text():
    html_bytes = (
        b"<html><head><script>var x = 1;</script><style>p { color: red; }</style></head>"
        b"<body><h1>Senior Developer</h1><p>Python &amp; Django</p></body></html>"
    )

    with patch(
        "app.services.job_fetcher.urllib.request.urlopen",
        return_value=_urlopen_mock(html_bytes),
    ):
        text = fetch_job_description("https://example.com/job")

    assert "Senior Developer" in text
    assert "Python & Django" in text
    assert "var x" not in text
    assert "color" not in text


def test_fetch_job_description_rejects_non_http_url():
    with pytest.raises(JobFetchError):
        fetch_job_description("ftp://example.com/job")


def test_fetch_job_description_raises_on_network_error():
    with patch(
        "app.services.job_fetcher.urllib.request.urlopen",
        side_effect=urllib.error.URLError("connection refused"),
    ):
        with pytest.raises(JobFetchError):
            fetch_job_description("https://example.com/job")


def test_fetch_job_description_raises_on_empty_text():
    with patch(
        "app.services.job_fetcher.urllib.request.urlopen",
        return_value=_urlopen_mock(b"<html><body></body></html>"),
    ):
        with pytest.raises(JobFetchError):
            fetch_job_description("https://example.com/job")
