import pytest

from app.services.pdf_parser import PdfParseError, extract_text


def test_extract_text_from_valid_pdf(sample_pdf):
    text = extract_text(sample_pdf)

    assert "Hello CV content" in text


def test_extract_text_rejects_non_pdf_bytes():
    with pytest.raises(PdfParseError):
        extract_text(b"this is definitely not a pdf")


def test_extract_text_rejects_blank_pdf(blank_pdf):
    with pytest.raises(PdfParseError):
        extract_text(blank_pdf)
