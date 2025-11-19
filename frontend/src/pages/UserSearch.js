import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (searchQuery.trim()) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Если пользователь не авторизован, показываем сообщение
      if (!currentUser) {
        setError('Для поиска пользователей необходимо авторизоваться');
        setLoading(false);
        return;
      }

      const response = await api.get(`/users/search/?username=${encodeURIComponent(searchQuery)}`);
      
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data.results) {
        usersData = response.data.results;
      } else {
        usersData = Object.values(response.data);
      }
      
      setUsers(usersData);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Для поиска пользователей необходимо авторизоваться');
      } else {
        setError('Не удалось выполнить поиск пользователей');
      }
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (!currentUser) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info">
          Для поиска пользователей необходимо <Link to="/login">войти в систему</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Поиск пользователей
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Введите имя пользователя для поиска..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item key={user.id} xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">
                      {user.username}
                    </Typography>
                  </Box>
                  {user.email && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email: {user.email}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Зарегистрирован: {new Date(user.date_joined).toLocaleDateString('ru-RU')}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/profile/${user.username}`}
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Перейти к профилю
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {searchQuery && !loading && users.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            Пользователи не найдены
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default UserSearch;