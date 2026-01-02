from django.contrib import admin

from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("filename", "course", "user", "size_bytes", "uploaded_at")
    search_fields = ("filename", "course__code", "user__email")
    list_filter = ("uploaded_at",)
