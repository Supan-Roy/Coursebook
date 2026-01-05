from rest_framework import serializers
from .models import Todo, TodoCategory


class TodoCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoCategory
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TodoSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=TodoCategory.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Todo
        fields = ["id", "title", "description", "is_completed", "priority", "due_date", "due_time", "category_id", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
