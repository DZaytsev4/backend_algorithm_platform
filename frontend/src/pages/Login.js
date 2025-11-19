import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login, getCurrentUser } from '../services/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('1. Getting tokens...');
      const tokens = await login(formData.username, formData.password);
      console.log('2. Tokens received:', tokens);
      
      // Сохраняем токены
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      console.log('3. Tokens saved to localStorage');
      
      // Даем время для сохранения токена перед следующим запросом
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('4. Getting user data...');
      const user = await getCurrentUser();
      console.log('5. User data received:', user);
      
      console.log('6. Updating auth context...');
      authLogin(user, tokens);
      
      console.log('7. Navigation to home');
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Очищаем токены в случае ошибки
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      if (error.response?.status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat();
          setError(errorMessages.join(', '));
        } else {
          setError(errorData);
        }
      } else if (error.request) {
        setError('Не удалось подключиться к серверу');
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Вход в систему
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Имя пользователя"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
            <Box textAlign="center">
              <Typography variant="body2">
                Нет аккаунта?{' '}
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  Зарегистрируйтесь
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;