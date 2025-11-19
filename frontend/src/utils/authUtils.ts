import { User } from '../types';

export const hasModerationAccess = (user: User | null): boolean => {
  if (!user) return false;
  
  console.log('Checking moderation access for user:', user);
  
  // Проверяем стандартное поле role
  if (user.role === 'moderator' || user.role === 'admin') {
    return true;
  }
  
  // Проверяем дополнительные поля из Django
  const userAny = user as any;
  
  // Django fields
  if (userAny.is_staff || userAny.is_superuser) {
    return true;
  }
  
  // Проверяем группы
  if (userAny.groups && Array.isArray(userAny.groups)) {
    const groupNames = userAny.groups.map((group: any) => 
      typeof group === 'string' ? group.toLowerCase() : 
      (group.name ? group.name.toLowerCase() : '')
    );
    
    const moderatorGroups = [
      'moderator', 'moderators', 'модератор', 'модераторы',
      'admin', 'administrators', 'администратор', 'администраторы'
    ];
    
    if (groupNames.some((group: string) => moderatorGroups.includes(group))) {
      return true;
    }
  }
  
  return false;
};

export const getUserRoleDisplay = (user: User): string => {
  const userAny = user as any;
  
  if (user.role) return user.role;
  if (userAny.is_superuser) return 'admin';
  if (userAny.is_staff) return 'staff';
  if (userAny.groups && userAny.groups.length > 0) {
    return userAny.groups.map((g: any) => typeof g === 'string' ? g : g.name).join(', ');
  }
  
  return 'consumer';
};