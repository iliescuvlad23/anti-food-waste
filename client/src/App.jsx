import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import SharedItems from './pages/SharedItems';
import Claims from './pages/Claims';
import ShareItem from './pages/ShareItem';
import AcceptInvitation from './pages/AcceptInvitation';
import { getToken } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#e0e0e0' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={() => setIsAuthenticated(true)} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register onRegister={() => setIsAuthenticated(true)} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard onLogout={() => setIsAuthenticated(false)} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/groups"
        element={
          isAuthenticated ? (
            <Groups />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/shared-items"
        element={
          isAuthenticated ? (
            <SharedItems />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/claims/:type"
        element={
          isAuthenticated ? (
            <Claims />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/invitations/accept"
        element={
          isAuthenticated ? (
            <AcceptInvitation />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/share/item/:id" element={<ShareItem />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center', background: '#1a1a1a', color: '#e0e0e0', minHeight: '100vh' }}>Page not found</div>} />
    </Routes>
  );
}

export default App;
