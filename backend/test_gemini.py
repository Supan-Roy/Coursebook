#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'coursebook.settings')
django.setup()

from preparation.gemini_service import GeminiService

service = GeminiService()
print(f'Service enabled: {service.enabled}')

test_text = 'Python is a programming language. It is easy to learn.'
result = service.generate_summary(test_text, max_words=100, style='detailed')
print(f'Success: {result["success"]}')
print(f'Word count: {result["word_count"]}')
if not result['success']:
    print(f'Error: {result["error"]}')
else:
    print(f'Notes length: {len(result["summary"])}')
    print(f'Notes: {result["summary"][:200]}...')
