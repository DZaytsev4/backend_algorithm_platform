from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from algorithms.models import Algorithm

class Command(BaseCommand):
    help = 'Создает группу модераторов и назначает права'

    def handle(self, *args, **options):
        # Создаем группу модераторов
        moderator_group, created = Group.objects.get_or_create(name='Модераторы')
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Группа "Модераторы" создана')
            )
        else:
            self.stdout.write(
                self.style.WARNING('Группа "Модераторы" уже существует')
            )