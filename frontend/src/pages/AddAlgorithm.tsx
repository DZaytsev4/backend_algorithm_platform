import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { apiService } from '../service/api';
import { Algorithm } from '../types';

const AddAlgorithm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '#include <iostream>\n#include <vector>\n\nusing namespace std;\n\n// Ваш алгоритм здесь\nvoid yourAlgorithm() {\n    // Реализация алгоритма\n    cout << "Hello, Algorithm Platform!" << endl;\n}',
    tags: '',
    isPaid: false,
    price: '100',
    language: 'C++',
    compiler: 'g++',
    author: '' // Добавляем поле автора
  });

  const [showPrice, setShowPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Преобразуем теги из строки в массив
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Подготавливаем данные для отправки
      const algorithmData: Partial<Algorithm> = {
        title: formData.title,
        description: formData.description,
        code: formData.code,
        tags: tagsArray,
        isPaid: formData.isPaid,
        price: formData.isPaid ? Number(formData.price) : undefined,
        language: formData.language,
        compiler: formData.compiler,
        author: formData.author || 'Анонимный автор' // Если автор не указан
      };

      console.log('Отправка данных:', algorithmData);
      
      // Отправляем на бэкенд
      const createdAlgorithm = await apiService.createAlgorithm(algorithmData);
      
      console.log('Алгоритм создан:', createdAlgorithm);
      setSuccess(true);
      
      // Сбрасываем форму после успешного добавления
      setFormData({
        title: '',
        description: '',
        code: '#include <iostream>\n#include <vector>\n\nusing namespace std;\n\n// Ваш алгоритм здесь\nvoid yourAlgorithm() {\n    // Реализация алгоритма\n    cout << "Hello, Algorithm Platform!" << endl;\n}',
        tags: '',
        isPaid: false,
        price: '100',
        language: 'C++',
        compiler: 'g++',
        author: ''
      });
      setShowPrice(false);

    } catch (err) {
      console.error('Ошибка при создании алгоритма:', err);
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при отправке алгоритма';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCodeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      code: value
    }));
  };

  const togglePaid = () => {
    const newIsPaid = !formData.isPaid;
    setFormData(prev => ({
      ...prev,
      isPaid: newIsPaid,
      price: newIsPaid ? '100' : '0'
    }));
    
    if (newIsPaid) {
      setShowPrice(true);
    } else {
      setTimeout(() => setShowPrice(false), 300);
    }
  };

  return (
    <div className="add-algorithm-page">
      <h1>Добавить новый алгоритм</h1>
      
      {error && (
        <div className="error-message">
          <strong>Ошибка:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          ✅ Алгоритм успешно отправлен на модерацию!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="author">Автор</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Ваше имя или псевдоним"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Название алгоритма</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Введите название алгоритма"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите алгоритм, его особенности и применение"
            required
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="language">Язык программирования</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="C++">C/C++</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="compiler">Компилятор</label>
            <select
              id="compiler"
              name="compiler"
              value={formData.compiler}
              onChange={handleChange}
            >
              <option value="g++">g++ (GCC)</option>
              <option value="gcc">gcc (GCC)</option>
              <option value="clang">clang (LLVM)</option>
              <option value="clang++">clang++ (LLVM)</option>
              <option value="python">Python Interpreter</option>
              <option value="node">Node.js</option>
              <option value="java">Java Compiler</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="code">Исходный код</label>
          <div className="code-editor-container">
            <CodeMirror
              value={formData.code}
              height="400px"
              extensions={[cpp()]}
              theme={oneDark}
              onChange={handleCodeChange}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightSpecialChars: true,
                syntaxHighlighting: true,
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Теги (через запятую)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="сортировка, C++, алгоритмы, графы"
          />
          <small>Укажите ключевые слова для поиска алгоритма</small>
        </div>

        <div className="form-group">
          <div className="paid-toggle-section">
            <div className="toggle-container">
              <span className="toggle-label">Платный алгоритм</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={togglePaid}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className={`price-input-wrapper ${showPrice ? 'visible' : 'hidden'}`}>
              <div className="price-input-container">
                <label htmlFor="price">Стоимость алгоритма</label>
                <div className="price-input-group">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="1"
                    max="10000"
                    placeholder="100"
                    className="price-input"
                    disabled={!formData.isPaid}
                  />
                  <span className="currency">руб.</span>
                </div>
                <p className="price-hint">Укажите стоимость в рублях</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Отправить на проверку'}
        </button>
      </form>

      <style jsx>{`
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        small {
          color: #666;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default AddAlgorithm;