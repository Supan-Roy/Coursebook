from rest_framework import serializers

from .models import StorageUsage


class StorageUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageUsage
        fields = ["used_bytes", "quota_bytes", "updated_at"]
        read_only_fields = ["used_bytes", "quota_bytes", "updated_at"]
