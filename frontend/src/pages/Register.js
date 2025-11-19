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
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
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

    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      console.log('1. Registering user...');
      
      // Регистрируем пользователя
      await api.post('/users/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2
      });
      
      console.log('2. Registration successful, auto-login...');
      
      // Автоматически логинимся после регистрации
      const tokenResponse = await api.post('/token/', {
        username: formData.username,
        password: formData.password
      });
      
      console.log('3. Login tokens received');
      
      const { access, refresh } = tokenResponse.data;
      
      // Сохраняем токены
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Получаем данные пользователя
      const userResponse = await api.get('/users/me/', {
        headers: {
          Authorization: `Bearer ${access}`
        }
      });
      
      console.log('4. User data received:', userResponse.data);
      
      // Обновляем контекст
      authLogin(userResponse.data, { access, refresh });
      
      console.log('5. Navigation to home');
      navigate('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = [];
          Object.entries(errorData).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages.map(msg => `${field}: ${msg}`));
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          });
          setError(errorMessages.join(', '));
        } else {
          setError(errorData);
        }
      } else if (error.request) {
        setError('Не удалось подключиться к серверу');
      } else {
        setError('Произошла ошибка при регистрации');
      }
      
      // Очищаем токены в случае ошибки
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Регистрация
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
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
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
              helperText="Минимум 8 символов"
            />
            <TextField
              fullWidth
              label="Подтверждение пароля"
              name="password2"
              type="password"
              value={formData.password2}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Box textAlign="center">
              <Typography variant="body2">
                Уже есть аккаунт?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Войдите
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;