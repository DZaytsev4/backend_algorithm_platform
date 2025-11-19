import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Algorithms from './pages/Algorithms';
import AlgorithmDetail from './pages/AlgorithmDetail';
import AddAlgorithm from './pages/AddAlgorithm';
import EditAlgorithm from './pages/EditAlgorithm';
import Profile from './pages/Profile';
import Moderation from './pages/Moderation';
import UserSearch from './pages/UserSearch';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/algorithms" element={<Algorithms />} />
              <Route path="/algorithms/add" element={<AddAlgorithm />} />
              <Route path="/algorithms/:id" element={<AlgorithmDetail />} />
              <Route path="/algorithms/:id/edit" element={<EditAlgorithm />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/users" element={<UserSearch />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;