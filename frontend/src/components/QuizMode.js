import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const QuizMode = ({ quizData, onExit, courseName, courseId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [answersRecord, setAnswersRecord] = useState([]);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (index) => {
    if (showResult) return; // Prevent changing answer after submission
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    setShowResult(true);
    setFlipped(true);
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Record this answer
    setAnswersRecord([...answersRecord, {
      question_index: currentQuestionIndex,
      question: currentQuestion.question,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect,
      topic: currentQuestion.topic
    }]);
  };

  const submitQuizResults = async () => {
    try {
      await axios.post(`${API_URL}/api/quiz/submit`, {
        quiz_id: quizData.quiz_id,
        course_id: courseId,
        score: score,
        total_questions: totalQuestions,
        topic: quizData.questions[0].topic,
        answers: answersRecord
      });
    } catch (err) {
      console.error('Error submitting quiz results:', err);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setFlipped(false);
    } else {
      // Submit quiz results before showing completion screen
      submitQuizResults();
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setFlipped(false);
  };

  const getOptionStyle = (index) => {
    const baseStyle = {
      padding: '1rem',
      borderRadius: '0.75rem',
      cursor: showResult ? 'default' : 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid',
      marginBottom: '0.75rem'
    };

    if (!showResult) {
      return {
        ...baseStyle,
        borderColor: selectedAnswer === index ? 'var(--text-primary)' : '#e5e7eb',
        background: selectedAnswer === index ? 'var(--card-purple)' : 'var(--bg-card)',
        transform: selectedAnswer === index ? 'scale(1.02)' : 'scale(1)'
      };
    }

    // Show result colors
    if (index === currentQuestion.correct_answer) {
      return {
        ...baseStyle,
        borderColor: '#10b981',
        background: '#d1fae5',
        cursor: 'default'
      };
    } else if (index === selectedAnswer) {
      return {
        ...baseStyle,
        borderColor: '#ef4444',
        background: '#fee2e2',
        cursor: 'default'
      };
    }

    return {
      ...baseStyle,
      borderColor: '#e5e7eb',
      background: 'var(--bg-section)',
      opacity: 0.6,
      cursor: 'default'
    };
  };

  if (quizCompleted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassing = percentage >= 70;

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '1.5rem',
          padding: '3rem',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {isPassing ? '🎉' : '📚'}
          </div>
          <h2 className="heading-2" style={{ marginBottom: '1rem' }}>
            Quiz Complete!
          </h2>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: isPassing ? '#10b981' : '#f59e0b', marginBottom: '1rem' }}>
            {score}/{totalQuestions}
          </div>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            You scored {percentage}%
          </p>
          {isPassing ? (
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Great job! You have a solid understanding of this material. 🌟
            </p>
          ) : (
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Keep studying! Review the course materials and try again. 💪
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleRestart} className="btn-primary">
              Try Again
            </button>
            <button onClick={onExit} className="btn-secondary">
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="heading-3">{courseName} Quiz</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            <button onClick={onExit} style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}>
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: 'var(--bg-section)', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--card-purple), var(--card-blue))',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Flashcard */}
        <div style={{
          perspective: '1000px',
          marginBottom: '2rem'
        }}>
          <div style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>
            {/* Front of card - Question */}
            <div style={{
              backfaceVisibility: 'hidden',
              padding: '2rem',
              background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))',
              borderRadius: '1rem',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', opacity: 0.7 }}>
                  📌 {currentQuestion.topic}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 }}>
                  {currentQuestion.question}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div style={{ marginBottom: '2rem' }}>
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleAnswerSelect(index)}
              style={getOptionStyle(index)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: showResult && index === currentQuestion.correct_answer ? '#10b981' :
                             showResult && index === selectedAnswer ? '#ef4444' :
                             selectedAnswer === index ? 'var(--text-primary)' : '#e5e7eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div style={{ flex: 1, fontSize: '1rem' }}>{option}</div>
                {showResult && index === currentQuestion.correct_answer && (
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                )}
                {showResult && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                  <span style={{ fontSize: '1.25rem' }}>✗</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Explanation (shown after answer) */}
        {showResult && (
          <div style={{
            padding: '1.5rem',
            background: selectedAnswer === currentQuestion.correct_answer ? '#d1fae5' : '#fff7ed',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${selectedAnswer === currentQuestion.correct_answer ? '#10b981' : '#f59e0b'}`
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              {selectedAnswer === currentQuestion.correct_answer ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {!showResult ? (
            <button 
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="btn-primary"
              style={{ opacity: selectedAnswer === null ? 0.5 : 1 }}
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              {currentQuestionIndex < totalQuestions - 1 ? 'Next Question →' : 'Finish Quiz'}
            </button>
          )}
        </div>

        {/* Score Display */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'var(--bg-section)', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Current Score: <strong>{score}/{currentQuestionIndex + (showResult ? 1 : 0)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizMode;
