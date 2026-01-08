import uuid
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone

from courses.models import Course, Semester
from materials.models import Material


class ShareLink(models.Model):
    """Model for sharing semesters, courses, or materials"""
    
    PRIVACY_PUBLIC = "public"
    PRIVACY_COURSEBOOK_USERS = "coursebook_users"
    
    PRIVACY_CHOICES = [
        (PRIVACY_PUBLIC, "Public - Anyone with the link"),
        (PRIVACY_COURSEBOOK_USERS, "Coursebook Users Only"),
    ]
    
    SHARE_TYPE_SEMESTER = "semester"
    SHARE_TYPE_COURSE = "course"
    
    SHARE_TYPE_CHOICES = [
        (SHARE_TYPE_SEMESTER, "Semester"),
        (SHARE_TYPE_COURSE, "Course"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="share_links")
    
    # Share type and target
    share_type = models.CharField(max_length=20, choices=SHARE_TYPE_CHOICES)
    semester_name = models.CharField(max_length=100, blank=True, null=True)  # For semester shares
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name="share_links")
    
    # Link details
    share_token = models.CharField(max_length=64, unique=True, db_index=True)  # Custom token for the link
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default=PRIVACY_PUBLIC)
    title = models.CharField(max_length=255, blank=True)  # Optional custom title
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # Optional expiration
    access_count = models.PositiveIntegerField(default=0)  # Track how many times accessed
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "share_type"]),
            models.Index(fields=["share_token"]),
        ]
    
    def __str__(self):
        share_target = self.semester_name or (self.course.code if self.course else "Course")
        return f"{self.get_share_type_display()}: {share_target} ({self.user.email})"
    
    def save(self, *args, **kwargs):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(32)
        if not self.title:
            if self.share_type == self.SHARE_TYPE_SEMESTER:
                self.title = f"{self.semester_name} - Semester"
            elif self.share_type == self.SHARE_TYPE_COURSE and self.course:
                self.title = f"{self.course.code or self.course.title} - Course"
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if the share link has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def get_shared_courses(self):
        """Get all courses included in this share"""
        if self.share_type == self.SHARE_TYPE_SEMESTER:
            return Course.objects.filter(user=self.user, semester=self.semester_name)
        elif self.share_type == self.SHARE_TYPE_COURSE and self.course:
            return Course.objects.filter(id=self.course.id)
        return Course.objects.none()
    
    def get_shared_materials(self):
        """Get all materials included in this share"""
        courses = self.get_shared_courses()
        return Material.objects.filter(course__in=courses, user=self.user, is_deleted=False)
