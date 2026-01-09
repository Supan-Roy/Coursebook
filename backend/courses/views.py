from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, Semester
from .serializers import CourseSerializer, SemesterSerializer


class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            # Log the error for debugging
            import traceback
            traceback.print_exc()
            raise


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Course.objects.filter(user=self.request.user)


class UpdateSemesterNameView(APIView):
    """Update semester name for all courses in a semester and Semester model"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_semester = request.data.get('old_semester')
        new_semester = request.data.get('new_semester')
        
        if not old_semester or not new_semester:
            return Response(
                {'detail': 'Both old_semester and new_semester are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new semester name already exists in Course model
        existing_course = Course.objects.filter(
            user=request.user, 
            semester=new_semester
        ).exists()
        
        # Check if new semester name already exists in Semester model
        existing_semester = Semester.objects.filter(
            user=request.user,
            name=new_semester
        ).exists()
        
        if (existing_course or existing_semester) and old_semester != new_semester:
            return Response(
                {'detail': 'A semester with this name already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update all courses with the old semester name
        updated_courses_count = Course.objects.filter(
            user=request.user,
            semester=old_semester
        ).update(semester=new_semester)
        
        # Update Semester model if it exists
        updated_semesters_count = Semester.objects.filter(
            user=request.user,
            name=old_semester
        ).update(name=new_semester)
        
        return Response({
            'message': f'Successfully updated {updated_courses_count} courses and {updated_semesters_count} semester(s)',
            'updated_courses_count': updated_courses_count,
            'updated_semesters_count': updated_semesters_count
        }, status=status.HTTP_200_OK)


class SemesterCreateView(APIView):
    """Create a new blank semester for the user"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get('name', '').strip()
        
        if not name:
            return Response(
                {'detail': 'Semester name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if semester already exists for this user
        if Semester.objects.filter(user=request.user, name=name).exists():
            return Response(
                {'detail': f'A semester named "{name}" already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            semester = Semester.objects.create(user=request.user, name=name)
            serializer = SemesterSerializer(semester)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class SemesterListView(APIView):
    """List all semesters for the authenticated user"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        semesters = Semester.objects.filter(user=request.user).order_by('-created_at')
        serializer = SemesterSerializer(semesters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SemesterDeleteView(APIView):
    """Delete a semester and optionally all its courses"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        name = request.data.get('name', '').strip()
        
        if not name:
            return Response(
                {'detail': 'Semester name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delete all courses in this semester
            deleted_courses = Course.objects.filter(
                user=request.user, 
                semester=name
            ).delete()[0]
            
            # Delete the semester record if it exists
            deleted_semesters = Semester.objects.filter(
                user=request.user, 
                name=name
            ).delete()[0]
            
            return Response({
                'message': 'Semester deleted successfully',
                'courses_deleted': deleted_courses,
                'semester_deleted': deleted_semesters > 0
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
