from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Algorithm

class AlgorithmViewsTests(TestCase):
    def setUp(self):
        """Настройка тестовых данных"""
        self.client = APIClient()
        
        # Создаем группы и пользователей
        self.moderator_group = Group.objects.create(name='Модераторы')
        
        # Обычный пользователь
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='user@test.com'
        )
        
        # Модератор
        self.moderator = User.objects.create_user(
            username='moderator',
            password='modpass123',
            email='mod@test.com'
        )
        self.moderator.groups.add(self.moderator_group)
        
        # Другой пользователь
        self.other_user = User.objects.create_user(
            username='otheruser',
            password='otherpass123',
            email='other@test.com'
        )
        
        # Создаем тестовые алгоритмы
        self.approved_algorithm = Algorithm.objects.create(
            name='Утвержденный алгоритм',
            description='Описание утвержденного алгоритма',
            code='print("approved")',
            author_name='testuser',
            status=Algorithm.STATUS_APPROVED
        )
        
        self.pending_algorithm = Algorithm.objects.create(
            name='Ожидающий алгоритм',
            description='Описание ожидающего алгоритма',
            code='print("pending")',
            author_name='testuser',
            status=Algorithm.STATUS_PENDING
        )
        
        self.rejected_algorithm = Algorithm.objects.create(
            name='Отклоненный алгоритм',
            description='Описание отклоненного алгоритма',
            code='print("rejected")',
            author_name='testuser',
            status=Algorithm.STATUS_REJECTED
        )
        
        self.other_user_algorithm = Algorithm.objects.create(
            name='Алгоритм другого пользователя',
            description='Описание другого алгоритма',
            code='print("other")',
            author_name='otheruser',
            status=Algorithm.STATUS_APPROVED
        )

    def _get_results(self, response):
        """Вспомогательный метод для получения результатов из пагинированного ответа"""
        return response.data.get('results', response.data)

    def test_get_algorithms_for_regular_user(self):
        """Тест получения списка алгоритмов для обычного пользователя"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(reverse('algorithm_list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Получаем результаты из пагинированного ответа
        results = self._get_results(response)
        self.assertIsInstance(results, list)
        
        # Обычный пользователь видит утвержденные алгоритмы и свои (включая отклоненные)
        algorithm_names = [alg['name'] for alg in results]
        self.assertIn('Утвержденный алгоритм', algorithm_names)
        self.assertIn('Ожидающий алгоритм', algorithm_names)  # Свой алгоритм
        self.assertIn('Алгоритм другого пользователя', algorithm_names)  # Утвержденный чужой
        self.assertIn('Отклоненный алгоритм', algorithm_names)  # Свой отклоненный

    def test_get_algorithms_for_moderator(self):
        """Тест получения списка алгоритмов для модератора"""
        self.client.force_authenticate(user=self.moderator)
        
        response = self.client.get(reverse('algorithm_list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Получаем результаты из пагинированного ответа
        results = self._get_results(response)
        self.assertIsInstance(results, list)
        
        # Модератор видит все алгоритмы
        algorithm_names = [alg['name'] for alg in results]
        self.assertIn('Утвержденный алгоритм', algorithm_names)
        self.assertIn('Ожидающий алгоритм', algorithm_names)
        self.assertIn('Отклоненный алгоритм', algorithm_names)
        self.assertIn('Алгоритм другого пользователя', algorithm_names)

    def test_algorithm_search_filter(self):
        """Тест фильтрации алгоритмов по поисковому запросу"""
        self.client.force_authenticate(user=self.moderator)
        
        # Поиск по названию - только один алгоритм должен подходить
        response = self.client.get(reverse('algorithm_list'), {'q': 'Утвержденный'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = self._get_results(response)
        self.assertIsInstance(results, list)
        
        # Должен найти только один алгоритм с этим именем
        found_algorithms = [alg for alg in results if 'Утвержденный' in alg['name']]
        self.assertEqual(len(found_algorithms), 1)
        self.assertEqual(found_algorithms[0]['name'], 'Утвержденный алгоритм')
        
        # Поиск по описанию
        response = self.client.get(reverse('algorithm_list'), {'q': 'ожидающего'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        found_algorithms = [alg for alg in results if 'Ожидающий алгоритм' in alg['name']]
        self.assertEqual(len(found_algorithms), 1)
        
        # Поиск по автору
        response = self.client.get(reverse('algorithm_list'), {'q': 'otheruser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        found_algorithms = [alg for alg in results if 'Алгоритм другого пользователя' in alg['name']]
        self.assertEqual(len(found_algorithms), 1)

    def test_create_algorithm_by_user(self):
        """Тест создания алгоритма пользователем"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Новый алгоритм',
            'description': 'Описание нового алгоритма',
            'code': 'print("new")',
            'tegs': 'python,test'
        }
        
        response = self.client.post(reverse('algorithm_list'), data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Новый алгоритм')
        self.assertEqual(response.data['status'], Algorithm.STATUS_PENDING)
        self.assertEqual(response.data['author_name'], 'testuser')
        
        # Проверяем дополнительные поля из сериализатора
        self.assertIn('status_display', response.data)
        self.assertIn('tags_list', response.data)
        self.assertIn('can_edit', response.data)
        self.assertIn('can_moderate', response.data)
        
        # Проверяем, что алгоритм действительно создан в БД
        self.assertTrue(Algorithm.objects.filter(name='Новый алгоритм').exists())

    def test_update_algorithm_by_author(self):
        """Тест обновления алгоритма автором"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'Обновленное название',
            'description': self.pending_algorithm.description,
            'code': self.pending_algorithm.code,
            'tegs': 'updated, tags'
        }
        
        response = self.client.put(
            reverse('algorithm_detail', kwargs={'pk': self.pending_algorithm.id}), 
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Обновленное название')
        
        # Проверяем обновление в БД
        self.pending_algorithm.refresh_from_db()
        self.assertEqual(self.pending_algorithm.name, 'Обновленное название')

    def test_update_algorithm_by_non_author(self):
        """Тест обновления алгоритма не-автором"""
        self.client.force_authenticate(user=self.other_user)
        
        data = {
            'name': 'Попытка чужого обновления',
            'description': self.pending_algorithm.description,
            'code': self.pending_algorithm.code
        }
        
        response = self.client.put(
            reverse('algorithm_detail', kwargs={'pk': self.pending_algorithm.id}), 
            data,
            format='json'
        )
        
        # Должен возвращать 404, потому что алгоритм не виден в queryset для этого пользователя
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_algorithm_by_author(self):
        """Тест удаления алгоритма автором"""
        self.client.force_authenticate(user=self.user)
        
        algorithm_id = self.pending_algorithm.id
        response = self.client.delete(reverse('algorithm_detail', kwargs={'pk': algorithm_id}))
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Проверяем, что алгоритм удален из БД
        self.assertFalse(Algorithm.objects.filter(id=algorithm_id).exists())

    def test_delete_algorithm_by_non_author(self):
        """Тест удаления алгоритма не-автором"""
        self.client.force_authenticate(user=self.other_user)
        
        algorithm_id = self.pending_algorithm.id
        response = self.client.delete(reverse('algorithm_detail', kwargs={'pk': algorithm_id}))
        
        # Должен возвращать 404, потому что алгоритм не виден в queryset для этого пользователя
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Проверяем, что алгоритм НЕ удален из БД
        self.assertTrue(Algorithm.objects.filter(id=algorithm_id).exists())

    def test_moderation_list_access_for_moderator(self):
        """Тест доступа к списку модерации для модератора"""
        self.client.force_authenticate(user=self.moderator)
        
        response = self.client.get(reverse('moderation_list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # В списке модерации только ожидающие алгоритмы
        self.assertIsInstance(response.data, list)  # Этот endpoint не пагинирован
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Ожидающий алгоритм')

    def test_moderation_list_access_for_regular_user(self):
        """Тест доступа к списку модерации для обычного пользователя"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(reverse('moderation_list'))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_algorithm_by_moderator(self):
        """Тест утверждения алгоритма модератором"""
        self.client.force_authenticate(user=self.moderator)
        
        data = {
            'status': Algorithm.STATUS_APPROVED
        }
        
        response = self.client.post(
            reverse('moderate_algorithm', kwargs={'algorithm_id': self.pending_algorithm.id}), 
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], Algorithm.STATUS_APPROVED)
        
        # Проверяем обновление в БД
        self.pending_algorithm.refresh_from_db()
        self.assertEqual(self.pending_algorithm.status, Algorithm.STATUS_APPROVED)
        self.assertEqual(self.pending_algorithm.moderated_by, self.moderator)
        self.assertIsNotNone(self.pending_algorithm.moderated_at)

    def test_reject_algorithm_by_moderator(self):
        """Тест отклонения алгоритма модератором"""
        self.client.force_authenticate(user=self.moderator)
        
        data = {
            'status': Algorithm.STATUS_REJECTED,
            'rejection_reason': 'Не соответствует требованиям'
        }
        
        response = self.client.post(
            reverse('moderate_algorithm', kwargs={'algorithm_id': self.pending_algorithm.id}), 
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], Algorithm.STATUS_REJECTED)
        self.assertEqual(response.data['rejection_reason'], 'Не соответствует требованиям')
        
        # Проверяем обновление в БД
        self.pending_algorithm.refresh_from_db()
        self.assertEqual(self.pending_algorithm.status, Algorithm.STATUS_REJECTED)
        self.assertEqual(self.pending_algorithm.rejection_reason, 'Не соответствует требованиям')