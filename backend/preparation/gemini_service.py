"""
Google Gemini API integration for Coursebook.

Provides high-quality AI-powered:
- Text summarization
- Quiz generation
- Content analysis

Free tier: 1,500 requests/day, 15 requests/minute
"""

import os
import logging
import google.generativeai as genai
from typing import Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize Gemini API with API key from settings."""
        api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
        if not api_key:
            logger.warning("GEMINI_API_KEY not found in settings or environment")
            self.enabled = False
            return
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
            logger.info("Gemini API initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {e}")
            self.enabled = False
    
    def generate_summary(
        self,
        text: str,
        max_words: int = 300,
        style: str = "concise"
    ) -> Dict:
        """
        Generate a summary using Gemini API.
        
        Args:
            text: Text to summarize
            max_words: Maximum words in summary
            style: Summary style (concise, detailed, bullet_points)
            
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
        
        try:
            # Build prompt based on style
            if style == "bullet_points":
                prompt = f"""Summarize the following text in clear bullet points (maximum {max_words} words total):

{text}

Provide a well-structured summary with:
- Key concepts and main ideas
- Important definitions
- Critical points to remember

Summary:"""
            elif style == "detailed":
                prompt = f"""Provide a comprehensive summary of the following text (maximum {max_words} words):

{text}

Include:
- Main concepts and ideas
- Important details and context
- Key takeaways

Summary:"""
            else:  # concise
                prompt = f"""Provide a concise, clear summary of the following text (maximum {max_words} words):

{text}

Focus on the most important information and key concepts.

Summary:"""
            
            # Generate summary
            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            word_count = len(summary.split())
            
            logger.info(f"Generated summary: {word_count} words")
            
            return {
                'success': True,
                'summary': summary,
                'word_count': word_count,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error generating summary with Gemini: {e}")
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': str(e)
            }
    
    def generate_quiz(
        self,
        text: str,
        num_questions: int = 10,
        difficulty: str = "medium"
    ) -> Dict:
        """
        Generate quiz questions using Gemini API.
        
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
            
            response = self.model.generate_content(prompt)
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
            
            logger.info(f"Generated {len(questions)} quiz questions")
            
            return {
                'success': True,
                'questions': questions,
                'count': len(questions),
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error generating quiz with Gemini: {e}")
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': str(e)
            }
    
    def _parse_quiz_response(self, text: str) -> List[Dict]:
        """Parse Gemini's quiz response into structured format."""
        questions = []
        lines = text.split('\n')
        
        current_question = None
        current_options = []
        current_answer = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Question line (Q1:, Q2:, etc.)
            if line.startswith('Q') and ':' in line:
                # Save previous question if exists
                if current_question and current_options and current_answer:
                    questions.append({
                        'type': 'mcq',
                        'question': current_question,
                        'options': current_options,
                        'answer': current_answer
                    })
                
                # Start new question
                current_question = line.split(':', 1)[1].strip()
                current_options = []
                current_answer = None
            
            # Option line (A), B), C), D))
            elif line and line[0] in ['A', 'B', 'C', 'D'] and (')' in line or '.' in line):
                # Extract option text (after A), B), etc.)
                option_text = line.split(')', 1)[-1].split('.', 1)[-1].strip()
                current_options.append(option_text)
            
            # Answer line
            elif line.startswith('ANSWER:') or line.startswith('Answer:'):
                answer_letter = line.split(':', 1)[1].strip()[0].upper()
                # Convert letter to option index
                if answer_letter in ['A', 'B', 'C', 'D']:
                    answer_index = ord(answer_letter) - ord('A')
                    if answer_index < len(current_options):
                        current_answer = current_options[answer_index]
        
        # Add last question
        if current_question and current_options and current_answer:
            questions.append({
                'type': 'mcq',
                'question': current_question,
                'options': current_options,
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
