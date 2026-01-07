import fitz  # PyMuPDF
from io import BytesIO
import logging
from PIL import Image

logger = logging.getLogger(__name__)


class PDFCompressionService:
    @staticmethod
    def compress_pdf(pdf_content, compression_level='medium'):
        """
        Compress a PDF using PyMuPDF with aggressive image downsampling and optimization.
        
        Args:
            pdf_content (bytes): The PDF file content
            compression_level (str): 'low', 'medium', or 'high'
        
        Returns:
            tuple: (compressed_pdf_bytes, error_message) or (None, error_message) if failed
        """
        try:
            # Open PDF from bytes
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            
            # Set image compression parameters based on level
            if compression_level == 'low':
                image_quality = 0.85  # 85% quality
                max_dpi = 200  # Max resolution
                jpeg_quality = 85
            elif compression_level == 'high':
                image_quality = 0.60  # 60% quality - more aggressive
                max_dpi = 150  # Lower resolution
                jpeg_quality = 70
            else:  # medium (default)
                image_quality = 0.75  # 75% quality
                max_dpi = 180  # Moderate resolution
                jpeg_quality = 80
            
            # Process each page and compress images
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Get image list for this page
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    try:
                        xref = img[0]  # Image xref number
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        # Only process if image is large enough to benefit from compression
                        if len(image_bytes) < 5000:  # Skip very small images
                            continue
                        
                        # Open image with fitz
                        img_doc = fitz.open(stream=image_bytes, filetype=image_ext)
                        pix = img_doc[0].get_pixmap()
                        
                        # Calculate new dimensions based on max_dpi
                        original_width = pix.width
                        original_height = pix.height
                        
                        # Calculate scale factor to achieve max_dpi (assuming 72 DPI default)
                        scale_factor = min(1.0, max_dpi / 72.0)
                        new_width = int(original_width * scale_factor)
                        new_height = int(original_height * scale_factor)
                        
                        # Resize if needed
                        if new_width < original_width or new_height < original_height:
                            pix = fitz.Pixmap(pix, 0, 0, new_width, new_height)
                        
                        # Convert to RGB if needed (JPEG requires RGB)
                        if pix.n - pix.alpha < 4:  # GRAY or RGB
                            if pix.alpha:
                                pix = fitz.Pixmap(fitz.csRGB, pix)
                            # Compress as JPEG
                            img_bytes = pix.tobytes("jpeg", jpeg_quality=jpeg_quality)
                        else:  # CMYK - convert to RGB first
                            pix_rgb = fitz.Pixmap(fitz.csRGB, pix)
                            img_bytes = pix_rgb.tobytes("jpeg", jpeg_quality=jpeg_quality)
                            pix_rgb = None
                        
                        # Replace the image in the PDF
                        doc.update_stream(xref, img_bytes)
                        
                        # Clean up
                        pix = None
                        img_doc.close()
                        
                    except Exception as img_error:
                        # Continue with other images if one fails
                        logger.warning(f"Failed to compress image {img_index} on page {page_num}: {str(img_error)}")
                        continue
            
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
                deflate=True,  # Always deflate
                deflate_images=True,  # Always deflate images
                deflate_fonts=(compression_level == 'high'),  # Deflate fonts only for high
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

