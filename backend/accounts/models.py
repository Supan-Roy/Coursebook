from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    USER_PLAN_FREE = "free"

    username = None
    email = models.EmailField(unique=True)
    university = models.CharField(max_length=200, blank=True, null=True)
    plan = models.CharField(max_length=20, default=USER_PLAN_FREE)
    quota_mb = models.PositiveIntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self) -> str:
        return self.email

    @property
    def quota_bytes(self) -> int:
        return self.quota_mb * 1024 * 1024
