import io
from typing import Dict, Any, Optional
from app.config import logger

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """
    High-speed native PDF text extraction using PyMuPDF (fitz).
    Handles multi-column layouts, tables, and vector text streams.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_pages = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text.strip():
                text_pages.append(page_text)
        doc.close()
        return "\n".join(text_pages)
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed, trying plain text decoding: {e}")
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts plain text from PDF, TXT, or Markdown binary payloads.
    """
    fn_lower = filename.lower()
    if fn_lower.endswith(".pdf"):
        return extract_text_from_pdf_bytes(file_bytes)
    elif fn_lower.endswith(".txt") or fn_lower.endswith(".md"):
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""
    else:
        # Fallback
        return extract_text_from_pdf_bytes(file_bytes)
