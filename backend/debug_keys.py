#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from preparation.gemini_service import GeminiService

print("=" * 60)
print("GEMINI API KEYS DEBUG")
print("=" * 60)

# Check .env
gemini_keys_env = os.environ.get('GEMINI_API_KEYS', '')
print(f"\n1. From environment (GEMINI_API_KEYS):")
if gemini_keys_env:
    keys_list = gemini_keys_env.split(',')
    print(f"   Number of keys: {len(keys_list)}")
    for i, key in enumerate(keys_list, 1):
        key_clean = key.strip()
        print(f"   Key {i}: {key_clean[:20]}...")
else:
    print(f"   <empty>")

# Check settings
print(f"\n2. From Django settings:")
api_keys_setting = getattr(settings, 'GEMINI_API_KEYS', [])
print(f"   GEMINI_API_KEYS: {api_keys_setting}")
print(f"   Number of keys: {len(api_keys_setting)}")

# Check service initialization
print(f"\n3. Service Initialization:")
service = GeminiService()
print(f"   Enabled: {service.enabled}")
print(f"   API Keys in service: {len(service.api_keys)}")
if service.api_keys:
    for i, key in enumerate(service.api_keys, 1):
        print(f"   Key {i}: {key[:20]}...")
else:
    print(f"   No keys loaded!")

print("\n" + "=" * 60)
