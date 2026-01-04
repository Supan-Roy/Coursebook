from django.urls import path

from .views import MaterialDetailView, MaterialExtractContentView, MaterialListCreateView, FileUploadView, MaterialUploadView

urlpatterns = [
    path("", MaterialListCreateView.as_view(), name="material-list-create"),
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    path("upload-material/", MaterialUploadView.as_view(), name="material-upload"),
    path("<uuid:id>/extract/", MaterialExtractContentView.as_view(), name="material-extract"),
    path("<uuid:id>/", MaterialDetailView.as_view(), name="material-detail"),
]
