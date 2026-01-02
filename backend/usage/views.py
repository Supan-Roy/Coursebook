from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StorageUsage
from .serializers import StorageUsageSerializer


class StorageUsageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        usage, _ = StorageUsage.objects.get_or_create(user=request.user)
        serializer = StorageUsageSerializer(instance=usage)
        return Response(serializer.data, status=status.HTTP_200_OK)
