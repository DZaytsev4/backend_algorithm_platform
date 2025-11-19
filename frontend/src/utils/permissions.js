// Утилиты для проверки прав доступа

/**
 * Проверяет, является ли пользователь модератором
 * Модераторами считаются пользователи с is_staff = true
 * или находящиеся в группе 'Модераторы'
 */
export const isModerator = (user) => {
  if (!user) return false;
  
  // Проверяем флаг is_staff
  if (user.is_staff) {
    return true;
  }
  
  // Проверяем группы пользователя
  if (user.groups && Array.isArray(user.groups)) {
    return user.groups.includes('Модераторы');
  }
  
  // Если groups - это объекты, проверяем по имени
  if (user.groups && user.groups.some) {
    return user.groups.some(group => 
      typeof group === 'object' ? group.name === 'Модераторы' : group === 'Модераторы'
    );
  }
  
  return false;
};

/**
 * Проверяет, может ли пользователь редактировать алгоритм
 */
export const canEditAlgorithm = (algorithm, user) => {
  return user && user.username === algorithm.author_name;
};

/**
 * Проверяет, может ли пользователь модерировать алгоритм
 */
export const canModerateAlgorithm = (algorithm, user) => {
  return isModerator(user);
};

/**
 * Проверяет, может ли пользователь просматривать алгоритм
 */
export const canViewAlgorithm = (algorithm, user) => {
  // Одобренные алгоритмы видны всем
  if (algorithm.status === 'approved') {
    return true;
  }
  
  // Автор может видеть свои алгоритмы в любом статусе
  if (user && user.username === algorithm.author_name) {
    return true;
  }
  
  // Модераторы могут видеть все алгоритмы
  if (isModerator(user)) {
    return true;
  }
  
  return false;
};