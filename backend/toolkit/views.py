"""
Toolkit API Views - File conversion endpoints
"""

import logging
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from .document_converter import DocumentConverter, SUPPORTED_FORMATS
from .images_to_pdf import ImagesToPDFService
from .page_numbering import PageNumberingService
from .pdf_merge import PDFMergeService
from .pdf_split import PDFSplitService
from .pdf_security import PDFSecurityService
from .pdf_compress import PDFCompressionService
from .pdf_watermark import PDFWatermarkService
from .pdf_edit import PDFEditService

logger = logging.getLogger(__name__)


class DocumentToPDFView(APIView):
    """Convert documents to PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Convert uploaded document to PDF"""
        print("="*50)
        print(f"DOCUMENT TO PDF REQUEST RECEIVED")
        print(f"FILES: {list(request.FILES.keys())}")
        print(f"DATA: {list(request.data.keys())}")
        print("="*50)
        
        logger.info(f"Received conversion request. FILES: {list(request.FILES.keys())}, DATA: {list(request.data.keys())}")
        
        if 'file' not in request.FILES:
            logger.error("No file in request.FILES")
            print("ERROR: No file in request.FILES")
            return Response(
                {'detail': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        file_name = file.name
        file_size = file.size
        
        print(f"File name: {file_name}, size: {file_size} bytes")
        
        # Validate file
        is_valid, validation_msg = DocumentConverter.validate_file(file_name, file_size)
        print(f"Validation result: is_valid={is_valid}, msg={validation_msg}")
        if not is_valid:
            print(f"ERROR: File validation failed: {validation_msg}")
            return Response(
                {'detail': validation_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read file content
        file_content = file.read()
        print(f"File content read: {len(file_content)} bytes")
        
        logger.info(f"Converting {file_name} ({file_size} bytes) to PDF")
        
        # Convert to PDF
        print(f"Calling DocumentConverter.convert...")
        pdf_bytes, error = DocumentConverter.convert(file_content, file_name)
        print(f"Conversion result: pdf_bytes={len(pdf_bytes) if pdf_bytes else None}, error={error}")
        
        if error:
            logger.error(f"Conversion failed for {file_name}: {error}")
            print(f"ERROR: Conversion failed: {error}")
            return Response(
                {'detail': f"Conversion failed: {error}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pdf_bytes is None:
            logger.error(f"PDF bytes is None for {file_name}")
            return Response(
                {'detail': 'Failed to generate PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        logger.info(f"Successfully generated PDF ({len(pdf_bytes)} bytes) for {file_name}")
        
        # Return PDF file as bytes
        from io import BytesIO
        pdf_buffer = BytesIO(pdf_bytes)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"{file_name.rsplit('.', 1)[0]}.pdf",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(pdf_bytes)
        return response


class ImagesToPDFView(APIView):
    """Convert one or more images to a PDF without padding"""

    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        logger.info("Received images to PDF request")

        image_files = request.FILES.getlist("files")
        is_valid, validation_msg = ImagesToPDFService.validate_images(image_files)
        if not is_valid:
            return Response({"detail": validation_msg}, status=status.HTTP_400_BAD_REQUEST)

        pdf_bytes, error = ImagesToPDFService.convert_images_to_pdf(image_files)
        if error or pdf_bytes is None:
            logger.error(f"Failed to convert images to PDF: {error}")
            return Response({"detail": f"Failed: {error or 'Unknown error'}"}, status=status.HTTP_400_BAD_REQUEST)

        from io import BytesIO

        buffer = BytesIO(pdf_bytes)
        buffer.seek(0)

        response = FileResponse(
            buffer,
            as_attachment=True,
            filename="images_to_pdf.pdf",
            content_type="application/pdf",
        )
        response["Content-Length"] = len(pdf_bytes)
        return response


class SupportedFormatsView(APIView):
    """Get list of supported file formats"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    
    def get(self, request):
        """Return supported formats"""
        return Response({
            'formats': SUPPORTED_FORMATS,
            'max_file_size_mb': 50
        })


class AddPageNumbersView(APIView):
    """Add page numbers to PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Add page numbers to uploaded PDF"""
        logger.info("Received add page numbers request")
        
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        file_name = pdf_file.name
        
        # Check if it's a PDF
        if not file_name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'File must be a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate PDF
        pdf_content = pdf_file.read()
        is_valid, validation_msg = PageNumberingService.validate_pdf(pdf_content)
        if not is_valid:
            return Response(
                {'detail': validation_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get parameters from request
        position = request.data.get('position', 'bottom_right')
        font_size = int(request.data.get('font_size', 10))
        color = request.data.get('color', '000000')
        start_number = int(request.data.get('start_number', 1))
        prefix = request.data.get('prefix', '')
        suffix = request.data.get('suffix', '')
        
        # Add page numbers
        logger.info(f"Adding page numbers to {file_name}: position={position}, size={font_size}, color={color}")
        
        result_pdf, error = PageNumberingService.add_page_numbers(
            pdf_content,
            position=position,
            font_size=font_size,
            color=color,
            start_number=start_number,
            prefix=prefix,
            suffix=suffix
        )
        
        if error:
            logger.error(f"Failed to add page numbers: {error}")
            return Response(
                {'detail': f"Failed: {error}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Successfully added page numbers ({len(result_pdf)} bytes)")
        
        # Return PDF file
        from io import BytesIO
        pdf_buffer = BytesIO(result_pdf)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"numbered_{file_name}",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response


class MergePDFsView(APIView):
    """Merge multiple PDFs into one"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Merge uploaded PDF files"""
        logger.info("Received merge PDFs request")
        
        # Get all PDF files
        pdf_files = request.FILES.getlist('files')
        
        if not pdf_files:
            return Response(
                {'detail': 'No PDF files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(pdf_files) < 2:
            return Response(
                {'detail': 'At least 2 PDF files are required to merge'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check all files are PDFs
        for pdf_file in pdf_files:
            if not pdf_file.name.lower().endswith('.pdf'):
                return Response(
                    {'detail': f'File "{pdf_file.name}" is not a PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Read file contents
        pdf_contents = []
        file_names = []
        
        for pdf_file in pdf_files:
            pdf_contents.append(pdf_file.read())
            file_names.append(pdf_file.name)
        
        # Merge PDFs
        logger.info(f"Merging {len(pdf_files)} PDFs: {', '.join(file_names)}")
        
        result_pdf, error = PDFMergeService.merge_pdfs(pdf_contents, file_names)
        
        if error:
            logger.error(f"Failed to merge PDFs: {error}")
            return Response(
                {'detail': f"Failed: {error}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Successfully merged PDFs ({len(result_pdf)} bytes)")
        
        # Return merged PDF
        from io import BytesIO
        pdf_buffer = BytesIO(result_pdf)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename="merged.pdf",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response


class SplitPDFView(APIView):
    """Split/extract pages from PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Extract pages from uploaded PDF"""
        logger.info("Received split PDF request")
        
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        file_name = pdf_file.name
        
        # Check if it's a PDF
        if not file_name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'File must be a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get page range from request
        page_ranges = request.data.get('pages', '').strip()
        
        if not page_ranges:
            return Response(
                {'detail': 'No page range specified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read PDF content
        pdf_content = pdf_file.read()
        
        # Validate and get page count
        is_valid, error_msg, total_pages = PDFSplitService.validate_pdf(pdf_content)
        
        if not is_valid:
            return Response(
                {'detail': error_msg, 'pages': 0},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Splitting {file_name}: total pages = {total_pages}, requested = {page_ranges}")
        
        # Split PDF
        result_pdf, error = PDFSplitService.split_pdf(pdf_content, page_ranges, file_name)
        
        if error:
            logger.error(f"Failed to split PDF: {error}")
            return Response(
                {'detail': f"Failed: {error}", 'pages': total_pages},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Successfully split PDF ({len(result_pdf)} bytes)")
        
        # Return split PDF
        from io import BytesIO
        pdf_buffer = BytesIO(result_pdf)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"split_{file_name}",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response


class LockPDFView(APIView):
    """Encrypt PDF with password protection"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Lock PDF with password"""
        logger.info("Received lock PDF request")
        
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        file_name = pdf_file.name
        
        # Check if it's a PDF
        if not file_name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'File must be a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get password from request
        user_password = request.data.get('password', '').strip()
        
        if not user_password:
            return Response(
                {'detail': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read PDF content
        pdf_content = pdf_file.read()
        
        logger.info(f"Locking {file_name} with password protection")
        
        # Lock PDF
        result_pdf, error = PDFSecurityService.lock_pdf(
            pdf_content, 
            user_password,
            file_name=file_name
        )
        
        if error:
            logger.error(f"Failed to lock PDF: {error}")
            return Response(
                {'detail': error},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Successfully locked PDF ({len(result_pdf)} bytes)")
        
        # Return locked PDF
        from io import BytesIO
        pdf_buffer = BytesIO(result_pdf)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"locked_{file_name}",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response


class UnlockPDFView(APIView):
    """Decrypt password-protected PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Unlock PDF with password"""
        logger.info("Received unlock PDF request")
        
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        file_name = pdf_file.name
        
        # Check if it's a PDF
        if not file_name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'File must be a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get password from request
        password = request.data.get('password', '').strip()
        
        if not password:
            return Response(
                {'detail': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read PDF content
        pdf_content = pdf_file.read()
        
        logger.info(f"Unlocking {file_name}")
        
        # Unlock PDF
        result_pdf, error = PDFSecurityService.unlock_pdf(
            pdf_content, 
            password,
            file_name=file_name
        )
        
        if error:
            logger.error(f"Failed to unlock PDF: {error}")
            return Response(
                {'detail': error},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Successfully unlocked PDF ({len(result_pdf)} bytes)")
        
        # Return unlocked PDF
        from io import BytesIO
        pdf_buffer = BytesIO(result_pdf)
        pdf_buffer.seek(0)
        
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"unlocked_{file_name}",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response


class CompressPDFView(APIView):
    """Compress PDF files"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Compress uploaded PDF"""
        if 'file' not in request.FILES:
            logger.error("No file in request.FILES")
            return Response(
                {'detail': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        file_name = file.name
        
        # Validate it's a PDF
        if not file_name.lower().endswith('.pdf'):
            logger.error(f"Invalid file type: {file_name}")
            return Response(
                {'detail': 'Please select a PDF file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read file
            pdf_content = file.read()
            
            # Get compression level from request (default: medium)
            compression_level = request.data.get('compressionLevel', 'medium')
            if compression_level not in ['low', 'medium', 'high']:
                compression_level = 'medium'
            
            # Compress PDF
            result_pdf, error = PDFCompressionService.compress_pdf(
                pdf_content,
                compression_level=compression_level
            )
            
            if error:
                logger.error(f"Failed to compress PDF: {error}")
                return Response(
                    {'detail': error},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Successfully compressed PDF ({len(result_pdf)} bytes)")
            
            # Return compressed PDF
            from io import BytesIO
            pdf_buffer = BytesIO(result_pdf)
            pdf_buffer.seek(0)
            
            response = FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=f"compressed_{file_name}",
                content_type='application/pdf'
            )
            response['Content-Length'] = len(result_pdf)
            return response
            
        except Exception as e:
            logger.error(f"Error processing compression request: {str(e)}")
            return Response(
                {'detail': f'Error compressing PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WatermarkPDFView(APIView):
    """Add text or image watermark to PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Add watermark to uploaded PDF"""
        logger.info("Received watermark PDF request")
        
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pdf_file = request.FILES['file']
        file_name = pdf_file.name
        
        # Check if it's a PDF
        if not file_name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'File must be a PDF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read PDF content
        pdf_content = pdf_file.read()
        
        # Get watermark type
        watermark_type = request.data.get('watermark_type', 'text')
        
        try:
            if watermark_type == 'text':
                # Get text watermark parameters
                text = request.data.get('text', 'WATERMARK')
                font_name = request.data.get('font_name', 'helvetica')
                font_size = int(request.data.get('font_size', 40))
                color = request.data.get('color', '000000').replace('#', '')
                opacity = float(request.data.get('opacity', 0.3))
                x_position = float(request.data.get('x_position', 300))
                y_position = float(request.data.get('y_position', 400))
                rotation = int(request.data.get('rotation', 45))
                apply_to_all = request.data.get('apply_to_all', 'true').lower() == 'true'

                page_number_raw = request.data.get('page_number')
                page_number = None
                if page_number_raw not in (None, '', 'null'):
                    try:
                        page_number = int(float(str(page_number_raw)))
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid page_number value '{page_number_raw}', ignoring and defaulting to apply_to_all")
                        page_number = None
                
                logger.info(f"Adding text watermark: text={text}, font={font_name}, size={font_size}")
                
                result_pdf, error = PDFWatermarkService.add_text_watermark(
                    pdf_content,
                    text=text,
                    font_name=font_name,
                    font_size=font_size,
                    color=color,
                    opacity=opacity,
                    x_position=x_position,
                    y_position=y_position,
                    rotation=rotation,
                    apply_to_all=apply_to_all,
                    page_number=page_number
                )
                
            elif watermark_type == 'image':
                # Get image watermark parameters
                if 'watermark_image' not in request.FILES:
                    return Response(
                        {'detail': 'No watermark image provided'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                watermark_image = request.FILES['watermark_image']
                image_content = watermark_image.read()
                
                width = float(request.data.get('width', 200))
                height = float(request.data.get('height', 200))
                x_position = float(request.data.get('x_position', 200))
                y_position = float(request.data.get('y_position', 300))
                opacity = float(request.data.get('opacity', 0.3))
                apply_to_all = request.data.get('apply_to_all', 'true').lower() == 'true'

                page_number_raw = request.data.get('page_number')
                page_number = None
                if page_number_raw not in (None, '', 'null'):
                    try:
                        page_number = int(float(str(page_number_raw)))
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid page_number value '{page_number_raw}', ignoring and defaulting to apply_to_all")
                        page_number = None
                
                logger.info(f"Adding image watermark: size={width}x{height}, position=({x_position},{y_position})")
                
                result_pdf, error = PDFWatermarkService.add_image_watermark(
                    pdf_content,
                    image_content=image_content,
                    width=width,
                    height=height,
                    x_position=x_position,
                    y_position=y_position,
                    opacity=opacity,
                    apply_to_all=apply_to_all,
                    page_number=page_number
                )
            else:
                return Response(
                    {'detail': 'Invalid watermark type. Must be "text" or "image"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if error:
                logger.error(f"Failed to add watermark: {error}")
                return Response(
                    {'detail': f"Failed: {error}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Successfully added watermark ({len(result_pdf)} bytes)")
            
            # Return watermarked PDF
            from io import BytesIO
            pdf_buffer = BytesIO(result_pdf)
            pdf_buffer.seek(0)
            
            response = FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=f"watermarked_{file_name}",
                content_type='application/pdf'
            )
            response['Content-Length'] = len(result_pdf)
            return response
            
        except Exception as e:
            logger.error(f"Error processing watermark request: {str(e)}")
            return Response(
                {'detail': f'Error adding watermark: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EditPDFView(APIView):
    """Apply annotations (text and highlights) to a PDF"""
    permission_classes = [AllowAny]  # Public access for toolkit features
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        logger.info("Received edit PDF request")

        if 'file' not in request.FILES:
            return Response({'detail': 'No PDF file provided'}, status=status.HTTP_400_BAD_REQUEST)

        pdf_file = request.FILES['file']
        file_name = pdf_file.name

        if not file_name.lower().endswith('.pdf'):
            return Response({'detail': 'File must be a PDF'}, status=status.HTTP_400_BAD_REQUEST)

        pdf_content = pdf_file.read()

        raw_annotations = request.data.get('annotations', '[]')
        try:
            annotations = json.loads(raw_annotations) if raw_annotations else []
        except Exception as exc:
            logger.error(f"Invalid annotations payload: {exc}")
            return Response({'detail': 'Invalid annotations payload'}, status=status.HTTP_400_BAD_REQUEST)

        result_pdf, error = PDFEditService.apply_annotations(pdf_content, annotations)
        if error:
            logger.error(f"Failed to edit PDF: {error}")
            return Response({'detail': f'Failed: {error}'}, status=status.HTTP_400_BAD_REQUEST)

        from io import BytesIO
        buffer = BytesIO(result_pdf)
        buffer.seek(0)

        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f"edited_{file_name}",
            content_type='application/pdf'
        )
        response['Content-Length'] = len(result_pdf)
        return response

