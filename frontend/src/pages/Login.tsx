import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../service/api';
import './Auth.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('1. Getting tokens...');
      const tokens = await apiService.login(formData);
      console.log('2. Tokens received:', tokens);
      
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      console.log('3. Tokens saved to localStorage');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('4. Getting user data...');
      const user = await apiService.getCurrentUser();
      console.log('5. User data received:', user);
      
      console.log('6. Updating auth context...');
      login(user, tokens);
      
      console.log('7. Navigation to home');
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      if ((error as any).response?.status === 401) {
        setError('Неверное имя пользователя или пароль');
      } else if ((error as any).message) {
        setError((error as Error).message);
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Вход в систему</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;