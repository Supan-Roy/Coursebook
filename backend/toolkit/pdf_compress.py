import fitz  # PyMuPDF
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class PDFCompressionService:
    @staticmethod
    def compress_pdf(pdf_content, compression_level='medium'):
        """
        Compress a PDF using PyMuPDF with image downsampling and optimization.
        
        Args:
            pdf_content (bytes): The PDF file content
            compression_level (str): 'low', 'medium', or 'high'
        
        Returns:
            tuple: (compressed_pdf_bytes, error_message) or (None, error_message) if failed
        """
        try:
            # Open PDF from bytes
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            
            # Set compression parameters based on level
            if compression_level == 'low':
                # Minimal compression - just deflate streams
                deflate = True
                deflate_images = False
                deflate_fonts = False
            elif compression_level == 'high':
                # Maximum compression - deflate everything and garbage collect aggressively
                deflate = True
                deflate_images = True
                deflate_fonts = True
            else:  # medium (default)
                # Balanced compression
                deflate = True
                deflate_images = True
                deflate_fonts = False
            
            # Apply garbage collection to remove unused objects
            if compression_level in ['medium', 'high']:
                doc.scrub()  # Remove hidden/deleted content
                
                # Additional garbage collection for high compression
                if compression_level == 'high':
                    # More aggressive: remove duplicate objects, embedded files
                    doc.subset_fonts()  # Remove unused font glyphs
            
            # Save with compression options
            output = BytesIO()
            doc.save(
                output,
                garbage=4 if compression_level == 'high' else 3,  # Garbage collection level
                deflate=deflate,
                deflate_images=deflate_images,
                deflate_fonts=deflate_fonts,
                clean=True,  # Clean up syntax
                pretty=False,  # Don't pretty-print (saves space)
                linear=False,  # Don't linearize (we're not optimizing for web)
            )
            doc.close()
            
            output.seek(0)
            compressed_pdf = output.getvalue()
            
            # Calculate compression effectiveness
            original_size = len(pdf_content)
            compressed_size = len(compressed_pdf)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            logger.info(f"Compression ({compression_level}): {original_size} -> {compressed_size} bytes ({compression_ratio:.1f}% reduction)")
            
            return compressed_pdf, None
            
        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            return None, f"Compression failed: {str(e)}"

