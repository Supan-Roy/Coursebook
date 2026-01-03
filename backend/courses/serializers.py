from rest_framework import serializers

from .models import Course, Semester


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "code", "title", "semester", "folder_slug", "created_at", "updated_at"]
        read_only_fields = ["id", "folder_slug", "created_at", "updated_at"]
