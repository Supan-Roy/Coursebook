"""
PDF Split Service
Extracts specific pages or page ranges from a PDF document.
"""

import io
import logging
from typing import Tuple, Optional, List

try:
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

logger = logging.getLogger(__name__)


class PDFSplitService:
    """Split/extract pages from PDF files"""
    
    @staticmethod
    def validate_pdf(file_content: bytes) -> Tuple[bool, str, int]:
        """
        Validate PDF and get page count
        Returns: (is_valid, error_message, page_count)
        """
        if not HAS_PYPDF2:
            return False, "PyPDF2 library is not installed", 0
        
        try:
            reader = PdfReader(io.BytesIO(file_content))
            page_count = len(reader.pages)
            
            if page_count == 0:
                return False, "PDF has no pages", 0
            
            return True, "Valid PDF", page_count
        except Exception as e:
            return False, f"Invalid PDF: {str(e)}", 0
    
    @staticmethod
    def parse_page_ranges(page_ranges: str, total_pages: int) -> Tuple[List[int], str]:
        """
        Parse page range string and return list of page numbers
        Supports formats: "1,3,5" or "1-5" or "1,3-5,7"
        Returns: (page_list, error_message)
        """
        if not page_ranges.strip():
            return [], "No page range specified"
        
        pages = set()
        
        try:
            # Split by comma
            parts = page_ranges.split(',')
            
            for part in parts:
                part = part.strip()
                
                if '-' in part:
                    # Range like "1-5"
                    range_parts = part.split('-')
                    if len(range_parts) != 2:
                        return [], f"Invalid range format: {part}"
                    
                    start = int(range_parts[0].strip())
                    end = int(range_parts[1].strip())
                    
                    if start < 1 or end > total_pages or start > end:
                        return [], f"Invalid range: {start}-{end} (PDF has {total_pages} pages)"
                    
                    pages.update(range(start, end + 1))
                else:
                    # Single page
                    page = int(part)
                    
                    if page < 1 or page > total_pages:
                        return [], f"Page {page} out of range (PDF has {total_pages} pages)"
                    
                    pages.add(page)
            
            if not pages:
                return [], "No valid pages selected"
            
            return sorted(list(pages)), ""
        
        except ValueError as e:
            return [], f"Invalid page number format: {str(e)}"
    
    @staticmethod
    def split_pdf(
        pdf_content: bytes,
        page_ranges: str,
        file_name: str = "document.pdf"
    ) -> Tuple[Optional[bytes], str]:
        """
        Extract specific pages from PDF
        
        Args:
            pdf_content: PDF file bytes
            page_ranges: Page range string (e.g., "1-5,7,9-10")
            file_name: Original file name (for logging)
        
        Returns:
            (split_pdf_bytes, error_message)
        """
        if not HAS_PYPDF2:
            return None, "PyPDF2 library is not installed"
        
        try:
            # Validate PDF
            is_valid, error_msg, total_pages = PDFSplitService.validate_pdf(pdf_content)
            if not is_valid:
                return None, error_msg
            
            # Parse page ranges
            pages, error_msg = PDFSplitService.parse_page_ranges(page_ranges, total_pages)
            if error_msg:
                return None, error_msg
            
            # Read source PDF
            reader = PdfReader(io.BytesIO(pdf_content))
            writer = PdfWriter()
            
            # Add selected pages
            for page_num in pages:
                # PyPDF2 uses 0-based indexing
                writer.add_page(reader.pages[page_num - 1])
            
            # Write output PDF
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            logger.info(f"Split {file_name}: extracted {len(pages)} pages from {total_pages}")
            
            return output_buffer.getvalue(), ""
        
        except Exception as e:
            logger.error(f"Error splitting PDF: {e}", exc_info=True)
            return None, f"Failed to split PDF: {str(e)}"
