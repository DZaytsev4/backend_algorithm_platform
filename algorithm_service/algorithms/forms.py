from django import forms
from .models import Algorithm

class AlgorithmForm(forms.ModelForm):
    class Meta:
        model = Algorithm
        fields = ['name', 'tegs', 'description', 'code']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Название алгоритма'
            }),
            'tegs': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Теги через запятую'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Описание алгоритма',
                'rows': 4
            }),
            'code': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Код алгоритма',
                'rows': 8
            }),
        }
    
    def clean_name(self):
        name = self.cleaned_data['name']
        if len(name.strip()) < 3:
            raise forms.ValidationError('Название должно содержать минимум 3 символа')
        return name
    
    def clean_description(self):
        description = self.cleaned_data['description']
        if len(description.strip()) < 10:
            raise forms.ValidationError('Описание должно содержать минимум 10 символов')
        return description
    
    def clean_code(self):
        code = self.cleaned_data['code']
        if len(code.strip()) < 5:
            raise forms.ValidationError('Код должен содержать минимум 5 символов')
        return code