from django.conf import settings
from django.db import models


class StorageUsage(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="storage_usage")
    used_bytes = models.PositiveBigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Storage usage"
        verbose_name_plural = "Storage usage"

    def __str__(self) -> str:
        return f"{self.user.email}: {self.used_bytes} bytes"

    @property
    def quota_bytes(self) -> int:
        return self.user.quota_bytes
