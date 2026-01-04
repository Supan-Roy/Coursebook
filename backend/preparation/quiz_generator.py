"""
Rule-based quiz generation engine.

NO AI, ML, transformers, or LLMs.
Pure Python, deterministic, reliable.

Supported quiz types:
1. FILL_IN_THE_BLANK - Mask one keyword, use other nouns as distractors
2. MCQ (Definition-based) - Extract definition patterns
3. TRUE_FALSE - Convert sentences to T/F questions
"""

import re
import logging
import random
from collections import Counter
from typing import List, Dict, Tuple, Set, Optional

logger = logging.getLogger(__name__)


class QuizGenerator:
    """Rule-based quiz question generator."""
    
    # Common English stop words to skip as keywords
    STOPWORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
        "can", "with", "by", "from", "up", "about", "into", "through", "during",
        "before", "after", "above", "below", "between", "under", "over", "out",
        "as", "if", "than", "that", "this", "these", "those", "which", "who", "whom",
        "where", "when", "why", "how", "all", "each", "every", "both", "few", "more",
        "most", "other", "some", "such", "no", "nor", "not", "only", "same", "so",
        "too", "very", "just", "also", "well", "while", "it", "its", "it's",
        "he", "she", "they", "i", "you", "we", "me", "him", "her", "us", "them",
        "what", "which", "who", "whom", "whose", "my", "your", "his", "her",
        "our", "their", "been", "could", "should", "would", "there"
    }
    
    # Low-value sentence starters (avoid questions from these)
    LOW_VALUE_STARTERS = {
        "this", "these", "that", "those", "it", "such",
        "there", "however", "moreover", "therefore", "thus",
        "in conclusion", "in summary", "for example", "for instance"
    }
    
    # Parameters
    MIN_SENTENCE_LENGTH = 8  # minimum words in a sentence
    MAX_SENTENCE_LENGTH = 40  # maximum words in a sentence
    MIN_KEYWORD_LENGTH = 3  # minimum chars for a keyword
    MIN_DISTRACTORS = 2  # minimum wrong options for MCQ
    
    def __init__(self):
        """Initialize the quiz generator."""
        self.sentences: List[str] = []
        self.keyword_pool: List[str] = []
        self.definitions: List[Tuple[str, str]] = []
    
    def generate_quiz(
        self, text: str, max_questions: int = 10
    ) -> List[Dict]:
        """
        Generate a quiz from text.
        
        Args:
            text: Input academic text (can be multi-paragraph)
            max_questions: Target number of questions (will return fewer if not enough valid questions)
            
        Returns:
            List of question dicts with structure:
            {
                "type": "fill_blank" | "mcq" | "true_false",
                "question": str,
                "options": List[str],
                "answer": str
            }
        """
        if not text or not isinstance(text, str) or not text.strip():
            logger.warning("generate_quiz: Empty or invalid text")
            return []
        
        # Step 1: Extract and validate sentences
        self.sentences = self._extract_sentences(text)
        if not self.sentences:
            logger.warning("generate_quiz: No valid sentences extracted")
            return []
        
        logger.debug(f"Extracted {len(self.sentences)} sentences")
        
        # Step 2: Build keyword pool for distractors
        self.keyword_pool = self._build_keyword_pool(self.sentences)
        if not self.keyword_pool:
            logger.warning("generate_quiz: No keywords extracted")
            return []
        
        logger.debug(f"Built keyword pool: {len(self.keyword_pool)} keywords")
        
        # Step 3: Extract definition patterns
        self.definitions = self._extract_definitions(self.sentences)
        logger.debug(f"Extracted {len(self.definitions)} definitions")
        
        questions = []
        
        # Step 4: Generate questions in priority order
        # Primary: Fill-in-the-blank (most reliable)
        fill_blank = self._generate_fill_blank_questions(
            max(1, max_questions // 2)
        )
        questions.extend(fill_blank)
        logger.debug(f"Generated {len(fill_blank)} fill-blank questions")
        
        # Secondary: Definition-based MCQs
        if len(questions) < max_questions:
            definitions = self._generate_definition_questions(
                max_questions - len(questions)
            )
            questions.extend(definitions)
            logger.debug(f"Generated {len(definitions)} definition questions")
        
        # Fallback: True/False (always safe)
        if len(questions) < max_questions:
            tf = self._generate_true_false_questions(
                max_questions - len(questions)
            )
            questions.extend(tf)
            logger.debug(f"Generated {len(tf)} true/false questions")
        
        return questions[:max_questions]
    
    def _extract_sentences(self, text: str) -> List[str]:
        """
        Extract and filter sentences from text.
        
        Filters:
        - Word count (8-40 words)
        - Low-value starters
        - Empty or malformed sentences
        - Structured prefixes (numbers, bullets, etc.)
        """
        # Split on sentence boundaries
        raw = re.split(r'[.!?]+', text)
        
        sentences = []
        for sent in raw:
            sent = sent.strip()
            if not sent:
                continue
            
            # Remove common structured prefixes: "1.", "Q1.", "- 1 -", etc.
            sent = re.sub(r'^[-–—]?\s*\d+[-–—]?\s*[-–—]?\s*[A-Z]{0,3}\s*[-–—]?\s*', '', sent)
            sent = re.sub(r'^[A-Z]\)\s*', '', sent)  # Remove "A) ", "B) "
            sent = re.sub(r'^\(?[a-z]\)\s*', '', sent)  # Remove "a) ", "(b) "
            sent = re.sub(r'^[•●○■□▪▫]\s*', '', sent)  # Remove bullet points
            sent = sent.strip()
            
            if not sent:
                continue
            
            # Skip sentences that are just definitions/labels
            if ':' in sent[:20] and len(sent.split(':')[0].split()) <= 3:
                # This is likely a definition like "Hypothesis: something"
                # Split and use the part after colon
                parts = sent.split(':', 1)
                if len(parts) == 2 and len(parts[1].strip()) > 20:
                    sent = parts[1].strip()
            
            words = sent.split()
            
            # Filter by length
            if len(words) < self.MIN_SENTENCE_LENGTH:
                continue
            if len(words) > self.MAX_SENTENCE_LENGTH:
                continue
            
            # Filter by low-value starters
            first_words = ' '.join(words[:2]).lower()
            skip = False
            for starter in self.LOW_VALUE_STARTERS:
                if first_words.startswith(starter):
                    skip = True
                    break
            if skip:
                continue
            
            # Must have at least some alphabetic content
            if sum(1 for c in sent if c.isalpha()) < 20:
                continue
            
            sentences.append(sent)
        
        return sentences
    
    def _build_keyword_pool(self, sentences: List[str]) -> List[str]:
        """
        Extract nouns and keywords for use as distractors.
        
        Heuristic: Words that are capitalized (likely proper nouns/important terms)
        or longer common words not in stopwords.
        """
        keywords = []
        
        for sent in sentences:
            words = sent.split()
            for i, word in enumerate(words):
                # Remove punctuation
                clean = re.sub(r'[^\w]', '', word)
                
                # Skip short words
                if len(clean) < self.MIN_KEYWORD_LENGTH:
                    continue
                
                # Skip stopwords
                if clean.lower() in self.STOPWORDS:
                    continue
                
                # Include capitalized words OR important-sounding lowercase words
                if len(clean) > 0:
                    # Always include if mid-sentence and capitalized (proper noun)
                    if i > 0 and clean[0].isupper():
                        keywords.append(clean)
                    # Include first-word capitals if they appear capitalized elsewhere
                    elif i == 0 and clean[0].isupper():
                        appears_mid_sentence = any(
                            w.strip('.,!?;:') == clean
                            for s in sentences 
                            for j, w in enumerate(s.split()) 
                            if j > 0
                        )
                        if appears_mid_sentence:
                            keywords.append(clean)
                    # Also include longer lowercase words as potential important terms
                    elif len(clean) >= 6:
                        keywords.append(clean)
        
        # Return unique keywords, most common first
        counter = Counter(keywords)
        return [kw for kw, _ in counter.most_common(100)]
    
    def _generate_fill_blank_questions(self, max_questions: int) -> List[Dict]:
        """
        Generate FILL_IN_THE_BLANK questions.
        
        Process:
        1. Find sentence with extractable keywords
        2. Mask one keyword with "_____"
        3. Create distractors from keyword pool
        4. Validate and return
        """
        questions = []
        used_sentences = set()
        
        for i, sent in enumerate(self.sentences):
            if len(questions) >= max_questions:
                break
            
            if i in used_sentences:
                continue
            
            # Extract keywords from this sentence
            sent_keywords = self._extract_keywords_from_sentence(sent)
            if not sent_keywords:
                continue
            
            # Pick the first keyword to mask
            masked_keyword = sent_keywords[0]
            
            # Create question by replacing keyword with blank
            # Use word boundary to avoid partial matches
            question = re.sub(
                r'\b' + re.escape(masked_keyword) + r'\b',
                "_____",
                sent,
                count=1
            )
            
            # Ensure the replacement actually happened
            if "_____" not in question:
                continue
            
            # Get distractors: keywords from pool, excluding correct answer
            distractors = [
                kw for kw in self.keyword_pool
                if kw != masked_keyword and len(kw) >= self.MIN_KEYWORD_LENGTH
            ][:self.MIN_DISTRACTORS + 1]
            
            if len(distractors) < self.MIN_DISTRACTORS:
                continue
            
            # Build options: shuffle for variety
            options = [masked_keyword] + distractors[:self.MIN_DISTRACTORS]
            random.shuffle(options)
            
            q_dict = {
                "type": "fill_blank",
                "question": question,
                "options": options,
                "answer": masked_keyword
            }
            
            if self._validate_question(q_dict):
                questions.append(q_dict)
                used_sentences.add(i)
        
        return questions
    
    def _extract_keywords_from_sentence(self, sent: str) -> List[str]:
        """Extract capitalized words (nouns) from a sentence."""
        words = sent.split()
        keywords = []
        
        for i, word in enumerate(words):
            clean = re.sub(r'[^\w]', '', word)
            
            # Must be capitalized and not a stopword
            if (len(clean) >= self.MIN_KEYWORD_LENGTH and
                clean[0].isupper() and
                clean.lower() not in self.STOPWORDS):
                # Skip first word unless it's clearly a proper noun/technical term
                if i == 0 and clean.lower() in ['the', 'a', 'an', 'in', 'on', 'at', 'to']:
                    continue
                keywords.append(clean)
        
        # Prioritize longer, more specific keywords
        keywords.sort(key=lambda k: len(k), reverse=True)
        
        return keywords
    
    def _extract_definitions(self, sentences: List[str]) -> List[Tuple[str, str]]:
        """
        Extract definition patterns from sentences.
        
        Patterns:
        - "X is defined as Y"
        - "X refers to Y"
        - "X is Y"
        """
        definitions = []
        
        patterns = [
            (r'(\w+)\s+is\s+(?:defined\s+)?as\s+(.+?)(?:[.!?]|$)', 2),
            (r'(\w+)\s+refers\s+to\s+(.+?)(?:[.!?]|$)', 2),
            (r'(\w+)\s+is\s+([a-z].+?)(?:[.!?]|$)', 2),
        ]
        
        for sent in sentences:
            for pattern, groups in patterns:
                matches = re.finditer(pattern, sent, re.IGNORECASE)
                for match in matches:
                    if len(match.groups()) >= groups:
                        term = match.group(1).strip()
                        definition = match.group(2).strip()
                        
                        # Clean definition
                        definition = re.sub(r'^(is|was|are)\s+', '', definition, flags=re.IGNORECASE)
                        definition = re.sub(r'[.!?]+$', '', definition).strip()
                        
                        # Validate
                        if (term and definition and
                            len(definition) > 10 and
                            len(term) > 1):
                            definitions.append((term, definition))
        
        return definitions
    
    def _generate_definition_questions(self, max_questions: int) -> List[Dict]:
        """
        Generate MCQ questions based on extracted definitions.
        
        Question: "What is X?"
        Correct answer: definition of X
        Distractors: definitions of other terms
        """
        questions = []
        
        for i, (term, definition) in enumerate(self.definitions):
            if len(questions) >= max_questions:
                break
            
            question = f"What is {term}?"
            
            # Find wrong options from other definitions
            wrong_defs = [
                d for j, (t, d) in enumerate(self.definitions)
                if i != j and d != definition
            ][:self.MIN_DISTRACTORS]
            
            if len(wrong_defs) < self.MIN_DISTRACTORS:
                continue
            
            # Build options and shuffle
            options = [definition] + wrong_defs
            random.shuffle(options)
            
            q_dict = {
                "type": "mcq",
                "question": question,
                "options": options,
                "answer": definition
            }
            
            if self._validate_question(q_dict):
                questions.append(q_dict)
        
        return questions
    
    def _generate_true_false_questions(self, max_questions: int) -> List[Dict]:
        """
        Generate TRUE_FALSE questions from sentences.
        
        Simple and always safe: convert any sentence to a T/F question.
        Question = sentence, Answer = True (by definition, all are true)
        """
        questions = []
        used_indices = set()
        
        for i, sent in enumerate(self.sentences):
            if len(questions) >= max_questions:
                break
            
            if i in used_indices:
                continue
            
            # Sentence becomes the question
            question = sent
            
            q_dict = {
                "type": "true_false",
                "question": question,
                "options": ["True", "False"],
                "answer": "True"
            }
            
            if self._validate_question(q_dict):
                questions.append(q_dict)
                used_indices.add(i)
        
        return questions
    
    def _validate_question(self, q_dict: Dict) -> bool:
        """
        Validate a question before including it.
        
        Checks:
        - All required fields present
        - Question text non-empty
        - Options non-empty list
        - Answer in options
        - No duplicate options
        - Minimum options requirement (2 for T/F, 3 for MCQ)
        """
        # Check required fields
        required_fields = {"type", "question", "options", "answer"}
        if not all(field in q_dict for field in required_fields):
            logger.debug(f"Invalid question: missing fields")
            return False
        
        # Check types
        if not isinstance(q_dict["type"], str):
            return False
        if not isinstance(q_dict["question"], str):
            return False
        if not isinstance(q_dict["options"], list):
            return False
        
        # Check non-empty question
        if not q_dict["question"].strip():
            logger.debug("Invalid question: empty question text")
            return False
        
        # Check non-empty options
        if not q_dict["options"] or len(q_dict["options"]) < 2:
            logger.debug("Invalid question: fewer than 2 options")
            return False
        
        # Check answer in options
        if q_dict["answer"] not in q_dict["options"]:
            logger.debug(f"Invalid question: answer '{q_dict['answer']}' not in options")
            return False
        
        # Check no duplicates
        if len(set(q_dict["options"])) != len(q_dict["options"]):
            logger.debug("Invalid question: duplicate options")
            return False
        
        # Type-specific validation
        if q_dict["type"] == "true_false":
            if len(q_dict["options"]) != 2:
                logger.debug("Invalid true/false: wrong number of options")
                return False
        
        if q_dict["type"] in ["mcq", "definition"]:
            if len(q_dict["options"]) < 3:
                logger.debug("Invalid MCQ: fewer than 3 options")
                return False
        
        return True


# Module-level interface
def generate_quiz(text: str, max_questions: int = 10) -> List[Dict]:
    """
    Generate a quiz from text.
    
    Args:
        text: Input academic text
        max_questions: Target number of questions
        
    Returns:
        List of valid question dictionaries
    """
    try:
        generator = QuizGenerator()
        questions = generator.generate_quiz(text, max_questions)
        logger.info(f"Generated {len(questions)} quiz questions from text")
        return questions
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return []
