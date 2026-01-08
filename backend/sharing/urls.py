from django.urls import path
from .views import (
    ShareLinkListCreateView,
    ShareLinkDetailView,
    ShareLinkUpdatePrivacyView,
    SharedContentView,
)

urlpatterns = [
    path('', ShareLinkListCreateView.as_view(), name='share_link_list_create'),
    path('<uuid:pk>/', ShareLinkDetailView.as_view(), name='share_link_detail'),
    path('<uuid:pk>/privacy/', ShareLinkUpdatePrivacyView.as_view(), name='share_link_privacy'),
    path('view/<str:token>/', SharedContentView.as_view(), name='shared_content'),
]

