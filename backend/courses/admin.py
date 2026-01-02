from django.contrib import admin

from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "user", "folder_slug", "created_at")
    search_fields = ("code", "title", "user__email")
    list_filter = ("created_at",)
