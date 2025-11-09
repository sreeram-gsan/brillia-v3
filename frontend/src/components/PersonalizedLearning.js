import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LearningCard from './LearningCard';
import GamificationDashboard from './GamificationDashboard';
import StudyPlan from './StudyPlan';

const PersonalizedLearning = ({ courseId }) => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    if (courseId) {
      loadPersonalizedData();
    }
  }, [courseId]);

  const loadPersonalizedData = async () => {
    setLoading(true);
    try {
      // Load cards, progress, and study plan in parallel
      const [cardsRes, progressRes, planRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/personalized/cards/${courseId}?student_id=student-demo-001`),
        axios.get(`${BACKEND_URL}/api/personalized/progress/${courseId}?student_id=student-demo-001`),
        axios.get(`${BACKEND_URL}/api/personalized/study-plan/${courseId}?student_id=student-demo-001`)
      ]);

      setCards(cardsRes.data.cards || []);
      setProgress(progressRes.data);
      setStudyPlan(planRes.data);
    } catch (error) {
      console.error('Error loading personalized data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardDismiss = async (cardId, correct = null) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/personalized/cards/dismiss?student_id=student-demo-001`,
        {
          card_id: cardId,
          correct: correct
        }
      );

      // Remove card from list
      setCards(cards.filter(c => c.id !== cardId));

      // Update progress
      const updatedProgress = await axios.get(
        `${BACKEND_URL}/api/personalized/progress/${courseId}?student_id=student-demo-001`
      );
      setProgress(updatedProgress.data);

      // Show new badges if any
      if (response.data.new_badges && response.data.new_badges.length > 0) {
        setNewBadges(response.data.new_badges);
        setShowBadgeModal(true);
      }

      // Reload cards if we're running low
      if (cards.length <= 2) {
        const cardsRes = await axios.get(
          `${BACKEND_URL}/api/personalized/cards/${courseId}?student_id=student-demo-001`
        );
        setCards(cardsRes.data.cards || []);
      }
    } catch (error) {
      console.error('Error dismissing card:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your personalized learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Badge Celebration Modal */}
      {showBadgeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            textAlign: 'center',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 className="heading-2" style={{ marginBottom: '1rem' }}>New Badge Unlocked!</h2>
            {newBadges.map((badge, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-section)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                  {badge.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {badge.description}
                </p>
                <div style={{ 
                  marginTop: '0.5rem', 
                  color: 'var(--accent-purple)', 
                  fontWeight: 600 
                }}>
                  +{badge.xp_reward} XP
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowBadgeModal(false)}
              style={{
                padding: '0.75rem 2rem',
                background: 'var(--accent-purple)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Gamification Dashboard */}
      {progress && <GamificationDashboard progress={progress} />}

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem',
        marginTop: '2rem',
        maxWidth: '900px',
        margin: '2rem auto 0'
      }}>
        {/* Left Column - Learning Cards */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              marginBottom: '0.5rem',
              color: '#1f2937'
            }}>
              📚 Topics to Master
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Review and practice to strengthen your understanding
            </p>
          </div>

          {cards.length === 0 ? (
            <div style={{
              background: 'var(--card-green)',
              borderRadius: '0.75rem',
              padding: '3rem',
              textAlign: 'center',
              border: '2px solid #86efac'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                marginBottom: '0.75rem',
                color: '#1f2937'
              }}>
                All Caught Up!
              </h3>
              <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.875rem' }}>
                You're doing great! All topics are well understood. Keep up the excellent work!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '1rem' 
            }}>
              {cards.map((card) => (
                <LearningCard
                  key={card.id}
                  card={card}
                  onDismiss={handleCardDismiss}
                />
              ))}
            </div>
          )}
        </div>

        {/* Study Plan Section */}
        {studyPlan && (
          <div style={{ marginTop: '2rem' }}>
            <StudyPlan studyPlan={studyPlan} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedLearning;
