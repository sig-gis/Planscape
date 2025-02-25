from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('delete/', views.delete_user, name='delete'),
    path('get_user_by_id/', views.get_user_by_id, name='get_user_by_id'),
]