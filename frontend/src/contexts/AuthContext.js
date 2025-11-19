import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        console.log('Checking auth with token...');
        const user = await getCurrentUser();
        setCurrentUser(user);
        console.log('User authenticated:', user.username);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Если запрос не удался, очищаем токены
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setCurrentUser(null);
      }
    } else {
      console.log('No token found');
    }
    setLoading(false);
  };

  const login = (userData, tokens) => {
    console.log('AuthContext login called');
    setCurrentUser(userData);
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
  };

  const logout = () => {
    console.log('AuthContext logout called');
    setCurrentUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};