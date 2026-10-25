import io

from pypdf import PdfReader


class PdfParseError(Exception):
    """Raised when a PDF cannot be read or contains no extractable text."""


def extract_text(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as exc:  # noqa: BLE001 - pypdf raises several exception types
        raise PdfParseError("Could not read the PDF file.") from exc

    pages: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:  # noqa: BLE001 - skip unreadable pages
            text = ""
        pages.append(text)

    full_text = "\n".join(pages).strip()
    if not full_text:
        raise PdfParseError(
            "No text could be extracted from the PDF. It may be a scanned image."
        )
    return full_text
