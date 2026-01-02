from django.urls import path

from .views import MaterialDetailView, MaterialListCreateView

urlpatterns = [
    path("", MaterialListCreateView.as_view(), name="material-list-create"),
    path("<uuid:id>/", MaterialDetailView.as_view(), name="material-detail"),
]
