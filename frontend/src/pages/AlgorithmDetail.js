import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  CircularProgress,
  Box,
  Grid,
} from '@mui/material';
import { Edit, Delete, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ALGORITHM_STATUS_DISPLAY } from '../utils/constants';

const AlgorithmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [algorithm, setAlgorithm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAlgorithm();
  }, [id]);

  const fetchAlgorithm = async () => {
    try {
      const response = await api.get(`/algorithms/${id}/`);
      setAlgorithm(response.data);
    } catch (error) {
      setError('Не удалось загрузить алгоритм');
      console.error('Error fetching algorithm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/algorithms/${id}/`);
      setDeleteDialogOpen(false);
      navigate('/algorithms');
    } catch (error) {
      setError('Не удалось удалить алгоритм');
      console.error('Error deleting algorithm:', error);
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!algorithm) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Алгоритм не найден</Alert>
        <Button component={Link} to="/algorithms" startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Назад к списку
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Заголовок и действия */}
      <Box sx={{ mb: 4 }}>
        <Button component={Link} to="/algorithms" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
          Назад к списку
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {algorithm.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip 
                label={ALGORITHM_STATUS_DISPLAY[algorithm.status]} 
                color={getStatusColor(algorithm.status)}
                size="small"
              />
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
          </Box>

          {algorithm.can_edit && (
            <Box display="flex" gap={1}>
              <Button
                component={Link}
                to={`/algorithms/${id}/edit`}
                variant="outlined"
                startIcon={<Edit />}
              >
                Редактировать
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Удалить
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Теги */}
      {algorithm.tags_list && algorithm.tags_list.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Теги</Typography>
          <Box>
            {algorithm.tags_list.map((tag, index) => (
              <Chip key={index} label={tag} variant="outlined" sx={{ mr: 1, mb: 1 }} />
            ))}
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Описание */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Описание
            </Typography>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {algorithm.description}
            </Typography>
          </Paper>
        </Grid>

        {/* Код */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Код алгоритма
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                bgcolor: 'grey.50',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              {algorithm.code}
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* Информация о модерации */}
      {algorithm.status === 'rejected' && algorithm.rejection_reason && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Причина отклонения:
          </Typography>
          {algorithm.rejection_reason}
        </Alert>
      )}

      {algorithm.moderated_by && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Модератор: {algorithm.moderated_by.username}
            {algorithm.moderated_at && (
              <> • {new Date(algorithm.moderated_at).toLocaleDateString('ru-RU')}</>
            )}
          </Typography>
        </Paper>
      )}

      {/* Диалог удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить алгоритм "{algorithm.name}"? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AlgorithmDetail;