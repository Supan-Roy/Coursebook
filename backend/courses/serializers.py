from rest_framework import serializers

from .models import Course


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "code", "title", "folder_slug", "created_at", "updated_at"]
        read_only_fields = ["id", "folder_slug", "created_at", "updated_at"]
