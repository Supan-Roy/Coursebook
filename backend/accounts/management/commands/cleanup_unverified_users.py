"""
Management command to clean up unverified user accounts (older than 48 hours).
Run this daily via cron or task scheduler.

Recommended: Run daily at 2 AM
Example cron: 0 2 * * * cd /path/to/project && python manage.py cleanup_unverified_users
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Delete unverified user accounts that are older than 48 hours'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=48,
            help='Number of hours after which to delete unverified accounts (default: 48)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Find unverified users created before cutoff time
        unverified_users = User.objects.filter(
            email_verified=False,
            created_at__lte=cutoff_time
        )
        
        count = unverified_users.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No unverified accounts to delete'))
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'[DRY RUN] Would delete {count} unverified accounts:')
            )
            for user in unverified_users[:10]:  # Show first 10
                self.stdout.write(
                    f'  - {user.email} (created {user.created_at}, '
                    f'OTP sent: {user.email_verification_sent_at or "Never"})'
                )
            if count > 10:
                self.stdout.write(f'  ... and {count - 10} more')
            return
        
        # Actually delete
        deleted_count = 0
        emails_deleted = []
        
        for user in unverified_users:
            emails_deleted.append(user.email)
            user.delete()
            deleted_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} unverified account(s)'
            )
        )
        
        if deleted_count <= 10:
            for email in emails_deleted:
                self.stdout.write(f'  - {email}')

