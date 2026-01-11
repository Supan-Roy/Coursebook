from django.urls import path

from .views import (
    MaterialDetailView, 
    MaterialExtractContentView, 
    MaterialListCreateView, 
    FileUploadView, 
    MaterialUploadView,
    TrashBinListView,
    MaterialRestoreView,
    MaterialPermanentDeleteView,
    EmptyTrashView,
    PublicMaterialServeView,
    MaterialPrivacyUpdateView
)

urlpatterns = [
    path("", MaterialListCreateView.as_view(), name="material-list-create"),
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    path("upload-material/", MaterialUploadView.as_view(), name="material-upload"),
    path("<uuid:id>/extract/", MaterialExtractContentView.as_view(), name="material-extract"),
    path("<uuid:id>/privacy/", MaterialPrivacyUpdateView.as_view(), name="material-privacy-update"),
    path("<uuid:id>/", MaterialDetailView.as_view(), name="material-detail"),
    path("trash/", TrashBinListView.as_view(), name="trash-bin-list"),
    path("trash/empty/", EmptyTrashView.as_view(), name="trash-empty"),
    path("<uuid:id>/restore/", MaterialRestoreView.as_view(), name="material-restore"),
    path("<uuid:id>/permanent-delete/", MaterialPermanentDeleteView.as_view(), name="material-permanent-delete"),
    path("files/<uuid:id>/", PublicMaterialServeView.as_view(), name="public-material-serve"),
]
