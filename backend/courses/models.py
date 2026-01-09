import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class Semester(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="semesters")
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0, help_text="Custom order for sorting semesters")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "name")
        ordering = ["order", "-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.user.email})"


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="courses")
    code = models.CharField(max_length=120, blank=True, default="")
    title = models.CharField(max_length=255, blank=True)
    semester = models.CharField(max_length=100, blank=True, default="")
    folder_slug = models.SlugField(max_length=140)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            ("user", "folder_slug"),
        )
        ordering = ["semester", "code"]

    def __str__(self) -> str:
        display_name = self.code or self.title or "Untitled Course"
        return f"{display_name} ({self.user.email})"

    def clean(self):
        """Validate that at least one of code or title is provided."""
        code = (self.code or "").strip() if self.code else ""
        title = (self.title or "").strip() if self.title else ""
        if not code and not title:
            raise ValidationError("Either course code or course title must be provided.")

    def save(self, *args, **kwargs):
        # Generate folder_slug before validation so required field is populated
        if not self.folder_slug:
            base_slug = slugify(self.code or self.title) or "course"
            slug = base_slug
            counter = 1
            while Course.objects.filter(user=self.user, folder_slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.folder_slug = slug

        # Validate after slug is set
        self.full_clean()
        super().save(*args, **kwargs)
