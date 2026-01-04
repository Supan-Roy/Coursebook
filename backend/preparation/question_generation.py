import re
import uuid
from collections import Counter
from typing import Iterable

STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your", "have", "will",
    "their", "about", "there", "which", "what", "when", "where", "while", "shall", "should",
    "could", "would", "after", "before", "because", "between", "through", "other", "such",
    "also", "than", "been", "being", "over", "under", "above", "below", "these", "those",
    "many", "some", "more", "most", "much", "very", "just", "even", "every", "using", "used",
    "use", "make", "made", "can", "cannot", "may", "might", "must", "each", "any", "either",
    "both", "once", "like", "often", "across", "within", "without", "into", "our", "its", "it's",
    "are", "was", "were", "is", "am", "be", "of", "in", "on", "at", "by", "an", "a", "to"
}


def _split_sentences(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    cleaned = [s.strip() for s in sentences if len(s.strip()) > 40]
    return cleaned


def _keyword_candidates(text: str, limit: int = 60) -> list[str]:
    words = re.findall(r"[A-Za-z]{3,}", text.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    counts = Counter(filtered)
    return [word for word, _ in counts.most_common(limit)]


def _find_keyword_in_sentence(sentence: str, keyword_pool: Iterable[str]) -> str | None:
    lower_sentence = sentence.lower()
    for word in keyword_pool:
        if word in lower_sentence and len(word) > 3:
            return word
    return None


def _build_options(correct: str, keyword_pool: list[str], max_options: int = 4) -> list[str]:
    distractors = [word for word in keyword_pool if word != correct][: max_options - 1]
    # Ensure unique and capitalized for nicer display
    options = [correct] + distractors
    options = [opt.capitalize() for opt in options]
    while len(options) < max_options:
        options.append(f"Option {len(options) + 1}")
    # Simple shuffle without importing random: rotate based on uuid hash
    shift = uuid.uuid4().int % len(options)
    options = options[shift:] + options[:shift]
    return options


def generate_questions_from_text(text: str, *, num_questions: int = 5, course_title: str = "Course") -> list[dict]:
    if not text or len(text.strip()) < 30:
        return [
            {
                "id": str(uuid.uuid4()),
                "prompt": f"What is one key concept you learned from {course_title}?",
                "options": ["Concept", "Definition", "Example", "Reminder"],
                "answer_index": 0,
                "source_excerpt": "",
            }
        ]

    sentences = _split_sentences(text)
    keyword_pool = _keyword_candidates(text, limit=120)

    questions: list[dict] = []
    used_prompts: set[str] = set()

    for sentence in sentences:
        keyword = _find_keyword_in_sentence(sentence, keyword_pool)
        if not keyword:
            continue

        blanked = re.sub(fr"\b{re.escape(keyword)}\b", "_____", sentence, flags=re.IGNORECASE)
        prompt = blanked.strip()
        if prompt in used_prompts:
            continue

        options = _build_options(keyword, keyword_pool)
        answer_index = options.index(keyword.capitalize()) if keyword.capitalize() in options else 0

        questions.append(
            {
                "id": str(uuid.uuid4()),
                "prompt": prompt,
                "options": options,
                "answer_index": answer_index,
                "source_excerpt": sentence.strip(),
            }
        )
        used_prompts.add(prompt)

        if len(questions) >= num_questions:
            break

    if not questions:
        return [
            {
                "id": str(uuid.uuid4()),
                "prompt": f"Summarize a major takeaway from {course_title}.",
                "options": ["Theory", "Process", "Definition", "Formula"],
                "answer_index": 0,
                "source_excerpt": "",
            }
        ]

    return questions[:num_questions]
