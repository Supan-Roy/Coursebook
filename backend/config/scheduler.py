"""
APScheduler configuration for running periodic tasks like trash cleanup
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
from django.utils import timezone

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(daemon=True)


def cleanup_trash():
    """Cleanup expired trash items (older than 30 days)"""
    try:
        logger.info("[TRASH CLEANUP] Starting scheduled trash cleanup...")
        call_command('cleanup_trash', verbosity=1)
        logger.info("[TRASH CLEANUP] Cleanup completed successfully")
    except Exception as e:
        logger.error(f"[TRASH CLEANUP] Error during scheduled cleanup: {e}", exc_info=True)


def start_scheduler():
    """Start the background scheduler"""
    if scheduler.running:
        logger.info("[SCHEDULER] Scheduler is already running")
        return
    
    try:
        # Run cleanup immediately on startup
        logger.info("[SCHEDULER] Running immediate trash cleanup on startup...")
        cleanup_trash()
        
        # Schedule cleanup_trash to run daily at 2 AM
        scheduler.add_job(
            cleanup_trash,
            'cron',
            hour=2,
            minute=0,
            id='cleanup_trash_job',
            name='Clean up expired trash items',
            replace_existing=True,  # Replace if job already exists
            timezone='UTC'
        )
        
        scheduler.start()
        logger.info("[SCHEDULER] Background scheduler started successfully. Next cleanup: 2 AM UTC daily")
    except Exception as e:
        logger.error(f"[SCHEDULER] Error starting scheduler: {e}", exc_info=True)


def stop_scheduler():
    """Stop the background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("[SCHEDULER] Background scheduler stopped")
