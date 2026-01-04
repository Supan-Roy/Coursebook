# Google Gemini API Integration

This document describes how the AI-powered summaries and quizzes work using Google's Gemini API.

## Overview

The application now uses Google's Gemini 1.5 Flash model to generate high-quality:
- **Study Summaries**: Intelligent text condensation with context awareness
- **Quiz Questions**: Contextual MCQs and fill-in-the-blank questions from study materials

**Automatic Fallback**: If the API is unavailable or rate-limited, the system automatically falls back to rule-based generation methods.

## Getting Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## Setup

### 1. Add API Key to Environment

Add to your `.env` file:
```bash
GEMINI_API_KEY=your-api-key-here
```

Or on Windows PowerShell:
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

Or on Linux/Mac:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

### 2. Restart Django Server

After adding the API key, restart your Django development server:
```bash
python manage.py runserver
```

## API Limits (Free Tier)

- **Daily**: 1,500 requests per day
- **Per Minute**: 15 requests per minute
- **Model**: Gemini 1.5 Flash

These limits are generous for typical study app usage. If you exceed limits, the system automatically falls back to rule-based generation.

## Features

### AI-Powered Summaries

**What it does**:
- Understands context and key concepts
- Maintains important terminology and definitions
- Creates coherent, readable summaries
- Adapts length based on source material

**Available styles**:
- `detailed`: Comprehensive summary with all key points
- `concise`: Brief overview of main ideas
- `bullet_points`: Structured list format

**API Call**: `POST /api/preparation/summary/generate/`

### AI-Powered Quizzes

**What it does**:
- Generates contextually relevant questions
- Creates plausible distractors (wrong answers)
- Covers different aspects of the material
- Adapts to difficulty level

**Question types**:
- Multiple Choice Questions (MCQs)
- Fill-in-the-blank questions

**Difficulty levels**:
- `easy`: Basic recall and understanding
- `medium`: Application and analysis
- `hard`: Critical thinking and synthesis

**API Call**: `POST /api/preparation/quiz/generate/`

## How It Works

### Summary Generation Flow

```
1. User uploads materials → Extract text
2. Check if Gemini API is available
3. If API available:
   - Send text to Gemini with style preference
   - Parse response
   - Return AI-generated summary
4. If API unavailable or fails:
   - Use rule-based TF-IDF summarizer
   - Return fallback summary
5. Response includes "ai_generated" flag
```

### Quiz Generation Flow

```
1. User selects materials → Extract text
2. Check if Gemini API is available
3. If API available:
   - Send text to Gemini with difficulty/count
   - Parse questions from response
   - Structure as JSON (question, options, answer, type)
   - Return AI-generated quiz
4. If API unavailable or fails:
   - Use rule-based keyword extraction
   - Generate questions from patterns
   - Return fallback quiz
5. Response includes "ai_generated" flag
```

## Architecture

### Files

- **`gemini_service.py`**: Core Gemini API integration
  - `GeminiService` class handles API calls
  - `generate_summary()`: Text summarization
  - `generate_quiz()`: Quiz generation
  - `_parse_quiz_response()`: Parse AI responses
  
- **`views.py`**: Updated endpoints
  - `SummaryGenerateView`: Try Gemini, fallback to rule-based
  - `QuizGenerateView`: Try Gemini, fallback to rule-based
  
- **`settings.py`**: Configuration
  - `GEMINI_API_KEY`: Environment variable

### Response Format

Both summary and quiz responses include an `ai_generated` boolean field:
```json
{
  "summary": "...",
  "ai_generated": true
}
```

This allows the frontend to show indicators like:
- ✨ AI-Generated Summary
- 🤖 AI-Generated Quiz

## Troubleshooting

### "Gemini API is not configured"

**Issue**: No API key found  
**Solution**: Add `GEMINI_API_KEY` to your `.env` file and restart the server

### "API request failed"

**Issue**: Network error or invalid API key  
**Solution**: 
1. Check your internet connection
2. Verify your API key is correct
3. Check [API Status](https://status.cloud.google.com/)

### "Rate limit exceeded"

**Issue**: Too many requests  
**Solution**: Wait a few minutes or upgrade to paid tier. The system automatically falls back to rule-based generation.

### Fallback is always used

**Issue**: API key not being read  
**Solution**:
1. Verify `.env` file exists in `backend/` directory
2. Ensure `python-dotenv` is installed
3. Restart Django server
4. Check logs for error messages

## Monitoring

The system logs all API attempts:
```python
logger.info("Attempting to generate summary with Gemini API")
logger.info("Successfully generated summary with Gemini API")
logger.warning("Gemini API failed: %s, falling back to rule-based", result['error'])
```

Check Django logs to see which generation method is being used.

## Cost Considerations

**Free tier is sufficient for**:
- Personal study apps
- Small class sizes (<100 students)
- Moderate usage (~50 summaries + 50 quizzes per day)

**Consider paid tier if**:
- Large scale deployment (>1000 users)
- High-frequency usage (>1500 requests/day)
- You need higher rate limits (>15/minute)

## Security

- API keys are stored in environment variables (not in code)
- Keys are never exposed to frontend
- All API calls are server-side only
- `.env` files are in `.gitignore` (never committed)

## Testing

Test the integration:

```bash
# Test with API key set
python manage.py test preparation

# Test without API key (should fallback)
unset GEMINI_API_KEY
python manage.py test preparation
```

Both should pass - the system gracefully handles both scenarios.

## Future Enhancements

Potential improvements:
- Cache API responses to reduce calls
- Implement exponential backoff for rate limits
- Add support for other LLM providers (OpenAI, Anthropic)
- Allow users to choose AI vs rule-based in settings
- Show confidence scores for AI-generated content

## Support

For issues related to:
- **Gemini API**: [Google AI Studio Support](https://ai.google.dev/docs)
- **This Integration**: Check Django logs and GitHub issues
