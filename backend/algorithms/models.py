from django.db import models
from django.contrib.auth.models import User

class Algorithm(models.Model):
    # Статусы алгоритма
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'На модерации'),
        (STATUS_APPROVED, 'Одобрен'),
        (STATUS_REJECTED, 'Отклонен'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Название')
    tegs = models.TextField(default='', verbose_name='Теги')
    description = models.TextField(verbose_name='Описание')
    code = models.TextField(default='', verbose_name='Код алгоритма')
    author_name = models.CharField(max_length=150, verbose_name='Автор')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default=STATUS_PENDING,
        verbose_name='Статус'
    )
    moderated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='moderated_algorithms',
        verbose_name='Модератор'
    )
    moderated_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата модерации')
    rejection_reason = models.TextField(blank=True, verbose_name='Причина отклонения')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    def can_edit(self, user):
        """
        Проверяет, может ли пользователь редактировать алгоритм.
        Автор может редактировать свой алгоритм в любом статусе.
        """
        return user.is_authenticated and user.username == self.author_name
    
    def can_moderate(self, user):
        """
        Проверяет, может ли пользователь модерировать алгоритм.
        Модераторами являются staff пользователи или пользователи в группе 'Модераторы'.
        """
        if not user.is_authenticated:
            return False
        return user.is_staff or user.groups.filter(name='Модераторы').exists()
    
    def can_view(self, user):
        """
        Проверяет, может ли пользователь просматривать алгоритм.
        - Одобренные алгоритмы видны всем
        - Автор может видеть свои алгоритмы в любом статусе
        - Модераторы могут видеть все алгоритмы
        """
        # Одобренные алгоритмы видны всем
        if self.status == self.STATUS_APPROVED:
            return True
        
        # Автор может видеть свои алгоритмы в любом статусе
        if user.is_authenticated and user.username == self.author_name:
            return True
        
        # Модераторы могут видеть все алгоритмы
        if self.can_moderate(user):
            return True
        
        return False
    
    def reset_moderation(self):
        """
        Сбрасывает статус модерации для повторной отправки.
        Используется при редактировании одобренных или отклоненных алгоритмов.
        """
        if self.status in [self.STATUS_APPROVED, self.STATUS_REJECTED]:
            self.status = self.STATUS_PENDING
            self.rejection_reason = ''
            self.moderated_by = None
            self.moderated_at = None
    
    @property
    def is_pending(self):
        """Проверяет, находится ли алгоритм на модерации"""
        return self.status == self.STATUS_PENDING
    
    @property
    def is_approved(self):
        """Проверяет, одобрен ли алгоритм"""
        return self.status == self.STATUS_APPROVED
    
    @property
    def is_rejected(self):
        """Проверяет, отклонен ли алгоритм"""
        return self.status == self.STATUS_REJECTED
    
    def get_status_display_with_icon(self):
        """Возвращает статус алгоритма с иконкой"""
        status_icons = {
            self.STATUS_PENDING: '⏳',
            self.STATUS_APPROVED: '✅',
            self.STATUS_REJECTED: '❌'
        }
        icon = status_icons.get(self.status, '')
        return f"{icon} {self.get_status_display()}"
    
    def get_tags_list(self):
        """Возвращает список тегов"""
        if not self.tegs:
            return []
        return [tag.strip() for tag in self.tegs.split(',')]
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Алгоритм'
        verbose_name_plural = 'Алгоритмы'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['author_name']),
            models.Index(fields=['status']),
        ]

    def save(self, *args, **kwargs):
        """Переопределяем save для дополнительной логики при сохранении"""
        # Если алгоритм создается впервые и автор не установлен, но пользователь аутентифицирован
        if not self.pk and not self.author_name and hasattr(self, '_current_user'):
            self.author_name = self._current_user.username
        
        super().save(*args, **kwargs)