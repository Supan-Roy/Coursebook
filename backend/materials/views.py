from django.http import HttpResponse, Http404
import requests
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import authentication
# ...existing code...

class OptionalJWTAuthentication(authentication.BaseAuthentication):
    """Authentication that attempts JWT but doesn't fail if token is invalid/missing"""
    def authenticate(self, request):
        jwt_auth = JWTAuthentication()
        try:
            return jwt_auth.authenticate(request)
        except Exception:
            # If authentication fails, return None to allow unauthenticated access
            return None

class PublicMaterialServeView(APIView):
    """Serve material file with privacy checks via /files/<uuid:id>/"""
    permission_classes = []  # Public access, but we check privacy manually
    authentication_classes = [OptionalJWTAuthentication]  # Try to authenticate but don't require it

    def get(self, request, id):
        from rest_framework.exceptions import PermissionDenied
        from sharing.models import ShareLink
        
        material = get_object_or_404(Material, id=id, is_deleted=False)
        
        # IMPORTANT: Owner can always access their own files, regardless of privacy
        # Check authentication token from headers (for API requests) or session
        is_owner = False
        if request.user.is_authenticated:
            is_owner = request.user.id == material.user.id
        
        # If owner, allow access immediately (bypass all privacy checks)
        if is_owner:
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
        
        # For non-owners, check privacy settings
        # Check if material's course/semester is shared via Sharing Room
        # If shared, use Sharing Room privacy (overrides material privacy)
        course = material.course
        share_link = None
        
        # Check for course-level share
        course_share = ShareLink.objects.filter(
            course=course,
            user=material.user,
            share_type=ShareLink.SHARE_TYPE_COURSE
        ).first()
        
        if course_share and not course_share.is_expired():
            share_link = course_share
        else:
            # Check for semester-level share
            if course.semester:
                semester_share = ShareLink.objects.filter(
                    user=material.user,
                    share_type=ShareLink.SHARE_TYPE_SEMESTER,
                    semester_name=course.semester
                ).first()
                
                if semester_share and not semester_share.is_expired():
                    share_link = semester_share
        
        # Determine effective privacy
        if share_link:
            # Sharing Room privacy overrides material privacy
            # Map ShareLink privacy to Material privacy (they use same values)
            effective_privacy = share_link.privacy
        else:
            # Use material's own privacy setting
            effective_privacy = material.privacy
        
        # Check access based on effective privacy (only for non-owners)
        # Handle both Material and ShareLink privacy constants (both use "private", "public", "coursebook_users")
        if effective_privacy == Material.PRIVACY_PRIVATE or effective_privacy == "private":
            # Private files are only accessible to owner (already checked above)
            # Return custom HTML error page
            return self._render_private_file_error(material)
        elif effective_privacy == Material.PRIVACY_COURSEBOOK_USERS:
            # Only authenticated Coursebook users can access
            if not request.user.is_authenticated:
                return self._render_coursebook_users_error(material)
        # else: PRIVACY_PUBLIC - anyone can access
        
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
    
    def _render_private_file_error(self, material):
        """Render a custom HTML error page for private files"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        dashboard_url = f"{frontend_url}/dashboard"
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Private File - Coursebook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Sofia Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: #000000;
            transition: background-color 0.2s;
        }}
        
        @media (prefers-color-scheme: light) {{
            body {{
                background: #f9fafb;
            }}
        }}
        
        .container {{
            width: 100%;
            max-width: 28rem;
        }}
        
        .card {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: background-color 0.2s, border-color 0.2s;
        }}
        
        @media (min-width: 640px) {{
            .card {{
                border-radius: 1rem;
                padding: 2rem;
            }}
        }}
        
        @media (prefers-color-scheme: light) {{
            .card {{
                background: #ffffff;
                border-color: transparent;
            }}
        }}
        
        .logo-container {{
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin-bottom: 1.5rem;
            cursor: pointer;
        }}
        
        .logo-container:hover {{
            opacity: 0.8;
        }}
        
        .logo-img {{
            width: 2rem;
            height: 2rem;
            flex-shrink: 0;
        }}
        
        @media (min-width: 640px) {{
            .logo-img {{
                width: 2.5rem;
                height: 2.5rem;
            }}
        }}
        
        @media (min-width: 768px) {{
            .logo-img {{
                width: 3rem;
                height: 3rem;
            }}
        }}
        
        .logo-text {{
            width: 10rem;
            height: 2.5rem;
            flex-shrink: 0;
            margin-left: -0.25rem;
            color: #ffffff;
        }}
        
        @media (min-width: 640px) {{
            .logo-text {{
                width: 12rem;
                height: 3rem;
                margin-left: -0.125rem;
            }}
        }}
        
        @media (min-width: 768px) {{
            .logo-text {{
                width: 14rem;
                height: 3.5rem;
                margin-left: 0;
            }}
        }}
        
        @media (min-width: 1024px) {{
            .logo-text {{
                width: 16rem;
                height: 4rem;
            }}
        }}
        
        .logo-text text {{
            font-family: 'Sofia Sans', sans-serif;
        }}
        
        @media (prefers-color-scheme: light) {{
            .logo-text {{
                color: #000000;
            }}
        }}
        
        .icon-container {{
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1.5rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .icon {{
            width: 2rem;
            height: 2rem;
            color: #ef4444;
        }}
        
        h1 {{
            font-family: 'Sofia Sans', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #ffffff;
            text-align: center;
        }}
        
        @media (prefers-color-scheme: light) {{
            h1 {{
                color: #111827;
            }}
        }}
        
        .message {{
            font-family: 'Sofia Sans', sans-serif;
            font-size: 0.875rem;
            color: #d1d5db;
            line-height: 1.5;
            margin-bottom: 1.5rem;
            text-align: center;
        }}
        
        @media (prefers-color-scheme: light) {{
            .message {{
                color: #4b5563;
            }}
        }}
        
        .button {{
            font-family: 'Sofia Sans', sans-serif;
            display: inline-block;
            width: 100%;
            padding: 0.625rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
            background: #0ea5e9;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: background-color 0.2s;
        }}
        
        .button:hover {{
            background: #0284c7;
        }}
        
        .button:active {{
            background: #0369a1;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo-container">
                <img src="{frontend_url}/coursebook.svg" alt="Coursebook" class="logo-img" onerror="this.style.display='none'" />
                <svg class="logo-text" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
                    <text x="150" y="40" text-anchor="middle" fill="currentColor" font-size="44" font-weight="700" font-family="Sofia Sans, sans-serif" letter-spacing="1">Coursebook</text>
                </svg>
            </div>
            
            <div class="icon-container">
                <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            
            <h1>Access Denied</h1>
            <p class="message">
                This file is private. Access denied.
            </p>
            
            <a href="{dashboard_url}" class="button">Go to Dashboard</a>
        </div>
    </div>
</body>
</html>
        """
        response = HttpResponse(html_content, content_type='text/html')
        response.status_code = 403
        return response
    
    def _render_coursebook_users_error(self, material):
        """Render a custom HTML error page for coursebook_users-only files"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        login_url = f"{frontend_url}/login"
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Required - Coursebook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Sofia Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: #000000;
            transition: background-color 0.2s;
        }}
        
        @media (prefers-color-scheme: light) {{
            body {{
                background: #f9fafb;
            }}
        }}
        
        .container {{
            width: 100%;
            max-width: 28rem;
        }}
        
        .card {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transition: background-color 0.2s, border-color 0.2s;
        }}
        
        @media (min-width: 640px) {{
            .card {{
                border-radius: 1rem;
                padding: 2rem;
            }}
        }}
        
        @media (prefers-color-scheme: light) {{
            .card {{
                background: #ffffff;
                border-color: transparent;
            }}
        }}
        
        .logo-container {{
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            margin-bottom: 1.5rem;
            cursor: pointer;
        }}
        
        .logo-container:hover {{
            opacity: 0.8;
        }}
        
        .logo-img {{
            width: 2rem;
            height: 2rem;
            flex-shrink: 0;
        }}
        
        @media (min-width: 640px) {{
            .logo-img {{
                width: 2.5rem;
                height: 2.5rem;
            }}
        }}
        
        @media (min-width: 768px) {{
            .logo-img {{
                width: 3rem;
                height: 3rem;
            }}
        }}
        
        .logo-text {{
            width: 10rem;
            height: 2.5rem;
            flex-shrink: 0;
            margin-left: -0.25rem;
            color: #ffffff;
        }}
        
        @media (min-width: 640px) {{
            .logo-text {{
                width: 12rem;
                height: 3rem;
                margin-left: -0.125rem;
            }}
        }}
        
        @media (min-width: 768px) {{
            .logo-text {{
                width: 14rem;
                height: 3.5rem;
                margin-left: 0;
            }}
        }}
        
        @media (min-width: 1024px) {{
            .logo-text {{
                width: 16rem;
                height: 4rem;
            }}
        }}
        
        .logo-text text {{
            font-family: 'Sofia Sans', sans-serif;
        }}
        
        @media (prefers-color-scheme: light) {{
            .logo-text {{
                color: #000000;
            }}
        }}
        
        .icon-container {{
            width: 4rem;
            height: 4rem;
            margin: 0 auto 1.5rem;
            background: rgba(14, 165, 233, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .icon {{
            width: 2rem;
            height: 2rem;
            color: #0ea5e9;
        }}
        
        h1 {{
            font-family: 'Sofia Sans', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #ffffff;
            text-align: center;
        }}
        
        @media (prefers-color-scheme: light) {{
            h1 {{
                color: #111827;
            }}
        }}
        
        .message {{
            font-family: 'Sofia Sans', sans-serif;
            font-size: 0.875rem;
            color: #d1d5db;
            line-height: 1.5;
            margin-bottom: 1.5rem;
            text-align: center;
        }}
        
        @media (prefers-color-scheme: light) {{
            .message {{
                color: #4b5563;
            }}
        }}
        
        .button {{
            font-family: 'Sofia Sans', sans-serif;
            display: inline-block;
            width: 100%;
            padding: 0.625rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #ffffff;
            background: #0ea5e9;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: background-color 0.2s;
        }}
        
        .button:hover {{
            background: #0284c7;
        }}
        
        .button:active {{
            background: #0369a1;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo-container">
                <img src="{frontend_url}/coursebook.svg" alt="Coursebook" class="logo-img" onerror="this.style.display='none'" />
                <svg class="logo-text" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
                    <text x="150" y="40" text-anchor="middle" fill="currentColor" font-size="44" font-weight="700" font-family="Sofia Sans, sans-serif" letter-spacing="1">Coursebook</text>
                </svg>
            </div>
            
            <div class="icon-container">
                <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
            
            <h1>Login Required</h1>
            <p class="message">
                This file is only accessible to Coursebook users. Please log in to continue.
            </p>
            
            <a href="{login_url}" class="button">Sign In</a>
        </div>
    </div>
</body>
</html>
        """
        response = HttpResponse(html_content, content_type='text/html')
        response.status_code = 403
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
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course
from usage.models import StorageUsage
from common.text_extraction import extract_text_from_path
from .models import Material
from .serializers import MaterialSerializer


