"""
PDF Merge Service
Merges multiple PDF files into a single PDF document.
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


class PDFMergeService:
    """Merge multiple PDF files into one"""
    
    @staticmethod
    def validate_pdfs(file_list: List[bytes]) -> Tuple[bool, str]:
        """Validate that all files are proper PDFs"""
        if not HAS_PYPDF2:
            return False, "PyPDF2 library is not installed"
        
        if not file_list:
            return False, "No files provided"
        
        if len(file_list) < 2:
            return False, "At least 2 PDF files are required to merge"
        
        try:
            for idx, file_content in enumerate(file_list):
                PdfReader(io.BytesIO(file_content))
        except Exception as e:
            return False, f"File {idx + 1} is not a valid PDF: {str(e)}"
        
        return True, "All PDFs are valid"
    
    @staticmethod
    def merge_pdfs(
        pdf_files: List[bytes],
        file_names: List[str] = None
    ) -> Tuple[Optional[bytes], str]:
        """
        Merge multiple PDF files into one
        
        Args:
            pdf_files: List of PDF file bytes
            file_names: List of file names (for logging/reference)
        
        Returns:
            (merged_pdf_bytes, error_message)
        """
        if not HAS_PYPDF2:
            return None, "PyPDF2 library is not installed"
        
        try:
            # Validate inputs
            is_valid, validation_msg = PDFMergeService.validate_pdfs(pdf_files)
            if not is_valid:
                return None, validation_msg
            
            # Create PDF writer
            writer = PdfWriter()
            
            # Add all PDFs to the writer
            for idx, pdf_content in enumerate(pdf_files):
                try:
                    reader = PdfReader(io.BytesIO(pdf_content))
                    
                    # Add all pages from this PDF
                    for page_num in range(len(reader.pages)):
                        writer.add_page(reader.pages[page_num])
                    
                    file_name = file_names[idx] if file_names and idx < len(file_names) else f"document_{idx + 1}.pdf"
                    logger.info(f"Added {len(reader.pages)} pages from {file_name}")
                    
                except Exception as e:
                    file_name = file_names[idx] if file_names and idx < len(file_names) else f"document_{idx + 1}"
                    logger.error(f"Error processing {file_name}: {e}")
                    return None, f"Error processing file {idx + 1}: {str(e)}"
            
            # Write output PDF
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            total_pages = sum(len(PdfReader(io.BytesIO(pdf)).pages) for pdf in pdf_files)
            logger.info(f"Successfully merged {len(pdf_files)} PDFs into 1 document with {total_pages} pages")
            
            return output_buffer.getvalue(), ""
            
        except Exception as e:
            logger.error(f"Error merging PDFs: {e}", exc_info=True)
            return None, f"Failed to merge PDFs: {str(e)}"
