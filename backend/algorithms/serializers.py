from rest_framework import serializers
from .models import Algorithm

class AlgorithmSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tags_list = serializers.ListField(source='get_tags_list', read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_moderate = serializers.SerializerMethodField()

    class Meta:
        model = Algorithm
        fields = [
            'id', 'name', 'tegs', 'description', 'code', 'author_name', 
            'status', 'status_display', 'moderated_by', 'moderated_at',
            'rejection_reason', 'created_at', 'updated_at', 'tags_list',
            'can_edit', 'can_moderate'
        ]
        read_only_fields = [
            'id', 'author_name', 'moderated_by', 'moderated_at', 
            'created_at', 'updated_at', 'status_display', 'tags_list',
            'can_edit', 'can_moderate'
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request:
            return obj.can_edit(request.user)
        return False

    def get_can_moderate(self, obj):
        request = self.context.get('request')
        if request:
            return obj.can_moderate(request.user)
        return False

    def create(self, validated_data):
        # Устанавливаем автора из запроса
        request = self.context.get('request')
        validated_data['author_name'] = request.user.username
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Если обновляются поля, которые требуют сброса модерации, сбрасываем
        if instance.status in [Algorithm.STATUS_APPROVED, Algorithm.STATUS_REJECTED]:
            instance.reset_moderation()
        return super().update(instance, validated_data)