from rest_framework import serializers

from courses.models import Course
from materials.models import Material
from .models import QuizSession, StudySummary


class StudySummarySerializer(serializers.ModelSerializer):
    materials = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), many=True, required=False
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    class Meta:
        model = StudySummary
        fields = [
            "id",
            "course",
            "materials",
            "title",
            "content",
            "word_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "word_count", "created_at", "updated_at"]

    def validate_course(self, course):
        request = self.context.get("request")
        if request and course.user_id != request.user.id:
            raise serializers.ValidationError("Invalid course for user")
        return course

    def validate_materials(self, materials):
        request = self.context.get("request")
        if not request:
            return materials
        for material in materials:
            if material.user_id != request.user.id:
                raise serializers.ValidationError("Material does not belong to user")
        return materials

    def create(self, validated_data):
        materials = validated_data.pop("materials", [])
        request = self.context.get("request")
        summary = StudySummary.objects.create(user=request.user, **validated_data)
        if materials:
            summary.materials.set(materials)
        return summary

    def update(self, instance, validated_data):
        materials = validated_data.pop("materials", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if materials is not None:
            instance.materials.set(materials)
        instance.save()
        return instance


class QuizSessionSerializer(serializers.ModelSerializer):
    materials = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), many=True, required=False
    )
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    class Meta:
        model = QuizSession
        fields = [
            "id",
            "course",
            "materials",
            "difficulty",
            "num_questions",
            "questions",
            "user_answers",
            "score",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "questions",
            "user_answers",
            "score",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def validate_course(self, course):
        request = self.context.get("request")
        if request and course.user_id != request.user.id:
            raise serializers.ValidationError("Invalid course for user")
        return course

    def validate_materials(self, materials):
        request = self.context.get("request")
        if not request:
            return materials
        for material in materials:
            if material.user_id != request.user.id:
                raise serializers.ValidationError("Material does not belong to user")
        return materials

    def create(self, validated_data):
        materials = validated_data.pop("materials", [])
        request = self.context.get("request")
        quiz = QuizSession.objects.create(user=request.user, **validated_data)
        if materials:
            quiz.materials.set(materials)
        return quiz
