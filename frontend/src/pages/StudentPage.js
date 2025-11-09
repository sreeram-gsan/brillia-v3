import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import QuizMode from '../components/QuizMode';
import ConceptHeatmap from '../components/ConceptHeatmap';
import PersonalizedLearning from '../components/PersonalizedLearning';
import VoiceChat from '../components/VoiceChat';
import StudentProfile from '../components/StudentProfile';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const StudentPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // materials, personalized, insights, chat
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses/`);
      setCourses(response.data);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId) => {
    try {
      const response = await axios.get(`${API_URL}/api/materials/course/${courseId}`);
      setMaterials(response.data);
      // Auto-select first material if available
      if (response.data.length > 0) {
        setSelectedMaterial(response.data[0]);
      } else {
        setSelectedMaterial(null);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
      setMaterials([]);
      setSelectedMaterial(null);
    }
  };

  const loadInsights = async (courseId) => {
    try {
      setLoadingInsights(true);
      const response = await axios.get(`${API_URL}/api/student/insights/${courseId}`);
      setInsights(response.data);
    } catch (err) {
      console.error('Error loading insights:', err);
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setMessages([]);
    setSessionId(null);
    setActiveTab('materials'); // Start with materials view
    loadMaterials(course.id);
    loadInsights(course.id);
  };

  const handleGenerateQuiz = async (topic = null, numQuestions = 5) => {
    try {
      const response = await axios.post(`${API_URL}/api/quiz/generate`, {
        course_id: selectedCourse.id,
        topic: topic,
        num_questions: numQuestions
      });
      
      setQuizData(response.data);
      setQuizMode(true);
    } catch (err) {
      console.error('Error generating quiz:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the quiz. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat/send`, {
        course_id: selectedCourse.id,
        message: currentMessage,
        session_id: sessionStorage.getItem(`session_${selectedCourse.id}`) || null,
        student_id: user?.id
      });
      
      // Check if response indicates quiz intent
      if (response.data.type === 'quiz_intent') {
        const topic = response.data.topic;
        
        // Show loading message
        const loadingMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you want to take a quiz${topic ? ` on ${topic}` : ''}! Let me generate questions based on the course materials... 📝`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate quiz with detected topic
        await handleGenerateQuiz(topic, 5);
        setIsTyping(false);
        return;
      }

      // Save session ID for continuity
      if (response.data.session_id) {
        sessionStorage.setItem(`session_${selectedCourse.id}`, response.data.session_id);
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.markdown_content || response.data.message,
        timestamp: response.data.timestamp,
        key_topics: response.data.key_topics || [],
        concept_graph: response.data.concept_graph || [],
        sources: response.data.sources || [],
        student_major: response.data.student_major
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    "Can you explain this topic in simpler terms?",
    "I don't understand this concept",
    "Can you give me an example?",
    "How does this relate to what we learned before?"
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Brillia
              </span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }}>| Student Dashboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-section)',
                  borderRadius: '0.5rem'
                }}>
                  {user.picture && (
                    <img 
                      src={user.picture} 
                      alt={user.name}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {user.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowProfile(true)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                ← Back to Home
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
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
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Course List */}
        <div style={{ width: '350px', background: 'var(--bg-card)', borderRight: '1px solid #e5e7eb', padding: '1.5rem', overflowY: 'auto' }}>
          <h2 className="heading-3" style={{ marginBottom: '1rem' }}>Available Courses</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              No courses available yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {courses.map(course => (
                <div
                  key={course.id}
                  onClick={() => handleCourseSelect(course)}
                  className="hover-lift"
                  style={{
                    background: selectedCourse?.id === course.id ? 'var(--card-purple)' : 'var(--bg-section)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    border: selectedCourse?.id === course.id ? '2px solid var(--text-primary)' : '1px solid #e5e7eb'
                  }}
                >
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '1rem' }}>{course.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {course.description}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {course.professor_name || 'Professor'}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--card-blue)', borderRadius: '0.75rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              💡 Learning Tip
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              I remember your previous questions and adapt my explanations to your learning style. Feel free to ask for clarification!
            </p>
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
          {selectedCourse ? (
            <>
              {/* Course Header with Tabs */}
              <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ padding: '1rem 1.5rem' }}>
                  <h2 className="heading-3" style={{ marginBottom: '0.25rem' }}>{selectedCourse.title}</h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {selectedCourse.description}
                  </p>
                </div>
                
                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem' }}>
                  <button
                    onClick={() => setActiveTab('materials')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'materials' ? '3px solid var(--text-primary)' : '3px solid transparent',
                      color: activeTab === 'materials' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === 'materials' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📚 Course Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('personalized')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'personalized' ? '3px solid var(--text-primary)' : '3px solid transparent',
                      color: activeTab === 'personalized' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === 'personalized' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ✨ Personalized Learning
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'insights' ? '3px solid var(--text-primary)' : '3px solid transparent',
                      color: activeTab === 'insights' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === 'insights' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📊 My Insights
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'chat' ? '3px solid var(--text-primary)' : '3px solid transparent',
                      color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === 'chat' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    💬 Chat & Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab('voice')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'voice' ? '3px solid var(--text-primary)' : '3px solid transparent',
                      color: activeTab === 'voice' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: activeTab === 'voice' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Talk to Brillia
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'materials' && (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {materials.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                        <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>No Materials Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          Your professor hasn't uploaded any materials for this course yet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Materials List Sidebar */}
                      <div style={{ 
                        width: '320px', 
                        background: 'var(--bg-card)', 
                        borderRight: '1px solid #e5e7eb',
                        overflowY: 'auto',
                        padding: '1.5rem'
                      }}>
                        <h3 className="heading-3" style={{ marginBottom: '1rem' }}>
                          Materials ({materials.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {materials.map((material, index) => (
                            <div
                              key={material.id}
                              onClick={() => setSelectedMaterial(material)}
                              className="hover-lift"
                              style={{
                                padding: '1rem',
                                background: selectedMaterial?.id === material.id ? 'var(--card-purple)' : 'var(--bg-section)',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                border: selectedMaterial?.id === material.id ? '2px solid var(--text-primary)' : '1px solid #e5e7eb',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                  color: 'white'
                                }}>
                                  {index + 1}
                                </div>
                                <span style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'var(--text-primary)',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.625rem',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  color: 'white'
                                }}>
                                  {material.material_type || 'Material'}
                                </span>
                              </div>
                              <h4 style={{ 
                                fontWeight: 600, 
                                fontSize: '0.875rem',
                                marginBottom: '0.25rem',
                                lineHeight: 1.4,
                                color: 'var(--text-primary)'
                              }}>
                                {material.title}
                              </h4>
                              <p style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)',
                                lineHeight: 1.4
                              }}>
                                {new Date(material.uploaded_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Material Content Area */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
                        {selectedMaterial ? (
                          <div>
                            {/* Material Header */}
                            <div style={{ marginBottom: '2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <span style={{
                                  padding: '0.5rem 1rem',
                                  background: selectedMaterial.material_type === 'lecture' ? 'var(--card-blue)' :
                                             selectedMaterial.material_type === 'assignment' ? 'var(--card-yellow)' :
                                             selectedMaterial.material_type === 'reading' ? 'var(--card-green)' : 'var(--card-purple)',
                                  borderRadius: '1rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textTransform: 'uppercase'
                                }}>
                                  {selectedMaterial.material_type || 'Material'}
                                </span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                  Uploaded: {new Date(selectedMaterial.uploaded_at).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>
                                {selectedMaterial.title}
                              </h1>
                            </div>

                            {/* Material Content */}
                            <div className="markdown-content" style={{ 
                              background: 'var(--bg-card)',
                              padding: '2rem',
                              borderRadius: '0.75rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedMaterial.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                              <p style={{ color: 'var(--text-secondary)' }}>
                                Select a material from the list to view its content
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'personalized' && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <PersonalizedLearning courseId={selectedCourse?.id} />
                </div>
              )}

              {activeTab === 'insights' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                  {loadingInsights ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your insights...</p>
                    </div>
                  ) : insights ? (
                    <div>
                      <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Your Learning Insights</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Track your progress and identify areas for improvement
                      </p>

                      {/* Key Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'var(--card-blue)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{insights.total_questions_asked}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Questions Asked</div>
                        </div>
                        <div style={{ background: 'var(--card-green)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{insights.total_quizzes}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quizzes Taken</div>
                        </div>
                        <div style={{ background: 'var(--card-yellow)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{insights.avg_quiz_score}%</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg Quiz Score</div>
                        </div>
                        <div style={{ background: 'var(--card-purple)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{insights.mastered_concepts}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Concepts Mastered</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Quiz Performance */}
                        {insights.quiz_by_topic && insights.quiz_by_topic.length > 0 && (
                          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <h3 className="heading-3" style={{ marginBottom: '1rem' }}>📊 Quiz Performance by Topic</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {insights.quiz_by_topic.slice(0, 5).map((topic, idx) => (
                                <div key={idx} style={{ paddingBottom: '0.75rem', borderBottom: idx < Math.min(insights.quiz_by_topic.length - 1, 4) ? '1px solid #e5e7eb' : 'none' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{topic.topic}</span>
                                    <span style={{ fontWeight: 700, color: topic.score >= 70 ? '#10b981' : topic.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                                      {topic.score}%
                                    </span>
                                  </div>
                                  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                      width: `${topic.score}%`,
                                      height: '100%',
                                      background: topic.score >= 70 ? '#10b981' : topic.score >= 50 ? '#f59e0b' : '#ef4444',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Most Discussed Topics */}
                        {insights.most_discussed_topics && insights.most_discussed_topics.length > 0 && (
                          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                            <h3 className="heading-3" style={{ marginBottom: '1rem' }}>💬 Topics You Explored</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {insights.most_discussed_topics.slice(0, 10).map((topic, idx) => (
                                <div key={idx} style={{
                                  background: idx % 4 === 0 ? 'var(--card-purple)' : 
                                             idx % 4 === 1 ? 'var(--card-blue)' :
                                             idx % 4 === 2 ? 'var(--card-green)' : 'var(--card-yellow)',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 500
                                }}>
                                  {topic.topic} <span style={{ opacity: 0.7 }}>({topic.count})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Concept Mastery Heatmap */}
                      <div style={{ marginTop: '2rem' }}>
                        <h3 className="heading-2" style={{ marginBottom: '1rem' }}>🧠 Your Concept Mastery</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                          Track your understanding of different concepts based on questions and quiz performance
                        </p>
                        <ConceptHeatmap heatmapData={insights.concept_mastery?.heatmap_data || []} showStudents={false} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                      <h3 className="heading-3" style={{ marginBottom: '0.5rem' }}>No Insights Yet</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Start asking questions and taking quizzes to see your learning insights!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Chat Messages */}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {messages.length === 0 ? (
                  <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
                    <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                      <span style={{ fontSize: '2rem' }}>🎓</span>
                    </div>
                    <h2 className="heading-2" style={{ marginBottom: '1rem' }}>Welcome to {selectedCourse.title}!</h2>
                    <p className="body-large" style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                      I'm Brillia, your AI teaching assistant. I'm here to help you truly understand concepts, not just answer questions. Ask me anything about this course!
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInputMessage(q)}
                          className="hover-lift"
                          style={{
                            textAlign: 'left',
                            padding: '1rem',
                            background: 'var(--bg-card)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)', marginRight: '0.5rem' }}>→</span>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {messages.map(message => (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                          marginBottom: '1.5rem'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '1rem 1.25rem',
                            borderRadius: '1rem',
                            background: message.role === 'user' ? 'var(--text-primary)' : 'var(--bg-card)',
                            color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                            border: message.role === 'user' ? 'none' : '1px solid #e5e7eb'
                          }}
                        >
                          {message.role === 'assistant' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, var(--card-purple), var(--card-blue))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                  B
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Brillia AI</span>
                              </div>
                              {message.student_major && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                  color: 'white',
                                  borderRadius: '1rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <span>✨</span>
                                  <span>Personalized for {message.student_major}</span>
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Key Topics */}
                          {message.role === 'assistant' && message.key_topics && message.key_topics.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                🎯 Key Topics:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {message.key_topics.map((topic, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      background: idx % 4 === 0 ? 'var(--card-purple)' : 
                                                 idx % 4 === 1 ? 'var(--card-blue)' :
                                                 idx % 4 === 2 ? 'var(--card-green)' : 'var(--card-yellow)',
                                      borderRadius: '1rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 500
                                    }}
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Concept Graph */}
                          {message.role === 'assistant' && message.concept_graph && message.concept_graph.length > 0 && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-section)', borderRadius: '0.5rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                🔗 Concept Connections:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {message.concept_graph.map((connection, idx) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{connection.source}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{connection.target}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      ({connection.relationship})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Markdown Content */}
                          {message.role === 'assistant' ? (
                            <div className="markdown-content" style={{ lineHeight: 1.6 }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div style={{ whiteSpace: 'pre-wrap', color: 'white', lineHeight: 1.6 }}>
                              {message.content}
                            </div>
                          )}
                          
                          {/* Sources/References */}
                          {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                            <div style={{ 
                              marginTop: '1rem', 
                              padding: '0.75rem', 
                              background: 'var(--bg-section)', 
                              borderRadius: '0.5rem',
                              borderLeft: '3px solid var(--card-blue)'
                            }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                📚 References from Course Materials:
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {message.sources.map((source, idx) => (
                                  <div key={idx} style={{ marginBottom: '0.25rem' }}>
                                    • {source}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div style={{ 
                            fontSize: '0.75rem', 
                            marginTop: '0.5rem', 
                            opacity: 0.8,
                            color: message.role === 'user' ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-secondary)'
                          }}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
                        <div style={{
                          padding: '1rem 1.25rem',
                          borderRadius: '1rem',
                          background: 'var(--bg-card)',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}></div>
                            <div style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}></div>
                            <div style={{ width: '8px', height: '8px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div style={{ background: 'var(--bg-card)', borderTop: '1px solid #e5e7eb', padding: '1.5rem' }}>
                <form onSubmit={handleSendMessage} style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Ask me anything about this course... (Press Enter to send, Shift+Enter for new line)"
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e5e7eb',
                        resize: 'none',
                        minHeight: '60px',
                        maxHeight: '150px'
                      }}
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={isTyping || !inputMessage.trim()}
                      className="btn-primary"
                      style={{ padding: '0.75rem 1.5rem', alignSelf: 'flex-end' }}
                    >
                      Send
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Brillia adapts to your learning style and remembers your progress
                  </p>
                </form>
              </div>
                </div>
              )}

              {activeTab === 'voice' && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <VoiceChat courseId={selectedCourse?.id} />
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Select a Course</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Choose a course from the sidebar to start learning with Brillia AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Mode Overlay */}
      {quizMode && quizData && (
        <QuizMode 
          quizData={quizData}
          onExit={() => {
            setQuizMode(false);
            setQuizData(null);
          }}
          courseName={selectedCourse?.title || 'Course'}
          courseId={selectedCourse?.id}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
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
          padding: '2rem'
        }}
        onClick={() => setShowProfile(false)}
        >
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '1rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowProfile(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'var(--bg-section)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--bg-section)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              ×
            </button>
            <StudentProfile user={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
