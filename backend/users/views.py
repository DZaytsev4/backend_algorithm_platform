from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from algorithms.models import Algorithm
from algorithms.serializers import AlgorithmSerializer
from .serializers import UserSerializer, RegisterSerializer

class UserList(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all()
        username = self.request.query_params.get('username', None)
        if username is not None:
            queryset = queryset.filter(username__icontains=username)
        return queryset

class UserDetail(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'username'

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """
    Получить текущего пользователя
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
def user_algorithms(request, username):
    """
    Получить алгоритмы пользователя
    """
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Пользователь не найден.'},
            status=status.HTTP_404_NOT_FOUND
        )

    algorithms = Algorithm.objects.filter(author_name=username).order_by('-created_at')
    
    # Проверяем, может ли текущий пользователь видеть все алгоритмы или только одобренные
    if request.user.is_authenticated and (request.user.username == username or request.user.is_staff):
        # Показываем все алгоритмы
        pass
    else:
        # Показываем только одобренные
        algorithms = algorithms.filter(status=Algorithm.STATUS_APPROVED)

    serializer = AlgorithmSerializer(algorithms, many=True, context={'request': request})
    return Response(serializer.data)