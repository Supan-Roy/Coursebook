from django.http import HttpResponse, Http404
import requests
from rest_framework.views import APIView
# ...existing code...

class PublicMaterialServeView(APIView):
    """Serve material file publicly via /files/<uuid:id>/"""
    permission_classes = []  # Public access

    def get(self, request, id):
        material = get_object_or_404(Material, id=id, is_deleted=False)
        cloudinary_url = material.storage_url
        if not cloudinary_url:
            raise Http404("File not found")
        try:
            resp = requests.get(cloudinary_url, stream=True)
            resp.raise_for_status()
        except Exception:
            raise Http404("File not found or unavailable")
        response = HttpResponse(resp.raw, content_type=material.content_type)
        response['Content-Disposition'] = f'inline; filename="{material.filename}"'
        return response
import os
import re
from pathlib import Path
import platform

# Configure Tesseract for Windows by adding to PATH
if platform.system() == 'Windows':
    tesseract_path = os.getenv('TESSERACT_CMD')
    if not tesseract_path:
        tesseract_path = r'C:\Program Files\Tesseract-OCR'
    else:
        # If TESSERACT_CMD points to tesseract.exe, get the directory
        tesseract_path = os.path.dirname(tesseract_path)
    
    # Add to PATH if not already there
    current_path = os.getenv('PATH', '')
    if tesseract_path not in current_path:
        os.environ['PATH'] = tesseract_path + os.pathsep + current_path

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course
from usage.models import StorageUsage
from common.text_extraction import extract_text_from_path
from .models import Material
from .serializers import MaterialSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Material.objects.filter(user=self.request.user, is_deleted=False).select_related('course')
        course_id = self.request.query_params.get("course_id")
        if (course_id):
            qs = qs.filter(course_id=course_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MaterialDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Material.objects.filter(user=self.request.user, is_deleted=False)
    
    def perform_destroy(self, instance):
        """Soft delete - move to trash instead of permanent deletion"""
        instance.soft_delete()


class MaterialExtractContentView(APIView):
    """Return extracted text from a stored material for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        material = get_object_or_404(Material, id=id, user=request.user)

        try:
            content = extract_text_from_path(material.storage_key, material.content_type)
        except Exception as exc:  # noqa: BLE001
            return Response({"detail": f"Failed to extract content: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {
                "material_id": str(material.id),
                "filename": material.filename,
                "content": content,
                "length": len(content),
            },
            status=status.HTTP_200_OK,
        )


class MaterialUploadView(APIView):
    """Upload materials (documents, pdfs, etc.) to a specific course"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        course_id = request.data.get('course')
        
        if not file:
            return Response(
                {'detail': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not course_id:
            return Response(
                {'detail': 'Course ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate course exists and belongs to user
        try:
            course = Course.objects.get(id=course_id, user=request.user)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate file size (50MB per-file limit)
        if file.size > 50 * 1024 * 1024:
            return Response(
                {'detail': 'File size exceeds 50MB limit'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce per-user storage quota (e.g. 500MB for free plan)
        usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        if usage.used_bytes + file.size > usage.quota_bytes:
            return Response(
                {
                    'detail': 'Storage limit reached. Please delete some files or upgrade your plan to upload more.',
                    'code': 'quota_exceeded',
                    'used_bytes': usage.used_bytes,
                    'quota_bytes': usage.quota_bytes,
                    'attempted_bytes': file.size,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Save file to Cloudinary
        from cloudinary.uploader import upload as cloudinary_upload
        cloudinary_result = cloudinary_upload(
            file,
            resource_type="raw",
            folder=f"materials/{request.user.id}/{course_id}/"
        )

        # Create material record with Cloudinary URLs
        material = Material.objects.create(
            user=request.user,
            course=course,
            filename=file.name,
            content_type=file.content_type or 'application/octet-stream',
            size_bytes=file.size,
            storage_url=cloudinary_result.get('secure_url', ''),
            storage_key=cloudinary_result.get('public_id', '')
        )
        
        # Update storage usage
        storage_usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        storage_usage.used_bytes += file.size
        storage_usage.save()
        
        return Response(
            MaterialSerializer(material).data,
            status=status.HTTP_201_CREATED
        )


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type - accept PDF and images
        file_extension = file.name.lower()
        valid_extensions = ['.pdf', '.png', '.jpg', '.jpeg']
        if not any(file_extension.endswith(ext) for ext in valid_extensions):
            return Response(
                {'detail': 'Only PDF and image files (PNG, JPG, JPEG) are allowed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            return Response(
                {'detail': 'File size exceeds 10MB limit'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate unique semester name based on existing semesters
        semester_name = self._generate_semester_name(request.user)

        # Parse file to extract course information (supports PDF and images)
        extracted_courses = self._extract_courses_from_file(file)
        
        # Create or get the Semester model instance to ensure proper created_at timestamp
        from courses.models import Semester
        from django.db.models import Min
        
        # Get minimum order of existing semesters (excluding the one we're about to create/get)
        # Filter out NULL order values to get actual minimum
        existing_semesters = Semester.objects.filter(
            user=request.user,
            order__isnull=False
        ).exclude(name=semester_name)
        
        semester_obj, semester_created = Semester.objects.get_or_create(
            user=request.user,
            name=semester_name
        )
        
        # If semester was just created, set its order to be at the top (minimum order - 1)
        if semester_created:
            if existing_semesters.exists():
                min_order = existing_semesters.aggregate(
                    min_order=Min('order')
                )['min_order']
                # Subtract 1 to put new semester above all existing ones
                new_order = min_order - 1
            else:
                # First semester gets order 0
                new_order = 0
            semester_obj.order = new_order
            semester_obj.save()
        
        # Create courses with the new semester
        created_courses = []
        for course_data in extracted_courses:
            course, created = Course.objects.get_or_create(
                user=request.user,
                code=course_data['code'],
                semester=semester_name,
                defaults={'title': course_data.get('title', '')}
            )
            if created:
                created_courses.append(course)

        # Routine file is only used for creating folders, not stored as material
        # No need to save the file or create material record
        
        return Response({
            'courses_created': [{'code': c.code, 'title': c.title} for c in created_courses],
            'semester': semester_name,
            'message': f'Routine processed successfully. {len(created_courses)} course(s) created in {semester_name}.'
        }, status=status.HTTP_201_CREATED)

    def _generate_semester_name(self, user):
        """
        Generate a unique semester name for the new upload.
        Mirrors the frontend logic: Semester 1, Semester 2, ...
        """
        import re

        # Collect semester names from both Course and Semester models
        course_semesters = Course.objects.filter(user=user).values_list('semester', flat=True).distinct()
        from courses.models import Semester  # local import to avoid circular
        db_semesters = Semester.objects.filter(user=user).values_list('name', flat=True).distinct()

        all_semesters = set([s.strip() for s in course_semesters if s] + [s.strip() for s in db_semesters if s])

        pattern = re.compile(r"^Semester\s+(\d+)$", re.IGNORECASE)
        numbers = []
        for name in all_semesters:
            match = pattern.match(name)
            if match:
                try:
                    numbers.append(int(match.group(1)))
                except ValueError:
                    continue

        next_number = max(numbers) + 1 if numbers else 1
        return f"Semester {next_number}"

    def _extract_courses_from_file(self, file):
        """Extract course codes and names from PDF or Image file"""
        file_extension = file.name.lower()
        
        if file_extension.endswith('.pdf'):
            return self._extract_courses_from_pdf(file)
        elif any(file_extension.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
            return self._extract_courses_from_image(file)
        else:
            return []

    def _extract_courses_from_image(self, image_file):
        """Extract course codes and names from image using OCR"""
        try:
            from PIL import Image
            import pytesseract
            import io
            import logging
            logger = logging.getLogger(__name__)
            
            # Read image from uploaded file
            image = Image.open(image_file)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Use OCR to extract text
            text = pytesseract.image_to_string(image)
            logger.info(f"Extracted text from image, length: {len(text)} characters")
            
            # Use the same course extraction logic as PDF
            return self._extract_courses_from_text(text)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error extracting courses from image: {str(e)}", exc_info=True)
            return []

    def _extract_courses_from_pdf(self, pdf_file):
        """Extract course codes and names from PDF using pattern matching"""
        try:
            import PyPDF2
            import logging
            logger = logging.getLogger(__name__)
            
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            logger.info(f"Extracted text length: {len(text)} characters")
            
            return self._extract_courses_from_text(text)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error extracting courses from PDF: {str(e)}", exc_info=True)
            return []

    def _extract_courses_from_text(self, text):
        """Extract course information from text using pattern matching"""
        import logging
        logger = logging.getLogger(__name__)
        
        courses = []
        seen = set()
        
        # Common day names and junk words to filter out
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        junk_words = ['Day', 'Course', 'Time', 'Slot', 'Room', 'Teacher']
        
        # Define multiple patterns to handle different routine formats
        patterns = [
            # Pattern 1: Dash-separated - "Course Name - CSE101" or "Course Name - CSE 101"
            {
                'pattern': r'([A-Za-z][A-Za-z\s&()\-:,\']+?)\s*-\s*([A-Z]{2,4})[\s-]?(\d{3,4})',
                'name': 'dash-separated',
                'title_group': 0,
                'code_prefix_group': 1,
                'code_number_group': 2
            },
            # Pattern 2: Tabular format - "CSE101    Introduction to Programming"
            {
                'pattern': r'([A-Z]{2,4})[\s-]?(\d{3,4})\s+([A-Za-z][A-Za-z\s&()\-:,\']{3,})',
                'name': 'tabular-code-first',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
            # Pattern 3: Colon-separated - "CSE101: Introduction to Programming"
            {
                'pattern': r'([A-Z]{2,4})[\s-]?(\d{3,4})\s*:\s*([A-Za-z][A-Za-z\s&()\-:,\']{3,})',
                'name': 'colon-separated',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
            # Pattern 4: Period-separated - "CSE101. Introduction to Programming"
            {
                'pattern': r'([A-Z]{2,4})[\s-]?(\d{3,4})\s*\.\s*([A-Za-z][A-Za-z\s&()\-:,\']{3,})',
                'name': 'period-separated',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
            # Pattern 5: Parentheses after name - "Introduction to Programming (CSE101)"
            {
                'pattern': r'([A-Za-z][A-Za-z\s&()\-:,\']{3,})\s*\(([A-Z]{2,4})[\s-]?(\d{3,4})\)',
                'name': 'parentheses-after-name',
                'title_group': 0,
                'code_prefix_group': 1,
                'code_number_group': 2
            },
            # Pattern 6: Parentheses after code - "CSE101 (Introduction to Programming)"
            {
                'pattern': r'([A-Z]{2,4})[\s-]?(\d{3,4})\s*\(([A-Za-z][A-Za-z\s&()\-:,\']{3,})\)',
                'name': 'parentheses-after-code',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
            # Pattern 7: Name first, code after (no separator) - "Introduction to Programming CSE101"
            {
                'pattern': r'([A-Za-z][A-Za-z\s&()\-:,\']{3,})\s+([A-Z]{2,4})[\s-]?(\d{3,4})(?:\s|$|[^\d])',
                'name': 'name-first-no-separator',
                'title_group': 0,
                'code_prefix_group': 1,
                'code_number_group': 2
            },
            # Pattern 8: Space between letters and numbers - "CS 101 Introduction to Programming"
            {
                'pattern': r'([A-Z]{2,4})\s+(\d{3,4})\s+([A-Za-z][A-Za-z\s&()\-:,\']{3,})',
                'name': 'space-in-code',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
            # Pattern 9: With section number - "CSE101-01 Introduction to Programming"
            {
                'pattern': r'([A-Z]{2,4})[\s-]?(\d{3,4})-\d+\s+([A-Za-z][A-Za-z\s&()\-:,\']{3,})',
                'name': 'with-section-number',
                'title_group': 2,
                'code_prefix_group': 0,
                'code_number_group': 1
            },
        ]
        
        # Process each pattern
        for pattern_config in patterns:
            matches = re.findall(pattern_config['pattern'], text)
            logger.info(f"Found {len(matches)} course matches with {pattern_config['name']} format: {matches[:5]}")  # Log first 5
            
            for match in matches:
                # Extract code and title based on pattern configuration
                code_prefix = match[pattern_config['code_prefix_group']]
                code_number = match[pattern_config['code_number_group']]
                code = f"{code_prefix}{code_number}"
                raw_title = match[pattern_config['title_group']].strip()
                
                # Skip if we already have this course code
                if code in seen:
                    continue
                
                # Filter out room codes and building codes
                if code_prefix.startswith('KT') or code_prefix.startswith('G1') or code_prefix.startswith('COM'):
                    continue
                    
                # Filter out year-like patterns
                should_keep = (
                    len(code_prefix) <= 3 or 
                    (len(code_prefix) == 4 and len(code_number) == 3)
                )
                
                if not should_keep:
                    continue
                
                # Clean the title using shared cleaning logic
                title = self._clean_course_title(raw_title, day_names, junk_words)
                
                # Skip if title is invalid after cleaning
                if not title or len(title) < 5:
                    continue
                
                # Skip if title contains too many numbers (likely junk)
                if sum(c.isdigit() for c in title) > len(title) * 0.3:
                    continue
                
                seen.add(code)
                courses.append({
                    'code': code,
                    'title': title
                })
        
        logger.info(f"Returning {len(courses)} unique courses: {[(c['code'], c['title']) for c in courses]}")
        return courses
    
    def _clean_course_title(self, title, day_names, junk_words):
        """Helper method to clean course titles extracted from various formats"""
        import re
        
        # Remove letter prefixes like "A)", "B)", "C)" at the beginning
        title = re.sub(r'^[A-Z]\)\s*', '', title).strip()
        
        # Remove room/lab indicators like "(COM LAB)", "(LAB)", etc.
        title = re.sub(r'\([^)]*(?:LAB|ROOM|COM)[^)]*\)', '', title, flags=re.IGNORECASE).strip()
        
        # Remove teacher initials (2-4 uppercase letters) from anywhere in the title
        title = re.sub(r'^[A-Z]{2,4}\s+', '', title).strip()  # At the beginning
        title = re.sub(r'\s+[A-Z]{2,4}\s+', ' ', title).strip()  # In the middle
        title = re.sub(r'\s+[A-Z]{2,4}$', '', title).strip()  # At the end
        
        # Remove day names from the beginning or anywhere
        for day in day_names:
            title = re.sub(rf'\b{day}\b', '', title, flags=re.IGNORECASE).strip()
        
        # Remove time patterns (e.g., "9:00 - 10:30", "10:45 - 12:15")
        title = re.sub(r'\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}', '', title).strip()
        
        # Remove junk words
        words = title.split()
        filtered_words = []
        for word in words:
            # Skip single letters and junk words
            if len(word) > 1 and word not in junk_words:
                filtered_words.append(word)
            # If we have at least 8 good words, stop (we got the course name)
            if len(filtered_words) >= 8:
                break
        
        title = ' '.join(filtered_words).strip()
        
        # Clean up extra spaces
        title = re.sub(r'\s+', ' ', title).strip()
        
        return title


class TrashBinListView(generics.ListAPIView):
    """List all deleted materials in trash bin"""
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Material.objects.filter(user=self.request.user, is_deleted=True)
        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs.order_by('-deleted_at')


class MaterialRestoreView(APIView):
    """Restore a material from trash bin"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        material = get_object_or_404(
            Material,
            id=id,
            user=request.user,
            is_deleted=True
        )
        
        material.restore()
        
        return Response(
            {
                'detail': 'Material restored successfully',
                'material': MaterialSerializer(material).data
            },
            status=status.HTTP_200_OK
        )


class MaterialPermanentDeleteView(APIView):
    """Permanently delete a material from trash bin"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        material = get_object_or_404(
            Material,
            id=id,
            user=request.user,
            is_deleted=True
        )
        
        # Delete the file from Cloudinary if present
        try:
            if material.storage_key:
                from cloudinary.uploader import destroy as cloudinary_destroy
                cloudinary_destroy(material.storage_key, resource_type="raw")
        except Exception as e:
            pass  # Log but don't fail if file doesn't exist
        
        # Update storage usage
        storage_usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        storage_usage.used_bytes = max(0, storage_usage.used_bytes - material.size_bytes)
        storage_usage.save()
        
        # Permanently delete from database
        material.delete()
        
        return Response(
            {'detail': 'Material permanently deleted'},
            status=status.HTTP_204_NO_CONTENT
        )


class EmptyTrashView(APIView):
    """Empty entire trash bin - permanently delete all trashed materials"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        materials = Material.objects.filter(user=request.user, is_deleted=True)
        
        total_size = 0
        deleted_count = 0
        
        for material in materials:
            # Delete from Cloudinary
            try:
                if material.storage_key:
                    from cloudinary.uploader import destroy as cloudinary_destroy
                    cloudinary_destroy(material.storage_key, resource_type="raw")
            except Exception:
                pass
            total_size += material.size_bytes
            deleted_count += 1
        
        # Update storage usage
        storage_usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        storage_usage.used_bytes = max(0, storage_usage.used_bytes - total_size)
        storage_usage.save()
        
        # Delete all from database
        materials.delete()
        
        return Response(
            {
                'detail': f'Trash emptied successfully. {deleted_count} materials permanently deleted.',
                'deleted_count': deleted_count,
                'freed_bytes': total_size
            },
            status=status.HTTP_200_OK
        )
