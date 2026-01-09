from rest_framework import serializers

from .models import Course, Semester


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ["id", "name", "order", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "code", "title", "semester", "folder_slug", "created_at", "updated_at"]
        read_only_fields = ["id", "folder_slug", "created_at", "updated_at"]
    
    def validate(self, data):
        """Ensure at least one of code or title is provided"""
        # Get values, handling None, empty string, or missing keys
        code_value = data.get('code', '')
        title_value = data.get('title', '')
        
        code = code_value.strip() if isinstance(code_value, str) else ''
        title = title_value.strip() if isinstance(title_value, str) else ''
        
        if not code and not title:
            raise serializers.ValidationError({
                'non_field_errors': ['Either course code or course title must be provided.']
            })
        
        # Normalize empty strings - ensure they're empty strings, not None
        data['code'] = code
        data['title'] = title
        
        return data