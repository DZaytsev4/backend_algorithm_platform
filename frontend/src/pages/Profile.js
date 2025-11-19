import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Box,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { isModerator } from '../utils/permissions';
import AlgorithmCard from '../components/algorithms/AlgorithmCard';
import api from '../services/api';

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      const [userResponse, algorithmsResponse] = await Promise.all([
        api.get(`/users/${username}/`),
        api.get(`/users/${username}/algorithms/`)
      ]);
      
      setUser(userResponse.data);
      
      // Обрабатываем разные форматы ответа для алгоритмов
      let algorithmsData = [];
      if (Array.isArray(algorithmsResponse.data)) {
        algorithmsData = algorithmsResponse.data;
      } else if (algorithmsResponse.data.results) {
        algorithmsData = algorithmsResponse.data.results;
      } else {
        algorithmsData = Object.values(algorithmsResponse.data);
      }
      
      setAlgorithms(algorithmsData);
    } catch (error) {
      setError('Не удалось загрузить данные пользователя');
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmsByStatus = (status) => {
    return algorithms.filter(alg => alg.status === status);
  };

  const approvedCount = getAlgorithmsByStatus('approved').length;
  const pendingCount = getAlgorithmsByStatus('pending').length;
  const rejectedCount = getAlgorithmsByStatus('rejected').length;

  const isOwnProfile = currentUser && currentUser.username === username;
  const userIsModerator = isModerator(currentUser);

  // Для обычных пользователей показываем только одобренные алгоритмы других пользователей
  const visibleAlgorithms = isOwnProfile || userIsModerator ? 
    algorithms : 
    algorithms.filter(alg => alg.status === 'approved');

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Пользователь не найден</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Заголовок профиля */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Профиль пользователя: {user.username}
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Chip label={`Алгоритмов: ${isOwnProfile || userIsModerator ? algorithms.length : approvedCount}`} variant="outlined" />
          <Chip label={`Одобрено: ${approvedCount}`} color="success" variant="outlined" />
          {(isOwnProfile || userIsModerator) && (
            <>
              <Chip label={`На модерации: ${pendingCount}`} color="warning" variant="outlined" />
              <Chip label={`Отклонено: ${rejectedCount}`} color="error" variant="outlined" />
            </>
          )}
        </Box>
        {user.email && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Email: {user.email}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Зарегистрирован: {new Date(user.date_joined).toLocaleDateString('ru-RU')}
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Табы с алгоритмами - показываем только для владельца профиля или модераторов */}
      {(isOwnProfile || userIsModerator) ? (
        <Paper>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`Все алгоритмы (${algorithms.length})`} />
            <Tab label={`Одобренные (${approvedCount})`} />
            <Tab label={`На модерации (${pendingCount})`} />
            <Tab label={`Отклоненные (${rejectedCount})`} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <AlgorithmGrid algorithms={algorithms} showAllStatuses={true} />
            )}
            {activeTab === 1 && (
              <AlgorithmGrid algorithms={getAlgorithmsByStatus('approved')} />
            )}
            {activeTab === 2 && (
              <AlgorithmGrid algorithms={getAlgorithmsByStatus('pending')} showAllStatuses={true} />
            )}
            {activeTab === 3 && (
              <AlgorithmGrid algorithms={getAlgorithmsByStatus('rejected')} showAllStatuses={true} />
            )}
          </Box>
        </Paper>
      ) : (
        // Для обычных пользователей показываем только одобренные алгоритмы
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Алгоритмы пользователя
          </Typography>
          <AlgorithmGrid algorithms={visibleAlgorithms} />
        </Box>
      )}
    </Container>
  );
};

const AlgorithmGrid = ({ algorithms, showAllStatuses = false }) => {
  if (algorithms.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Алгоритмы не найдены
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {showAllStatuses ? 
            'Пользователь еще не добавил алгоритмов' : 
            'У пользователя нет одобренных алгоритмов'}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {algorithms.map((algorithm) => (
        <Grid item key={algorithm.id} xs={12} sm={6} md={4}>
          <AlgorithmCard algorithm={algorithm} />
        </Grid>
      ))}
    </Grid>
  );
};

export default Profile;