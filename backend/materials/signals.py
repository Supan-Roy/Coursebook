from django.db.models.signals import post_delete, pre_delete
from django.dispatch import receiver

from usage.models import StorageUsage
from .models import Material


@receiver(pre_delete, sender=Material)
def update_storage_on_delete(sender, instance, **kwargs):
    """Update storage usage when a material is deleted"""
    try:
        storage_usage, _ = StorageUsage.objects.get_or_create(user=instance.user)
        storage_usage.used_bytes = max(0, storage_usage.used_bytes - instance.size_bytes)
        storage_usage.save()
    except Exception as e:
        # Log error but don't block deletion
        print(f"Error updating storage usage on material delete: {e}")


@receiver(post_delete, sender=Material)
def delete_file_on_delete(sender, instance, **kwargs):
    """Delete the file from Cloudinary when a material is deleted"""
    try:
        if instance.storage_key:
            from cloudinary.uploader import destroy as cloudinary_destroy
            cloudinary_destroy(instance.storage_key, resource_type="raw")
    except Exception as e:
        # Log error but don't block deletion
        print(f"Error deleting file from Cloudinary on material delete: {e}")
