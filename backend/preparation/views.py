import logging
from typing import Iterable

from django.shortcuts import get_object_or_404
from django.http import FileResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.text_extraction import extract_text_from_path
from courses.models import Course
from materials.models import Material
from .models import QuizSession, StudySummary
from .question_generation import generate_questions_from_text
from .summarizer import summarize_text
from .pdf_export import generate_summary_pdf
from .serializers import QuizSessionSerializer, StudySummarySerializer
from .gemini_service import get_gemini_service

logger = logging.getLogger(__name__)


def _load_materials(material_ids: Iterable, user) -> list[Material]:
    materials = list(Material.objects.filter(id__in=material_ids, user=user))
    if len(materials) != len(set(material_ids)):
        raise ValueError("One or more materials do not belong to the user")
    return materials


class StudySummaryListCreateView(generics.ListCreateAPIView):
    serializer_class = StudySummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = StudySummary.objects.filter(user=self.request.user)
        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class StudySummaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudySummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return StudySummary.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class QuizSessionListView(generics.ListAPIView):
    serializer_class = QuizSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = QuizSession.objects.filter(user=self.request.user)
        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class SummaryGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get("course")
        material_ids = request.data.get("materials", [])

        if not course_id:
            return Response({"detail": "course is required"}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id, user=request.user)

        materials: list[Material] = []
        if material_ids:
            try:
                materials = _load_materials(material_ids, request.user)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        aggregated_text_parts: list[str] = []
        for material in materials:
            try:
                text = extract_text_from_path(material.storage_key, material.content_type, max_chars=20000)
                if text:
                    aggregated_text_parts.append(text)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to extract text for material %s: %s", material.id, exc)

        combined_text = "\n".join(aggregated_text_parts).strip()
        if not combined_text:
            return Response({"detail": "No text could be extracted from the selected materials."}, status=status.HTTP_400_BAD_REQUEST)

        # Try Gemini API first, fallback to rule-based if unavailable
        gemini = get_gemini_service()
        summary = None
        used_ai = False
        
        if gemini.enabled:
            logger.info("Attempting to generate summary with Gemini API")
            max_words = int(len(combined_text.split()) * 0.15)  # ~15% of source
            result = gemini.generate_summary(combined_text, max_words=max_words, style='detailed')
            if result['success']:
                summary = result['summary']
                used_ai = True
                logger.info("Successfully generated summary with Gemini API")
            else:
                logger.warning("Gemini API failed: %s, falling back to rule-based", result['error'])
        
        # Fallback to rule-based summarizer if Gemini unavailable or failed
        if summary is None:
            logger.info("Using rule-based summarizer")
            summary = summarize_text(combined_text, ratio=0.15)
        
        return Response(
            {
                "course": str(course.id),
                "materials": [str(m.id) for m in materials],
                "summary": summary,
                "source_length": len(combined_text),
                "ai_generated": used_ai,
            },
            status=status.HTTP_200_OK,
        )


class QuizGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get("course")
        material_ids = request.data.get("materials", [])
        difficulty = request.data.get("difficulty", "medium")
        num_questions = request.data.get("num_questions", 5)

        try:
            num_questions = max(3, min(int(num_questions), 15))
        except (TypeError, ValueError):
            num_questions = 5

        course = get_object_or_404(Course, id=course_id, user=request.user)

        materials: list[Material] = []
        if material_ids:
            try:
                materials = _load_materials(material_ids, request.user)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        aggregated_text_parts: list[str] = []
        for material in materials:
            try:
                text = extract_text_from_path(material.storage_key, material.content_type)
                if text:
                    aggregated_text_parts.append(text)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to extract text for material %s: %s", material.id, exc)

        combined_text = "\n".join(aggregated_text_parts).strip()
        
        # Try Gemini API first, fallback to rule-based if unavailable
        gemini = get_gemini_service()
        questions = None
        used_ai = False
        
        if gemini.enabled:
            logger.info("Attempting to generate quiz with Gemini API")
            result = gemini.generate_quiz(combined_text, num_questions=num_questions, difficulty=difficulty)
            if result['success']:
                questions = result['questions']
                used_ai = True
                logger.info("Successfully generated %d questions with Gemini API", len(questions))
            else:
                logger.warning("Gemini API failed: %s, falling back to rule-based", result['error'])
        
        # Fallback to rule-based quiz generator if Gemini unavailable or failed
        if questions is None:
            logger.info("Using rule-based quiz generator")
            questions = generate_questions_from_text(combined_text, num_questions=num_questions, course_title=course.title or course.code)

        quiz = QuizSession.objects.create(
            user=request.user,
            course=course,
            difficulty=difficulty,
            num_questions=len(questions),
            questions=questions,
        )
        if materials:
            quiz.materials.set(materials)

        serializer = QuizSessionSerializer(quiz, context={"request": request})
        response_data = serializer.data
        response_data['ai_generated'] = used_ai
        return Response(response_data, status=status.HTTP_201_CREATED)


class QuizSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(QuizSession, id=quiz_id, user=request.user)
        answers = request.data.get("answers", {}) or {}

        if not isinstance(answers, dict):
            return Response({"detail": "answers must be a dictionary"}, status=status.HTTP_400_BAD_REQUEST)

        score, correct, total = quiz.mark_completed(answers)
        return Response(
            {
                "score": score,
                "correct": correct,
                "total": total,
                "quiz_id": str(quiz.id),
            },
            status=status.HTTP_200_OK,
        )


class SummaryExportPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Export summary text as PDF file."""
        summary_text = request.data.get("text", "").strip()
        title = request.data.get("title", "Study Summary")
        course_code = request.data.get("course_code", "")

        if not summary_text:
            return Response(
                {"detail": "Summary text is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Generate PDF
            pdf_buffer = generate_summary_pdf(
                summary_text=summary_text,
                title=title,
                course_code=course_code,
            )

            # Return as file download
            filename = f"summary_{course_code or 'study'}.pdf".lower()
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=filename,
                content_type="application/pdf",
            )
        except Exception as e:
            logger.error(f"Failed to generate PDF: {e}")
            return Response(
                {"detail": "Failed to generate PDF"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

