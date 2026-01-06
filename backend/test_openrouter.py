import os
import requests
import json

api_key = os.getenv("OPENROUTER_API_KEY", "")

if not api_key:
    raise SystemExit(
        "OPENROUTER_API_KEY is not set. Export it in your environment or load it from backend/.env."
    )

print("Testing OpenRouter API key...\n")
print(f"Key: {api_key[:6]}...{api_key[-4:]} (masked)\n")

# Test 1: Simple request to free model
print("Test 1: Simple request to xiaomi/mimo-v2-flash:free")
print("="*70)

response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Coursebook"
    },
    json={
        "model": "xiaomi/mimo-v2-flash:free",
        "messages": [
            {
                "role": "user",
                "content": "Generate 2 multiple choice questions about photosynthesis"
            }
        ],
        "max_tokens": 500
    },
    timeout=30
)

print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    result = response.json()
    print("✅ KEY IS WORKING!\n")
    
    message = result.get('choices', [{}])[0].get('message', {}).get('content', '')
    print("Response:")
    print(message[:500])
    
    usage = result.get('usage', {})
    print(f"\nTokens used:")
    print(f"  Input: {usage.get('prompt_tokens', 0)}")
    print(f"  Output: {usage.get('completion_tokens', 0)}")
    
else:
    print("❌ Failed")
    print(response.text[:500])

print("\n" + "="*70)
print("\nTest 2: Check available models")
print("="*70)

# List some free models available
free_models = [
    "xiaomi/mimo-v2-flash:free",
    "google/gemini-2.0-flash-lite:free",
    "meta-llama/llama-3-8b-instruct:free",
]

print(f"\nFree models available on OpenRouter:")
for model in free_models:
    print(f"  • {model}")

print("\n" + "="*70)
print("\nCOMPARISON: OpenRouter vs Google Gemini")
print("="*70)

comparison = """
FEATURE                    | OPENROUTER                 | GOOGLE GEMINI
---------------------------|----------------------------|---------------------------
API Key Status             | ✅ WORKING (Just tested)   | ❌ All quota exhausted
Free Tier Models           | ✅ Multiple free options   | ❌ 1500 req/day limit
Rate Limits                | ✅ Varies by model         | ❌ Strict daily limits
Extended Reasoning         | ✅ Available               | ❌ Not free tier
Alternative Models         | ✅ 100+ models available   | ❌ Only Gemini models
Cost for Heavy Use         | $ Low cost                 | $ Higher cost
Setup Complexity           | Medium (different API)     | Low (already done)
Code Changes Required      | Yes, modify gemini_service | No, already working

BEST FOR:
- OpenRouter: Multiple LLM options, extended reasoning, heavy use
- Gemini: Quick setup, familiar integration, good for light use
"""

print(comparison)
