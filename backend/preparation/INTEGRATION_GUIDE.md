# Quiz Generation Integration Guide

## 📦 Deliverables

### Core Files (464 lines)
- **[quiz_generator.py](quiz_generator.py)** - Rule-based generation engine
  - `QuizGenerator` class with 8 methods
  - Three question type generators (fill-blank, MCQ, T/F)
  - Deterministic, zero-dependency, fully tested

### Django Integration (332 + 212 lines)
- **[quiz_service.py](quiz_service.py)** - ORM layer & service class
  - `StudyQuiz` model for database persistence
  - `QuizGenerationService` with 8 static methods
  - Text extraction, CRUD operations, stats
  
- **[quiz_api.py](quiz_api.py)** - REST API endpoints
  - `StudyQuizViewSet` with generate & stats endpoints
  - `QuizGenerationSerializer` for request validation
  - Full example URL routing

### Tests (550+ lines)
- **[test_quiz_generator.py](test_quiz_generator.py)** - Comprehensive test suite
  - 23 tests covering core functionality & edge cases
  - 100% pass rate
  - Tests for all question types, validation, error handling

### Documentation
- **[README_QUIZ.md](README_QUIZ.md)** - Complete reference guide
  - Design philosophy, question types, examples
  - API reference, Django integration, performance
  - Testing guide, limitations, future enhancements

---

## 🚀 Integration Checklist

### Step 1: Add to Django

#### 1a. Add StudyQuiz Model (quiz_service.py)

```python
# backend/preparation/models.py - ADD AT END OF FILE
from preparation.quiz_service import StudyQuiz

# (The model is defined in quiz_service.py, import it or copy it to models.py)
```

