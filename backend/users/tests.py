from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from algorithms.models import Algorithm
# Используем абсолютные импорты
from users.forms import RegisterForm
from users.serializers import UserSerializer, RegisterSerializer

User = get_user_model()

class UserViewsTests(TestCase):
    def setUp(self):
        """Настройка тестовых данных"""
        self.client = APIClient()
        
        # Создаем группы
        self.moderator_group = Group.objects.create(name='Модераторы')
        
        # Создаем тестовых пользователей
        self.user1 = User.objects.create_user(
            username='testuser1',
            password='testpass123',
            email='user1@test.com'
        )
        
        self.user2 = User.objects.create_user(
            username='testuser2',
            password='testpass123',
            email='user2@test.com'
        )
        
        self.staff_user = User.objects.create_user(
            username='staffuser',
            password='staffpass123',
            email='staff@test.com',
            is_staff=True
        )
        
        self.moderator = User.objects.create_user(
            username='moderator',
            password='modpass123',
            email='mod@test.com'
        )
        self.moderator.groups.add(self.moderator_group)
        
        # Создаем алгоритмы для тестов
        self.approved_algorithm_user1 = Algorithm.objects.create(
            name='Утвержденный алгоритм user1',
            description='Описание',
            code='print("test")',
            author_name='testuser1',
            status=Algorithm.STATUS_APPROVED
        )
        
        self.pending_algorithm_user1 = Algorithm.objects.create(
            name='Ожидающий алгоритм user1',
            description='Описание',
            code='print("test")',
            author_name='testuser1',
            status=Algorithm.STATUS_PENDING
        )
        
        self.approved_algorithm_user2 = Algorithm.objects.create(
            name='Утвержденный алгоритм user2',
            description='Описание',
            code='print("test")',
            author_name='testuser2',
            status=Algorithm.STATUS_APPROVED
        )

    def _get_results(self, response):
        """Вспомогательный метод для получения результатов из пагинированного ответа"""
        return response.data.get('results', response.data)

    # Тесты регистрации
    def test_register_user_success(self):
        """Тест успешной регистрации пользователя"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        
        response = self.client.post(reverse('register'), data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        self.assertEqual(response.data['email'], 'newuser@test.com')
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_user_password_mismatch(self):
        """Тест регистрации с несовпадающими паролями"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'password2': 'differentpass'
        }
        
        response = self.client.post(reverse('register'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_duplicate_username(self):
        """Тест регистрации с существующим username"""
        data = {
            'username': 'testuser1',  # Уже существует
            'email': 'new@test.com',
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        
        response = self.client.post(reverse('register'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_user_duplicate_email(self):
        """Тест регистрации с существующим email"""
        data = {
            'username': 'newuser',
            'email': 'user1@test.com',  # Уже существует
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        
        response = self.client.post(reverse('register'), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # Тесты получения текущего пользователя
    def test_get_current_user_authenticated(self):
        """Тест получения данных текущего пользователя (аутентифицирован)"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('current_user'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser1')
        self.assertEqual(response.data['email'], 'user1@test.com')

    def test_get_current_user_unauthenticated(self):
        """Тест получения данных текущего пользователя (не аутентифицирован)"""
        response = self.client.get(reverse('current_user'))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Тесты поиска пользователей
    def test_user_search_authenticated(self):
        """Тест поиска пользователей (аутентифицирован)"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_search'), {'username': 'testuser'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        # Должны найти testuser1 и testuser2 (2 пользователя)
        self.assertEqual(len(results), 2)
        usernames = [user['username'] for user in results]
        self.assertIn('testuser1', usernames)
        self.assertIn('testuser2', usernames)

    def test_user_search_unauthenticated(self):
        """Тест поиска пользователей (не аутентифицирован)"""
        response = self.client.get(reverse('user_search'))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_search_no_results(self):
        """Тест поиска пользователей без результатов"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_search'), {'username': 'nonexistentuser'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self._get_results(response)
        self.assertEqual(len(results), 0)

    # Тесты получения профиля пользователя
    def test_get_user_profile_authenticated(self):
        """Тест получения профиля пользователя (аутентифицирован)"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_profile', kwargs={'username': 'testuser2'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser2')
        self.assertEqual(response.data['email'], 'user2@test.com')

    def test_get_user_profile_unauthenticated(self):
        """Тест получения профиля пользователя (не аутентифицирован)"""
        response = self.client.get(reverse('user_profile', kwargs={'username': 'testuser1'}))
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_profile_not_found(self):
        """Тест получения несуществующего профиля пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_profile', kwargs={'username': 'nonexistent'}))
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Тесты получения алгоритмов пользователя
    def test_get_user_algorithms_own_profile(self):
        """Тест получения алгоритмов своего профиля"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'testuser1'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Все алгоритмы user1 (2 алгоритма)
        self.assertEqual(len(response.data), 2)

    def test_get_user_algorithms_other_user(self):
        """Тест получения алгоритмов другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'testuser2'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Только утвержденные алгоритмы user2 (1 алгоритм)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Утвержденный алгоритм user2')

    def test_get_user_algorithms_staff_user(self):
        """Тест получения алгоритмов пользователя staff-пользователем"""
        self.client.force_authenticate(user=self.staff_user)
        
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'testuser1'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Все алгоритмы user1 (staff видит все)
        self.assertEqual(len(response.data), 2)

    def test_get_user_algorithms_moderator(self):
        """Тест получения алгоритмов пользователя модератором"""
        self.client.force_authenticate(user=self.moderator)
        
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'testuser1'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Модератор НЕ является staff, поэтому видит только утвержденные алгоритмы
        # (1 алгоритм, а не 2)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Утвержденный алгоритм user1')

    def test_get_user_algorithms_unauthenticated(self):
        """Тест получения алгоритмов пользователя (не аутентифицирован)"""
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'testuser1'}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Только утвержденные алгоритмы (1 алгоритм)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Утвержденный алгоритм user1')

    def test_get_user_algorithms_nonexistent_user(self):
        """Тест получения алгоритмов несуществующего пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(reverse('user_algorithms', kwargs={'username': 'nonexistent'}))
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)


class UserFormsTests(TestCase):
    """Тесты для форм пользователей"""
    
    def test_register_form_valid(self):
        """Тест валидной формы регистрации"""
        form_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        }
        
        form = RegisterForm(data=form_data)
        self.assertTrue(form.is_valid())
        
        user = form.save()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.email, 'newuser@test.com')

    def test_register_form_duplicate_email(self):
        """Тест формы регистрации с дублирующимся email"""
        # Создаем пользователя с email
        User = get_user_model()
        User.objects.create_user(
            username='existinguser',
            email='existing@test.com',
            password='testpass123'
        )
        
        form_data = {
            'username': 'newuser',
            'email': 'existing@test.com',  # Дублирующийся email
            'password1': 'complexpass123',
            'password2': 'complexpass123'
        }
        
        form = RegisterForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('email', form.errors)

    def test_register_form_password_mismatch(self):
        """Тест формы регистрации с несовпадающими паролями"""
        form_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password1': 'complexpass123',
            'password2': 'differentpass123'  # Пароли не совпадают
        }
        
        form = RegisterForm(data=form_data)
        self.assertFalse(form.is_valid())


class UserSerializersTests(TestCase):
    """Тесты для сериализаторов пользователей"""
    
    def test_register_serializer_valid(self):
        """Тест валидного сериализатора регистрации"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'complexpass123',
            'password2': 'complexpass123'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        user = serializer.save()
        self.assertEqual(user.username, 'newuser')
        self.assertEqual(user.email, 'newuser@test.com')
        self.assertTrue(user.check_password('complexpass123'))

    def test_register_serializer_password_mismatch(self):
        """Тест сериализатора регистрации с несовпадающими паролями"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'complexpass123',
            'password2': 'differentpass123'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_register_serializer_duplicate_username(self):
        """Тест сериализатора регистрации с дублирующимся username"""
        # Создаем пользователя
        User = get_user_model()
        User.objects.create_user(
            username='existinguser',
            email='existing@test.com',
            password='testpass123'
        )
        
        data = {
            'username': 'existinguser',  # Дублирующийся username
            'email': 'newuser@test.com',
            'password': 'complexpass123',
            'password2': 'complexpass123'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_user_serializer_fields(self):
        """Тест полей сериализатора пользователя"""
        User = get_user_model()
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        serializer = UserSerializer(user)
        expected_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_staff']
        
        for field in expected_fields:
            self.assertIn(field, serializer.data)