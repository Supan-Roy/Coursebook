# Preparation Mode - Implementation Plan

## Overview
Add a "Preparation Mode" feature to course detail pages that allows students to:
1. Select course materials (PDFs, documents, images)
2. Generate AI summaries of the content
3. Create study/preparation plans

## Feature Components

### 1. Frontend Components

#### A. Preparation Mode Toggle/Entry
- Location: Course Detail Page header
- UI: Button/tab to enter Preparation Mode
- States: Normal View / Preparation Mode

#### B. File Selection Interface
- Display list of course materials
- Allow single or multiple file selection
- Show file preview/metadata
- Filter by file type (PDF, DOC, images)

#### C. Summarization Panel
- Show selected file(s)
- "Generate Summary" button
- Display AI-generated summary
- Loading states during processing
- Edit/save summary functionality

#### D. Plan Creation Interface
- Template options (study plan, revision plan, quiz prep)
- Timeline/calendar integration
- Task breakdown
- Progress tracking
- Save/export plans

### 2. Backend API Endpoints

#### A. File Content Extraction
```
POST /api/materials/{id}/extract-content/
- Extract text from PDFs, DOCs, images (OCR)
- Return structured text content
```

#### B. Summarization Service
```
POST /api/materials/summarize/
Body: {
  material_ids: [1, 2, 3],
  summary_length: "brief" | "detailed",
  focus_areas: ["key_concepts", "formulas", "examples"]
}
Response: {
  summary: "AI-generated summary",
  key_points: [],
  topics: []
}
```

#### C. Plan Management
```
POST /api/courses/{id}/plans/
GET /api/courses/{id}/plans/
PUT /api/courses/{id}/plans/{plan_id}/
DELETE /api/courses/{id}/plans/{plan_id}/
```

### 3. Database Models

#### Preparation Plan Model
```python
class PreparationPlan(models.Model):
    course = ForeignKey(Course)
    user = ForeignKey(User)
    title = CharField(max_length=200)
    materials = ManyToManyField(CourseMaterial)
    summary = TextField()
    plan_type = CharField(choices=['study', 'revision', 'quiz_prep'])
    tasks = JSONField()  # [{title, deadline, completed, notes}]
    created_at = DateTimeField()
    updated_at = DateTimeField()
```

### 4. AI Integration Options

#### Option 1: OpenAI API
- Use GPT-4 for summarization
- Pros: High quality, good at understanding context
- Cons: Costs per request, rate limits

#### Option 2: Local LLM (Ollama)
- Use Llama 2 or similar models locally
- Pros: Free, no rate limits, privacy
- Cons: Requires GPU, slower on CPU

#### Option 3: Hugging Face Transformers
- Use summarization models (BART, T5)
- Pros: Free, customizable
- Cons: Setup complexity, resource intensive

### 5. Implementation Phases

#### Phase 1: Basic UI & File Selection (Week 1)
- [ ] Add Preparation Mode toggle button
- [ ] Create file selection interface
- [ ] Build layout for preparation workspace
- [ ] Add file preview functionality

#### Phase 2: Content Extraction (Week 1-2)
- [ ] Implement PDF text extraction
- [ ] Extend OCR for image materials
- [ ] Handle DOC/DOCX extraction
- [ ] Create extraction API endpoint

#### Phase 3: Summarization (Week 2-3)
- [ ] Choose AI service (recommend starting with OpenAI)
- [ ] Implement summarization backend
- [ ] Create summary display UI
- [ ] Add edit/save summary functionality
- [ ] Implement caching to avoid re-summarizing

#### Phase 4: Plan Creation (Week 3-4)
- [ ] Design plan templates
- [ ] Build plan creation UI
- [ ] Implement task management
- [ ] Add deadline/calendar integration
- [ ] Create plan storage backend

#### Phase 5: Polish & Features (Week 4-5)
- [ ] Add progress tracking
- [ ] Implement plan sharing
- [ ] Export plans (PDF, Calendar)
- [ ] Add AI-suggested study schedule
- [ ] Mobile responsiveness

## Technology Stack

### Frontend
- React components for Preparation Mode
- State management for selected files
- Monaco Editor or similar for note-taking
- Calendar library (react-big-calendar)

### Backend
- Django REST Framework
- Celery for async processing
- Redis for caching summaries
- AI Service integration

### AI Services
**Recommended Start: OpenAI API**
- Easy integration
- Excellent quality
- Fast processing
```python
import openai

def summarize_content(text):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful study assistant. Summarize educational content concisely."},
            {"role": "user", "content": f"Summarize this: {text}"}
        ]
    )
    return response.choices[0].message.content
```

## File Structure

```
backend/
├── preparation/
│   ├── models.py (PreparationPlan, PlanTask)
│   ├── serializers.py
│   ├── views.py
│   ├── ai_services.py (summarization logic)
│   └── urls.py

frontend/
├── src/
│   ├── components/
│   │   ├── PreparationMode/
│   │   │   ├── PreparationMode.jsx
│   │   │   ├── FileSelector.jsx
│   │   │   ├── SummaryPanel.jsx
│   │   │   ├── PlanCreator.jsx
│   │   │   └── PlanTaskList.jsx
│   ├── services/
│   │   └── preparationService.js
```

## Security Considerations
- Rate limiting on AI API calls
- User quota management
- File size limits for processing
- Sanitize extracted content
- Authentication for all endpoints

## Cost Estimation (OpenAI)
- Average document: 2000-5000 tokens
- GPT-4 cost: ~$0.03 per 1K tokens
- Per summary: $0.06-$0.15
- Monthly budget: $50 = ~300-800 summaries

## Alternative: Free Tier Solution
1. Use Hugging Face's free API
2. Implement simple extractive summarization (no AI needed)
3. Add AI feature as premium upgrade

## Next Steps
1. Decide on AI service provider
2. Create basic UI mockup for approval
3. Implement Phase 1 (UI & file selection)
4. Set up backend infrastructure
5. Integrate AI service
6. Test and iterate

## Questions to Address
1. Should summaries be saved permanently or regenerated?
2. Maximum file size for summarization?
3. Should plans be shareable between students?
4. Integration with existing Todo system?
5. AI service budget allocation?
