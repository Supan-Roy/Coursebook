"""
PDF Page Numbering Service
Adds customizable page numbers to PDF documents with adjustable size, position, and color.
"""

import io
import logging
from typing import Tuple, Optional
from enum import Enum

try:
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch

logger = logging.getLogger(__name__)


class PageNumberPosition(Enum):
    """Enumeration for page number positions"""
    TOP_LEFT = "top_left"
    TOP_CENTER = "top_center"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_CENTER = "bottom_center"
    BOTTOM_RIGHT = "bottom_right"


class PageNumberingService:
    """Add customizable page numbers to PDF files"""
    
    @staticmethod
    def validate_pdf(file_content: bytes) -> Tuple[bool, str]:
        """Validate that the file is a proper PDF"""
        if not HAS_PYPDF2:
            return False, "PyPDF2 library is not installed"
        
        try:
            PdfReader(io.BytesIO(file_content))
            return True, "Valid PDF"
        except Exception as e:
            return False, f"Invalid PDF: {str(e)}"
    
    @staticmethod
    def add_page_numbers(
        pdf_content: bytes,
        position: str = "bottom_right",
        font_size: int = 10,
        color: str = "000000",
        start_number: int = 1,
        prefix: str = "",
        suffix: str = ""
    ) -> Tuple[Optional[bytes], str]:
        """
        Add page numbers to PDF
        
        Args:
            pdf_content: PDF file bytes
            position: "top_left", "top_center", "top_right", "bottom_left", "bottom_center", "bottom_right"
            font_size: Font size in points (8-24)
            color: Hex color code (e.g., "000000" for black, "FF0000" for red)
            start_number: Starting page number (default 1)
            prefix: Text before page number (e.g., "Page ")
            suffix: Text after page number (e.g., " of {total}")
        
        Returns:
            (pdf_bytes, error_message)
        """
        if not HAS_PYPDF2:
            return None, "PyPDF2 library is not installed"
        
        try:
            # Validate inputs
            if position not in [e.value for e in PageNumberPosition]:
                return None, f"Invalid position: {position}. Use: {', '.join([e.value for e in PageNumberPosition])}"
            
            if not 8 <= font_size <= 24:
                return None, "Font size must be between 8 and 24 points"
            
            if len(color) != 6 or not all(c in '0123456789ABCDEFabcdef' for c in color):
                return None, "Invalid color code. Use hex format (e.g., '000000' for black)"
            
            # Parse hex color to RGB
            rgb = tuple(int(color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
            
            # Read the input PDF
            reader = PdfReader(io.BytesIO(pdf_content))
            writer = PdfWriter()
            
            total_pages = len(reader.pages)
            
            for page_num in range(total_pages):
                page = reader.pages[page_num]
                
                # Get page dimensions
                page_width = float(page.mediabox.width)
                page_height = float(page.mediabox.height)
                
                # Create overlay with page number
                overlay_buffer = io.BytesIO()
                c = canvas.Canvas(overlay_buffer, pagesize=(page_width, page_height))
                c.setFont("Helvetica", font_size)
                c.setFillColorRGB(*rgb)
                
                # Calculate page number text
                current_page_num = start_number + page_num
                page_text = f"{prefix}{current_page_num}{suffix}"
                
                # Calculate text dimensions for positioning
                text_width = c.stringWidth(page_text, "Helvetica", font_size)
                text_height = font_size
                margin = 0.5 * inch
                
                # Position based on selection
                if position == PageNumberPosition.TOP_LEFT.value:
                    x = margin
                    y = page_height - margin - text_height
                elif position == PageNumberPosition.TOP_CENTER.value:
                    x = (page_width - text_width) / 2
                    y = page_height - margin - text_height
                elif position == PageNumberPosition.TOP_RIGHT.value:
                    x = page_width - margin - text_width
                    y = page_height - margin - text_height
                elif position == PageNumberPosition.BOTTOM_LEFT.value:
                    x = margin
                    y = margin
                elif position == PageNumberPosition.BOTTOM_CENTER.value:
                    x = (page_width - text_width) / 2
                    y = margin
                else:  # BOTTOM_RIGHT
                    x = page_width - margin - text_width
                    y = margin
                
                # Draw the page number
                c.drawString(x, y, page_text)
                c.save()
                
                # Read overlay
                overlay_buffer.seek(0)
                overlay_reader = PdfReader(overlay_buffer)
                overlay_page = overlay_reader.pages[0]
                
                # Merge overlay with original page
                page.merge_page(overlay_page)
                writer.add_page(page)
            
            # Write output PDF
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            return output_buffer.getvalue(), ""
            
        except Exception as e:
            logger.error(f"Error adding page numbers: {e}", exc_info=True)
            return None, f"Failed to add page numbers: {str(e)}"
