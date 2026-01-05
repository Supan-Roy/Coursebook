"""
PDF Edit Service
Adds simple annotations (text and highlight rectangles) to PDF pages.
"""

import json
import logging
from io import BytesIO
from typing import Tuple, Optional, List, Dict
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor

logger = logging.getLogger(__name__)


class PDFEditService:
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    FONT_MAPPING = {
        'helvetica': 'Helvetica',
        'helvetica-bold': 'Helvetica-Bold',
        'times': 'Times-Roman',
        'times-bold': 'Times-Bold',
        'courier': 'Courier',
        'courier-bold': 'Courier-Bold',
    }

    @classmethod
    def validate_pdf(cls, pdf_content: bytes) -> Tuple[bool, str, int]:
        try:
            if len(pdf_content) > cls.MAX_FILE_SIZE:
                return False, "PDF file exceeds 50MB limit", 0
            pdf_reader = PdfReader(BytesIO(pdf_content))
            page_count = len(pdf_reader.pages)
            if page_count == 0:
                return False, "PDF file has no pages", 0
            return True, "", page_count
        except Exception as exc:
            logger.error("PDF validation error: %s", exc)
            return False, f"Invalid PDF file: {exc}", 0

    @classmethod
    def apply_annotations(cls, pdf_content: bytes, annotations: List[Dict]) -> Tuple[Optional[bytes], str]:
        try:
            is_valid, error_msg, page_count = cls.validate_pdf(pdf_content)
            if not is_valid:
                return None, error_msg

            pdf_reader = PdfReader(BytesIO(pdf_content))
            pdf_writer = PdfWriter()

            # Group annotations by 1-based page number
            by_page: Dict[int, List[Dict]] = {}
            for ann in annotations:
                try:
                    page = int(ann.get('page', 1))
                    if page < 1:
                        page = 1
                except (ValueError, TypeError):
                    page = 1
                by_page.setdefault(page, []).append(ann)

            for idx in range(page_count):
                page = pdf_reader.pages[idx]
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                page_num = idx + 1

                page_annotations = by_page.get(page_num, [])
                if page_annotations:
                    packet = BytesIO()
                    can = canvas.Canvas(packet, pagesize=(page_width, page_height))

                    for ann in page_annotations:
                        ann_type = ann.get('type')
                        try:
                            x = float(ann.get('x', 0))
                            y = float(ann.get('y', 0))
                            opacity = float(ann.get('opacity', 0.5))
                            color = str(ann.get('color', '0000ff')).replace('#', '')
                        except (ValueError, TypeError):
                            continue

                        if ann_type == 'text':
                            text_value = str(ann.get('text', 'Note'))
                            font_name = cls.FONT_MAPPING.get(str(ann.get('fontName', 'helvetica')).lower(), 'Helvetica')
                            try:
                                font_size = float(ann.get('fontSize', 14))
                            except (ValueError, TypeError):
                                font_size = 14

                            can.saveState()
                            can.setFillAlpha(max(0.0, min(opacity, 1.0)))
                            can.setFillColor(HexColor(f'#{color}'))
                            can.setFont(font_name, font_size)
                            can.drawString(x, y, text_value)
                            can.restoreState()

                        elif ann_type == 'highlight':
                            try:
                                width = float(ann.get('width', 120))
                                height = float(ann.get('height', 32))
                            except (ValueError, TypeError):
                                width, height = 120.0, 32.0
                            
                            can.saveState()
                            # Parse color to RGB
                            hex_color = color.replace('#', '')
                            try:
                                r = int(hex_color[0:2], 16) / 255.0
                                g = int(hex_color[2:4], 16) / 255.0
                                b = int(hex_color[4:6], 16) / 255.0
                            except (ValueError, IndexError):
                                r, g, b = 1.0, 0.8, 0.0  # default yellow
                            
                            # Set alpha and color using RGB with alpha
                            alpha_val = max(0.0, min(opacity, 1.0))
                            can.setFillAlpha(alpha_val)
                            can.setFillColorRGB(r, g, b, alpha=alpha_val)
                            can.rect(x, y, width, height, fill=1, stroke=0)
                            can.restoreState()
                        else:
                            continue

                    can.save()
                    packet.seek(0)
                    overlay_pdf = PdfReader(packet)
                    page.merge_page(overlay_pdf.pages[0])

                pdf_writer.add_page(page)

            output = BytesIO()
            pdf_writer.write(output)
            output.seek(0)
            return output.getvalue(), ""

        except Exception as exc:
            logger.error("Error applying annotations: %s", exc)
            return None, f"Failed to edit PDF: {exc}"