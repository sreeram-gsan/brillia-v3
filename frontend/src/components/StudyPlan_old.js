import React from 'react';

const StudyPlan = ({ studyPlan }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#84cc16';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '1rem',
      padding: '1.5rem',
      position: 'sticky',
      top: '1rem'
    }}>
      <h3 className="heading-3" style={{ marginBottom: '1rem' }}>
        📅 Your Study Plan
      </h3>

      {/* Daily Focus */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-yellow) 0%, var(--accent-orange) 100%)',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        color: 'white'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.9 }}>
          TODAY'S FOCUS
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
          {studyPlan.daily_focus}
        </div>
      </div>

      {/* Recommended Topics */}
      {studyPlan.recommended_topics.length > 0 && (
        <>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#6b7280'
          }}>
            RECOMMENDED TOPICS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studyPlan.recommended_topics.map((topic, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--bg-section)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  borderLeft: `4px solid ${getPriorityColor(topic.priority)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>
                    {topic.concept}
                  </div>
                  <div style={{
                    background: getPriorityColor(topic.priority),
                    color: 'white',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 600
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
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>📊</span>
                    <span>{topic.current_mastery}% mastery</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>⏱️</span>
                    <span>~{topic.estimated_time} min</span>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-purple)',
                  fontWeight: 600
                }}>
                  → {topic.recommended_action}
                </div>
              </div>
            ))}
          </div>

          {/* Total Time */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--bg-section)',
            borderRadius: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Total Estimated Time
            </span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--accent-purple)'
            }}>
              ~{studyPlan.total_estimated_time} minutes
            </span>
          </div>
        </>
      )}

      {/* Motivational Quote */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.875rem',
        fontStyle: 'italic',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        "The expert in anything was once a beginner." 💡
      </div>
    </div>
  );
};

export default StudyPlan;
