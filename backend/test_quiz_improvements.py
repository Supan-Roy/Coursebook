from preparation.quiz_generator import generate_quiz

text = """
Hypothesis Testing: A hypothesis is some statement about a population which we want to verify on the basis of information available from a sample.

Statistical inference is used to test hypotheses and draw conclusions.

A null hypothesis represents no change or no difference in the population.

The alternative hypothesis represents what we want to prove or establish.

Type I error occurs when we reject a true null hypothesis.

Type II error occurs when we fail to reject a false null hypothesis.
"""

print("Generating quiz questions...\n")
questions = generate_quiz(text, max_questions=5)

print(f"Generated {len(questions)} questions:\n")
for i, q in enumerate(questions, 1):
    print(f"Question {i} ({q['type']}):")
    print(f"Q: {q['question']}")
    print(f"Options: {', '.join(q['options'])}")
    print(f"Answer: {q['answer']}")
    print()
