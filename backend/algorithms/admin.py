from django.contrib import admin
from .models import Algorithm

@admin.register(Algorithm)
class AlgorithmAdmin(admin.ModelAdmin):
    list_display = ('name', 'author_name', 'created_at', 'updated_at')
    list_filter = ('author_name', 'created_at')
    search_fields = ('name', 'author_name')
    readonly_fields = ('created_at', 'updated_at')