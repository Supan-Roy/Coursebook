from django.urls import path
from . import views

urlpatterns = [
    # Todo endpoints
    path("", views.MyPlansCreateView.as_view(), name="my-plans-create"),
    path("<uuid:id>/", views.TodoDetailView.as_view(), name="todo-detail"),
    
    # Category endpoints
    path("categories/", views.TodoCategoryListCreateView.as_view(), name="todo-categories"),
    path("categories/<uuid:id>/", views.TodoCategoryDetailView.as_view(), name="todo-category-detail"),
]
