from django.contrib import admin

from .models import StorageUsage


@admin.register(StorageUsage)
class StorageUsageAdmin(admin.ModelAdmin):
    list_display = ("user", "used_bytes", "updated_at")
    search_fields = ("user__email",)
