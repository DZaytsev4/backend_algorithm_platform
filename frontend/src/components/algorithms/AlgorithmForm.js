import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import api from '../../services/api';

const AlgorithmForm = ({ editMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(editMode);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    tegs: '',
    description: '',
    code: '',
  });

  useEffect(() => {
    if (editMode && id) {
      fetchAlgorithm();
    }
  }, [editMode, id]);

  const fetchAlgorithm = async () => {
    try {
      const response = await api.get(`/algorithms/${id}/`);
      setFormData({
        name: response.data.name,
        tegs: response.data.tegs,
        description: response.data.description,
        code: response.data.code,
      });
    } catch (error) {
      setError('Не удалось загрузить алгоритм для редактирования');
      console.error('Error fetching algorithm:', error);
    } finally {
      setFetchLoading(false);
    }
  };

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
      if (editMode) {
        await api.put(`/algorithms/${id}/`, formData);
      } else {
        await api.post('/algorithms/', formData);
      }
      navigate('/algorithms');
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = [];
          Object.values(errorData).forEach(messages => {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages);
            } else {
              errorMessages.push(messages);
            }
          });
          setError(errorMessages.join(', '));
        } else {
          setError(errorData);
        }
      } else {
        setError('Произошла ошибка при сохранении алгоритма');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" component="h1" gutterBottom>
          {editMode ? 'Редактирование алгоритма' : 'Добавление алгоритма'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3 }}>
          <TextField
            fullWidth
            label="Название алгоритма"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Минимум 3 символа"
          />

          <TextField
            fullWidth
            label="Теги"
            name="tegs"
            value={formData.tegs}
            onChange={handleChange}
            margin="normal"
            helperText="Укажите теги через запятую (например: сортировка, python, алгоритм)"
          />

          <TextField
            fullWidth
            label="Описание"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
            helperText="Минимум 10 символов. Опишите назначение и особенности алгоритма"
          />

          <TextField
            fullWidth
            label="Код алгоритма"
            name="code"
            value={formData.code}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={8}
            required
            helperText="Минимум 5 символов. Укажите реализацию алгоритма на любом языке программирования"
            sx={{
              '& textarea': {
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }
            }}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
            >
              {loading ? 'Сохранение...' : (editMode ? 'Обновить алгоритм' : 'Добавить алгоритм')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/algorithms')}
              size="large"
            >
              Отмена
            </Button>
          </Box>

          {!editMode && (
            <FormHelperText sx={{ mt: 1 }}>
              После добавления алгоритм будет отправлен на модерацию. Вы сможете просматривать его в своем профиле.
            </FormHelperText>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AlgorithmForm;