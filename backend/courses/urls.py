from django.urls import path

from .views import CourseDetailView, CourseListCreateView

urlpatterns = [
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("<uuid:id>/", CourseDetailView.as_view(), name="course-detail"),
]
