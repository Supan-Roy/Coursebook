import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from courses.models import Course


class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="materials")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="materials")
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    size_bytes = models.PositiveBigIntegerField(default=0)
    storage_url = models.URLField(max_length=500)
    storage_key = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Trash bin fields
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["user", "course"]),
            models.Index(fields=["user", "is_deleted"]),
            models.Index(fields=["deleted_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.filename} ({self.course.code})"
    
    def soft_delete(self):
        """Move material to trash bin"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    
    def restore(self):
        """Restore material from trash bin"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    def is_expired(self, days=30):
        """Check if material has been in trash for more than specified days"""
        if not self.is_deleted or not self.deleted_at:
            return False
        return (timezone.now() - self.deleted_at).days >= days
