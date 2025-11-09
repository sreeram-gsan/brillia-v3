import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const EMERGENT_AUTH_URL = 'https://auth.emergentagent.com';

const AdminAuth = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [location]);

  const checkAuth = async () => {
    // Check if there's a session_id in URL fragment
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      await processSession(sessionId);
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Check existing session
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      
      if (response.data && response.data.role === 'admin') {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const processSession = async (sessionId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/process-admin-session`,
        {},
        {
          headers: {
            'X-Session-ID': sessionId
          },
          withCredentials: true
        }
      );

      if (response.data && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Session processing failed:', err);
      if (err.response?.status === 403) {
        setError('Only brilliateaching@gmail.com is allowed to access admin features.');
      } else {
        setError('Authentication failed. Please try again.');
      }
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/admin`;
    window.location.href = `${EMERGENT_AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '3rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
                <span className="text-white font-bold" style={{ fontSize: '2rem' }}>B</span>
              </div>
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Admin Login
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Sign in with your Google account to access the admin dashboard
            </p>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pass user and logout function to children
  return React.cloneElement(children, { user, onLogout: handleLogout });
};

export default AdminAuth;
