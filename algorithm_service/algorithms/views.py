from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Algorithm
from .forms import AlgorithmForm

def algorithm_list(request):
    query = request.GET.get('q')
    
    if query:
        algorithms = Algorithm.objects.filter(
            Q(name__icontains=query) | 
            Q(tegs__icontains=query) |
            Q(description__icontains=query) |
            Q(author_name__icontains=query)
        )
    else:
        algorithms = Algorithm.objects.all()
    
    return render(request, 'algorithms/list.html', {
        'algorithms': algorithms,
        'query': query
    })

def algorithm_detail(request, algorithm_id):
    algorithm = get_object_or_404(Algorithm, id=algorithm_id)
    return render(request, 'algorithms/algorithm_detail.html', {
        'algorithm': algorithm
    })

@login_required
def add_algorithm(request):
    if request.method == 'POST':
        form = AlgorithmForm(request.POST)
        if form.is_valid():
            algorithm = form.save(commit=False)
            algorithm.author_name = request.user.username
            algorithm.save()
            messages.success(request, 'Алгоритм успешно добавлен!')
            return redirect('algorithm_list')
    else:
        form = AlgorithmForm()
    
    return render(request, 'algorithms/add_algorithm.html', {'form': form})

@login_required
def edit_algorithm(request, algorithm_id):
    """Представление для редактирования алгоритма"""
    algorithm = get_object_or_404(Algorithm, id=algorithm_id)
    
    # Проверяем, может ли пользователь редактировать этот алгоритм
    if not algorithm.can_edit(request.user):
        messages.error(request, 'У вас нет прав для редактирования этого алгоритма.')
        return redirect('algorithm_detail', algorithm_id=algorithm_id)
    
    if request.method == 'POST':
        form = AlgorithmForm(request.POST, instance=algorithm)
        if form.is_valid():
            form.save()
            messages.success(request, 'Алгоритм успешно обновлен!')
            return redirect('algorithm_detail', algorithm_id=algorithm_id)
    else:
        form = AlgorithmForm(instance=algorithm)
    
    return render(request, 'algorithms/edit_algorithm.html', {
        'form': form,
        'algorithm': algorithm
    })