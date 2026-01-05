import os
import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
import requests

# Get the first key
keys_env = os.environ.get('GEMINI_API_KEYS', '')
keys = [k.strip() for k in keys_env.split(',') if k.strip()]

if not keys:
    print("❌ No keys found in environment")
    sys.exit(1)

first_key = keys[0]
print(f"Testing first key: {first_key[:20]}...{first_key[-10:]}")
print(f"Total keys configured: {len(keys)}\n")

# Test the key
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={first_key}"
data = {"contents": [{"parts": [{"text": "Say 'test successful' if you can read this"}]}]}

try:
    print("Making test API call...")
    response = requests.post(url, json=data, timeout=10)
    
    print(f"Status Code: {response.status_code}\n")
    
    if response.status_code == 200:
        result = response.json()
        if 'candidates' in result:
            text = result['candidates'][0]['content']['parts'][0]['text']
            print("✅ SUCCESS! Key is working!")
            print(f"Response: {text}")
            print(f"\nUsage: {result.get('usageMetadata', {})}")
            sys.exit(0)
    
    # Check for quota issues
    response_text = response.text
    if '"limit":0' in response_text or '"limit": 0' in response_text:
        print("❌ ZERO QUOTA - This key was created incorrectly")
        print("   The Generative AI API is not enabled or has no free tier quota")
        print("   Create a new key at: https://aistudio.google.com/app/apikey")
        print("   Select 'Create API key in new project'")
    elif 'API_KEY_INVALID' in response_text:
        print("❌ INVALID KEY - This key doesn't exist or is revoked")
    elif 'quota' in response_text.lower() or '429' in response_text:
        print("⚠️  QUOTA EXCEEDED - Key is valid but quota used up")
        print("   Wait until midnight UTC or use a different key")
    else:
        print(f"❌ ERROR: {response_text[:500]}")
    
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Connection error: {e}")
    sys.exit(1)
