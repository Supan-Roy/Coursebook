"""
Quiz generation service.

Integrates quiz_generator with Django models and API.
Handles validation, caching, and persistence.
"""

import logging
from typing import List, Dict, Optional

from django.db import models
from django.utils import timezone

from preparation.quiz_generator import generate_quiz as generate_quiz_raw

logger = logging.getLogger(__name__)


class StudyQuiz(models.Model):
    """
    Model for storing generated quizzes.
    
    A quiz is derived from study materials for a specific course.
    Supports regeneration and version tracking.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='study_quizzes')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='quizzes')
    
    # Source material reference
    materials = models.ManyToManyField(
        'materials.Material',
        related_name='generated_quizzes',
        help_text="Materials from which this quiz was generated"
    )
    
    # Quiz content
    title = models.CharField(max_length=255, help_text="Quiz title")
    description = models.TextField(blank=True, default="", help_text="Quiz description/instructions")
    questions = models.JSONField(
        default=list,
        help_text="List of question dicts: {type, question, options, answer}"
    )
    
    # Metadata
    question_count = models.IntegerField(default=0, help_text="Number of questions in quiz")
    question_types = models.JSONField(
        default=dict,
        help_text="Count of each question type: {fill_blank: int, mcq: int, true_false: int}"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    generated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Study Quiz"
        verbose_name_plural = "Study Quizzes"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'course']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.question_count} Q) - {self.course}"
    
    def save(self, *args, **kwargs):
        """Save and update metadata."""
        self.question_count = len(self.questions) if self.questions else 0
        
        # Calculate type distribution
        types = {}
        for q in self.questions:
            q_type = q.get('type', 'unknown')
            types[q_type] = types.get(q_type, 0) + 1
        self.question_types = types
        
        super().save(*args, **kwargs)


class QuizGenerationService:
    """
    Service for quiz generation and management.
    
    Handles:
    - Text extraction from materials
    - Quiz generation with validation
    - Storage and retrieval
    - Question stats
    """
    
    # Configuration
    DEFAULT_MAX_QUESTIONS = 10
    MIN_QUESTIONS = 3
    MAX_QUESTIONS = 50
    
    @staticmethod
    def generate_quiz(
        text: str,
        max_questions: int = DEFAULT_MAX_QUESTIONS,
        validate_all: bool = True
    ) -> Dict:
        """
        Generate a quiz from text.
        
        Args:
            text: Input material text
            max_questions: Target question count
            validate_all: Verify all questions meet standards
            
        Returns:
            {
                'success': bool,
                'questions': List[Dict],
                'count': int,
                'stats': {
                    'fill_blank': int,
                    'mcq': int,
                    'true_false': int
                },
                'error': Optional[str]
            }
        """
        try:
            # Validate input
            if not text or not isinstance(text, str):
                return {
                    'success': False,
                    'questions': [],
                    'count': 0,
                    'stats': {},
                    'error': 'Invalid or empty input text'
                }
            
            # Clamp question count
            max_q = max(
                QuizGenerationService.MIN_QUESTIONS,
                min(max_questions, QuizGenerationService.MAX_QUESTIONS)
            )
            
            # Generate questions
            questions = generate_quiz_raw(text, max_q)
            
            # Validate if requested
            if validate_all and not questions:
                return {
                    'success': False,
                    'questions': [],
                    'count': 0,
                    'stats': {},
                    'error': 'No valid questions could be generated from the provided text'
                }
            
            # Calculate stats
            stats = {}
            for q in questions:
                q_type = q.get('type', 'unknown')
                stats[q_type] = stats.get(q_type, 0) + 1
            
            logger.info(f"Generated {len(questions)} quiz questions (max requested: {max_q})")
            
            return {
                'success': True,
                'questions': questions,
                'count': len(questions),
                'stats': stats,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error in quiz generation: {e}")
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'stats': {},
                'error': f'Generation error: {str(e)}'
            }
    
    @staticmethod
    def extract_text_from_materials(materials) -> str:
        """
        Extract combined text from material objects.
        
        Args:
            materials: QuerySet or list of Material objects
            
        Returns:
            Combined text from all materials
        """
        if not materials:
            return ""
        
        text_parts = []
        for material in materials:
            # Try multiple text source fields
            content = getattr(material, 'content', None) or \
                      getattr(material, 'text', None) or \
                      getattr(material, 'description', None) or ""
            
            if content:
                text_parts.append(str(content))
        
        return "\n\n".join(text_parts)
    
    @staticmethod
    def save_quiz(
        user,
        course,
        materials,
        title: str,
        questions: List[Dict],
        description: str = ""
    ) -> Optional[StudyQuiz]:
        """
        Save a generated quiz to database.
        
        Args:
            user: User instance
            course: Course instance
            materials: List or QuerySet of Material instances
            title: Quiz title
            questions: List of question dicts
            description: Optional quiz description
            
        Returns:
            SavedStudyQuiz instance or None if error
        """
        try:
            # Validate questions
            if not questions:
                logger.warning("No questions to save")
                return None
            
            # Create quiz
            quiz = StudyQuiz(
                user=user,
                course=course,
                title=title,
                description=description,
                questions=questions
            )
            quiz.save()
            
            # Add many-to-many materials
            if materials:
                quiz.materials.set(materials)
            
            logger.info(f"Saved quiz: {quiz.id} ({len(questions)} questions)")
            return quiz
            
        except Exception as e:
            logger.error(f"Error saving quiz: {e}")
            return None
    
    @staticmethod
    def get_quiz(quiz_id: int, user=None) -> Optional[StudyQuiz]:
        """
        Retrieve a quiz by ID.
        
        Args:
            quiz_id: Quiz ID
            user: Optional user filter (for permission checking)
            
        Returns:
            StudyQuiz instance or None
        """
        try:
            quiz = StudyQuiz.objects.get(id=quiz_id)
            if user and quiz.user != user:
                return None
            return quiz
        except StudyQuiz.DoesNotExist:
            return None
    
    @staticmethod
    def list_quizzes(user, course=None) -> List[StudyQuiz]:
        """
        List quizzes for a user.
        
        Args:
            user: User instance
            course: Optional course filter
            
        Returns:
            QuerySet of StudyQuiz instances
        """
        qs = StudyQuiz.objects.filter(user=user)
        if course:
            qs = qs.filter(course=course)
        return qs.order_by('-created_at')
    
    @staticmethod
    def delete_quiz(quiz_id: int, user=None) -> bool:
        """
        Delete a quiz.
        
        Args:
            quiz_id: Quiz ID
            user: Optional user filter (for permission checking)
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            quiz = StudyQuiz.objects.get(id=quiz_id)
            if user and quiz.user != user:
                return False
            quiz.delete()
            logger.info(f"Deleted quiz: {quiz_id}")
            return True
        except StudyQuiz.DoesNotExist:
            return False
    
    @staticmethod
    def get_quiz_stats(quiz: StudyQuiz) -> Dict:
        """
        Get statistics for a quiz.
        
        Args:
            quiz: StudyQuiz instance
            
        Returns:
            {
                'total': int,
                'by_type': {type: count},
                'created': datetime,
                'material_count': int
            }
        """
        return {
            'total': quiz.question_count,
            'by_type': quiz.question_types,
            'created': quiz.created_at,
            'material_count': quiz.materials.count(),
            'course': str(quiz.course),
            'user': str(quiz.user)
        }
