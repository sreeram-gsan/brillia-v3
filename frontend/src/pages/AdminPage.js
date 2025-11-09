import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AdminPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/auth/waitlist`, {
        withCredentials: true
      });
      setWaitlist(response.data.waitlist || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch waitlist:', err);
      setError('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId) => {
    if (!window.confirm('Approve this student\'s access to Brillia?')) {
      return;
    }

    try {
      setProcessingId(entryId);
      await axios.post(
        `${API_URL}/api/auth/waitlist/${entryId}/approve`,
        {},
        { withCredentials: true }
      );
      await fetchWaitlist();
      alert('Student approved successfully!');
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve student. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (entryId) => {
    if (!window.confirm('Reject this student\'s waitlist request?')) {
      return;
    }

    try {
      setProcessingId(entryId);
      await axios.post(
        `${API_URL}/api/auth/waitlist/${entryId}/reject`,
        {},
        { withCredentials: true }
      );
      await fetchWaitlist();
      alert('Student rejected.');
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Failed to reject student. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingEntries = waitlist.filter(e => e.status === 'pending');
  const approvedEntries = waitlist.filter(e => e.status === 'approved');
  const rejectedEntries = waitlist.filter(e => e.status === 'rejected');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav className="container mx-auto px-6" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Brillia
            </span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }}>| Admin Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'var(--bg-section)',
                borderRadius: '0.5rem'
              }}>
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}>
                    {user.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {user.email}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              ← Back to Home
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                onMouseLeave={(e) => e.target.style.background = '#ef4444'}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '2rem',
          color: 'var(--text-primary)'
        }}>
          Student Waitlist Management
        </h1>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-yellow)',
            borderRadius: '1rem',
            border: '2px solid rgba(251, 188, 5, 0.3)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {pendingEntries.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Pending Requests
            </div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-green)',
            borderRadius: '1rem',
            border: '2px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {approvedEntries.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Approved Students
            </div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'var(--card-grey)',
            borderRadius: '1rem',
            border: '2px solid rgba(148, 163, 184, 0.3)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {rejectedEntries.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Rejected
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'var(--bg-card)',
            borderRadius: '1rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading waitlist...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '2rem',
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '1rem',
            color: '#991b1b',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingEntries.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}>
                  🔔 Pending Requests ({pendingEntries.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingEntries.map(entry => (
                    <div key={entry.id} style={{
                      padding: '1.5rem',
                      background: 'var(--bg-card)',
                      borderRadius: '1rem',
                      border: '2px solid var(--card-yellow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        {entry.picture && (
                          <img
                            src={entry.picture}
                            alt={entry.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem'
                          }}>
                            {entry.name}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem'
                          }}>
                            {entry.email}
                          </div>
                          {entry.institution && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>🏛️</span>
                              <span>{entry.institution}</span>
                            </div>
                          )}
                          {entry.invitation_code && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.25rem'
                            }}>
                              <span>🎟️</span>
                              <span>Code: {entry.invitation_code}</span>
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem'
                          }}>
                            Requested: {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleApprove(entry.id)}
                          disabled={processingId === entry.id}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: processingId === entry.id ? 'not-allowed' : 'pointer',
                            opacity: processingId === entry.id ? 0.5 : 1,
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            if (processingId !== entry.id) e.target.style.background = '#16a34a';
                          }}
                          onMouseLeave={(e) => {
                            if (processingId !== entry.id) e.target.style.background = '#22c55e';
                          }}
                        >
                          {processingId === entry.id ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(entry.id)}
                          disabled={processingId === entry.id}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: processingId === entry.id ? 'not-allowed' : 'pointer',
                            opacity: processingId === entry.id ? 0.5 : 1,
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            if (processingId !== entry.id) e.target.style.background = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            if (processingId !== entry.id) e.target.style.background = '#ef4444';
                          }}
                        >
                          {processingId === entry.id ? '...' : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Students */}
            {approvedEntries.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}>
                  ✅ Approved Students ({approvedEntries.length})
                </h2>
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '2px solid var(--card-green)'
                }}>
                  {approvedEntries.map(entry => (
                    <div key={entry.id} style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--bg-section)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {entry.picture && (
                        <img
                          src={entry.picture}
                          alt={entry.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}>
                          {entry.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {entry.email}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        Approved {entry.approved_at ? new Date(entry.approved_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Students */}
            {rejectedEntries.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}>
                  ❌ Rejected ({rejectedEntries.length})
                </h2>
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '2px solid var(--card-grey)'
                }}>
                  {rejectedEntries.map(entry => (
                    <div key={entry.id} style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--bg-section)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {entry.picture && (
                        <img
                          src={entry.picture}
                          alt={entry.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            opacity: 0.5
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          opacity: 0.7
                        }}>
                          {entry.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {entry.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {waitlist.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                border: '2px dashed var(--bg-section)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1.125rem'
                }}>
                  No waitlist entries yet
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
