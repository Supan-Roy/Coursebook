import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from courses.models import Course
from materials.models import Material


class StudySummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="study_summaries")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="study_summaries")
    materials = models.ManyToManyField(Material, related_name="study_summaries", blank=True)
    title = models.CharField(max_length=255, default="Summary")
    content = models.TextField()
    word_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "course"]),
        ]

    def save(self, *args, **kwargs):
        self.word_count = len((self.content or "").split())
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Summary for {self.course.code} ({self.user.email})"


class QuizSession(models.Model):
    DIFFICULTY_CHOICES = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_sessions")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="quiz_sessions")
    materials = models.ManyToManyField(Material, related_name="quiz_sessions", blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    num_questions = models.PositiveSmallIntegerField(default=5)
    questions = models.JSONField(default=list)  # [{id, prompt, options, answer_index, source_excerpt}]
    user_answers = models.JSONField(default=dict)  # {question_id: selected_index}
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "course"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def mark_completed(self, answers: dict[str, int]):
        total = len(self.questions) or 1
        correct = 0

        for question in self.questions:
            qid = str(question.get("id"))
            correct_index = question.get("answer_index")
            user_choice = answers.get(qid)
            if isinstance(user_choice, int) and user_choice == correct_index:
                correct += 1

        percent = round((correct / total) * 100, 2)
        self.user_answers = answers
        self.score = percent
        self.completed_at = timezone.now()
        self.save(update_fields=["user_answers", "score", "completed_at", "updated_at"])
        return percent, correct, total

    def __str__(self) -> str:
        return f"Quiz {self.id} - {self.course.code}"