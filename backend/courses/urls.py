from django.urls import path

from .views import CourseDetailView, CourseListCreateView, UpdateSemesterNameView, SemesterCreateView, SemesterListView, SemesterDeleteView

urlpatterns = [
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("update-semester/", UpdateSemesterNameView.as_view(), name="update-semester"),
    path("semesters/", SemesterListView.as_view(), name="semester-list"),
    path("semesters/create/", SemesterCreateView.as_view(), name="semester-create"),
    path("semesters/delete/", SemesterDeleteView.as_view(), name="semester-delete"),
    path("<uuid:id>/", CourseDetailView.as_view(), name="course-detail"),
]
