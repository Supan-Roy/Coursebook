import os
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.test import override_settings

User = get_user_model()
user = User.objects.get(email='admin@supanroy.com')

with override_settings(ALLOWED_HOSTS=['testserver']):
    client = APIClient()
    client.force_authenticate(user=user)

    # Test courses endpoint
    response = client.get('/api/courses/')
    print("Status:", response.status_code)
    print("Response type:", type(response))
    
    try:
        data = response.json()
        print("Data type:", type(data))
        print("Data keys:", list(data.keys()) if isinstance(data, dict) else "Not a dict")
        print("\nFull response:")
        print(json.dumps(data, indent=2, default=str))
    except Exception as e:
        print("Error:", e)
        print("Content:", response.content)