**Alternative**: Copy `StudyQuiz` class from [quiz_service.py](quiz_service.py#L23) to your `models.py`

#### 1b. Create Migrations

```bash
python manage.py makemigrations preparation
python manage.py migrate
```

### Step 2: Update Django Admin (optional)

```python
# backend/preparation/admin.py - ADD

from django.contrib import admin
from preparation.quiz_service import StudyQuiz

@admin.register(StudyQuiz)
class StudyQuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'user', 'question_count', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('question_count', 'question_types', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Info', {'fields': ('title', 'description', 'course', 'user')}),
        ('Questions', {'fields': ('questions', 'question_count', 'question_types')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'generated_at')}),
    )
```

### Step 3: Add API Endpoints

#### 3a. Create/Update [backend/preparation/urls.py](../urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from preparation.quiz_api import StudyQuizViewSet

router = DefaultRouter()
router.register(r'quizzes', StudyQuizViewSet, basename='quiz')

urlpatterns = [
    path('', include(router.urls)),
]
```

#### 3b. Register in Main URLs

```python
# backend/coursebook/urls.py - FIND the following and ensure it exists:

urlpatterns = [
    # ... other patterns ...
    path('api/preparation/', include('preparation.urls')),
]
```

### Step 4: Test the Integration

```bash
# Run all tests
python manage.py test preparation -v 2

# Expected output:
# Ran 27 tests (23 quiz_generator + 4 existing preparation tests)
# OK
```

---

## 📡 API Usage Examples

### Generate a Quiz

```http
POST /api/preparation/quizzes/generate/

{
  "title": "Chapter 5: Python Basics",
  "description": "Review fundamental Python concepts",
  "course_id": 1,
  "material_ids": [1, 2, 3],
  "max_questions": 10,
  "save_quiz": true
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "quiz": {
    "id": 42,
    "title": "Chapter 5: Python Basics",
    "description": "...",
    "questions": [...],
    "question_count": 9,
    "question_types": {
      "fill_blank": 5,
      "mcq": 2,
      "true_false": 2
    },
    "created_at": "2024-01-04T10:30:00Z",
    "course": 1
  },
  "count": 9,
  "stats": {
    "fill_blank": 5,
    "mcq": 2,
    "true_false": 2
  },
  "error": null
}
```

### List User's Quizzes

```http
GET /api/preparation/quizzes/
```

**Response**:
```json
[
  {
    "id": 42,
    "title": "Chapter 5: Python Basics",
    "question_count": 9,
    "created_at": "2024-01-04T10:30:00Z",
    ...
  },
  {
    "id": 41,
    "title": "Chapter 4: Data Types",
    "question_count": 12,
    "created_at": "2024-01-03T15:20:00Z",
    ...
  }
]
```

### Get Quiz Statistics

```http
GET /api/preparation/quizzes/stats/
```

**Response**:
```json
{
  "total_quizzes": 5,
  "total_questions": 52,
  "by_type": {
    "fill_blank": 28,
    "mcq": 15,
    "true_false": 9
  },
  "quizzes": [...]
}
```

### Retrieve Specific Quiz

```http
GET /api/preparation/quizzes/42/
```

**Response**:
```json
{
  "id": 42,
  "title": "Chapter 5: Python Basics",
  "description": "...",
  "questions": [
    {
      "type": "fill_blank",
      "question": "The _____ is responsible for running Python code.",
      "options": ["interpreter", "compiler", "IDE", "debugger"],
      "answer": "interpreter"
    },
    {
      "type": "mcq",
      "question": "What is a function?",
      "options": [
        "A reusable block of code that performs a task",
        "A loop structure",
        "A data type"
      ],
      "answer": "A reusable block of code that performs a task"
    },
    ...
  ],
  "question_count": 9,
  "question_types": {...},
  "created_at": "...",
  "course": 1
}
```

### Delete a Quiz

```http
DELETE /api/preparation/quizzes/42/
```

**Response**: `204 No Content`

---

## 🧪 Testing the Module

### Run Unit Tests

```bash
# All tests
python manage.py test preparation.test_quiz_generator -v 2

# Specific test class
python manage.py test preparation.test_quiz_generator.TestQuizGenerator -v 2

# Specific test
python manage.py test preparation.test_quiz_generator.TestQuizGenerator.test_fill_blank_questions
```

### Test Manually in Django Shell

```bash
python manage.py shell
```

```python
from preparation.quiz_generator import generate_quiz
from preparation.quiz_service import QuizGenerationService

# Test 1: Basic generation
text = """
Python is a high-level programming language created in 1991.
The language was named after the Monty Python comedy series.
Python emphasizes code readability and simplicity.
The interpreter executes Python code directly without compilation.
"""

questions = generate_quiz(text, max_questions=5)
for q in questions:
    print(f"\n{q['type'].upper()}")
    print(f"Q: {q['question']}")
    print(f"A: {q['answer']}")
    print(f"Options: {q['options']}")

# Test 2: Service generation
result = QuizGenerationService.generate_quiz(text, max_questions=10)
print(f"\nGenerated {result['count']} questions")
print(f"Types: {result['stats']}")
```

---

## 📝 Database Queries

### Get all quizzes for a course

```python
from preparation.quiz_service import StudyQuiz

quizzes = StudyQuiz.objects.filter(course_id=1)
for quiz in quizzes:
    print(f"{quiz.title}: {quiz.question_count} questions")
```

### Get user's most recent quiz

```python
quiz = StudyQuiz.objects.filter(user=request.user).first()
```

### Get statistics for a course

```python
from django.db.models import Sum, Count

stats = StudyQuiz.objects.filter(course_id=1).aggregate(
    total_quizzes=Count('id'),
    total_questions=Sum('question_count')
)
print(f"Course has {stats['total_quizzes']} quizzes")
print(f"Total questions: {stats['total_questions']}")
```

---

## 🔧 Configuration

### Adjust Generation Parameters

In [quiz_generator.py](quiz_generator.py#L22-L28):

```python
class QuizGenerator:
    MIN_SENTENCE_LENGTH = 8      # Minimum words per sentence
    MAX_SENTENCE_LENGTH = 40     # Maximum words per sentence
    MIN_KEYWORD_LENGTH = 3       # Minimum keyword length
    MIN_DISTRACTORS = 2          # Minimum wrong options
```

Adjust these based on your content:
- **Academic journals**: Keep defaults (8-40 words)
- **Short paragraphs**: Lower MAX to 30
- **Dense technical writing**: Raise MIN to 10

### Adjust Service Limits

In [quiz_service.py](quiz_service.py#L138-L140):

```python
class QuizGenerationService:
    DEFAULT_MAX_QUESTIONS = 10   # Default quiz size
    MIN_QUESTIONS = 3            # Minimum acceptable
    MAX_QUESTIONS = 50           # Maximum limit
```

---

## 🐛 Debugging

### No questions generated?

**Check**:
1. **Text quality**: Ensure text has 5+ substantive sentences
2. **Sentence length**: Each sentence should be 8-40 words
3. **Keywords**: Should have capitalized nouns (Python, Django, etc.)

```python
from preparation.quiz_generator import QuizGenerator

gen = QuizGenerator()
sentences = gen._extract_sentences(your_text)
print(f"Extracted {len(sentences)} sentences")

keywords = gen._build_keyword_pool(sentences)
print(f"Found {len(keywords)} keywords: {keywords}")
```

### Questions not validating?

**Check**:
1. Empty question text
2. Options not in options list
3. Duplicate options
4. < 3 options for MCQ

```python
q = {...}  # Your question
is_valid = gen._validate_question(q)
print(f"Valid: {is_valid}")
```

### Test with sample data

```python
sample_text = """
The Internet is a global system of interconnected computer networks that use the Internet 
protocol suite to link devices worldwide. The Internet Protocol serves as the fundamental 
communication protocol that enables data transmission between different networks. A web server 
is a computer that stores and delivers website content to users upon request. The Domain 
Name System translates human-readable domain names into numerical IP addresses that computers 
can understand and use for routing. Bandwidth represents the maximum amount of data that can 
be transmitted across a network connection in a specific time period.
"""

result = QuizGenerationService.generate_quiz(sample_text, max_questions=10)
print(f"Generated {result['count']} questions")
print(f"Stats: {result['stats']}")
```

---

## 📚 Next Steps

1. **Integrate with frontend**: Use the REST API in your React app
2. **Add quiz taking**: Create `QuizResponse` model to track user answers
3. **Analytics**: Track question difficulty, student performance
4. **Caching**: Avoid regenerating same content (use material hash as key)
5. **Export**: Add PDF/DOCX export of quizzes

---

## 🎯 Success Criteria

✅ All 23 tests pass  
✅ No external ML/AI dependencies  
✅ Deterministic (same input = same output)  
✅ Handles edge cases gracefully  
✅ API endpoints working  
✅ Database persistence  
✅ Clean, readable code  
✅ Comprehensive documentation  

---

## 📞 Support

**Files**:
- [quiz_generator.py](quiz_generator.py) - Core engine (464 lines)
- [quiz_service.py](quiz_service.py) - Django ORM layer (332 lines)
- [quiz_api.py](quiz_api.py) - REST API (212 lines)
- [test_quiz_generator.py](test_quiz_generator.py) - Test suite (550+ lines)
- [README_QUIZ.md](README_QUIZ.md) - Full documentation

**Questions?** Check the documentation files or review the test suite for usage examples.
