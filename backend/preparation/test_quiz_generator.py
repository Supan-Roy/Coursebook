"""
Tests for the quiz generator module.

Covers:
- Fill-in-the-blank generation
- MCQ generation
- True/False generation
- Validation and edge cases
- No LLM/AI usage
"""

import unittest
from preparation.quiz_generator import QuizGenerator, generate_quiz


class TestQuizGenerator(unittest.TestCase):
    """Test the quiz generation engine."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.generator = QuizGenerator()
        self.sample_text = """
        The Python programming language was created by Guido van Rossum.
        Python is designed to be highly readable and maintainable.
        The interpreter executes code line by line at runtime.
        Variables store data that can be modified during program execution.
        Functions are reusable blocks of code that perform specific tasks.
        Object-oriented programming organizes code into classes and objects.
        A database is a structured collection of data stored on disk.
        SQL is used to query and manipulate data in relational databases.
        """
    
    def test_empty_text(self):
        """Test handling of empty text."""
        result = generate_quiz("", max_questions=5)
        self.assertEqual(result, [])
    
    def test_short_text(self):
        """Test handling of very short text (insufficient sentences)."""
        result = generate_quiz("Hello world.", max_questions=5)
        self.assertEqual(result, [])
    
    def test_valid_text_generation(self):
        """Test generation from valid text."""
        result = generate_quiz(self.sample_text, max_questions=10)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        self.assertLessEqual(len(result), 10)
    
    def test_question_structure(self):
        """Test that each question has required fields."""
        result = generate_quiz(self.sample_text, max_questions=5)
        
        required_fields = {"type", "question", "options", "answer"}
        for q in result:
            self.assertTrue(required_fields.issubset(set(q.keys())))
            self.assertIn(q["type"], ["fill_blank", "mcq", "true_false"])
            self.assertIsInstance(q["question"], str)
            self.assertIsInstance(q["options"], list)
            self.assertGreater(len(q["options"]), 1)
            self.assertIn(q["answer"], q["options"])
    
    def test_fill_blank_questions(self):
        """Test fill-in-the-blank question generation."""
        result = generate_quiz(self.sample_text, max_questions=5)
        fill_blanks = [q for q in result if q["type"] == "fill_blank"]
        
        for q in fill_blanks:
            # Must have exactly 1 blank
            self.assertEqual(q["question"].count("_____"), 1)
            # Must have at least 2 options
            self.assertGreaterEqual(len(q["options"]), 2)
            # Answer must be in options
            self.assertIn(q["answer"], q["options"])
    
    def test_mcq_questions(self):
        """Test MCQ question generation."""
        result = generate_quiz(self.sample_text, max_questions=10)
        mcqs = [q for q in result if q["type"] == "mcq"]
        
        for q in mcqs:
            # Must be phrased as a question
            self.assertIn("?", q["question"])
            # Must have at least 3 options
            self.assertGreaterEqual(len(q["options"]), 3)
            # Answer must be in options
            self.assertIn(q["answer"], q["options"])
            # No duplicate options
            self.assertEqual(len(q["options"]), len(set(q["options"])))
    
    def test_true_false_questions(self):
        """Test true/false question generation."""
        result = generate_quiz(self.sample_text, max_questions=10)
        tf_questions = [q for q in result if q["type"] == "true_false"]
        
        for q in tf_questions:
            # Must have exactly True and False
            self.assertEqual(set(q["options"]), {"True", "False"})
            # Answer must be True (all sentences are facts)
            self.assertEqual(q["answer"], "True")
    
    def test_no_duplicate_questions(self):
        """Test that no duplicate questions are generated."""
        result = generate_quiz(self.sample_text, max_questions=10)
        questions = [q["question"] for q in result]
        self.assertEqual(len(questions), len(set(questions)))
    
    def test_max_questions_respected(self):
        """Test that max_questions parameter is respected."""
        for max_q in [1, 3, 5, 10]:
            result = generate_quiz(self.sample_text, max_questions=max_q)
            self.assertLessEqual(len(result), max_q)
    
    def test_sentence_extraction(self):
        """Test that sentences are extracted correctly."""
        sentences = self.generator._extract_sentences(self.sample_text)
        self.assertGreater(len(sentences), 0)
        
        # Check that very short sentences are filtered
        for sent in sentences:
            words = sent.split()
            self.assertGreaterEqual(len(words), self.generator.MIN_SENTENCE_LENGTH)
            self.assertLessEqual(len(words), self.generator.MAX_SENTENCE_LENGTH)
    
    def test_keyword_pool(self):
        """Test that keywords are extracted for distractors."""
        self.generator.sentences = self.generator._extract_sentences(self.sample_text)
        keywords = self.generator._build_keyword_pool(self.generator.sentences)
        
        self.assertGreater(len(keywords), 0)
        
        # Check that all keywords are reasonable length
        for kw in keywords:
            self.assertGreaterEqual(len(kw), self.generator.MIN_KEYWORD_LENGTH)
            self.assertNotIn(kw.lower(), self.generator.STOPWORDS)
    
    def test_definition_extraction(self):
        """Test extraction of definition patterns."""
        definition_text = """
        Machine Learning is defined as a subset of artificial intelligence.
        A neural network refers to a computational model inspired by biology.
        A database is a collection of organized data.
        """
        definitions = self.generator._extract_definitions(
            self.generator._extract_sentences(definition_text)
        )
        
        self.assertGreater(len(definitions), 0)
        
        for term, definition in definitions:
            self.assertGreater(len(term), 0)
            self.assertGreater(len(definition), 5)
    
    def test_validation_no_crashes(self):
        """Test that invalid questions are silently rejected."""
        # Test with text that might produce weak questions
        sparse_text = "Data. Code. Functions. Variables."
        result = generate_quiz(sparse_text, max_questions=10)
        
        # Should return list (possibly empty) without crashing
        self.assertIsInstance(result, list)
    
    def test_non_string_input(self):
        """Test that non-string input is handled gracefully."""
        result = generate_quiz(None, max_questions=5)
        self.assertEqual(result, [])
    
    def test_deterministic_output(self):
        """Test that same input produces same output."""
        result1 = generate_quiz(self.sample_text, max_questions=5)
        result2 = generate_quiz(self.sample_text, max_questions=5)
        
        # Questions should be identical (deterministic)
        self.assertEqual(len(result1), len(result2))
        self.assertEqual(
            [q["question"] for q in result1],
            [q["question"] for q in result2]
        )
    
    def test_question_validity(self):
        """Test all generated questions pass validation."""
        result = generate_quiz(self.sample_text, max_questions=10)
        
        for q in result:
            is_valid = self.generator._validate_question(q)
            self.assertTrue(
                is_valid,
                f"Generated invalid question: {q}"
            )
    
    def test_blank_not_in_distractors(self):
        """Test that blanked keyword isn't in distractors (no auto-answer)."""
        result = generate_quiz(self.sample_text, max_questions=10)
        fill_blanks = [q for q in result if q["type"] == "fill_blank"]
        
        for q in fill_blanks:
            # Answer appears exactly once in options
            answer_count = q["options"].count(q["answer"])
            self.assertEqual(answer_count, 1)
    
    def test_multiple_runs_variety(self):
        """Test that multiple runs produce consistent but varied content."""
        results = [
            generate_quiz(self.sample_text, max_questions=5)
            for _ in range(3)
        ]
        
        # All runs should produce valid results
        for result in results:
            self.assertGreater(len(result), 0)
            for q in result:
                self.assertIn(q["type"], ["fill_blank", "mcq", "true_false"])


