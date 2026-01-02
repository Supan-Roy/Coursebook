from courses.models import Course
from django.contrib.auth import get_user_model
User = get_user_model()

# Get all users and their courses
users = User.objects.all()
for user in users:
    print(f'User: {user.email}')
    courses = Course.objects.filter(user=user)
    print(f'  Courses count: {courses.count()}')
    for course in courses:
        print(f'    - {course.code}: {course.title}')
    print()
