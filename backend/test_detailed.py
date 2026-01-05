import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

import requests
import json

keys_env = os.environ.get('GEMINI_API_KEYS', '')
keys = [k.strip() for k in keys_env.split(',') if k.strip()]

first_key = keys[0]
print(f"Testing FIRST KEY (brand new): {first_key[:25]}...{first_key[-10:]}\n")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={first_key}"
data = {"contents": [{"parts": [{"text": "Say hello"}]}]}

try:
    response = requests.post(url, json=data, timeout=10)
    
    print(f"Status Code: {response.status_code}\n")
    print("Full Response:")
    print("="*70)
    
    try:
        response_json = response.json()
        print(json.dumps(response_json, indent=2))
    except:
        print(response.text)
    
    print("="*70)
    
    if response.status_code == 200:
        print("\n✅ KEY IS WORKING PERFECTLY!")
    else:
        print("\n❌ Key failed - see error details above")
        
        # Check specific error
        if '"limit":0' in response.text or '"limit": 0' in response.text:
            print("\nIssue: API not enabled or project has no quota allocation")
        elif 'per day' in response.text.lower():
            print("\nIssue: Daily quota limit reached")
        elif 'per minute' in response.text.lower():
            print("\nIssue: Per-minute rate limit reached")
            
except Exception as e:
    print(f"Connection error: {e}")
