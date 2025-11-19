import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  TextField,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlgorithmCard from '../components/algorithms/AlgorithmCard';
import api from '../services/api';

const Algorithms = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 12
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAlgorithms();
  }, [searchQuery, pagination.page]);

  const fetchAlgorithms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Всегда показываем только одобренные алгоритмы
      params.append('status', 'approved');
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      params.append('page', pagination.page);

      const response = await api.get(`/algorithms/?${params.toString()}`);
      
      // Обрабатываем разные форматы ответа
      let algorithmsData = [];
      let paginationData = {
        count: 0,
        next: null,
        previous: null
      };

      if (Array.isArray(response.data)) {
        algorithmsData = response.data;
      } else if (response.data.results) {
        algorithmsData = response.data.results;
        paginationData = {
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous
        };
      } else {
        algorithmsData = Object.values(response.data);
      }

      setAlgorithms(algorithmsData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));
    } catch (error) {
      console.error('API Response:', error.response?.data);
      setError('Не удалось загрузить алгоритмы');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.count / pagination.pageSize);

  return (
    <Container maxWidth="lg">
      {/* Заголовок и кнопка добавления */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Алгоритмы
        </Typography>
        {currentUser && (
          <Button
            variant="contained"
            component={Link}
            to="/algorithms/add"
            startIcon={<Add />}
          >
            Добавить алгоритм
          </Button>
        )}
      </Box>

      {/* Поиск */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Поиск по названию или тегам..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="outlined" 
              onClick={clearSearch}
              fullWidth
              disabled={!searchQuery}
            >
              Очистить поиск
            </Button>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Поиск по названию алгоритма и тегам
        </Typography>
      </Box>

      {/* Сообщения об ошибках */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Список алгоритмов */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : !algorithms || algorithms.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'Алгоритмы по вашему запросу не найдены' : 'Пока нет одобренных алгоритмов'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Будьте первым, кто добавит алгоритм!'}
          </Typography>
          {currentUser && (
            <Button
              variant="contained"
              component={Link}
              to="/algorithms/add"
              startIcon={<Add />}
              sx={{ mt: 2 }}
            >
              Добавить алгоритм
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Найдено алгоритмов: {pagination.count}
              {searchQuery && ` по запросу "${searchQuery}"`}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {algorithms.map((algorithm) => (
              <Grid item key={algorithm.id} xs={12} sm={6} md={4}>
                <AlgorithmCard algorithm={algorithm} />
              </Grid>
            ))}
          </Grid>

          {/* Пагинация */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination 
                count={totalPages} 
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Algorithms;