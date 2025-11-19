import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../service/api';
import { User, Algorithm } from '../types';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const [userAlgorithms, setUserAlgorithms] = useState<Algorithm[]>([]);
  const [algorithmsLoading, setAlgorithmsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setAlgorithmsLoading(true);
        const algorithms = await apiService.getUserAlgorithms(user.username);
        setUserAlgorithms(algorithms);
      } catch (err) {
        setError('Ошибка загрузки данных пользователя');
        console.error('Profile data fetch error:', err);
      } finally {
        setAlgorithmsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(editForm);
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Ошибка обновления профиля');
      console.error('Profile update error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (authLoading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Проверка аутентификации...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 8L18 10M18 10L16 12M18 10L20 12M18 10L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Доступ ограничен</h1>
          <p className="unauthorized-message">
            Для просмотра профиля необходимо авторизоваться в системе
          </p>
          <div className="unauthorized-actions">
            <Link to="/login" className="auth-btn primary">
              <span>Войти в аккаунт</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/register" className="auth-btn secondary">
              <span>Создать аккаунт</span>
            </Link>
          </div>
          <div className="unauthorized-features">
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>Создавайте собственные алгоритмы</span>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>Сохраняйте избранные решения</span>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>Отслеживайте свою активность</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Профиль пользователя</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="profile-content">
        <div className="profile-info-section">
          <h2>Информация профиля</h2>
          
          {!isEditing ? (
            <div className="profile-info">
              <div className="info-section">
                <label>Имя пользователя:</label>
                <span>{user.username}</span>
              </div>

              <div className="info-section">
                <label>Email:</label>
                <span>{user.email || 'Не указан'}</span>
              </div>

              <div className="info-section">
                <label>Имя:</label>
                <span>{user.first_name || 'Не указано'}</span>
              </div>

              <div className="info-section">
                <label>Фамилия:</label>
                <span>{user.last_name || 'Не указана'}</span>
              </div>

              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Редактировать профиль
              </button>
            </div>
          ) : (
            <form className="edit-form" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Имя пользователя:</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Имя:</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Фамилия:</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  Сохранить
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="algorithms-section">
          <h2>Мои алгоритмы ({userAlgorithms.length})</h2>
          
          {algorithmsLoading ? (
            <div className="loading">Загрузка алгоритмов...</div>
          ) : userAlgorithms.length === 0 ? (
            <div className="no-algorithms">
              У вас пока нет созданных алгоритмов
            </div>
          ) : (
            <div className="algorithms-list">
              {userAlgorithms.map((algorithm) => (
                <div key={algorithm.id} className="algorithm-card">
                  <h3>{algorithm.title}</h3>
                  <p>{algorithm.description}</p>
                  <div className="algorithm-meta">
                    <span className={`status ${algorithm.isPaid ? 'paid' : 'free'}`}>
                      {algorithm.isPaid ? 'Платный' : 'Бесплатный'}
                    </span>
                    <span className="language">{algorithm.language}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;