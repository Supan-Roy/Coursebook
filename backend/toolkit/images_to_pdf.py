from io import BytesIO
from typing import Iterable, Tuple

from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


class ImagesToPDFService:
    """Convert one or more images to a single PDF without padding."""

    SUPPORTED_FORMATS = {"jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB per file

    @classmethod
    def validate_images(cls, image_files: Iterable) -> Tuple[bool, str]:
        """Validate image files for type and size."""
        files = list(image_files or [])
        if not files:
            return False, "No image files provided"

        for image in files:
            if not getattr(image, "name", None):
                return False, "Invalid file upload"

            ext = image.name.rsplit(".", 1)[-1].lower()
            if ext not in cls.SUPPORTED_FORMATS:
                return False, f"Unsupported image format: {ext}"

            if getattr(image, "size", 0) > cls.MAX_FILE_SIZE:
                return False, f"{image.name} exceeds 50MB limit"

        return True, ""

    @classmethod
    def convert_images_to_pdf(cls, image_files: Iterable) -> Tuple[bytes, str]:
        """Render each image on its own PDF page sized to the image itself."""
        try:
            buffer = BytesIO()
            pdf = canvas.Canvas(buffer)

            for image in image_files:
                img_bytes = image.read()
                reader = ImageReader(BytesIO(img_bytes))
                width, height = reader.getSize()

                # Match page size to image dimensions to avoid extra whitespace
                pdf.setPageSize((width, height))
                pdf.drawImage(
                    reader,
                    0,
                    0,
                    width=width,
                    height=height,
                    preserveAspectRatio=False,
                    mask="auto",
                )
                pdf.showPage()

            pdf.save()
            buffer.seek(0)
            return buffer.getvalue(), ""
        except Exception as exc:  # pragma: no cover - defensive catch
            return None, str(exc)
