"""
PDF Security Service
Lock (encrypt) and unlock (decrypt) PDF files with passwords.
"""

import io
import logging
from typing import Tuple, Optional

try:
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

logger = logging.getLogger(__name__)


class PDFSecurityService:
    """Encrypt and decrypt PDF files"""
    
    @staticmethod
    def validate_pdf(file_content: bytes) -> Tuple[bool, str, bool]:
        """
        Validate PDF and check if it's encrypted
        Returns: (is_valid, error_message, is_encrypted)
        """
        if not HAS_PYPDF2:
            return False, "PyPDF2 library is not installed", False
        
        try:
            reader = PdfReader(io.BytesIO(file_content))
            is_encrypted = reader.is_encrypted
            
            if len(reader.pages) == 0:
                return False, "PDF has no pages", is_encrypted
            
            return True, "Valid PDF", is_encrypted
        except Exception as e:
            return False, f"Invalid PDF: {str(e)}", False
    
    @staticmethod
    def lock_pdf(
        pdf_content: bytes,
        user_password: str,
        owner_password: Optional[str] = None,
        file_name: str = "document.pdf"
    ) -> Tuple[Optional[bytes], str]:
        """
        Encrypt PDF with password protection
        
        Args:
            pdf_content: PDF file bytes
            user_password: Password for opening the PDF
            owner_password: Password for full permissions (optional, defaults to user_password)
            file_name: Original file name (for logging)
        
        Returns:
            (encrypted_pdf_bytes, error_message)
        """
        if not HAS_PYPDF2:
            return None, "PyPDF2 library is not installed"
        
        if not user_password or len(user_password.strip()) < 1:
            return None, "Password is required"
        
        try:
            # Validate PDF
            is_valid, error_msg, is_encrypted = PDFSecurityService.validate_pdf(pdf_content)
            if not is_valid:
                return None, error_msg
            
            if is_encrypted:
                return None, "PDF is already encrypted. Please unlock it first."
            
            # Read source PDF
            reader = PdfReader(io.BytesIO(pdf_content))
            writer = PdfWriter()
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Add encryption
            if owner_password is None:
                owner_password = user_password
            
            writer.encrypt(
                user_pwd=user_password,
                owner_pwd=owner_password
            )
            
            # Write output PDF
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            logger.info(f"Locked PDF: {file_name} with password protection")
            
            return output_buffer.getvalue(), ""
        
        except Exception as e:
            logger.error(f"Error locking PDF: {e}", exc_info=True)
            return None, f"Failed to lock PDF: {str(e)}"
    
    @staticmethod
    def unlock_pdf(
        pdf_content: bytes,
        password: str,
        file_name: str = "document.pdf"
    ) -> Tuple[Optional[bytes], str]:
        """
        Decrypt password-protected PDF
        
        Args:
            pdf_content: Encrypted PDF file bytes
            password: Password to decrypt the PDF
            file_name: Original file name (for logging)
        
        Returns:
            (decrypted_pdf_bytes, error_message)
        """
        if not HAS_PYPDF2:
            return None, "PyPDF2 library is not installed"
        
        if not password or len(password.strip()) < 1:
            return None, "Password is required"
        
        try:
            # Read encrypted PDF
            reader = PdfReader(io.BytesIO(pdf_content))
            
            if not reader.is_encrypted:
                return None, "PDF is not encrypted"
            
            # Try to decrypt with provided password
            if not reader.decrypt(password):
                return None, "Incorrect password"
            
            # Create new unencrypted PDF
            writer = PdfWriter()
            
            # Copy all pages
            try:
                for page in reader.pages:
                    writer.add_page(page)
            except Exception as e:
                return None, f"Failed to read encrypted pages: {str(e)}"
            
            # Write output PDF (without encryption)
            output_buffer = io.BytesIO()
            writer.write(output_buffer)
            output_buffer.seek(0)
            
            logger.info(f"Unlocked PDF: {file_name}")
            
            return output_buffer.getvalue(), ""
        
        except Exception as e:
            logger.error(f"Error unlocking PDF: {e}", exc_info=True)
            return None, f"Failed to unlock PDF: {str(e)}"
