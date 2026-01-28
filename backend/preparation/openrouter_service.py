"""
OpenRouter AI Service for quiz and notes generation.
Provides simple interface matching the old Gemini service.
"""

import os
import logging
import requests
from typing import Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenRouterService:
    """Generate quizzes and study notes using OpenRouter API."""
    
    def __init__(self):
        """Initialize OpenRouter service with API key."""
        self.api_key = os.environ.get('OPENROUTER_API_KEY', '')
        
        if not self.api_key:
            self.api_key = getattr(settings, 'OPENROUTER_API_KEY', '')
        
        self.enabled = bool(self.api_key)
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "meta-llama/llama-3.2-3b-instruct:free"
        self.temperature = 0.3
        self.top_p = 0.9
        self.max_tokens = 600

        # Referer and title must match what you registered at OpenRouter
        self.http_referer = os.environ.get(
            "OPENROUTER_HTTP_REFERER",
            getattr(settings, "OPENROUTER_HTTP_REFERER", "http://localhost:8000"),
        )
        self.app_title = os.environ.get(
            "OPENROUTER_APP_TITLE",
            getattr(settings, "OPENROUTER_APP_TITLE", "Coursebook"),
        )
        
        if self.enabled:
            logger.info("OpenRouter service initialized successfully")
        else:
            logger.warning("OpenRouter API key not configured")
    
    def generate_summary(
        self,
        text: str,
        max_words: int = 1500,
        style: str = "detailed"
    ) -> Dict:
        """
        Generate study notes from text using OpenRouter.
        
        Args:
            text: Source material
            max_words: Maximum output words
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
                'error': 'OpenRouter API not configured'
            }
        
        try:
            # Build appropriate prompt
            if style == "bullet_points":
                math_example = "$E=mc^2$"
                block_math_example = "$$\\int_0^{\\infty} e^{-t} dt = 1$$"
                prompt = f"""Create comprehensive study notes from the following material in Markdown format with bullet points.

{text}

Instructions:
- Return the notes ONLY in Markdown format. Do NOT add any intro like "Here are notes" or a closing sentence.
- Use Markdown formatting: ## for section headers, - or * for bullet points, **bold** for emphasis, *italic* for emphasis.
- Math equations: Use LaTeX syntax with $...$ for inline math (e.g., {math_example}) and $$...$$ for block equations (e.g., {block_math_example}).
- Include key concepts, definitions, main ideas, examples, critical points, and relationships.
- Structure with clear sections using ## headers.

Notes:"""
            elif style == "concise":
                math_example = "$E=mc^2$"
                block_math_example = "$$\\int_0^{\\infty} e^{-t} dt = 1$$"
                prompt = f"""Create focused study notes from the following material (around {max_words} words) in Markdown format.

{text}

Instructions:
- Return the notes ONLY in Markdown format. Do NOT add any intro or closing sentence.
- Use Markdown formatting: ## for section headers, **bold** for key terms, *italic* for emphasis, - for lists.
- Math equations: Use LaTeX syntax with $...$ for inline math (e.g., {math_example}) and $$...$$ for block equations (e.g., {block_math_example}).
- Cover main concepts, definitions, and essential points to remember.
- Keep it concise but informative with clear structure.

Notes:"""
            else:  # detailed
                math_example = "$E=mc^2$"
                block_math_example = "$$\\int_0^{\\infty} e^{-t} dt = 1$$"
                prompt = f"""Create comprehensive, detailed study notes from the following material in Markdown format.

{text}

Instructions:
- Return the notes ONLY in Markdown format. Do NOT include any leading phrase (e.g., "Here are notes") or closing sentence.
- Use Markdown formatting:
  * ## for main section headers (e.g., ## Key Concepts)
  * ### for subsections
  * **bold** for important terms and definitions
  * *italic* for emphasis
  * - or * for bullet points
  * Numbered lists (1., 2., 3.) for sequences
  * Math equations: Use LaTeX syntax with $...$ for inline math (e.g., {math_example}) and $$...$$ for block equations (e.g., {block_math_example})
- Explain key concepts clearly and break down complex ideas.
- Provide context, definitions, relationships, critical points, examples, and logical structure.
- IMPORTANT: Provide a COMPLETE summary. Do not cut off mid-sentence or mid-section. Ensure all sections are fully explained.
- Aim for around {max_words} words; prioritize completeness and thoroughness over brevity.
- Structure content with clear sections and subsections.
- Make sure to cover ALL important points from the source material.

