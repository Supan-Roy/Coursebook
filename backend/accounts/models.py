from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta

from .managers import UserManager


class User(AbstractUser):
    USER_PLAN_FREE = "free"

    username = None
    email = models.EmailField(unique=True)
    university = models.CharField(max_length=200, blank=True, null=True)
    profile_photo = models.URLField(max_length=500, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    plan = models.CharField(max_length=20, default=USER_PLAN_FREE)
    quota_mb = models.PositiveIntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Login security fields
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Password reset fields
    password_reset_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Account deletion fields
    account_deletion_token = models.CharField(max_length=100, blank=True, null=True)
    account_deletion_sent_at = models.DateTimeField(null=True, blank=True)
    account_deletion_reasons = models.TextField(blank=True, null=True)  # Store JSON string of selected reasons

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self) -> str:
        return self.email

    @property
    def quota_bytes(self) -> int:
        return self.quota_mb * 1024 * 1024
    
    def is_account_locked(self):
        """Check if account is currently locked due to failed login attempts"""
        if self.locked_until and self.locked_until > timezone.now():
            return True
        # Unlock if lock period has expired
        if self.locked_until and self.locked_until <= timezone.now():
            self.locked_until = None
            self.failed_login_attempts = 0
            self.save(update_fields=['locked_until', 'failed_login_attempts'])
        return False
    
    def record_failed_login(self):
        """Record a failed login attempt and lock account if threshold reached"""
        self.failed_login_attempts += 1
        # Lock account after 5 failed attempts for 30 minutes
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'locked_until'])
    
    def reset_failed_login_attempts(self):
        """Reset failed login attempts after successful login"""
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_login_attempts', 'locked_until'])
