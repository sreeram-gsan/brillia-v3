import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const VoiceChat = ({ courseId }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Click "Start a conversation" to begin');
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    return () => {
      // Cleanup on unmount
      stopVoiceChat();
    };
  }, []);

  const initializeVoiceChat = async () => {
    try {
      setError(null);
      setStatusMessage('Initializing voice chat...');

      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }

      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis is not supported in your browser.');
      }

      // Setup speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening... Speak now!');
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript('');
          handleVoiceQuestion(finalTranscript.trim());
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setStatusMessage('No speech detected. Try speaking again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access.');
          stopVoiceChat();
        } else {
          setStatusMessage(`Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if we're still supposed to be listening
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.log('Recognition restart failed:', err);
          }
        }
      };

      // Setup microphone for visualization
      await setupMicrophoneVisualization();

      // Start listening
      recognitionRef.current.start();
      setStatusMessage('Voice chat active! Speak your question.');
      
    } catch (err) {
      console.error('Failed to initialize voice chat:', err);
      setError(err.message || 'Failed to initialize voice chat');
      setStatusMessage('Initialization failed');
      stopVoiceChat();
    }
  };

  const setupMicrophoneVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setupAudioVisualization(stream);
    } catch (err) {
      console.warn('Could not setup audio visualization:', err);
    }
  };

  const setupAudioVisualization = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!analyserRef.current || !isListening) {
          setAudioLevel(0);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (err) {
      console.warn('Audio visualization failed:', err);
    }
  };

  const handleVoiceQuestion = async (question) => {
    if (!question.trim()) return;

    setStatusMessage('Processing your question...');
    setConversation(prev => [...prev, { role: 'user', content: question }]);

    try {
      // Send question to chat API (same endpoint as Chat & Quiz)
      const response = await axios.post(
        `${API_URL}/api/chat/send`,
        {
          course_id: courseId,
          message: question,
          session_id: sessionStorage.getItem(`voice_session_${courseId}`) || null
        },
        { withCredentials: true }
      );

      // Save session ID for continuity
      if (response.data.session_id) {
        sessionStorage.setItem(`voice_session_${courseId}`, response.data.session_id);
      }

      // Extract the response content
      const answer = response.data.markdown_content || response.data.message || 'I apologize, but I could not generate a response.';
      
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: answer,
        key_topics: response.data.key_topics || [],
        sources: response.data.sources || []
      }]);
      
      // Speak the response
      speakText(answer);
      
    } catch (err) {
      console.error('Error getting response:', err);
      const errorMsg = 'Sorry, I encountered an error processing your question. Please try again.';
      setConversation(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      speakText(errorMsg);
      setStatusMessage('Ready for your next question');
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    setIsSpeaking(true);
    setStatusMessage('Speaking...');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusMessage('Listening... Speak your next question!');
    };

    utterance.onerror = (err) => {
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
      setStatusMessage('Listening... Speak your next question!');
    };

    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Microphone paused');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setStatusMessage('Listening... Speak now!');
    }
  };

  const stopVoiceChat = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop speech synthesis
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Stop audio visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    setAudioLevel(0);
    setTranscript('');
    setStatusMessage('Voice chat ended. Click "Start a conversation" to begin again.');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {conversation.length === 0 ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}>
              <span style={{ 
                fontSize: '2.5rem', 
                fontWeight: 700,
                color: 'white'
              }}>B</span>
              {isListening && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: `3px solid rgba(34, 197, 94, ${0.3 + audioLevel * 0.7})`,
                  animation: 'pulse 1.5s infinite',
                  transform: `scale(${1 + audioLevel * 0.3})`
                }}></div>
              )}
              {isSpeaking && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '3px solid rgba(59, 130, 246, 0.5)',
                  animation: 'pulse 1s infinite'
                }}></div>
              )}
            </div>
            <h2 className="heading-2" style={{ marginBottom: '1rem' }}>Talk to Brillia</h2>
            <p className="body-large" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Use your voice to ask questions about the course. Brillia will respond with voice and text.
            </p>
            
            {/* Status Message */}
            <p style={{
              fontSize: '0.875rem',
              color: isListening ? '#22c55e' : isSpeaking ? '#3b82f6' : 'var(--text-secondary)',
              fontWeight: isListening || isSpeaking ? 600 : 400,
              marginBottom: '2rem'
            }}>
              {statusMessage}
            </p>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Current Transcript */}
            {transcript && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'var(--bg-card)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                textAlign: 'left'
              }}>
                <strong>Listening:</strong> "{transcript}"
              </div>
            )}

            {!isListening && !isSpeaking && (
              <div style={{ 
                background: 'var(--bg-card)', 
                padding: '1.5rem', 
                borderRadius: '0.75rem', 
                border: '1px solid #e5e7eb',
                marginTop: '2rem',
                textAlign: 'left'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  Tips for best experience:
                </h4>
                <ul style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  paddingLeft: '1.5rem',
                  lineHeight: '1.8'
                }}>
                  <li>Speak clearly and at a natural pace</li>
                  <li>Ask specific questions about your course materials</li>
                  <li>Use a quiet environment for better accuracy</li>
                  <li>Wait for Brillia to finish speaking before asking your next question</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '1.5rem'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-card)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb'
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.75rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'white'
                        }}>B</div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Brillia</span>
                      </div>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem', lineHeight: '1.6' }} {...props} />,
                          ul: ({ node, ...props }) => <ul style={{ marginLeft: '1.25rem', marginBottom: '0.75rem' }} {...props} />,
                          ol: ({ node, ...props }) => <ol style={{ marginLeft: '1.25rem', marginBottom: '0.75rem' }} {...props} />,
                          code: ({ node, inline, ...props }) => 
                            inline ? 
                            <code style={{ background: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.875rem', color: '#1f2937' }} {...props} /> :
                            <code style={{ display: 'block', background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.875rem' }} {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.key_topics && msg.key_topics.length > 0 && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid #e5e7eb',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Key Topics:</strong> {msg.key_topics.join(', ')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.9375rem', lineHeight: '1.5' }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isSpeaking && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '2rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Brillia is speaking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area - Voice Controls */}
      <div style={{ 
        borderTop: '1px solid #e5e7eb', 
        padding: '1.5rem',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!isListening && conversation.length === 0 ? (
              <button
                onClick={initializeVoiceChat}
                className="btn-primary"
                style={{ 
                  padding: '0.75rem 2rem',
                  fontSize: '0.9375rem'
                }}
              >
                Start a conversation
              </button>
            ) : (
              <>
                <button
                  onClick={toggleListening}
                  className={isListening ? "btn-secondary" : "btn-primary"}
                  style={{ 
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9375rem',
                    minWidth: '120px'
                  }}
                >
                  {isListening ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={stopVoiceChat}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9375rem',
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
                  End Chat
                </button>
              </>
            )}
          </div>
          {(isListening || isSpeaking) && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              marginTop: '0.75rem', 
              textAlign: 'center' 
            }}>
              {isListening ? 'Listening for your voice...' : 'Brillia is responding...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
