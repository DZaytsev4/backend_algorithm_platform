import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
} from '@mui/material';
import { Check, Close, Visibility, Code } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ALGORITHM_STATUS_DISPLAY } from '../utils/constants';

const Moderation = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchModerationAlgorithms();
  }, [activeTab]);

  const fetchModerationAlgorithms = async () => {
    try {
      setLoading(true);
      let endpoint = '/algorithms/moderation/';
      
      // Если выбрана вкладка "Все", получаем все алгоритмы для модераторов
      if (activeTab === 1) {
        // Для модераторов можно показать все алгоритмы или другие статусы
        const response = await api.get('/algorithms/');
        let algorithmsData = [];
        if (Array.isArray(response.data)) {
          algorithmsData = response.data;
        } else if (response.data.results) {
          algorithmsData = response.data.results;
        } else {
          algorithmsData = Object.values(response.data);
        }
        setAlgorithms(algorithmsData);
        setLoading(false);
        return;
      }

      const response = await api.get(endpoint);
      
      let algorithmsData = [];
      if (Array.isArray(response.data)) {
        algorithmsData = response.data;
      } else if (response.data.results) {
        algorithmsData = response.data.results;
      } else {
        algorithmsData = Object.values(response.data);
      }
      
      setAlgorithms(algorithmsData);
    } catch (error) {
      console.error('Error fetching moderation algorithms:', error);
      if (error.response?.status === 403) {
        setError('У вас нет прав для доступа к модерации');
      } else {
        setError('Не удалось загрузить алгоритмы для модерации');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModerationDialog = (algorithm, action = null) => {
    setSelectedAlgorithm(algorithm);
    setRejectionReason('');
    setModerationDialogOpen(true);
  };

  const handleCloseModerationDialog = () => {
    setModerationDialogOpen(false);
    setSelectedAlgorithm(null);
    setRejectionReason('');
  };

  const moderateAlgorithm = async (status) => {
    if (!selectedAlgorithm) return;

    setActionLoading(true);
    try {
      await api.post(`/algorithms/moderation/${selectedAlgorithm.id}/`, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : ''
      });
      
      // Удаляем алгоритм из списка после модерации
      setAlgorithms(prev => prev.filter(alg => alg.id !== selectedAlgorithm.id));
      handleCloseModerationDialog();
      
      // Показываем сообщение об успехе
      setError('');
    } catch (error) {
      console.error('Error moderating algorithm:', error);
      setError('Не удалось выполнить модерацию');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Проверяем права доступа
  if (!currentUser || (!currentUser.is_staff && !currentUser.groups?.includes('Модераторы'))) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          У вас нет прав для доступа к этой странице. Только модераторы и администраторы могут просматривать эту страницу.
        </Alert>
      </Container>
    );
  }

  const pendingAlgorithms = algorithms.filter(alg => alg.status === 'pending');
  const allAlgorithms = algorithms;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Панель модерации
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Здесь вы можете просматривать и модерировать алгоритмы, отправленные пользователями.
      </Typography>

      {error && (
        <Alert 
          severity={error.includes('У вас нет прав') ? 'error' : 'warning'} 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={`На модерации (${pendingAlgorithms.length})`} 
          />
          <Tab 
            label="Все алгоритмы" 
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : activeTab === 0 && pendingAlgorithms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Нет алгоритмов для модерации
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Все алгоритмы прошли модерацию. Новые появления появятся здесь автоматически.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {(activeTab === 0 ? pendingAlgorithms : allAlgorithms).map((algorithm) => (
            <Grid item key={algorithm.id} xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flexGrow={1}>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <Typography variant="h6" component={Link} to={`/algorithms/${algorithm.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                          {algorithm.name}
                        </Typography>
                        <Chip 
                          label={ALGORITHM_STATUS_DISPLAY[algorithm.status]} 
                          color={getStatusColor(algorithm.status)}
                          size="small"
                        />
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Автор: {algorithm.author_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Создан: {new Date(algorithm.created_at).toLocaleDateString('ru-RU')}
                        </Typography>
                        {algorithm.updated_at !== algorithm.created_at && (
                          <Typography variant="body2" color="text.secondary">
                            Обновлен: {new Date(algorithm.updated_at).toLocaleDateString('ru-RU')}
                          </Typography>
                        )}
                      </Box>

                      {algorithm.tags_list && algorithm.tags_list.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {algorithm.tags_list.map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              variant="outlined" 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }} 
                            />
                          ))}
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {truncateText(algorithm.description, 200)}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                        <Code sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Код: {algorithm.code.length} символов
                        </Typography>
                      </Box>

                      {algorithm.status === 'rejected' && algorithm.rejection_reason && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Причина отклонения:
                          </Typography>
                          {algorithm.rejection_reason}
                        </Alert>
                      )}

                      {algorithm.moderated_by && (
                        <Typography variant="body2" color="text.secondary">
                          Модератор: {algorithm.moderated_by.username}
                          {algorithm.moderated_at && (
                            <> • {new Date(algorithm.moderated_at).toLocaleDateString('ru-RU')}</>
                          )}
                        </Typography>
                      )}
                    </Box>

                    {algorithm.status === 'pending' && (
                      <Box display="flex" flexDirection="column" gap={1} sx={{ ml: 2, minWidth: 120 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleOpenModerationDialog(algorithm, 'approve')}
                          size="small"
                        >
                          Одобрить
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleOpenModerationDialog(algorithm, 'reject')}
                          size="small"
                        >
                          Отклонить
                        </Button>
                        <Button
                          component={Link}
                          to={`/algorithms/${algorithm.id}`}
                          variant="outlined"
                          startIcon={<Visibility />}
                          size="small"
                          target="_blank"
                        >
                          Подробнее
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Диалог модерации */}
      <Dialog 
        open={moderationDialogOpen} 
        onClose={handleCloseModerationDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Модерация алгоритма
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {selectedAlgorithm?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Автор: {selectedAlgorithm?.author_name}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Причина отклонения"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Укажите причину, если отклоняете алгоритм..."
            helperText="Обязательно для заполнения при отклонении"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseModerationDialog}
            disabled={actionLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={() => moderateAlgorithm('approved')}
            color="success"
            variant="contained"
            disabled={actionLoading}
            startIcon={<Check />}
          >
            Одобрить
          </Button>
          <Button
            onClick={() => moderateAlgorithm('rejected')}
            color="error"
            variant="outlined"
            disabled={actionLoading || !rejectionReason.trim()}
            startIcon={<Close />}
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Moderation;