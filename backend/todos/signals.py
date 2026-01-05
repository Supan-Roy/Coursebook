from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import TodoCategory

User = get_user_model()


@receiver(post_save, sender=User)
def create_default_categories(sender, instance, created, **kwargs):
    """Create default categories when a new user is created"""
    if created:
        TodoCategory.objects.create(user=instance, name="Academic")
        TodoCategory.objects.create(user=instance, name="Personal")
