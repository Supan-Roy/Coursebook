"""
Test script to verify Gemini integration works correctly
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from preparation.gemini_service import get_gemini_service

def test_gemini_service():
    print("=" * 60)
    print("Testing Gemini Service Integration")
    print("=" * 60)
    
    gemini = get_gemini_service()
    
    print(f"\nAPI Enabled: {gemini.enabled}")
    
    if not gemini.enabled:
        print("\n⚠️  Gemini API is not configured")
        print("   To enable AI generation:")
        print("   1. Get API key from: https://aistudio.google.com/apikey")
        print("   2. Add to .env file: GEMINI_API_KEY=your-key-here")
        print("   3. Restart the server")
        print("\n✅ Fallback to rule-based generation will work automatically")
        return
    
    # Test sample text
    sample_text = """
    Statistical inference is the process of using data analysis to infer properties 
    of an underlying probability distribution. Inferential statistical analysis infers 
    properties of a population, for example by testing hypotheses and deriving estimates.
    
    Hypothesis testing is a statistical method that is used to make decisions based on 
    experimental data. A hypothesis test evaluates two mutually exclusive statements 
    about a population to determine which statement is best supported by the sample data.
    """
    
    print("\n" + "=" * 60)
    print("Test 1: Summary Generation")
    print("=" * 60)
    result = gemini.generate_summary(sample_text, max_words=50, style='concise')
    if result['success']:
        print(f"✅ Summary generated successfully")
        print(f"Summary: {result['summary'][:200]}...")
    else:
        print(f"❌ Failed: {result['error']}")
    
    print("\n" + "=" * 60)
    print("Test 2: Quiz Generation")
    print("=" * 60)
    result = gemini.generate_quiz(sample_text, num_questions=2, difficulty='medium')
    if result['success']:
        print(f"✅ Quiz generated successfully")
        print(f"Number of questions: {len(result['questions'])}")
        for i, q in enumerate(result['questions'], 1):
            print(f"\nQuestion {i}:")
            print(f"  Type: {q['type']}")
            print(f"  Question: {q['question']}")
            print(f"  Answer: {q['answer']}")
    else:
        print(f"❌ Failed: {result['error']}")
    
    print("\n" + "=" * 60)
    print("Integration test complete!")
    print("=" * 60)

if __name__ == '__main__':
    test_gemini_service()
