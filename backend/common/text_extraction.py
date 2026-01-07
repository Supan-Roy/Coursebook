import os
import platform
import re
from pathlib import Path
from typing import Optional

from PyPDF2 import PdfReader
from PIL import Image
import pytesseract


# Ensure Tesseract is discoverable on Windows environments
if platform.system() == "Windows":
    tesseract_path = os.getenv("TESSERACT_CMD")
    if tesseract_path:
        tesseract_dir = os.path.dirname(tesseract_path)
    else:
        tesseract_dir = r"C:\\Program Files\\Tesseract-OCR"
    current_path = os.getenv("PATH", "")
    if tesseract_dir and tesseract_dir not in current_path:
        os.environ["PATH"] = tesseract_dir + os.pathsep + current_path


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".webp", ".svg"}
TEXT_EXTENSIONS = {".txt", ".md"}


def _extract_pdf_text(path: Path) -> str:
    reader = PdfReader(path)
    chunks: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text:
            chunks.append(text)
    return "\n".join(chunks)


def _extract_image_text(path: Path) -> str:
    image = Image.open(path)
    if image.mode != "RGB":
        image = image.convert("RGB")
    return pytesseract.image_to_string(image)


def _extract_plain_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _clean_text(text: str) -> str:
    # Collapse excessive whitespace and control characters
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_path(file_path: str | Path, content_type: Optional[str] = None, max_chars: int = 12000) -> str:
    """Extract human-readable text from a stored file path or remote URL.

    Supports PDFs, common image formats via OCR, and plain text files.
    If file_path is a URL (starts with http/https), downloads the file to a temp location first.
    The result is cleaned and truncated to max_chars to avoid oversized payloads.
    """
    import tempfile
    import requests

    is_url = isinstance(file_path, str) and file_path.startswith("http")
    if is_url:
        # Download remote file (Cloudinary or local API proxy) to temp file
        import shutil
        import uuid
        ext = Path(file_path).suffix.lower() or ".tmp"
        temp_dir = tempfile.gettempdir()
        temp_name = f"material_{uuid.uuid4().hex}{ext}"
        temp_path = Path(temp_dir) / temp_name
        try:
            response = requests.get(file_path, stream=True)
            response.raise_for_status()
            with open(temp_path, "wb") as f:
                shutil.copyfileobj(response.raw, f)
            path = temp_path
            content_type = (content_type or "").lower()
            try:
                if ext == ".pdf" or "pdf" in content_type:
                    raw_text = _extract_pdf_text(path)
                elif ext in IMAGE_EXTENSIONS or content_type.startswith("image/"):
                    raw_text = _extract_image_text(path)
                elif ext in TEXT_EXTENSIONS or content_type.startswith("text/"):
                    raw_text = _extract_plain_text(path)
                else:
                    raw_text = _extract_plain_text(path)
            finally:
                try:
                    path.unlink(missing_ok=True)
                except Exception:
                    pass
        except Exception as exc:
            raise RuntimeError(f"Failed to extract text from remote file {file_path}: {exc}") from exc
    else:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        ext = path.suffix.lower()
        content_type = (content_type or "").lower()
        try:
            if ext == ".pdf" or "pdf" in content_type:
                raw_text = _extract_pdf_text(path)
            elif ext in IMAGE_EXTENSIONS or content_type.startswith("image/"):
                raw_text = _extract_image_text(path)
            elif ext in TEXT_EXTENSIONS or content_type.startswith("text/"):
                raw_text = _extract_plain_text(path)
            else:
                raw_text = _extract_plain_text(path)
        except Exception as exc:
            raise RuntimeError(f"Failed to extract text from {path}: {exc}") from exc

    cleaned = _clean_text(raw_text)
    return cleaned[:max_chars]
