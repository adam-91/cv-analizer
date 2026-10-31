"""Fetch a job posting page and extract its readable text."""

import html
import logging
import re
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
_TIMEOUT_SECONDS = 10
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB

_SCHEME_RE = re.compile(r"^https?://", re.IGNORECASE)
_SCRIPT_STYLE_RE = re.compile(
    r"<(script|style)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL
)
_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


class JobFetchError(Exception):
    """Raised when a job posting URL cannot be fetched or parsed."""


def fetch_job_description(url: str) -> str:
    url = url.strip()
    if not _SCHEME_RE.match(url):
        raise JobFetchError("URL must start with http:// or https://.")

    request = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SECONDS) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            raw = response.read(_MAX_BYTES + 1)
    except (
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
        OSError,
        ValueError,
    ) as exc:
        logger.warning("Failed to fetch job posting URL %r: %s", url, exc)
        raise JobFetchError(f"Could not fetch the job posting: {exc}") from exc

    if len(raw) > _MAX_BYTES:
        raise JobFetchError("The job posting page is too large to process.")

    try:
        page = raw.decode(charset, errors="replace")
    except LookupError:
        page = raw.decode("utf-8", errors="replace")

    # Remove scripts/styles first, then any remaining tags, then decode entities.
    page = _SCRIPT_STYLE_RE.sub(" ", page)
    text = _TAG_RE.sub(" ", page)
    text = html.unescape(text)
    text = _WHITESPACE_RE.sub(" ", text).strip()

    if not text:
        raise JobFetchError("No text could be extracted from the job posting URL.")

    logger.info("Fetched job posting text chars=%d", len(text))
    return text
