import os
import re
from pathlib import Path

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course
from usage.models import StorageUsage
from .models import Material
from .serializers import MaterialSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Material.objects.filter(user=self.request.user)
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
        return Material.objects.filter(user=self.request.user)


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
        
        # Validate file size (50MB limit)
        if file.size > 50 * 1024 * 1024:
            return Response(
                {'detail': 'File size exceeds 50MB limit'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save the file
        upload_dir = Path(settings.MEDIA_ROOT) / 'materials' / str(request.user.id) / str(course_id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / file.name
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # Create material record
        material = Material.objects.create(
            user=request.user,
            course=course,
            filename=file.name,
            content_type=file.content_type or 'application/octet-stream',
            size_bytes=file.size,
            storage_url=f'/media/materials/{request.user.id}/{course_id}/{file.name}',
            storage_key=str(file_path)
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

        # Validate file type
        if not file.name.lower().endswith('.pdf'):
            return Response(
                {'detail': 'Only PDF files are allowed'}, 
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

        # Parse PDF to extract course information
        extracted_courses = self._extract_courses_from_pdf(file)
        
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

        # Save the file
        upload_dir = Path(settings.MEDIA_ROOT) / 'uploads' / str(request.user.id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / file.name
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # Create material record (associate with first course if any)
        course = created_courses[0] if created_courses else None
        if not course and extracted_courses:
            # Try to find existing course
            course = Course.objects.filter(
                user=request.user,
                code=extracted_courses[0]['code']
            ).first()

        if not course:
            # Create a default "Routine" course if no courses extracted
            course, _ = Course.objects.get_or_create(
                user=request.user,
                code='ROUTINE',
                defaults={'title': 'Class Routine'}
            )

        material = Material.objects.create(
            user=request.user,
            course=course,
            filename=file.name,
            content_type=file.content_type,
            size_bytes=file.size,
            storage_url=f'/media/uploads/{request.user.id}/{file.name}',
            storage_key=str(file_path)
        )
        
        # Update storage usage
        storage_usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        storage_usage.used_bytes += file.size
        storage_usage.save()

        return Response({
            'material': MaterialSerializer(material).data,
            'courses_created': [{'code': c.code, 'title': c.title} for c in created_courses],
            'semester': semester_name,
            'message': f'File uploaded successfully. {len(created_courses)} course(s) created in {semester_name}.'
        }, status=status.HTTP_201_CREATED)

    def _generate_semester_name(self, user):
        """Generate a unique semester name for the new upload"""
        # Get all existing semesters for this user
        existing_semesters = Course.objects.filter(user=user).values_list('semester', flat=True).distinct()
        
        # Use "Semester Name" as base
        base_semester = "Semester Name"
        
        # If base semester doesn't exist, use it
        if base_semester not in existing_semesters:
            return base_semester
        
        # Otherwise, append a counter
        counter = 2
        while f"{base_semester} {counter}" in existing_semesters:
            counter += 1
        
        return f"{base_semester} {counter}"

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

            # Pattern to match course with name and code
            # More precise: captures only the immediate text before the code
            course_with_name_pattern = r'([A-Za-z][A-Za-z\s&]+?)\s*-\s*([A-Z]{2,4})[\s-]?(\d{3,4})'
            
            matches_with_names = re.findall(course_with_name_pattern, text)
            logger.info(f"Found {len(matches_with_names)} course matches with names: {matches_with_names}")
            
            courses = []
            seen = set()
            
            # Common day names and junk words to filter out
            day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            junk_words = ['Day', 'Course', 'Time', 'Slot', 'Room', 'Teacher']
            
            for match in matches_with_names:
                raw_title = match[0].strip()
                code = f"{match[1]}{match[2]}"
                
                # Filter out room codes and building codes
                if match[1].startswith('KT') or match[1].startswith('G1') or match[1].startswith('COM'):
                    continue
                    
                # Filter out year-like patterns
                should_keep = (
                    len(match[1]) <= 3 or 
                    (len(match[1]) == 4 and len(match[2]) == 3)
                )
                
                if not should_keep:
                    continue
                
                # Clean the title
                title = raw_title
                
                # Remove teacher initials from the beginning (2-4 uppercase letters)
                title = re.sub(r'^[A-Z]{2,4}\s+', '', title).strip()
                
                # Remove day names from the beginning or anywhere
                for day in day_names:
                    title = title.replace(day, '').strip()
                
                # Remove junk words
                words = title.split()
                filtered_words = []
                for word in words:
                    # Skip single letters and junk words
                    if len(word) > 1 and word not in junk_words:
                        filtered_words.append(word)
                    # If we have at least 6 good words, stop (we got the course name)
                    if len(filtered_words) >= 6:
                        break
                
                title = ' '.join(filtered_words).strip()
                
                # Skip if title is empty or too short after cleaning
                if len(title) < 5:
                    continue
                
                # Skip if title contains too many numbers (likely junk)
                if sum(c.isdigit() for c in title) > len(title) * 0.3:
                    continue
                
                if code not in seen:
                    seen.add(code)
                    courses.append({
                        'code': code,
                        'title': title
                    })
            
            logger.info(f"Returning {len(courses)} unique courses: {[(c['code'], c['title']) for c in courses]}")
            return courses
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error extracting courses from PDF: {str(e)}", exc_info=True)
            return []
