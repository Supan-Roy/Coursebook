from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


class RootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({
            "message": "Welcome to Coursebook API",
            "version": "1.0",
            "endpoints": {
                "health": "/api/health/",
                "auth": "/api/auth/",
                "courses": "/api/courses/",
                "materials": "/api/materials/",
                "usage": "/api/usage/",
                "admin": "/admin/"
            }
        })


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("admin/", admin.site.urls),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/materials/", include("materials.urls")),
    path("api/usage/", include("usage.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
