import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MessagesProvider } from './context/MessagesContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import MessagesModal from './components/MessagesModal';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading Titus…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
    </div>
  );
  return user?.isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <MessagesProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/browse" element={<PrivateRoute><ProductPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer style={footerStyle}>
          <div style={footerInner}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>📚 Titus</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Cal State Fullerton · Student book exchange · {new Date().getFullYear()}</span>
          </div>
        </footer>
        <MessagesModal />
      </div>
    </MessagesProvider>
  );
}

const footerStyle = { background: 'var(--blue)', borderTop: 'none', padding: '16px 24px' };
const footerInner = { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
