import React from 'react';

const GamificationDashboard = ({ progress }) => {
  const xpPercentage = (progress.xp_progress / 100) * 100;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      {/* Level Card - Purple */}
      <div style={{
        background: 'var(--card-purple)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
          Level {progress.level}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          {progress.level_name}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          {progress.xp} / {progress.xp_for_next_level} XP
        </div>
      </div>

      {/* Streak Card - Blue */}
      <div style={{
        background: 'var(--card-blue)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
          {progress.study_streak}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Day Streak
        </div>
      </div>

      {/* Cards Completed - Yellow */}
      <div style={{
        background: 'var(--card-yellow)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
          {progress.total_cards_completed}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Cards Completed
        </div>
      </div>

      {/* Badges - Green */}
      <div style={{
        background: 'var(--card-green)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
          {progress.badges_earned.length}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Badges Earned
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;
