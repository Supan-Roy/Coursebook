from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import User
from materials.models import Material


@receiver(pre_delete, sender=User)
def cleanup_user_cloudinary_files(sender, instance, **kwargs):
    """Ensure all Cloudinary files are deleted when a user is deleted"""
    try:
        # Get all materials for this user
        materials = Material.objects.filter(user=instance)
        
        # Delete each file from Cloudinary
        for material in materials:
            try:
                if material.storage_key:
                    from cloudinary.uploader import destroy as cloudinary_destroy
                    cloudinary_destroy(material.storage_key, resource_type="raw")
            except Exception as e:
                # Log but don't block deletion
                print(f"Error deleting Cloudinary file {material.storage_key} for user {instance.email}: {e}")
    except Exception as e:
        # Log but don't block user deletion
        print(f"Error cleaning up Cloudinary files for user {instance.email}: {e}")

