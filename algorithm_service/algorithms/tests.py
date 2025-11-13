# algorithms/tests.py
from django.test import TestCase
from django.urls import reverse
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