import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const StudentProfile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [majors, setMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
    fetchMajors();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        withCredentials: true
      });
      setProfile(response.data);
      setSelectedMajor(response.data.major || '');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/majors`);
      setMajors(response.data.majors || []);
    } catch (err) {
      console.error('Failed to fetch majors:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(
        `${API_URL}/api/profile/me`,
        { major: selectedMajor },
        { withCredentials: true }
      );
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      fetchProfile(); // Refresh profile data
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        minHeight: '400px'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--bg-section)',
            borderTop: '4px solid var(--text-primary)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          My Profile
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem'
        }}>
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '1rem',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        marginBottom: '1.5rem'
      }}>
        {/* Profile Picture and Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt={profile.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--bg-section)'
              }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white'
            }}>
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              {profile?.name}
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              {profile?.email}
            </p>
          </div>
        </div>

        {/* Major Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Major / Field of Study
          </label>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem'
          }}>
            This helps Brillia personalize explanations based on your background
          </p>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--text-primary)'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">Select your major...</option>
            {majors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </div>

        {/* Current Major Display */}
        {profile?.major && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--bg-section)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current major: </span>
            <span style={{ 
              fontWeight: 600, 
              color: 'var(--text-primary)' 
            }}>
              {profile.major}
            </span>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.875rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedMajor === profile?.major}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '0.875rem',
          fontSize: '1rem',
          opacity: (saving || selectedMajor === profile?.major) ? 0.6 : 1,
          cursor: (saving || selectedMajor === profile?.major) ? 'not-allowed' : 'pointer'
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Additional Info */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--bg-section)',
        borderRadius: '0.75rem'
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Why does this matter?
        </h4>
        <ul style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          margin: 0,
          paddingLeft: '1.5rem',
          lineHeight: '1.8'
        }}>
          <li>Brillia tailors explanations to your field of study</li>
          <li>Concepts are explained using examples relevant to your major</li>
          <li>For example, "supply and demand" uses market examples for business students and ecosystem examples for biology students</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentProfile;
