import fitz  # PyMuPDF
from io import BytesIO
import logging
import subprocess
import tempfile
import os
import shutil

logger = logging.getLogger(__name__)


class PDFCompressionService:
    @staticmethod
    def _check_ghostscript():
        """Check if Ghostscript is available"""
        try:
            # Try to find gs command (works on both Windows and Unix)
            gs_commands = ['gs', 'gswin64c', 'gswin32c']
            for cmd in gs_commands:
                result = subprocess.run(
                    [cmd, '--version'],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    return cmd
            return None
        except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
            return None
    
    @staticmethod
    def _compress_with_ghostscript(pdf_content, compression_level='medium'):
        """
        Compress PDF using Ghostscript (much better compression than PyMuPDF alone).
        
        Args:
            pdf_content (bytes): The PDF file content
            compression_level (str): 'low', 'medium', or 'high'
        
        Returns:
            tuple: (compressed_pdf_bytes, error_message) or (None, error_message) if failed
        """
        gs_cmd = PDFCompressionService._check_ghostscript()
        if not gs_cmd:
            return None, "Ghostscript not found"
        
        # Set Ghostscript compression settings based on level
        if compression_level == 'low':
            dpi = 150
            image_resolution = 150
            pdf_settings = "/screen"  # 72 dpi
        elif compression_level == 'high':
            dpi = 200
            image_resolution = 150
            pdf_settings = "/ebook"  # 150 dpi, aggressive compression
        else:  # medium (default)
            dpi = 200
            image_resolution = 200
            pdf_settings = "/printer"  # 300 dpi, good balance
        
        temp_input = None
        temp_output = None
        try:
            # Create temporary files
            temp_input = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            
            # Write input PDF
            temp_input.write(pdf_content)
            temp_input.close()
            temp_output.close()
            
            # Build Ghostscript command
            gs_command = [
                gs_cmd,
                '-sDEVICE=pdfwrite',
                f'-dPDFSETTINGS={pdf_settings}',
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                '-dDetectDuplicateImages=true',
                '-dCompressFonts=true',
                '-dSubsetFonts=true',
                '-dColorImageDownsampleType=/Bicubic',
                '-dColorImageResolution={}'.format(image_resolution),
                '-dGrayImageDownsampleType=/Bicubic',
                '-dGrayImageResolution={}'.format(image_resolution),
                '-dMonoImageDownsampleType=/Bicubic',
                '-dMonoImageResolution={}'.format(image_resolution),
                '-dColorImageFilter=/DCTEncode',
                '-dGrayImageFilter=/DCTEncode',
                '-dAutoRotatePages=/None',
                '-dEmbedAllFonts=true',
                f'-sOutputFile={temp_output.name}',
                temp_input.name
            ]
            
            # Run Ghostscript
            result = subprocess.run(
                gs_command,
                capture_output=True,
                timeout=60,
                check=False
            )
            
            if result.returncode != 0:
                error_msg = result.stderr.decode('utf-8', errors='ignore')
                logger.error(f"Ghostscript compression failed: {error_msg}")
                return None, f"Ghostscript compression failed: {error_msg[:200]}"
            
            # Read compressed PDF
            with open(temp_output.name, 'rb') as f:
                compressed_pdf = f.read()
            
            # Calculate compression effectiveness
            original_size = len(pdf_content)
            compressed_size = len(compressed_pdf)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            logger.info(f"Ghostscript compression ({compression_level}): {original_size} -> {compressed_size} bytes ({compression_ratio:.1f}% reduction)")
            
            # If compression didn't help, return original
            if compressed_size >= original_size:
                logger.warning("Ghostscript compression didn't reduce size, returning original")
                return pdf_content, None
            
            return compressed_pdf, None
            
        except subprocess.TimeoutExpired:
            return None, "Compression timed out"
        except Exception as e:
            logger.error(f"Ghostscript compression error: {str(e)}")
            return None, f"Ghostscript compression error: {str(e)}"
        finally:
            # Clean up temporary files
            if temp_input and os.path.exists(temp_input.name):
                try:
                    os.unlink(temp_input.name)
                except:
                    pass
            if temp_output and os.path.exists(temp_output.name):
                try:
                    os.unlink(temp_output.name)
                except:
                    pass
    
    @staticmethod
    def _compress_with_pymupdf(pdf_content, compression_level='medium'):
        """
        Fallback compression using PyMuPDF (safer but less effective).
        """
        try:
            # Open PDF from bytes
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            
            # Set compression parameters based on level
            if compression_level == 'low':
                garbage_level = 2
                deflate = True
                deflate_images = False
                deflate_fonts = False
            elif compression_level == 'high':
                garbage_level = 4
                deflate = True
                deflate_images = True
                deflate_fonts = True
            else:  # medium (default)
                garbage_level = 3
                deflate = True
                deflate_images = True
                deflate_fonts = False
            
            # Apply garbage collection
            if compression_level in ['medium', 'high']:
                doc.scrub()
                if compression_level == 'high':
                    try:
                        doc.subset_fonts()
                    except:
                        pass
            
            # Save with compression
            output = BytesIO()
            doc.save(
                output,
                garbage=garbage_level,
                deflate=deflate,
                deflate_images=deflate_images,
                deflate_fonts=deflate_fonts,
                clean=True,
                pretty=False,
                linear=False,
                ascii=False,
            )
            doc.close()
            
            output.seek(0)
            compressed_pdf = output.getvalue()
            
            original_size = len(pdf_content)
            compressed_size = len(compressed_pdf)
            
            if compressed_size >= original_size:
                return pdf_content, None
            
            return compressed_pdf, None
            
        except Exception as e:
            logger.error(f"PyMuPDF compression failed: {str(e)}")
            return None, f"PyMuPDF compression failed: {str(e)}"
    
    @staticmethod
    def compress_pdf(pdf_content, compression_level='medium'):
        """
        Compress a PDF using Ghostscript (preferred) or PyMuPDF (fallback).
        
        Args:
            pdf_content (bytes): The PDF file content
            compression_level (str): 'low', 'medium', or 'high'
        
        Returns:
            tuple: (compressed_pdf_bytes, error_message) or (None, error_message) if failed
        """
        # Try Ghostscript first (better compression)
        result, error = PDFCompressionService._compress_with_ghostscript(pdf_content, compression_level)
        if result is not None:
            return result, None
        
        # Fallback to PyMuPDF if Ghostscript fails or is not available
        logger.info(f"Ghostscript compression failed or unavailable ({error}), falling back to PyMuPDF")
        return PDFCompressionService._compress_with_pymupdf(pdf_content, compression_level)