Notes:"""
            
            response = requests.post(
                url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": self.http_referer,
                    "X-Title": self.app_title,
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": self.temperature,
                    "top_p": self.top_p,
                    "max_tokens": self.max_tokens,
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                summary = result['choices'][0]['message']['content'].strip()
                
                # Check if response was truncated (OpenRouter may indicate this)
                finish_reason = result['choices'][0].get('finish_reason', '')
                if finish_reason == 'length':
                    logger.warning("OpenRouter response was truncated due to token limit")
                
                word_count = len(summary.split())
                
                logger.info(f"Generated summary: {word_count} words via OpenRouter (finish_reason: {finish_reason})")
                
                return {
                    'success': True,
                    'summary': summary,
                    'word_count': word_count,
                    'error': None
                }
            else:
                error_msg = response.text
                logger.error(
                    "OpenRouter error (status %s): %s",
                    response.status_code,
                    error_msg[:200],
                )
                return {
                    'success': False,
                    'summary': '',
                    'word_count': 0,
                    'error': f'Failed to generate notes: {error_msg[:100]}'
                }
                
        except Exception as e:
            logger.error(f"Exception in generate_summary: {e}")
            return {
                'success': False,
                'summary': '',
                'word_count': 0,
                'error': f'Error generating notes: {str(e)}'
            }
    
    def generate_quiz(
        self,
        text: str,
        num_questions: int = 10,
        difficulty: str = "medium"
    ) -> Dict:
        """
        Generate quiz questions using OpenRouter.
        
        Args:
            text: Source material
            num_questions: Number of questions
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
                'error': 'OpenRouter API not configured'
            }
        
        try:
            prompt = f"""Generate {num_questions} multiple-choice quiz questions from the following material. Difficulty: {difficulty}

{text}

Format each question as JSON:
[
  {{
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Why this answer is correct"
  }}
]

Generate only valid JSON array, no other text."""
            
            response = requests.post(
                url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": self.http_referer,
                    "X-Title": self.app_title,
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": self.temperature,
                    "top_p": self.top_p,
                    "max_tokens": self.max_tokens,
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result['choices'][0]['message']['content'].strip()
                
                # Parse JSON response
                try:
                    import json
                    # Try to extract JSON from response
                    start_idx = response_text.find('[')
                    end_idx = response_text.rfind(']') + 1
                    
                    if start_idx >= 0 and end_idx > start_idx:
                        json_str = response_text[start_idx:end_idx]
                        questions = json.loads(json_str)

                        # Normalize schema: ensure answer_index exists (integer)
                        normalized = []
                        for idx, q in enumerate(questions, start=1):
                            nq = dict(q)
                            # Use provided correct_answer if answer_index missing
                            if 'answer_index' not in nq and 'correct_answer' in nq:
                                try:
                                    nq['answer_index'] = int(nq['correct_answer'])
                                except Exception:
                                    nq['answer_index'] = None
                            # Ensure options list exists
                            if 'options' not in nq:
                                nq['options'] = []
                            # Set a stable id for grading
                            nq.setdefault('id', idx)
                            normalized.append(nq)

                        logger.info(f"Generated {len(normalized)} quiz questions via OpenRouter")
                        
                        return {
                            'success': True,
                            'questions': normalized[:num_questions],
                            'count': len(normalized),
                            'error': None
                        }
                except Exception as parse_error:
                    logger.error(f"Failed to parse quiz JSON: {parse_error}")
                
                return {
                    'success': False,
                    'questions': [],
                    'count': 0,
                    'error': 'Failed to parse quiz format'
                }
            else:
                error_msg = response.text
                logger.error(
                    "OpenRouter error (status %s): %s",
                    response.status_code,
                    error_msg[:200],
                )
                return {
                    'success': False,
                    'questions': [],
                    'count': 0,
                    'error': f'Failed to generate quiz: {error_msg[:100]}'
                }
                
        except Exception as e:
            logger.error(f"Exception in generate_quiz: {e}")
            return {
                'success': False,
                'questions': [],
                'count': 0,
                'error': f'Error generating quiz: {str(e)}'
            }


# Singleton instance
_openrouter_service = None


def get_openrouter_service() -> OpenRouterService:
    """Get or create OpenRouter service instance."""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service
