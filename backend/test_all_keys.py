import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

import requests

keys_env = os.environ.get('GEMINI_API_KEYS', '')
keys = [k.strip() for k in keys_env.split(',') if k.strip()]

print(f"Testing {len(keys)} API keys...\n")

working_keys = []
quota_exceeded_keys = []
zero_quota_keys = []
invalid_keys = []

for idx, key in enumerate(keys, 1):
    print(f"Key {idx}: {key[:20]}...{key[-8:]}", end=' ')
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
    data = {"contents": [{"parts": [{"text": "test"}]}]}
    
    try:
        response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            print("✅ WORKING - Has available quota")
            working_keys.append(idx)
        elif '"limit":0' in response.text or '"limit": 0' in response.text:
            print("❌ ZERO QUOTA - Created incorrectly")
            zero_quota_keys.append(idx)
        elif 'API_KEY_INVALID' in response.text:
            print("❌ INVALID")
            invalid_keys.append(idx)
        elif '429' in str(response.status_code) or 'quota' in response.text.lower():
            print("⚠️  QUOTA EXHAUSTED - Wait for reset")
            quota_exceeded_keys.append(idx)
        else:
            print(f"❓ UNKNOWN - {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR - {str(e)[:50]}")

print("\n" + "="*60)
print("SUMMARY:")
print(f"✅ Working keys: {len(working_keys)} {working_keys if working_keys else ''}")
print(f"⚠️  Quota exhausted: {len(quota_exceeded_keys)} {quota_exceeded_keys if quota_exceeded_keys else ''}")
print(f"❌ Zero quota: {len(zero_quota_keys)} {zero_quota_keys if zero_quota_keys else ''}")
print(f"❌ Invalid: {len(invalid_keys)} {invalid_keys if invalid_keys else ''}")

if working_keys:
    print(f"\n🎉 You have {len(working_keys)} working key(s)! The system will use them.")
elif quota_exceeded_keys:
    print("\n⏰ All keys exhausted. Quotas reset at midnight UTC.")
    print("   Or add new keys from https://aistudio.google.com/app/apikey")
else:
    print("\n❌ No working keys. Create new ones at:")
    print("   https://aistudio.google.com/app/apikey")
    print("   Select 'Create API key in new project'")
