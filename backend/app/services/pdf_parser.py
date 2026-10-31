import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)


class PdfParseError(Exception):
    """Raised when a PDF cannot be read or contains no extractable text."""


def extract_text(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as exc:  # noqa: BLE001 - pypdf raises several exception types
        logger.warning("Could not read the PDF file: %s", exc)
        raise PdfParseError("Could not read the PDF file.") from exc

    logger.info("PDF loaded pages=%d", len(reader.pages))

    pages: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception as exc:  # noqa: BLE001 - skip unreadable pages
            logger.warning("Skipping unreadable PDF page: %s", exc)
            text = ""
        pages.append(text)

    full_text = "\n".join(pages).strip()
    if not full_text:
        raise PdfParseError(
            "No text could be extracted from the PDF. It may be a scanned image."
        )
    logger.info("Extracted text chars=%d", len(full_text))
    return full_text