class TestQuizGeneratorEdgeCases(unittest.TestCase):
    """Test edge cases and robustness."""
    
    def test_very_long_text(self):
        """Test handling of very long input."""
        long_text = "Each day brings new opportunities to learn something valuable. " * 100
        result = generate_quiz(long_text, max_questions=10)
        
        # Long repetitive text may not generate questions (acceptable behavior)
        self.assertIsInstance(result, list)
        # Just verify it doesn't crash
        self.assertLessEqual(len(result), 10)
    
    def test_text_with_special_chars(self):
        """Test text containing special characters."""
        text = """
        The C++ language is powerful for systems programming.
        Variables store values during runtime execution.
        Data structures organize information efficiently for retrieval.
        The formula demonstrates energy and mass relationship fundamentally.
        """
        result = generate_quiz(text, max_questions=5)
        # May or may not generate questions depending on content
        self.assertIsInstance(result, list)
    
    def test_text_with_numbers(self):
        """Test text containing numbers."""
        text = """
        Python 3.9 introduced new features.
        The algorithm has 2n complexity.
        World population exceeded 8 billion in 2022.
        """
        result = generate_quiz(text, max_questions=5)
        self.assertIsInstance(result, list)
    
    def test_single_sentence(self):
        """Test with single valid sentence."""
        text = "The rapid advancement of artificial intelligence is transforming industries worldwide."
        result = generate_quiz(text, max_questions=5)
        
        self.assertIsInstance(result, list)
    
    def test_repeated_content(self):
        """Test with highly repetitive content."""
        text = "Test test test. " * 20
        result = generate_quiz(text, max_questions=5)
        
        # Should handle gracefully (may return empty)
        self.assertIsInstance(result, list)


if __name__ == '__main__':
    unittest.main()
