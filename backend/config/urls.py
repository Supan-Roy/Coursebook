from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from materials.views import PublicMaterialServeView


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
                "todos": "/api/todos/",
                "admin": "/admin/"
            }
        })


def api_not_found_view(request, unmatched=None):
    return JsonResponse(
        {
            "detail": "Not found.",
            "path": request.path,
        },
        status=404,
    )


def themed_not_found_view(request, unmatched=None):
    return render(request, "404.html", status=404)


urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("admin/", admin.site.urls),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/auth/", include("accounts.urls")),
    path("auth/", include("accounts.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/materials/", include("materials.urls")),
    path("api/usage/", include("usage.urls")),
    path("api/todos/", include("todos.urls")),
    path("api/preparation/", include("preparation.urls")),
    path("api/toolkit/", include("toolkit.urls")),
    path("api/sharing/", include("sharing.urls")),
    # Public material access without the /api/ prefix
    path("materials/files/<uuid:id>/", PublicMaterialServeView.as_view(), name="public-material-serve-direct"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all API 404 response
urlpatterns += [
    path("api/<path:unmatched>", api_not_found_view, name="api-not-found"),
]

# Catch-all HTML 404 page for all other unmatched paths
urlpatterns += [
    path("<path:unmatched>", themed_not_found_view, name="html-not-found"),
]
