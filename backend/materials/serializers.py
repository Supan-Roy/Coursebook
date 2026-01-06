from rest_framework import serializers

from courses.models import Course
from .models import Material


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            "id",
            "course",
            "filename",
            "content_type",
            "size_bytes",
            "storage_url",
            "storage_key",
            "uploaded_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        ]
        read_only_fields = ["id", "uploaded_at", "updated_at", "is_deleted", "deleted_at"]

    def validate_course(self, course):
        request = self.context.get("request")
        if request and course.user_id != request.user.id:
            raise serializers.ValidationError("Invalid course for user")
        return course

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        course = validated_data["course"]
        if user and course.user_id != user.id:
            raise serializers.ValidationError("Invalid course for user")
        validated_data["user"] = user
        return super().create(validated_data)
