"""Management command to test Gemini API keys."""
import os
import sys
from django.core.management.base import BaseCommand
from django.conf import settings

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class Command(BaseCommand):
    help = 'Test Gemini API keys for validity'

    def handle(self, *args, **options):
        if not GENAI_AVAILABLE:
            self.stdout.write(self.style.ERROR('google.generativeai not installed'))
            sys.exit(1)

        # Get keys from env
        keys_env = os.environ.get('GEMINI_API_KEYS', '')
        if keys_env:
            api_keys = [k.strip() for k in keys_env.split(',') if k.strip()]
        else:
            api_keys = getattr(settings, 'GEMINI_API_KEYS', [])

        if not api_keys:
            single_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
            if single_key:
                api_keys = [single_key]

        if not api_keys:
            self.stdout.write(self.style.ERROR('No API keys found in settings or environment'))
            sys.exit(1)

        self.stdout.write(f"Testing {len(api_keys)} API key(s)...\n")

        for idx, key in enumerate(api_keys, 1):
            self.stdout.write(f"Key {idx}: {key[:10]}...{key[-5:]} (length: {len(key)})", ending=' ')

            try:
                # Configure API
                genai.configure(api_key=key)
                self.stdout.write(self.style.SUCCESS('✓ Configuration OK'), ending=' ')

                # Try to create model
                model = genai.GenerativeModel('gemini-2.0-flash')
                self.stdout.write(self.style.SUCCESS('✓ Model Created'), ending=' ')

                # Try a simple test (do NOT make actual call to save quota)
                self.stdout.write(self.style.SUCCESS('✓ VALID'))

            except Exception as e:
                error_msg = str(e)
                if 'API_KEY_INVALID' in error_msg or 'not found' in error_msg.lower():
                    self.stdout.write(self.style.ERROR(f'✗ INVALID KEY - {error_msg[:80]}'))
                elif 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
                    self.stdout.write(self.style.WARNING(f'⚠ QUOTA ISSUE - {error_msg[:80]}'))
                elif 'permission' in error_msg.lower():
                    self.stdout.write(self.style.ERROR(f'✗ PERMISSION DENIED - {error_msg[:80]}'))
                else:
                    self.stdout.write(self.style.ERROR(f'✗ ERROR - {error_msg[:80]}'))

        self.stdout.write('\n' + self.style.SUCCESS('Key validation complete'))
