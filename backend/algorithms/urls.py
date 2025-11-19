from django.urls import path
from . import views

urlpatterns = [
    path('', views.AlgorithmList.as_view(), name='algorithm_list'),
    path('<int:pk>/', views.AlgorithmDetail.as_view(), name='algorithm_detail'),
    path('moderation/', views.moderation_list, name='moderation_list'),
    path('moderation/<int:algorithm_id>/', views.moderate_algorithm, name='moderate_algorithm'),
]