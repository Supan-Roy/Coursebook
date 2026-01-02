import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="courses")
    code = models.CharField(max_length=120)
    title = models.CharField(max_length=255, blank=True)
    folder_slug = models.SlugField(max_length=140)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (
            ("user", "code"),
            ("user", "folder_slug"),
        )
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} ({self.user.email})"

    def save(self, *args, **kwargs):
        if not self.folder_slug:
            base_slug = slugify(self.code or self.title) or "course"
            slug = base_slug
            counter = 1
            while Course.objects.filter(user=self.user, folder_slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.folder_slug = slug
        super().save(*args, **kwargs)
