from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Todo, TodoCategory
from .serializers import TodoSerializer, TodoCategorySerializer
import logging

logger = logging.getLogger(__name__)


class TodoCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = TodoCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure default categories exist for the user
        user = self.request.user
        if not user.todo_categories.exists():
            TodoCategory.objects.create(user=user, name="Academic")
            TodoCategory.objects.create(user=user, name="Personal")
        
        return TodoCategory.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TodoCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TodoCategorySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return TodoCategory.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.name in ("Academic", "Personal"):
            raise ValidationError({"detail": "Default categories cannot be edited."})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.name in ("Academic", "Personal"):
            raise ValidationError({"detail": "Default categories cannot be deleted."})
        instance.delete()


class MyPlansCreateView(generics.ListCreateAPIView):
    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user).select_related('category')

    def perform_create(self, serializer):
        logger.info(f"Creating todo with data: {serializer.validated_data}")
        serializer.save(user=self.request.user)


class TodoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user).select_related('category')

    def perform_update(self, serializer):
        logger.info(f"Updating todo with data: {serializer.validated_data}")
        serializer.save()
