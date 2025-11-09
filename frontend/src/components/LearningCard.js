import React, { useState } from 'react';

const LearningCard = ({ card, onDismiss }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Use rotating colors like My Insights section
  const getCardColor = (cardId) => {
    const colors = [
      { bg: 'var(--card-purple)', border: '#d8c5e8', text: '#6b21a8', badge: '#b794f6' },
      { bg: 'var(--card-blue)', border: '#b8d9e8', text: '#1e40af', badge: '#7ab8e8' },
      { bg: 'var(--card-green)', border: '#b8e8c5', text: '#166534', badge: '#7ad89a' },
      { bg: 'var(--card-yellow)', border: '#e8d9b8', text: '#854d0e', badge: '#e8c77a' }
    ];
    // Use card ID to determine color index for consistency
    const hash = cardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % 4];
  };
  
  const getPriorityColor = (priority) => {
    // Keep this for backwards compatibility but not used for colors anymore
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Priority';
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

  const cardStyle = getCardColor(card.id);

  if (card.card_type === 'quiz' && !showQuiz) {
    // Show quiz preview - similar to My Insights cards
    return (
      <div
        style={{
          background: cardStyle.bg,
          borderRadius: '0.75rem',
          padding: '1.25rem',
          border: `2px solid ${cardStyle.border}`,
          position: 'relative'
        }}
      >
        {/* Priority Badge */}
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: cardStyle.badge,
          color: 'white',
          padding: '0.25rem 0.625rem',
          borderRadius: '0.375rem',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {getPriorityColor(card.priority)}
        </div>

        {/* Content */}
        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>❓</div>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem', 
          paddingRight: '6rem',
          color: '#1f2937'
        }}>
          {card.concept}
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.8125rem', lineHeight: '1.5' }}>
          Test your knowledge with a quick quiz question
        </p>

        <button
          onClick={() => setShowQuiz(true)}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: cardStyle.badge,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Take Quiz →
        </button>
      </div>
    );
  }

  if (card.card_type === 'quiz' && showQuiz) {
    // Show actual quiz
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: `2px solid ${cardStyle.border}`
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>❓</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1f2937' }}>
          {card.concept}
        </h3>
        
        <div style={{
          background: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', lineHeight: '1.6' }}>
            {card.quiz_question.question}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {card.quiz_question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showFeedback && handleQuizAnswer(index)}
              disabled={showFeedback}
              style={{
                padding: '1rem',
                background: 
                  showFeedback && index === card.quiz_question.correct_answer
                    ? '#d1fae5'
                    : showFeedback && index === selectedAnswer && !isCorrect
                    ? '#fee2e2'
                    : selectedAnswer === index
                    ? '#ede9fe'
                    : '#ffffff',
                color: '#1f2937',
                border: showFeedback && index === card.quiz_question.correct_answer
                    ? '2px solid #10b981'
                    : showFeedback && index === selectedAnswer && !isCorrect
                    ? '2px solid #ef4444'
                    : selectedAnswer === index
                    ? '2px solid #8b5cf6'
                    : '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: showFeedback ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontWeight: 500,
                lineHeight: '1.6'
              }}
            >
              <span style={{ fontWeight: 700, marginRight: '0.5rem', color: '#6b7280' }}>
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div style={{
            background: isCorrect ? '#d1fae5' : '#fee2e2',
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
              <strong style={{ color: isCorrect ? '#065f46' : '#991b1b', fontSize: '1rem' }}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.6' }}>
              {card.quiz_question.explanation}
            </p>
          </div>
        )}

        {showFeedback && !isCorrect && (
          <button
            onClick={handleQuizDismiss}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: '#6b7280',
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

  // Review card - similar to My Insights style
  return (
    <div
      style={{
        background: cardStyle.bg,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `2px solid ${cardStyle.border}`,
        position: 'relative'
      }}
    >
      {/* Priority Badge */}
      <div style={{
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        background: cardStyle.badge,
        color: 'white',
        padding: '0.25rem 0.625rem',
        borderRadius: '0.375rem',
        fontSize: '0.7rem',
        fontWeight: 600
      }}>
        {getPriorityColor(card.priority)}
      </div>

      {/* Content */}
      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📖</div>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: 700, 
        marginBottom: '0.75rem', 
        paddingRight: '6rem',
        color: '#1f2937'
      }}>
        {card.concept}
      </h3>
      
      <div style={{
        background: '#ffffff',
        padding: '0.875rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ fontSize: '0.8125rem', lineHeight: '1.6', color: '#374151' }}>
          {card.content_summary}
        </p>
      </div>

      <button
        onClick={handleReviewDismiss}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: cardStyle.badge,
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        Got it! ✓
      </button>
    </div>
  );
};

export default LearningCard;
