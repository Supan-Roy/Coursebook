#!/usr/bin/env python
"""Test the actual API endpoint to see what's being returned."""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from preparation.views import SummaryGenerateView
from courses.models import Course, Semester
from materials.models import Material
import json

User = get_user_model()

print("=" * 70)
print("TESTING API ENDPOINT RESPONSE")
print("=" * 70)

# Create test data
try:
    # Cleanup first if exists
    User.objects.filter(email='test_api@example.com').delete()
    
    user = User.objects.create_user(email='test_api@example.com', password='testpass')
    semester = Semester.objects.create(name='Spring 2026', user=user)
    course = Course.objects.create(
        code='TEST101',
        title='Test Course',
        semester='Spring 2026',
        folder_slug='test101-api',
        user=user
    )
    
    # Create a test material with some content
    material = Material.objects.create(
        course=course,
        filename='test.txt',
        content_type='text/plain',
        file_size=100,
        storage_key='test_key',
        user=user
    )
    
    # Create test file content
    test_content = """
    Python is a high-level programming language.
    It is easy to learn and widely used.
    Python supports multiple programming paradigms.
    """
    
    # Mock the extract_text_from_path function to return our test content
    from preparation import views
    original_extract = views.extract_text_from_path
    views.extract_text_from_path = lambda key, content_type, max_chars=None: test_content
    
    # Create a request
    factory = RequestFactory()
    request = factory.post('/api/preparation/summaries/generate/', 
                          data=json.dumps({
                              'course': str(course.id),
                              'materials': [str(material.id)]
                          }),
                          content_type='application/json')
    request.user = user
    
    # Call the view
    view = SummaryGenerateView.as_view()
    response = view(request)
    
    print(f"\n1. Response Status: {response.status_code}")
    print(f"2. Response Type: {type(response)}")
    print(f"3. Response Data Type: {type(response.data)}")
    print(f"\n4. Response Data:")
    print(json.dumps(response.data, indent=2))
    
    print(f"\n5. Has 'summary' key: {'summary' in response.data}")
    if 'summary' in response.data:
        summary = response.data['summary']
        print(f"6. Summary type: {type(summary)}")
        print(f"7. Summary length: {len(summary)}")
        print(f"8. Summary content: {summary[:150]}...")
    else:
        print("6. ERROR: No 'summary' key in response!")
        print(f"   Available keys: {list(response.data.keys())}")
    
    # Cleanup
    views.extract_text_from_path = original_extract
    material.delete()
    course.delete()
    semester.delete()
    user.delete()
    
    print("\n" + "=" * 70)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
