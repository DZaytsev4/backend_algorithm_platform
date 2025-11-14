Настройка проекта:
Первоначальные действия:
1. Форк к себе
2. git clone ...
3. pip install django 
При обновление проекта и первом запуске:
Заходим в папку с проектом и делаем следующие действия:
1. python manage.py makemigrations 
2. python manage.py migrate 
3. (по необходимости) python manage.py createsuperuser
4. python manage.py runserver -- запуск сервера
