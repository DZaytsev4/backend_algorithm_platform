import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginData, RegisterData } from '../types';
import { apiService } from '../service/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, tokens: { access: string; refresh: string }) => void;
  register: (data: RegisterData & { password2: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        console.log('Checking auth with token...');
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        console.log('User authenticated:', userData.username);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } else {
      console.log('No token found');
    }
    setLoading(false);
  };

  const login = (userData: User, tokens: { access: string; refresh: string }) => {
    console.log('AuthContext login called');
    setUser(userData);
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
  };

  const logout = () => {
    console.log('AuthContext logout called');
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const register = async (registerData: RegisterData & { password2: string }) => {
    try {
      console.log('1. Registering user...');
      
      // Регистрируем пользователя (не возвращает данных)
      await apiService.register(registerData);
      
      console.log('2. Registration successful, auto-login...');
      
      // Автоматически логинимся после регистрации
      const tokens = await apiService.login({
        username: registerData.username,
        password: registerData.password,
      });
      
      console.log('3. Login tokens received');
      
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      
      // Даем время для сохранения токена
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('4. Getting user data...');
      const userData = await apiService.getCurrentUser();
      
      console.log('5. User data received:', userData);
      
      // Обновляем контекст
      login(userData, tokens);
      
    } catch (error) {
      console.error('Registration failed:', error);
      // Очищаем токены в случае ошибки
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateUser(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};