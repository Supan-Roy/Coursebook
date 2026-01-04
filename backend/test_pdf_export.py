#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(email='admin@supanroy.com')

client = APIClient()
client.force_authenticate(user=user)

# Test PDF export endpoint
print("Testing PDF export endpoint...")
response = client.post(
    '/api/preparation/summaries/export-pdf/',
    {
        'text': 'Introduction. Database systems are critical. Methods. We studied 50 papers. Results. Five key trends identified. Conclusion. Future research is needed.',
        'title': 'Research Summary',
        'course_code': 'CSE101'
    },
    format='json'
)

print('Status:', response.status_code)
if response.status_code == 200:
    print('✓ PDF generated successfully')
    print('Size:', len(response.content), 'bytes')
    print('✓ PDF export endpoint working!')
    print('✓ Content-Type:', response.get('Content-Type', 'Not set'))
    print('✓ Content-Disposition:', response.get('Content-Disposition', 'Not set'))
else:
    print('Status:', response.status_code)
    print('Error:', response.data if hasattr(response, 'data') else response.content[:500])
