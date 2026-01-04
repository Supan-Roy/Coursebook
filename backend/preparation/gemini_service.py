"""
Google Gemini API integration for Coursebook.

Provides high-quality AI-powered:
- Text summarization
- Quiz generation
- Content analysis

Free tier: 1,500 requests/day, 15 requests/minute
Implements rate limiting and quota management to avoid exceeding limits.
"""

import os
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google.generativeai not installed")


class RateLimiter:
    """Manages API rate limiting to prevent quota issues."""
    
    REQUESTS_PER_DAY = 1000  # Conservative limit (actual is 1500/day)
    REQUESTS_PER_MINUTE = 10  # Conservative limit (actual is 15/min)
    
    @staticmethod
    def get_cache_key(key_type):
        """Generate cache key for rate limiting."""
        return f"gemini_rate_{key_type}_{datetime.now().strftime('%Y%m%d')}"
    
    @staticmethod
    def check_day_limit():
        """Check if daily quota is available."""
        cache_key = RateLimiter.get_cache_key('day')
        count = cache.get(cache_key, 0)
        
        if count >= RateLimiter.REQUESTS_PER_DAY:
            logger.warning(f"Daily API quota exceeded: {count}/{RateLimiter.REQUESTS_PER_DAY}")
            return False
        
        return True
    
    @staticmethod
    def check_minute_limit():
        """Check if minute quota is available."""
        cache_key = RateLimiter.get_cache_key('minute')
        count = cache.get(cache_key, 0)
        
        if count >= RateLimiter.REQUESTS_PER_MINUTE:
            logger.warning(f"Per-minute API quota exceeded: {count}/{RateLimiter.REQUESTS_PER_MINUTE}")
            return False
        
        return True
    
    @staticmethod
    def increment_counters():
        """Increment request counters."""
        # Daily counter
        day_key = RateLimiter.get_cache_key('day')
        cache.set(day_key, cache.get(day_key, 0) + 1, 86400)
        
        # Minute counter
        minute_key = RateLimiter.get_cache_key('minute')
        cache.set(minute_key, cache.get(minute_key, 0) + 1, 60)


