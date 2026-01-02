from django.urls import path

from .views import StorageUsageView

urlpatterns = [
    path("", StorageUsageView.as_view(), name="storage-usage"),
]
