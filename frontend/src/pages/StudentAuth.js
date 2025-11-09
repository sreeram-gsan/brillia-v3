import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const EMERGENT_AUTH_URL = 'https://auth.emergentagent.com';

const StudentAuth = ({ children }) => {
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'approved', 'waitlist', 'error'
  const [user, setUser] = useState(null);
  const [waitlistInfo, setWaitlistInfo] = useState(null);
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
      
      if (response.data && response.data.role === 'student') {
        setUser(response.data);
        setAuthStatus('approved');
      } else {
        setAuthStatus('waitlist');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setAuthStatus('waitlist');
    }
  };

  const processSession = async (sessionId) => {
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/process-student-session`,
        {},
        {
          headers: {
            'X-Session-ID': sessionId
          },
          withCredentials: true
        }
      );

      if (response.data.status === 'approved') {
        setUser(response.data.user);
        setAuthStatus('approved');
      } else if (response.data.status === 'waitlist') {
        setWaitlistInfo(response.data.waitlist);
        setAuthStatus('waitlist');
      }
    } catch (err) {
      console.error('Session processing failed:', err);
      setError('Authentication failed. Please try again.');
      setAuthStatus('error');
    }
  };

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/student`;
    window.location.href = `${EMERGENT_AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
      setAuthStatus('waitlist');
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authStatus === 'loading') {
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
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === 'waitlist' || authStatus === 'error') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '3rem 2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '1rem',
                background: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '3rem', fontWeight: 700 }}>B</span>
              </div>
            </div>

            {waitlistInfo ? (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}>
                  You're on the Waitlist!
                </h1>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  marginBottom: '2rem'
                }}>
                  Thank you for your interest in Brillia! We've received your request and you'll get access soon.
                </p>
                <div style={{
                  background: 'var(--card-blue)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Your Details
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {waitlistInfo.picture && (
                      <img 
                        src={waitlistInfo.picture} 
                        alt={waitlistInfo.name}
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%'
                        }}
                      />
                    )}
                    <div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {waitlistInfo.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {waitlistInfo.email}
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }}>
                  We'll notify you via email once your access is approved.
                </p>
              </>
            ) : (
              <>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)',
                  marginTop: '1.5rem'
                }}>
                  Student Login
                </h1>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1.125rem',
                  lineHeight: '1.8',
                  marginBottom: '2rem'
                }}>
                  Sign in with Google to join the waitlist for Brillia
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
              </>
            )}

            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '2rem',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is approved, pass to children
  return React.cloneElement(children, { user, onLogout: handleLogout });
};

export default StudentAuth;
