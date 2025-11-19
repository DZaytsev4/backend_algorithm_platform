import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../service/api';
import { Algorithm } from '../types';
import './AlgorithmDetails.css';

const AlgorithmDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchAlgorithm = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await apiService.getAlgorithmById(id);
        setAlgorithm(data);
      } catch (err) {
        setError('Ошибка загрузки алгоритма');
        console.error('Failed to fetch algorithm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlgorithm();
  }, [id]);

  const handleCopyCode = async () => {
    if (!algorithm?.code) return;
    
    try {
      await navigator.clipboard.writeText(algorithm.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (loading) {
    return (
      <div className="algorithm-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Загрузка алгоритма...</div>
        </div>
      </div>
    );
  }

  if (error || !algorithm) {
    return (
      <div className="algorithm-details">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error || 'Алгоритм не найден'}</div>
          <button onClick={() => navigate('/')} className="back-btn error-btn">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="algorithm-details">
      <div className="details-header">
        <Link to="/" className="back-link">
          <span className="back-arrow">←</span>
          Назад к поиску
        </Link>
        <h1 className="algorithm-title">{algorithm.title}</h1>
        <div className="algorithm-meta">
          <div className="meta-badges">
            <div className="meta-badge">
              <span className="badge-icon">👤</span>
              <div className="badge-content">
                <span className="badge-label">Автор</span>
                <span className="badge-value">{algorithm.author}</span>
              </div>
            </div>
            <div className="meta-badge">
              <span className="badge-icon">📅</span>
              <div className="badge-content">
                <span className="badge-label">Добавлен</span>
                <span className="badge-value">
                  {new Date(algorithm.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-content">
        <div className="main-content">
          <section className="content-section">
            <h2 className="section-title">Описание</h2>
            <div className="description-text">
              <p>{algorithm.description}</p>
            </div>
          </section>

          {algorithm.code && (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">Код алгоритма</h2>
                <div className="code-meta">
                  <span className="language-badge">{algorithm.language}</span>
                  <span className="compiler-badge">{algorithm.compiler}</span>
                </div>
              </div>
              <div className="code-container">
                <button 
                  className={`copy-btn ${isCopied ? 'copied' : ''}`}
                  onClick={handleCopyCode}
                  title="Копировать код"
                >
                  {isCopied ? (
                    <>
                      <span className="copy-icon">✓</span>
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <span className="copy-icon">📋</span>
                      Копировать
                    </>
                  )}
                </button>
                <pre className="code-block">
                  <code>{algorithm.code}</code>
                </pre>
              </div>
            </section>
          )}
        </div>

        <aside className="sidebar">
          <div className="info-card">
            <h3 className="card-title">Детали алгоритма</h3>
            
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">Тип:</span>
                <span className={`info-value ${algorithm.isPaid ? 'paid' : 'free'}`}>
                  {algorithm.isPaid ? 'Платный' : 'Бесплатный'}
                </span>
              </div>
              
              {algorithm.isPaid && algorithm.price && (
                <div className="info-row">
                  <span className="info-label">Цена:</span>
                  <span className="info-value price">{algorithm.price} руб.</span>
                </div>
              )}
              
              <div className="info-row">
                <span className="info-label">Обновлен:</span>
                <span className="info-value">
                  {new Date(algorithm.updatedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          {algorithm.tags.length > 0 && (
            <div className="tags-card">
              <h3 className="card-title">Теги</h3>
              <div className="tags-container">
                {algorithm.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AlgorithmDetails;