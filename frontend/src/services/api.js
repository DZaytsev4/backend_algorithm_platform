import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✓ Token added to request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    console.log('✓ API Response success:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('✗ API Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      console.log('401 error - removing tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Не перенаправляем автоматически, чтобы компоненты могли обработать ошибку
    }
    
    return Promise.reject(error);
  }
);

export default api;