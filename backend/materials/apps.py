from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class MaterialsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "materials"

    def ready(self):
        import materials.signals
        
        # Start background scheduler for trash cleanup
        try:
            from config.scheduler import start_scheduler
            start_scheduler()
        except Exception as e:
            logger.warning(f"Could not start scheduler: {e}")
