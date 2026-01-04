#!/usr/bin/env python
"""Simple HTTP test of the API endpoint."""
import requests
import json

# Assuming the development server is running on localhost:8000
BASE_URL = "http://localhost:8000/api"

print("=" * 70)
print("TESTING API ENDPOINT WITH HTTP REQUEST")
print("=" * 70)

# First, let's check if server is running by trying to get a token
print("\n1. Attempting to connect to server...")
try:
    # Try a simple endpoint
    response = requests.get(f"{BASE_URL}/courses/", timeout=2)
    print(f"   Server is {'UP' if response.status_code in [200, 401, 403] else 'DOWN'}")
    print(f"   Status code: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("   ERROR: Server is not running!")
    print("   Please start the server with: python manage.py runserver")
    exit(1)
except Exception as e:
    print(f"   ERROR: {e}")
    exit(1)

print("\n" + "=" * 70)
print("To test the summary generation:")
print("1. Start the Django server: cd backend && python manage.py runserver")
print("2. Login to the app and note your authentication token")
print("3. Use the browser dev tools to see the actual API responses")
print("=" * 70)
