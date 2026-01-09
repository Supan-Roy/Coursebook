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
        fields = ["id", "title", "description", "is_completed", "priority", "due_date", "due_time", "repeat", "category_id", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        """Convert model instance to JSON response"""
        data = super().to_representation(instance)
        # Ensure due_time is in the response even if None
        if 'due_time' not in data:
            data['due_time'] = instance.due_time
        return data

    def create(self, validated_data):
        """Create a new todo with proper field handling"""
        todo = Todo.objects.create(**validated_data)
        return todo

    def update(self, instance, validated_data):
        """Update a todo with proper field handling"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
