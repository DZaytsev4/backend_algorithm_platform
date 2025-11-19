# algorithms/tests.py
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User 
from .models import Algorithm

class SearchFunctionalityTests(TestCase):
    def setUp(self):
        Algorithm.objects.create(
            name="Бинарный поиск",
            tegs="поиск, алгоритм, массив",
            description="Алгоритм поиска в отсортированном массиве",
            code="def binary_search(arr, target):\n    left, right = 0, len(arr) - 1"
        )
        Algorithm.objects.create(
            name="Сортировка пузырьком", 
            tegs="сортировка, алгоритм, python",
            description="Простой алгоритм сортировки",
            code="def bubble_sort(arr):\n    n = len(arr)"
        )
        Algorithm.objects.create(
            name="Быстрая сортировка",
            tegs="сортировка, quicksort, рекурсия", 
            description="Эффективный алгоритм сортировки",
            code="def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr"
        )

    def test_search_by_algorithm_name(self):
        """Тест поиска по названию алгоритма"""
        response = self.client.get(reverse('algorithm_list'), {'q': 'Бинарный'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Бинарный поиск")
        self.assertNotContains(response, "Сортировка пузырьком")

    def test_search_by_tags(self):
        """Тест поиска по тегам"""
        response = self.client.get(reverse('algorithm_list'), {'q': 'python'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Сортировка пузырьком")
        self.assertNotContains(response, "Быстрая сортировка")

    def test_search_multiple_results(self):
        """Тест поиска, который находит несколько результатов"""
        response = self.client.get(reverse('algorithm_list'), {'q': 'сортировка'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Сортировка пузырьком")
        self.assertContains(response, "Быстрая сортировка")
        self.assertNotContains(response, "Бинарный поиск")

    def test_search_no_results(self):
        """Тест поиска без результатов"""
        response = self.client.get(reverse('algorithm_list'), {'q': 'несуществующий'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ничего не найдено")
        self.assertNotContains(response, "Бинарный поиск")

    def test_empty_search_returns_all(self):
        """Тест пустого поиска (должен вернуть все алгоритмы)"""
        response = self.client.get(reverse('algorithm_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Бинарный поиск")
        self.assertContains(response, "Сортировка пузырьком")
        self.assertContains(response, "Быстрая сортировка")


#-----------------------------------------------------------------------------

class AuthenticationTests(TestCase):
    """Тесты для регистрации, входа и выхода из системы"""
    
    def setUp(self):
        # Создаем тестового пользователя для тестов входа
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com', 
            'password': 'testpass123'
        }
        self.user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password']
        )

    def test_user_registration_success(self):
        """Тест успешной регистрации нового пользователя"""
        new_user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password1': 'complexpassword123',
            'password2': 'complexpassword123'
        }
        
        response = self.client.post(reverse('register'), new_user_data)
        
        # Проверяем редирект после успешной регистрации
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('algorithm_list'))
        
        # Проверяем, что пользователь создан в базе данных
        self.assertTrue(User.objects.filter(username='newuser').exists())
        
        # Проверяем, что пользователь автоматически авторизован после регистрации
        response = self.client.get(reverse('algorithm_list'))
        self.assertContains(response, 'Выйти')  # Кнопка выхода вместо входа

    def test_user_registration_password_mismatch(self):
        """Тест регистрации с несовпадающими паролями"""
        invalid_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password1': 'password123',
            'password2': 'differentpassword'
        }
        
        response = self.client.post(reverse('register'), invalid_data)
        
        # Должен остаться на странице регистрации с ошибкой
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'error')
        self.assertFalse(User.objects.filter(username='newuser').exists())

    def test_user_registration_existing_username(self):
        """Тест регистрации с уже существующим именем пользователя"""
        existing_user_data = {
            'username': 'testuser',  # Уже существует
            'email': 'new@example.com',
            'password1': 'password123',
            'password2': 'password123'
        }
        
        response = self.client.post(reverse('register'), existing_user_data)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'error')

    def test_user_login_success(self):
        """Тест успешного входа в систему"""
        login_data = {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }
        
        response = self.client.post(reverse('login'), login_data)
        
        # Проверяем редирект после успешного входа
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('algorithm_list'))
        
        # Проверяем, что пользователь авторизован
        response = self.client.get(reverse('algorithm_list'))
        self.assertContains(response, 'Выйти')  # Кнопка выхода вместо входа

    def test_user_login_wrong_password(self):
        """Тест входа с неправильным паролем"""
        login_data = {
            'username': self.user_data['username'],
            'password': 'wrongpassword'
        }
        
        response = self.client.post(reverse('login'), login_data)
        
        # Должен остаться на странице входа с ошибкой
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Неверное имя пользователя или пароль')

    def test_user_login_nonexistent_user(self):
        """Тест входа с несуществующим пользователем"""
        login_data = {
            'username': 'nonexistent',
            'password': 'anypassword'
        }
        
        response = self.client.post(reverse('login'), login_data)
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Неверное имя пользователя или пароль')

    def test_user_logout(self):
        """Тест выхода из системы"""
        # Сначала логинимся
        self.client.login(
            username=self.user_data['username'],
            password=self.user_data['password']
        )
        
        # Проверяем, что пользователь авторизован
        response = self.client.get(reverse('algorithm_list'))
        self.assertContains(response, 'Выйти')
        
        # Выходим
        response = self.client.post(reverse('logout'))
        
        # Проверяем редирект после выхода
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('algorithm_list'))
        
        # Проверяем, что пользователь разлогинен
        response = self.client.get(reverse('algorithm_list'))
        self.assertContains(response, 'Войти')  # Теперь должна быть кнопка входа

    def test_navigation_links_authenticated(self):
        """Тест навигационных ссылок для авторизованного пользователя"""
        self.client.login(
            username=self.user_data['username'],
            password=self.user_data['password']
        )
        
        response = self.client.get(reverse('algorithm_list'))
        
        # Должны видеть кнопку выхода, а не входа
        self.assertContains(response, 'Выйти')
        self.assertNotContains(response, 'Войти')

    def test_navigation_links_unauthenticated(self):
        """Тест навигационных ссылок для неавторизованного пользователя"""
        response = self.client.get(reverse('algorithm_list'))
        
        # Должны видеть кнопки входа и регистрации
        self.assertContains(response, 'Войти')
        self.assertContains(response, 'Регистрация')
        self.assertNotContains(response, 'Выйти')