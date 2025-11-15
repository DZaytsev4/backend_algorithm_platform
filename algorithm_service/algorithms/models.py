from django.db import models

class Algorithm(models.Model):
    name = models.CharField(max_length=200)
    tegs = models.TextField(default='')
    description = models.TextField()
    code = models.TextField(default='')
    author_name = models.CharField(max_length=150, verbose_name='Автор')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def can_edit(self, user):
        """Проверяет, может ли пользователь редактировать алгоритм"""
        return user.is_authenticated and user.username == self.author_name

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Алгоритм'
        verbose_name_plural = 'Алгоритмы'