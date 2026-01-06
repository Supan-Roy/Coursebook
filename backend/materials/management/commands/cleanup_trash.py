"""
Management command to clean up expired trash items (older than 30 days).
Run this daily via cron or task scheduler.
"""
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from materials.models import Material
from usage.models import StorageUsage


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
        
        for material in expired_materials:
            # Delete physical file
            try:
                if material.storage_key and os.path.exists(material.storage_key):
                    os.remove(material.storage_key)
                    self.stdout.write(f'Deleted file: {material.filename}')
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Could not delete file {material.filename}: {e}')
                )
            
            total_size += material.size_bytes
            user = material.user
            
            # Update storage usage
            storage_usage, _ = StorageUsage.objects.get_or_create(user=user)
            storage_usage.used_bytes = max(0, storage_usage.used_bytes - material.size_bytes)
            storage_usage.save()
            
            deleted_count += 1
        
        # Delete from database
        expired_materials.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} expired materials, '
                f'freed {total_size / (1024 * 1024):.2f} MB'
            )
        )
