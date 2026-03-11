"""
Management command to clean up expired trash items (older than 30 days).
Run this daily via cron or task scheduler.
"""
import os
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from materials.models import Material
from usage.models import StorageUsage

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Permanently delete materials that have been in trash for more than 30 days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days after which to delete materials (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find expired materials
        expired_materials = Material.objects.filter(
            is_deleted=True,
            deleted_at__lte=cutoff_date
        )
        
        count = expired_materials.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No expired materials to delete'))
            logger.info("[CLEANUP] No expired materials to delete")
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'[DRY RUN] Would delete {count} materials:')
            )
            for material in expired_materials[:10]:  # Show first 10
                self.stdout.write(f'  - {material.filename} (deleted {material.deleted_at})')
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
            return
        
        # Actually delete
        total_size = 0
        deleted_count = 0
        failed_count = 0
        
        for material in expired_materials:
            try:
                # Delete from Cloudinary if using Cloudinary storage
                if material.storage_key:
                    try:
                        from cloudinary.uploader import destroy as cloudinary_destroy
                        cloudinary_destroy(material.storage_key, resource_type="raw")
                        self.stdout.write(f'Deleted from Cloudinary: {material.filename}')
                        logger.info(f"[CLEANUP] Deleted from Cloudinary: {material.filename}")
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'Could not delete from Cloudinary {material.filename}: {e}')
                        )
                        logger.warning(f"[CLEANUP] Could not delete from Cloudinary {material.filename}: {e}")
                
                total_size += material.size_bytes
                user = material.user
                
                # Update storage usage
                storage_usage, _ = StorageUsage.objects.get_or_create(user=user)
                storage_usage.used_bytes = max(0, storage_usage.used_bytes - material.size_bytes)
                storage_usage.save()
                
                deleted_count += 1
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Error processing {material.filename}: {e}')
                )
                logger.error(f"[CLEANUP] Error processing {material.filename}: {e}")
        
        # Delete from database
        expired_materials.delete()
        
        success_message = (
            f'Successfully deleted {deleted_count} expired materials, '
            f'freed {total_size / (1024 * 1024):.2f} MB'
        )
        if failed_count > 0:
            success_message += f', {failed_count} files failed to delete from cloud'
        
        self.stdout.write(self.style.SUCCESS(success_message))
        logger.info(f"[CLEANUP] {success_message}")
