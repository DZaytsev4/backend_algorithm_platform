from django.urls import path
from . import views

urlpatterns = [
    path('algorithms/', views.algorithm_list, name='algorithm_list'),
    path('algorithms/add/', views.add_algorithm, name='add_algorithm'),
    path('algorithms/<int:algorithm_id>/', views.algorithm_detail, name='algorithm_detail'),
    path('algorithms/<int:algorithm_id>/edit/', views.edit_algorithm, name='edit_algorithm'),
]