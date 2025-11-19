import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Code, Group, Security, ArrowForward } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AlgorithmCard from '../components/algorithms/AlgorithmCard';
import api from '../services/api';

const Home = () => {
  const { currentUser } = useAuth();
  const [featuredAlgorithms, setFeaturedAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedAlgorithms();
  }, []);

  const fetchFeaturedAlgorithms = async () => {
    try {
      // Получаем только одобренные алгоритмы для главной страницы
      const response = await api.get('/algorithms/?status=approved&limit=6');
      
      let algorithmsData = [];
      if (Array.isArray(response.data)) {
        algorithmsData = response.data;
      } else if (response.data.results) {
        algorithmsData = response.data.results;
      } else {
        algorithmsData = Object.values(response.data);
      }
      
      setFeaturedAlgorithms(algorithmsData);
    } catch (error) {
      console.error('Error fetching featured algorithms:', error);
      setError('Не удалось загрузить популярные алгоритмы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Добро пожаловать в сервис алгоритмов
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Изучайте, делитесь и обсуждайте алгоритмы с сообществом
        </Typography>
        <Box sx={{ mt: 4, gap: 2 }}>
          {currentUser ? (
            <>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/algorithms"
                sx={{ mr: 2 }}
              >
                Смотреть алгоритмы
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/algorithms/add"
              >
                Добавить алгоритм
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/register"
                sx={{ mr: 2 }}
              >
                Начать сейчас
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/login"
              >
                Войти
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Почему выбирают нас?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Code sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Проверенные алгоритмы
                </Typography>
                <Typography color="text.secondary">
                  Все алгоритмы проходят модерацию для обеспечения качества и корректности
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Group sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Сообщество
                </Typography>
                <Typography color="text.secondary">
                  Общайтесь с другими разработчиками, делитесь знаниями и опытом
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Качество
                </Typography>
                <Typography color="text.secondary">
                  Только проверенные и одобренные алгоритмы от сообщества
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Featured Algorithms Section */}
      <Box sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h2">
            Недавно добавленные алгоритмы
          </Typography>
          <Button 
            component={Link} 
            to="/algorithms" 
            endIcon={<ArrowForward />}
          >
            Все алгоритмы
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {featuredAlgorithms.slice(0, 6).map((algorithm) => (
              <Grid item key={algorithm.id} xs={12} sm={6} md={4}>
                <AlgorithmCard algorithm={algorithm} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && featuredAlgorithms.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Пока нет одобренных алгоритмов
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Будьте первым, кто добавит алгоритм!
            </Typography>
            {currentUser && (
              <Button
                variant="contained"
                component={Link}
                to="/algorithms/add"
                sx={{ mt: 2 }}
              >
                Добавить алгоритм
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home;