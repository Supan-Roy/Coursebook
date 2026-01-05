"""
PDF Watermarking Service
Adds text or image watermarks to PDF files with customizable positioning
"""

from io import BytesIO
from typing import Tuple, Optional
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import logging

logger = logging.getLogger(__name__)


class PDFWatermarkService:
    """Service for adding watermarks to PDFs"""
    
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
        """Validate PDF file and return page count"""
        try:
            if len(pdf_content) > cls.MAX_FILE_SIZE:
                return False, "PDF file exceeds 50MB limit", 0
            
            pdf_reader = PdfReader(BytesIO(pdf_content))
            page_count = len(pdf_reader.pages)
            
            if page_count == 0:
                return False, "PDF file has no pages", 0
            
            return True, "", page_count
            
        except Exception as e:
            logger.error(f"PDF validation error: {str(e)}")
            return False, f"Invalid PDF file: {str(e)}", 0
    
    @classmethod
    def add_text_watermark(
        cls,
        pdf_content: bytes,
        text: str,
        font_name: str = 'helvetica',
        font_size: int = 40,
        color: str = '000000',
        opacity: float = 0.3,
        x_position: float = 300,
        y_position: float = 400,
        rotation: int = 45,
        apply_to_all: bool = True,
        page_number: Optional[int] = None
    ) -> Tuple[Optional[bytes], str]:
        """Add text watermark to PDF"""
        try:
            # Validate PDF
            is_valid, error_msg, page_count = cls.validate_pdf(pdf_content)
            if not is_valid:
                return None, error_msg
            
            # Read original PDF
            pdf_reader = PdfReader(BytesIO(pdf_content))
            pdf_writer = PdfWriter()
            
            # Get font
            font = cls.FONT_MAPPING.get(font_name.lower(), 'Helvetica')
            
            # Create watermark
            for page_idx in range(page_count):
                page = pdf_reader.pages[page_idx]
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Check if we should apply watermark to this page
                should_watermark = apply_to_all or (page_number is not None and page_idx == page_number - 1)
                
                if should_watermark:
                    # Create watermark overlay
                    packet = BytesIO()
                    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
                    
                    # Set transparency
                    can.setFillAlpha(opacity)
                    
                    # Set color
                    can.setFillColor(HexColor(f'#{color}'))
                    
                    # Set font
                    can.setFont(font, font_size)
                    
                    # Save state and rotate
                    can.saveState()
                    can.translate(x_position, y_position)
                    can.rotate(rotation)
                    
                    # Draw text
                    can.drawString(0, 0, text)
                    
                    can.restoreState()
                    can.save()
                    
                    # Merge watermark with page
                    packet.seek(0)
                    watermark_pdf = PdfReader(packet)
                    page.merge_page(watermark_pdf.pages[0])
                
                pdf_writer.add_page(page)
            
            # Write output
            output = BytesIO()
            pdf_writer.write(output)
            output.seek(0)
            
            return output.getvalue(), ""
            
        except Exception as e:
            logger.error(f"Error adding text watermark: {str(e)}")
            return None, f"Failed to add watermark: {str(e)}"
    
    @classmethod
    def add_image_watermark(
        cls,
        pdf_content: bytes,
        image_content: bytes,
        width: float = 200,
        height: float = 200,
        x_position: float = 200,
        y_position: float = 300,
        opacity: float = 0.3,
        apply_to_all: bool = True,
        page_number: Optional[int] = None
    ) -> Tuple[Optional[bytes], str]:
        """Add image watermark to PDF"""
        try:
            # Validate PDF
            is_valid, error_msg, page_count = cls.validate_pdf(pdf_content)
            if not is_valid:
                return None, error_msg
            
            # Read original PDF
            pdf_reader = PdfReader(BytesIO(pdf_content))
            pdf_writer = PdfWriter()
            
            # Load image
            image = ImageReader(BytesIO(image_content))
            
            # Create watermark for each page
            for page_idx in range(page_count):
                page = pdf_reader.pages[page_idx]
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Check if we should apply watermark to this page
                should_watermark = apply_to_all or (page_number is not None and page_idx == page_number - 1)
                
                if should_watermark:
                    # Create watermark overlay
                    packet = BytesIO()
                    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
                    
                    # Set transparency
                    can.setFillAlpha(opacity)
                    
                    # Draw image
                    can.drawImage(
                        image,
                        x_position,
                        y_position,
                        width=width,
                        height=height,
                        mask='auto',
                        preserveAspectRatio=True
                    )
                    
                    can.save()
                    
                    # Merge watermark with page
                    packet.seek(0)
                    watermark_pdf = PdfReader(packet)
                    page.merge_page(watermark_pdf.pages[0])
                
                pdf_writer.add_page(page)
            
            # Write output
            output = BytesIO()
            pdf_writer.write(output)
            output.seek(0)
            
            return output.getvalue(), ""
            
        except Exception as e:
            logger.error(f"Error adding image watermark: {str(e)}")
            return None, f"Failed to add watermark: {str(e)}"
