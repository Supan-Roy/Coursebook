from django.urls import path
from . import views

urlpatterns = [
    path("", views.TodoListCreateView.as_view(), name="todo-list-create"),
    path("<uuid:id>/", views.TodoDetailView.as_view(), name="todo-detail"),
]
