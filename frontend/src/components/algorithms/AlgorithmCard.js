import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Visibility, Code, Person, Schedule } from '@mui/icons-material';
import { ALGORITHM_STATUS_DISPLAY } from '../../utils/constants';

const AlgorithmCard = ({ algorithm }) => {
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Заголовок */}
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            fontWeight: 600,
            minHeight: '56px'
          }}
        >
          {algorithm.name}
        </Typography>

        {/* Информация об авторе и дате */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {algorithm.author_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(algorithm.created_at).toLocaleDateString('ru-RU')}
            </Typography>
          </Box>
        </Box>

        {/* Теги */}
        {algorithm.tags_list && algorithm.tags_list.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {algorithm.tags_list.slice(0, 3).map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                variant="outlined" 
                size="small"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  fontSize: '0.7rem'
                }}
              />
            ))}
            {algorithm.tags_list.length > 3 && (
              <Chip 
                label={`+${algorithm.tags_list.length - 3}`} 
                size="small"
                sx={{ 
                  mb: 0.5,
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
        )}

        {/* Описание */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
            mb: 2,
            minHeight: '63px'
          }}
        >
          {truncateText(algorithm.description, 150)}
        </Typography>

        {/* Информация о коде */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto',
          pt: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Code sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {algorithm.code?.length || 0} симв.
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          size="small" 
          component={Link} 
          to={`/algorithms/${algorithm.id}`}
          startIcon={<Visibility />}
          fullWidth
          variant="outlined"
        >
          Подробнее
        </Button>
      </CardActions>
    </Card>
  );
};

export default AlgorithmCard;