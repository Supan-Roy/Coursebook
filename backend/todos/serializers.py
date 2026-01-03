from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ["id", "title", "description", "is_completed", "priority", "due_date", "due_time", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
