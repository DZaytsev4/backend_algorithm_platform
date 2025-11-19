import api from './api';

export const login = async (username, password) => {
  const response = await api.post('/token/', { 
    username, 
    password 
  });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/users/register/', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me/');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const refreshToken = async (refresh) => {
  const response = await api.post('/token/refresh/', { refresh });
  return response.data;
};