def cleanup_expired_trash(user):
    """
    Delete materials from trash that are older than 30 days.
    Returns count of deleted items.
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    
    expired_materials = Material.objects.filter(
        user=user,
        is_deleted=True,
        deleted_at__lte=cutoff_date
    )
    
    deleted_count = 0
    total_size = 0
    
    for material in expired_materials:
        try:
            # Delete from Cloudinary if present
            if material.storage_key:
                try:
                    from cloudinary.uploader import destroy as cloudinary_destroy
                    cloudinary_destroy(material.storage_key, resource_type="raw")
                except Exception:
                    pass  # Ignore Cloudinary errors
            
            total_size += material.size_bytes
        except Exception:
            pass
    
    # Update storage usage
    if deleted_count > 0 or total_size > 0:
        storage_usage, _ = StorageUsage.objects.get_or_create(user=user)
        storage_usage.used_bytes = max(0, storage_usage.used_bytes - total_size)
        storage_usage.save()
    
    # Delete from database
    deleted_count = expired_materials.count()
    expired_materials.delete()
    
    return deleted_count


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


class MaterialPrivacyUpdateView(APIView):
    """Update privacy setting of a material"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, id):
        material = get_object_or_404(Material, id=id, user=request.user, is_deleted=False)
        privacy = request.data.get('privacy')
        
        if privacy not in [Material.PRIVACY_PRIVATE, Material.PRIVACY_PUBLIC, Material.PRIVACY_COURSEBOOK_USERS]:
            return Response(
                {"detail": "Invalid privacy setting. Must be 'private', 'public', or 'coursebook_users'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        material.privacy = privacy
        material.save(update_fields=['privacy'])
        
        return Response(MaterialSerializer(material).data, status=status.HTTP_200_OK)


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
        # Auto-cleanup expired trash (30+ days old) before listing
        cleanup_expired_trash(self.request.user)
        
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
        # First remove any expired items (automatic cleanup)
        cleanup_expired_trash(request.user)
        
        # Then empty the remaining items in trash
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
