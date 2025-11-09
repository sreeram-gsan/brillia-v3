import React from 'react';

const StudyPlan = ({ studyPlan }) => {
  // Use rotating colors like My Insights section
  const getTopicColor = (index) => {
    const colors = [
      { bg: 'var(--card-purple)', border: '#d8c5e8', text: '#6b21a8', badge: '#b794f6' },
      { bg: 'var(--card-blue)', border: '#b8d9e8', text: '#1e40af', badge: '#7ab8e8' },
      { bg: 'var(--card-green)', border: '#b8e8c5', text: '#166534', badge: '#7ad89a' },
      { bg: 'var(--card-yellow)', border: '#e8d9b8', text: '#854d0e', badge: '#e8c77a' }
    ];
    return colors[index % 4];
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 700, 
        marginBottom: '1rem',
        color: '#1f2937'
      }}>
        📅 Your Study Plan
      </h3>

      {/* Daily Focus - Highlighted Card */}
      <div style={{
        background: 'var(--card-purple)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '2px solid #c4b5fd'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#6b21a8', letterSpacing: '0.05em' }}>
          TODAY'S FOCUS
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', lineHeight: '1.5' }}>
          {studyPlan.daily_focus}
        </div>
      </div>

      {/* Recommended Topics */}
      {studyPlan.recommended_topics.length > 0 && (
        <>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#6b7280',
            letterSpacing: '0.05em'
          }}>
            RECOMMENDED TOPICS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studyPlan.recommended_topics.map((topic, index) => {
              const style = getTopicColor(index);
              return (
                <div
                  key={index}
                  style={{
                    background: style.bg,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: `2px solid ${style.border}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, flex: 1, color: '#1f2937' }}>
                      {topic.concept}
                    </div>
                    <div style={{
                      background: style.badge,
                      color: 'white',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      marginLeft: '0.5rem'
                    }}>
                      {topic.priority}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span>📊</span>
                      <span style={{ fontWeight: 600 }}>{topic.current_mastery}%</span>
                      <span>mastery</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span>⏱️</span>
                      <span style={{ fontWeight: 600 }}>~{topic.estimated_time} min</span>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.8125rem',
                    color: style.text,
                    fontWeight: 600
                  }}>
                    → {topic.recommended_action}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Time */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
              Total Estimated Time
            </span>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#8b5cf6'
            }}>
              ~{studyPlan.total_estimated_time} min
            </span>
          </div>
        </>
      )}

      {/* Motivational Quote */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '2px solid #f3f4f6',
        fontSize: '0.8125rem',
        fontStyle: 'italic',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        "The expert in anything was once a beginner." 💡
      </div>
    </div>
  );
};

export default StudyPlan;
