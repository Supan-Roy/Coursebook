from django.urls import path

from .views import (
    QuizGenerateView,
    QuizSessionListView,
    QuizSubmitView,
    StudySummaryDetailView,
    StudySummaryListCreateView,
    SummaryGenerateView,
    SummaryExportPdfView,
)

urlpatterns = [
    path("summaries/", StudySummaryListCreateView.as_view(), name="summary-list-create"),
    path("summaries/<uuid:id>/", StudySummaryDetailView.as_view(), name="summary-detail"),
    path("summaries/generate/", SummaryGenerateView.as_view(), name="summary-generate"),
    path("summaries/export-pdf/", SummaryExportPdfView.as_view(), name="summary-export-pdf"),
    path("quizzes/", QuizSessionListView.as_view(), name="quiz-list"),
    path("quizzes/generate/", QuizGenerateView.as_view(), name="quiz-generate"),
    path("quizzes/<uuid:quiz_id>/submit/", QuizSubmitView.as_view(), name="quiz-submit"),
]
