import React, { useState } from 'react';

const LearningCard = ({ card, onDismiss }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return '#ef4444'; // Red - High priority
      case 2: return '#f59e0b'; // Orange - Medium priority
      case 3: return '#84cc16'; // Light green - Low priority
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Priority';
    }
  };

  const handleQuizAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === card.quiz_question.correct_answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Auto-dismiss after 3 seconds if correct
    if (correct) {
      setTimeout(() => {
        onDismiss(card.id, true);
      }, 3000);
    }
  };

  const handleReviewDismiss = () => {
    onDismiss(card.id, null);
  };

  const handleQuizDismiss = () => {
    onDismiss(card.id, isCorrect);
  };

  if (card.card_type === 'quiz' && !showQuiz) {
    // Show quiz preview
    return (
      <div
        className="hover-lift"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: `3px solid ${getPriorityColor(card.priority)}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Priority Badge */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: getPriorityColor(card.priority),
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {getPriorityLabel(card.priority)}
        </div>

        {/* Content */}
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>❓</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', paddingRight: '6rem', color: 'var(--text-primary)' }}>
          {card.concept}
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Test your knowledge with a quick quiz question
        </p>

        <button
          onClick={() => setShowQuiz(true)}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--accent-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Take Quiz
        </button>
      </div>
    );
  }

  if (card.card_type === 'quiz' && showQuiz) {
    // Show actual quiz
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: `3px solid ${getPriorityColor(card.priority)}`
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>❓</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {card.concept}
        </h3>
        
        <div style={{
          background: 'var(--bg-section)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {card.quiz_question.question}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {card.quiz_question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showFeedback && handleQuizAnswer(index)}
              disabled={showFeedback}
              style={{
                padding: '0.75rem',
                background: 
                  showFeedback && index === card.quiz_question.correct_answer
                    ? '#10b981'
                    : showFeedback && index === selectedAnswer && !isCorrect
                    ? '#ef4444'
                    : selectedAnswer === index
                    ? 'var(--accent-purple)'
                    : 'var(--bg-section)',
                color: 
                  (showFeedback && index === card.quiz_question.correct_answer) ||
                  (showFeedback && index === selectedAnswer && !isCorrect) ||
                  selectedAnswer === index
                    ? 'white'
                    : 'var(--text-primary)',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div style={{
            background: isCorrect ? '#10b98120' : '#ef444420',
            border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{isCorrect ? '✅' : '❌'}</span>
              <strong style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              {card.quiz_question.explanation}
            </p>
          </div>
        )}

        {showFeedback && !isCorrect && (
          <button
            onClick={handleQuizDismiss}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Try Again Later
          </button>
        )}
      </div>
    );
  }

  // Review card
  return (
    <div
      className="hover-lift"
      style={{
        background: 'var(--bg-card)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: `3px solid ${getPriorityColor(card.priority)}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Priority Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: getPriorityColor(card.priority),
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        {getPriorityLabel(card.priority)}
      </div>

      {/* Content */}
      <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>📖</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', paddingRight: '6rem', color: 'var(--text-primary)' }}>
        {card.concept}
      </h3>
      
      <div style={{
        background: 'var(--bg-section)',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {card.content_summary}
        </p>
      </div>

      <button
        onClick={handleReviewDismiss}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'var(--accent-blue)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Got it! ✓
      </button>
    </div>
  );
};

export default LearningCard;
