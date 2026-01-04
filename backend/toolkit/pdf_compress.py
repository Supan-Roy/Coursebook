from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO


class PDFCompressionService:
    @staticmethod
    def compress_pdf(pdf_content, compression_level='medium'):
        """
        Compress a PDF by removing unnecessary content and optimizing streams.
        
        Args:
            pdf_content (bytes): The PDF file content
            compression_level (str): 'low', 'medium', or 'high'
        
        Returns:
            tuple: (compressed_pdf_bytes, error_message) or (None, error_message) if failed
        """
        try:
            # Read the PDF
            reader = PdfReader(BytesIO(pdf_content))
            writer = PdfWriter()
            
            # Set compression level
            if compression_level == 'low':
                compress_content_streams = False
            elif compression_level == 'high':
                compress_content_streams = True
            else:  # medium
                compress_content_streams = True
            
            # Copy pages with compression
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                
                # Apply compression
                if compress_content_streams:
                    page.compress_content_streams()
                
                writer.add_page(page)
            
            # Write to bytes
            output = BytesIO()
            writer.write(output)
            output.seek(0)
            
            compressed_pdf = output.getvalue()
            
            # Check if compression was effective
            original_size = len(pdf_content)
            compressed_size = len(compressed_pdf)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            return compressed_pdf, None
            
        except Exception as e:
            return None, f"Compression failed: {str(e)}"
