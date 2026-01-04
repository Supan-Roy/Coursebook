"""
Quiz generation API endpoints (DRF serializers & views).

Add to your preparation app's views.py and urls.py
"""

from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from preparation.quiz_service import QuizGenerationService, StudyQuiz
from materials.models import Material
from courses.models import Course


class StudyQuizSerializer(serializers.ModelSerializer):
    """Serializer for StudyQuiz model."""
    
    question_count = serializers.IntegerField(read_only=True)
    question_types = serializers.JSONField(read_only=True)
    
    class Meta:
        model = StudyQuiz
        fields = [
            'id', 'title', 'description', 'questions',
            'question_count', 'question_types',
            'created_at', 'updated_at', 'course'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuizGenerationSerializer(serializers.Serializer):
    """Serializer for quiz generation request."""
    
    title = serializers.CharField(max_length=255, help_text="Quiz title")
    description = serializers.CharField(
        default="",
        required=False,
        help_text="Quiz description"
    )
    course_id = serializers.IntegerField(help_text="Course ID")
    material_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of material IDs to use for generation"
    )
    max_questions = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=50,
        required=False,
        help_text="Target number of questions"
    )
    save_quiz = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Whether to save quiz to database"
    )


class StudyQuizViewSet(viewsets.ModelViewSet):
    """ViewSet for managing study quizzes."""
    
    serializer_class = StudyQuizSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return quizzes for current user."""
        return StudyQuiz.objects.filter(user=self.request.user)
    
    @action(
        detail=False,
        methods=['post'],
        serializer_class=QuizGenerationSerializer
    )
    def generate(self, request):
        """
        Generate a new quiz from materials.
        
        POST /api/preparation/quizzes/generate/
        {
            "title": "Chapter 5 Review",
            "description": "Optional description",
            "course_id": 1,
            "material_ids": [1, 2, 3],
            "max_questions": 10,
            "save_quiz": true
        }
        
        Returns:
        {
            "success": true,
            "quiz": {...},  # Full quiz if saved
            "questions": [...],
            "count": 10,
            "stats": {
                "fill_blank": 5,
                "mcq": 3,
                "true_false": 2
            },
            "error": null
        }
        """
        serializer = QuizGenerationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'error': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate course access
        try:
            course = Course.objects.get(id=serializer.validated_data['course_id'])
            # Check if user has access to course (implement per your permission model)
        except Course.DoesNotExist:
            return Response(
                {
                    'success': False,
                    'error': 'Course not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get materials
        material_ids = serializer.validated_data['material_ids']
        materials = Material.objects.filter(
            id__in=material_ids,
            course=course
        )
        
        if not materials.exists():
            return Response(
                {
                    'success': False,
                    'error': 'No valid materials found'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extract text from materials
        text = QuizGenerationService.extract_text_from_materials(materials)
        
        if not text:
            return Response(
                {
                    'success': False,
                    'error': 'Materials contain no extractable text'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate quiz
        result = QuizGenerationService.generate_quiz(
            text,
            max_questions=serializer.validated_data.get('max_questions', 10)
        )
        
        if not result['success']:
            return Response(
                {
                    'success': False,
                    'error': result['error']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Optionally save to database
        quiz = None
        if serializer.validated_data.get('save_quiz', True):
            quiz = QuizGenerationService.save_quiz(
                user=request.user,
                course=course,
                materials=materials,
                title=serializer.validated_data['title'],
                questions=result['questions'],
                description=serializer.validated_data.get('description', '')
            )
        
        return Response(
            {
                'success': True,
                'quiz': StudyQuizSerializer(quiz).data if quiz else None,
                'questions': result['questions'],
                'count': result['count'],
                'stats': result['stats'],
                'error': None
            },
            status=status.HTTP_201_CREATED if quiz else status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics for user's quizzes."""
        quizzes = self.get_queryset()
        
        total_questions = sum(q.question_count for q in quizzes)
        type_counts = {}
        for quiz in quizzes:
            for q_type, count in quiz.question_types.items():
                type_counts[q_type] = type_counts.get(q_type, 0) + count
        
        return Response({
            'total_quizzes': quizzes.count(),
            'total_questions': total_questions,
            'by_type': type_counts,
            'quizzes': StudyQuizSerializer(quizzes, many=True).data
        })


# URL Configuration (add to urls.py)

from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'quizzes', StudyQuizViewSet, basename='quiz')

urlpatterns = [
    path('', include(router.urls)),
]

# In your main urls.py:
# path('api/preparation/', include('preparation.urls'))