class GeminiService:
    """Service for interacting with Google Gemini API with rate limiting."""
    
    def __init__(self):
        """Initialize Gemini API with API keys from settings (with rotation support)."""
        if not GENAI_AVAILABLE:
            logger.warning("google.generativeai not installed - AI features disabled")
            self.enabled = False
            return
        
        # Support multiple keys for quota rotation
        self.api_keys = getattr(settings, 'GEMINI_API_KEYS', [])
        
        # Fallback to single key if multiple keys not configured
        if not self.api_keys:
            single_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
            if single_key:
                self.api_keys = [single_key]
        
        if not self.api_keys:
            logger.warning("No Gemini API keys found in settings or environment")
            self.enabled = False
            return
        
        self.current_key_index = 0
        
        try:
            # Configure with first key
            genai.configure(api_key=self.api_keys[0])
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            self.enabled = True
            logger.info(f"Gemini API initialized with {len(self.api_keys)} key(s)")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {e}")
            self.enabled = False
    
    def _rotate_key(self):
        """Rotate to next API key."""
        if len(self.api_keys) <= 1:
            return
        
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        current_key = self.api_keys[self.current_key_index]
        try:
            genai.configure(api_key=current_key)
            logger.info(f"Rotated to API key {self.current_key_index + 1}/{len(self.api_keys)}")
        except Exception as e:
            logger.error(f"Failed to rotate API key: {e}")
    
    def generate_summary(
        self,
        text: str,
        max_words: int = 1500,
        style: str = "detailed"
    ) -> Dict:
        """
        Generate detailed study notes using Gemini API with rate limiting.
        
        Args:
            text: Text to create notes from
            max_words: Maximum words in notes (default 1500 for detailed explanation)
            style: Notes style (detailed, concise, bullet_points)
            
        Returns:
            {
                'success': bool,
                'summary': str,
                'word_count': int,
                'error': Optional[str]
            }
        """
        if not self.enabled:
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': 'Gemini API not configured'
            }
        
        # Check rate limits
        if not RateLimiter.check_day_limit():
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': 'Daily API quota exceeded. Will use fallback generation.'
            }
        
        if not RateLimiter.check_minute_limit():
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': 'Per-minute API quota exceeded. Please try again in a moment.'
            }
        
        try:
            # Build prompt based on style
            if style == "bullet_points":
                prompt = f"""Create comprehensive study notes from the following material in bullet point format:

{text}

Create detailed, well-organized notes that include:
- All key concepts with clear explanations
- Important definitions and terminology
- Main ideas and supporting details
- Examples and applications
- Critical points to remember
- Relationships between concepts

Make the notes thorough and educational, as if explaining the material to a student who wants to deeply understand the topic.

Notes:"""
            elif style == "concise":
                prompt = f"""Create focused study notes from the following material (around {max_words} words):

{text}

Provide clear, organized notes covering:
- Main concepts and key ideas
- Important definitions
- Essential points to remember

Keep it concise but informative.

Notes:"""
            else:  # detailed - default
                prompt = f"""Create comprehensive, detailed study notes from the following material. Explain everything thoroughly as if teaching the content:

{text}

Your notes should:
- Explain all key concepts in detail with clear, easy-to-understand language
- Break down complex ideas into simpler components
- Provide context and background information where helpful
- Include important definitions and terminology
- Explain how different concepts relate to each other
- Highlight critical points and important takeaways
- Use examples to illustrate concepts when applicable
- Organize information logically with clear structure

Write the notes as if you're explaining this material to a student who wants to fully understand the topic. Be thorough, educational, and clear. Aim for around {max_words} words but prioritize completeness and clarity over strict word count.

Notes:"""
            
            # Try generating with key rotation on quota errors
            for attempt in range(len(self.api_keys)):
                try:
                    response = self.model.generate_content(prompt, request_options={"timeout": 30})
                    summary = response.text.strip()
                    word_count = len(summary.split())
                    
                    # Increment rate limit counters only on success
                    RateLimiter.increment_counters()
                    
                    logger.info(f"Generated notes: {word_count} words")
                    
                    return {
                        'success': True,
                        'summary': summary,
                        'word_count': word_count,
                        'error': None
                    }
                    
                except Exception as e:
                    error_msg = str(e)
                    logger.warning(f"Error on attempt {attempt + 1}/{len(self.api_keys)}: {error_msg}")
                    
                    # Check if it's a quota error
                    if "429" in error_msg or "quota" in error_msg.lower():
                        if attempt < len(self.api_keys) - 1:
                            logger.info(f"Quota exceeded, rotating to next API key...")
                            self._rotate_key()
                            continue
                        else:
                            logger.warning("All API keys exceeded quota")
                            return {
                                'success': False,
                                'summary': '',
                                'word_count': 0,
                                'error': 'All API quotas exceeded. Using fallback generation method.'
                            }
                    else:
                        return {
                            'success': False,
                            'summary': '',
                            'word_count': 0,
                            'error': error_msg
                        }
            
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': 'Failed to generate notes with all available keys'
            }
        except Exception as outer_e:
            logger.error(f"Outer exception in generate_summary: {outer_e}")
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': f'Error generating notes: {str(outer_e)}'
            }
    
    def generate_quiz(
        self,
        text: str,
        num_questions: int = 10,
        difficulty: str = "medium"
    ) -> Dict:
        """
        Generate quiz questions using Gemini API with rate limiting.
        
        Args:
            text: Source material for quiz
            num_questions: Number of questions to generate
            difficulty: Question difficulty (easy, medium, hard)
            
        Returns:
            {
                'success': bool,
                'questions': List[Dict],
                'count': int,
                'error': Optional[str]
            }
        """
        if not self.enabled:
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': 'Gemini API not configured'
            }
        
        # Check rate limits
        if not RateLimiter.check_day_limit():
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': 'Daily API quota exceeded. Will use fallback generation.'
            }
        
        if not RateLimiter.check_minute_limit():
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': 'Per-minute API quota exceeded. Please try again in a moment.'
            }
        
        try:
            prompt = f"""Generate {num_questions} high-quality multiple-choice questions from the following text.

REQUIREMENTS:
1. Questions should be {difficulty} difficulty
2. Each question must have exactly 4 options (A, B, C, D)
3. Mark the correct answer clearly
4. Mix question types: factual recall, conceptual understanding, application
5. Avoid ambiguous or trick questions
6. Questions should test actual understanding, not just memorization

TEXT TO ANALYZE:
{text}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

Q1: [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
ANSWER: [A/B/C/D]

Q2: [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
ANSWER: [A/B/C/D]

[Continue for all {num_questions} questions]

Generate the questions now:"""
            
            # Try generating with key rotation on quota errors
            for attempt in range(len(self.api_keys)):
                try:
                    response = self.model.generate_content(prompt, request_options={"timeout": 30})
                    quiz_text = response.text.strip()
                    
                    # Parse the response into structured questions
                    questions = self._parse_quiz_response(quiz_text)
                    
                    if not questions:
                        return {
                            'success': False,
                            'questions': [],
                            'count': 0,
                            'error': 'Failed to parse quiz questions'
                        }
                    
                    # Increment rate limit counters only on success
                    RateLimiter.increment_counters()
                    
                    logger.info(f"Generated {len(questions)} quiz questions")
                    
                    return {
                        'success': True,
                        'questions': questions,
                        'count': len(questions),
                        'error': None
                    }
                    
                except Exception as e:
                    error_msg = str(e)
                    logger.warning(f"Error on attempt {attempt + 1}/{len(self.api_keys)}: {error_msg}")
                    
                    # Check if it's a quota error
                    if "429" in error_msg or "quota" in error_msg.lower():
                        if attempt < len(self.api_keys) - 1:
                            logger.info(f"Quota exceeded, rotating to next API key...")
                            self._rotate_key()
                            continue
                        else:
                            logger.warning("All API keys exceeded quota")
                            return {
                                'success': False,
                                'questions': [],
                                'count': 0,
                                'error': 'All API quotas exceeded. Using fallback generation method.'
                            }
                    else:
                        return {
                            'success': False,
                            'questions': [],
                            'count': 0,
                            'error': error_msg
                        }
            
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': 'Failed to generate quiz with all available keys'
            }
        except Exception as outer_e:
            logger.error(f"Outer exception in generate_quiz: {outer_e}")
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': f'Error generating quiz: {str(outer_e)}'
            }
    
    def _parse_quiz_response(self, text: str) -> List[Dict]:
        """Parse Gemini's quiz response into structured format."""
        questions = []
        lines = text.split('\n')
        
        current_question = None
        current_options = {}  # Dict to store options with their letters
        current_answer = None
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            i += 1
            
            if not line:
                continue
            
            # Question line (Q1:, Q2:, etc.)
            if line.startswith('Q') and ':' in line:
                # Save previous question if exists
                if current_question and current_options and current_answer:
                    options_list = [current_options.get(letter, '') for letter in ['A', 'B', 'C', 'D'] if current_options.get(letter)]
                    if current_answer in options_list:
                        questions.append({
                            'type': 'mcq',
                            'question': current_question,
                            'options': options_list,
                            'answer': current_answer
                        })
                
                # Start new question
                current_question = line.split(':', 1)[1].strip()
                current_options = {}
                current_answer = None
            
            # Option line (A), B), C), D) or A] B] etc.)
            elif len(line) > 2 and line[0] in ['A', 'B', 'C', 'D'] and (')' in line or ']' in line):
                letter = line[0]
                # Extract option text (everything after the letter and punctuation)
                option_text = line[1:].lstrip('):] ').strip()
                if option_text:
                    current_options[letter] = option_text
            
            # Answer line (can be "ANSWER: C" or "Answer: C")
            elif 'ANSWER' in line.upper() and ':' in line:
                parts = line.split(':', 1)
                if len(parts) > 1:
                    answer_part = parts[1].strip()
                    # Extract the first letter that's A, B, C, or D
                    for char in answer_part:
                        if char in ['A', 'B', 'C', 'D']:
                            answer_letter = char
                            # Get the answer text from current_options
                            if answer_letter in current_options:
                                current_answer = current_options[answer_letter]
                            break
        
        # Add last question
        if current_question and current_options and current_answer:
            options_list = [current_options.get(letter, '') for letter in ['A', 'B', 'C', 'D'] if current_options.get(letter)]
            if current_answer in options_list:
                questions.append({
                    'type': 'mcq',
                    'question': current_question,
                    'options': options_list,
                    'answer': current_answer
                })
        
        return questions


# Global instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """Get or create global Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
