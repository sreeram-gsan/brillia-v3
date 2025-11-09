import React from 'react';

const ConceptHeatmap = ({ heatmapData, showStudents = true }) => {
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div style={{ 
        background: 'var(--bg-section)', 
        padding: '3rem', 
        borderRadius: '0.75rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>
          No Concept Data Yet
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          The heatmap will populate as students interact with course materials, ask questions, and take quizzes.
        </p>
      </div>
    );
  }

  // Function to get color based on mastery score
  const getMasteryColor = (score) => {
    if (score >= 80) return '#10b981'; // Green - High mastery
    if (score >= 60) return '#84cc16'; // Light green - Good mastery
    if (score >= 40) return '#f59e0b'; // Orange - Moderate mastery
    if (score >= 20) return '#f97316'; // Dark orange - Low mastery
    return '#ef4444'; // Red - Very low mastery
  };

  // Function to get mastery level text
  const getMasteryLevel = (score) => {
    if (score >= 80) return 'Mastered';
    if (score >= 60) return 'Proficient';
    if (score >= 40) return 'Developing';
    if (score >= 20) return 'Emerging';
    return 'Beginning';
  };

  // Sort by mastery score for better visualization
  const sortedData = [...heatmapData].sort((a, b) => b.mastery - a.mastery);

  return (
    <div>
      {/* Heatmap Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'var(--bg-section)',
        borderRadius: '0.5rem'
      }}>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Mastery Scale:</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Based on questions asked, quiz performance, and engagement
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
            <span>0-20%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#f97316', borderRadius: '4px' }}></div>
            <span>20-40%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '4px' }}></div>
            <span>40-60%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#84cc16', borderRadius: '4px' }}></div>
            <span>60-80%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
            <span>80-100%</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {sortedData.map((item, index) => (
          <div
            key={index}
            className="hover-lift"
            style={{
              background: 'var(--bg-card)',
              border: `3px solid ${getMasteryColor(item.mastery)}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background gradient based on mastery */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${getMasteryColor(item.mastery)}15, ${getMasteryColor(item.mastery)}05)`,
              opacity: 0.5
            }}></div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: 'var(--text-primary)',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.concept}
              </div>

              {/* Mastery Score */}
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700,
                color: getMasteryColor(item.mastery),
                marginBottom: '0.5rem'
              }}>
                {Math.round(item.mastery)}%
              </div>

              {/* Mastery Level Badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                background: getMasteryColor(item.mastery),
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.75rem'
              }}>
                {getMasteryLevel(item.mastery)}
              </div>

              {/* Stats */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Interactions:</span>
                  <strong>{item.interactions}</strong>
                </div>
                {showStudents && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Students:</span>
                    <strong>{item.students}</strong>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden',
                marginTop: '0.75rem'
              }}>
                <div style={{
                  width: `${item.mastery}%`,
                  height: '100%',
                  background: getMasteryColor(item.mastery),
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        padding: '1.5rem',
        background: 'var(--bg-section)',
        borderRadius: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Total Concepts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {sortedData.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Mastered (≥80%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            {sortedData.filter(d => d.mastery >= 80).length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Needs Attention (&lt;40%)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
            {sortedData.filter(d => d.mastery < 40).length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Avg. Mastery
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {Math.round(sortedData.reduce((sum, d) => sum + d.mastery, 0) / sortedData.length)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptHeatmap;
