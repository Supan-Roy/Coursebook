import uuid
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course
from materials.models import Material
from preparation.models import QuizSession


class PreparationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(email="user@example.com", password="pass1234")
        self.client.force_authenticate(user=self.user)
        self.course = Course.objects.create(user=self.user, code="CSE101", title="Intro to CS")
        self.material = Material.objects.create(
            user=self.user,
            course=self.course,
            filename="doc.pdf",
            content_type="application/pdf",
            size_bytes=128,
            storage_url="http://example.com/doc.pdf",
            storage_key="doc.pdf",
        )

    @patch("preparation.views.summarize_text", return_value="This is an excellent summary of the key concepts.")
    @patch(
        "preparation.views.extract_text_from_path",
        return_value="Important concepts appear here. More detail follows. Additional explanation.",
    )
    def test_generate_summary_returns_text(self, mock_extract, mock_summarize):
        url = "/api/preparation/summaries/generate/"
        payload = {"course": str(self.course.id), "materials": [str(self.material.id)]}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course"], str(self.course.id))
        self.assertEqual(response.data["materials"], [str(self.material.id)])
        self.assertEqual(response.data["summary"], "This is an excellent summary of the key concepts.")
        mock_extract.assert_called_once_with(self.material.storage_key, self.material.content_type, max_chars=20000)
        mock_summarize.assert_called_once()

    @patch("preparation.views.extract_text_from_path", return_value="")
    def test_generate_summary_rejects_when_no_text(self, _mock_extract):
        url = "/api/preparation/summaries/generate/"
        payload = {"course": str(self.course.id), "materials": [str(self.material.id)]}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    @patch("preparation.views.generate_questions_from_text")
    @patch("preparation.views.extract_text_from_path", return_value="Networking fundamentals and OSI layers explained.")
    def test_generate_quiz_creates_session(self, _mock_extract, mock_generate):
        qid = str(uuid.uuid4())
        mock_generate.return_value = [
            {
                "id": qid,
                "prompt": "The OSI model has how many layers?",
                "options": ["Seven", "Five", "Four", "Two"],
                "answer_index": 0,
                "source_excerpt": "The OSI model defines seven layers.",
            }
        ]

        url = "/api/preparation/quizzes/generate/"
        payload = {"course": str(self.course.id), "materials": [str(self.material.id)], "num_questions": 5}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(QuizSession.objects.filter(user=self.user, course=self.course).exists())
        self.assertEqual(response.data["num_questions"], 1)
        self.assertEqual(response.data["questions"][0]["id"], qid)
        mock_generate.assert_called_once()

    def test_submit_quiz_scores_answers(self):
        question_id = str(uuid.uuid4())
        quiz = QuizSession.objects.create(
            user=self.user,
            course=self.course,
            difficulty="medium",
            num_questions=1,
            questions=[
                {
                    "id": question_id,
                    "prompt": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "answer_index": 1,
                    "source_excerpt": "Simple addition example.",
                }
            ],
        )
        quiz.materials.set([self.material])

        url = f"/api/preparation/quizzes/{quiz.id}/submit/"
        payload = {"answers": {question_id: 1}}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["score"], 100.0)
        self.assertEqual(response.data["correct"], 1)
        self.assertEqual(response.data["total"], 1)
        quiz.refresh_from_db()
        self.assertIsNotNone(quiz.completed_at)
        self.assertEqual(quiz.user_answers, {question_id: 1})
