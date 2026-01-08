from rest_framework import serializers
from .models import ShareLink


class ShareLinkSerializer(serializers.ModelSerializer):
    """Serializer for ShareLink model"""
    
    share_url = serializers.SerializerMethodField()
    coursebook_share_url = serializers.SerializerMethodField()
    shared_courses_count = serializers.SerializerMethodField()
    shared_materials_count = serializers.SerializerMethodField()
    course_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ShareLink
        fields = [
            'id', 'share_type', 'semester_name', 'course', 'share_token',
            'privacy', 'title', 'created_at', 'updated_at', 'expires_at',
            'access_count', 'share_url', 'coursebook_share_url',
            'shared_courses_count', 'shared_materials_count', 'course_details'
        ]
        read_only_fields = ['id', 'share_token', 'created_at', 'updated_at', 'access_count']
    
    def get_share_url(self, obj):
        """Generate public share URL"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{frontend_url}/shared/{obj.share_token}"
    
    def get_coursebook_share_url(self, obj):
        """Generate Coursebook users share URL"""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{frontend_url}/shared/{obj.share_token}?type=coursebook"
    
    def get_shared_courses_count(self, obj):
        """Get count of shared courses"""
        return obj.get_shared_courses().count()
    
    def get_shared_materials_count(self, obj):
        """Get count of shared materials"""
        return obj.get_shared_materials().count()
    
    def get_course_details(self, obj):
        """Get course details if sharing a single course"""
        if obj.share_type == ShareLink.SHARE_TYPE_COURSE and obj.course:
            return {
                'id': str(obj.course.id),
                'code': obj.course.code,
                'title': obj.course.title,
                'semester': obj.course.semester,
            }
        return None


class ShareLinkCreateSerializer(serializers.Serializer):
    """Serializer for creating a share link"""
    
    share_type = serializers.ChoiceField(choices=ShareLink.SHARE_TYPE_CHOICES)
    semester_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    course_id = serializers.UUIDField(required=False)
    privacy = serializers.ChoiceField(choices=ShareLink.PRIVACY_CHOICES, default=ShareLink.PRIVACY_PUBLIC)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate(self, data):
        share_type = data.get('share_type')
        semester_name = data.get('semester_name')
        course_id = data.get('course_id')
        
        if share_type == ShareLink.SHARE_TYPE_SEMESTER and not semester_name:
            raise serializers.ValidationError("semester_name is required for semester shares")
        
        if share_type == ShareLink.SHARE_TYPE_COURSE and not course_id:
            raise serializers.ValidationError("course_id is required for course shares")
        
        return data

