from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.cache import cache
from django.db.models import F

from .models import ShareLink
from .serializers import ShareLinkSerializer, ShareLinkCreateSerializer
from courses.models import Course
from materials.serializers import MaterialSerializer
from materials.models import Material


class ShareLinkListCreateView(generics.ListCreateAPIView):
    """List all share links for the current user or create a new one"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShareLinkSerializer
    
    def get_queryset(self):
        return ShareLink.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = ShareLinkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        share_type = serializer.validated_data['share_type']
        privacy = serializer.validated_data.get('privacy', ShareLink.PRIVACY_PUBLIC)
        title = serializer.validated_data.get('title', '')
        
        if share_type == ShareLink.SHARE_TYPE_SEMESTER:
            semester_name = serializer.validated_data['semester_name']
            # Check if semester exists for this user (either as Semester object or in courses)
            from courses.models import Semester
            semester_exists = (
                Semester.objects.filter(user=request.user, name=semester_name).exists() or
                Course.objects.filter(user=request.user, semester=semester_name).exists()
            )
            if not semester_exists:
                return Response(
                    {"detail": f"Semester '{semester_name}' not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            share_link = ShareLink.objects.create(
                user=request.user,
                share_type=share_type,
                semester_name=semester_name,
                privacy=privacy,
                title=title
            )
        
        elif share_type == ShareLink.SHARE_TYPE_COURSE:
            course_id = serializer.validated_data['course_id']
            course = get_object_or_404(Course, id=course_id, user=request.user)
            
            share_link = ShareLink.objects.create(
                user=request.user,
                share_type=share_type,
                course=course,
                privacy=privacy,
                title=title
            )
        
        return Response(ShareLinkSerializer(share_link).data, status=status.HTTP_201_CREATED)


class ShareLinkDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a share link"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShareLinkSerializer
    
    def get_queryset(self):
        return ShareLink.objects.filter(user=self.request.user)


class ShareLinkUpdatePrivacyView(APIView):
    """Update privacy setting of a share link"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        share_link = get_object_or_404(ShareLink, id=pk, user=request.user)
        privacy = request.data.get('privacy')
        
        if privacy not in [ShareLink.PRIVACY_PUBLIC, ShareLink.PRIVACY_COURSEBOOK_USERS]:
            return Response(
                {"detail": "Invalid privacy setting."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        share_link.privacy = privacy
        share_link.save()
        
        return Response(ShareLinkSerializer(share_link).data)


class SharedContentView(APIView):
    """View shared content by token (public or authenticated)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        share_link = get_object_or_404(ShareLink, share_token=token)
        
        # Check if expired
        if share_link.is_expired():
            return Response(
                {"detail": "This share link has expired."},
                status=status.HTTP_410_GONE
            )
        
        # Check privacy
        if share_link.privacy == ShareLink.PRIVACY_COURSEBOOK_USERS:
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "This share requires Coursebook account. Please log in."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Prevent double counting using cache-based tracking
        # Create a unique key based on token and request fingerprint
        # Use IP address and user agent to identify unique visitors
        ip_address = request.META.get('REMOTE_ADDR', 'unknown')
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')[:50]  # Limit length
        cache_key = f'share_viewed_{share_link.id}_{ip_address}_{hash(user_agent)}'
        
        # Check if this view was already counted in the last 10 seconds
        if not cache.get(cache_key, False):
            # Mark as viewed in cache (10 second TTL to prevent rapid double-counting)
            cache.set(cache_key, True, 10)
            
            # Increment access count (only once per unique visitor per 10 seconds)
            # Use F() to prevent race conditions and ensure atomic increment
            ShareLink.objects.filter(id=share_link.id).update(access_count=F('access_count') + 1)
        
        # Refresh the instance to get updated count
        share_link.refresh_from_db()
        
        # Get shared courses and materials
        courses = share_link.get_shared_courses()
        materials = share_link.get_shared_materials()
        
        # Serialize courses manually
        courses_data = []
        for course in courses:
            courses_data.append({
                'id': str(course.id),
                'code': course.code,
                'title': course.title,
                'semester': course.semester,
                'folder_slug': course.folder_slug,
            })
        
        # Serialize materials manually to avoid validation issues for public access
        materials_data = []
        for material in materials:
            material_dict = {
                'id': str(material.id),
                'course': str(material.course.id) if material.course else None,
                'course_id': str(material.course.id) if material.course else None,
                'filename': material.filename,
                'content_type': material.content_type,
                'size_bytes': material.size_bytes,
                'storage_url': material.storage_url,
                'storage_key': material.storage_key,
                'uploaded_at': material.uploaded_at.isoformat() if material.uploaded_at else None,
                'updated_at': material.updated_at.isoformat() if material.updated_at else None,
                'is_deleted': material.is_deleted,
                'deleted_at': material.deleted_at.isoformat() if material.deleted_at else None,
            }
            materials_data.append(material_dict)
        
        # Get user info for share link
        share_link_data = ShareLinkSerializer(share_link).data
        share_link_data['user'] = {
            'email': share_link.user.email,
            'first_name': share_link.user.first_name,
            'last_name': share_link.user.last_name,
        }
        
        return Response({
            'share_link': share_link_data,
            'courses': courses_data,
            'materials': materials_data,
        })
