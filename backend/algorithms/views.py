from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Algorithm
from .serializers import AlgorithmSerializer

class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.groups.filter(name='Модераторы').exists())

class AlgorithmList(generics.ListCreateAPIView):
    serializer_class = AlgorithmSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Algorithm.objects.all()
        query = self.request.query_params.get('q', None)
        user = self.request.user

        # Если пользователь не аутентифицирован, показываем только одобренные
        if not user.is_authenticated:
            queryset = queryset.filter(status=Algorithm.STATUS_APPROVED)
        else:
            # Если пользователь аутентифицирован, показываем одобренные и его собственные
            if not user.is_staff and not user.groups.filter(name='Модераторы').exists():
                queryset = queryset.filter(
                    Q(status=Algorithm.STATUS_APPROVED) | Q(author_name=user.username)
                )

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(tegs__icontains=query) |
                Q(description__icontains=query) |
                Q(author_name__icontains=query)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Автоматически устанавливаем статус "на модерации"
        serializer.save(status=Algorithm.STATUS_PENDING)

class AlgorithmDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Algorithm.objects.all()
    serializer_class = AlgorithmSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Используем тот же фильтр, что и в AlgorithmList
        queryset = Algorithm.objects.all()
        user = self.request.user

        if not user.is_authenticated:
            queryset = queryset.filter(status=Algorithm.STATUS_APPROVED)
        else:
            if not user.is_staff and not user.groups.filter(name='Модераторы').exists():
                queryset = queryset.filter(
                    Q(status=Algorithm.STATUS_APPROVED) | Q(author_name=user.username)
                )
        return queryset

    def update(self, request, *args, **kwargs):
        # Проверяем, может ли пользователь редактировать этот алгоритм
        algorithm = self.get_object()
        if not algorithm.can_edit(request.user):
            return Response(
                {'detail': 'У вас нет прав для редактирования этого алгоритма.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        algorithm = self.get_object()
        if not algorithm.can_edit(request.user):
            return Response(
                {'detail': 'У вас нет прав для удаления этого алгоритма.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([IsModerator])
def moderation_list(request):
    """
    Список алгоритмов на модерации (только для модераторов)
    """
    pending_algorithms = Algorithm.objects.filter(status=Algorithm.STATUS_PENDING).order_by('created_at')
    serializer = AlgorithmSerializer(pending_algorithms, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsModerator])
def moderate_algorithm(request, algorithm_id):
    """
    Модерация алгоритма (одобрение/отклонение)
    """
    try:
        algorithm = Algorithm.objects.get(id=algorithm_id, status=Algorithm.STATUS_PENDING)
    except Algorithm.DoesNotExist:
        return Response(
            {'detail': 'Алгоритм не найден или уже прошел модерацию.'},
            status=status.HTTP_404_NOT_FOUND
        )

    status_action = request.data.get('status')
    rejection_reason = request.data.get('rejection_reason', '')

    if status_action not in [Algorithm.STATUS_APPROVED, Algorithm.STATUS_REJECTED]:
        return Response(
            {'detail': 'Неверный статус. Допустимые значения: "approved", "rejected".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    algorithm.status = status_action
    algorithm.rejection_reason = rejection_reason if status_action == Algorithm.STATUS_REJECTED else ''
    algorithm.moderated_by = request.user
    algorithm.moderated_at = timezone.now()
    algorithm.save()

    serializer = AlgorithmSerializer(algorithm, context={'request': request})
    return Response(serializer.data)