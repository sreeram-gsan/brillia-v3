import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import ConceptHeatmap from '../components/ConceptHeatmap';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AnalyticsTab = ({ selectedCourse, materials }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conceptMastery, setConceptMastery] = useState(null);
  const [loadingConcepts, setLoadingConcepts] = useState(false);

  useEffect(() => {
    if (selectedCourse) {
      loadAnalytics();
      loadConceptMastery();
    }
  }, [selectedCourse]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/analytics/course/${selectedCourse.id}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConceptMastery = async () => {
    try {
      setLoadingConcepts(true);
      const response = await axios.get(`${API_URL}/api/quiz/concept-mastery/${selectedCourse.id}`);
      setConceptMastery(response.data);
    } catch (err) {
      console.error('Error loading concept mastery:', err);
    } finally {
      setLoadingConcepts(false);
    }
  };

  if (!selectedCourse) {
    return (
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
        Select a course to view analytics
      </p>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div>
      <h2 className="heading-3" style={{ marginBottom: '1.5rem' }}>
        {selectedCourse.title} - Course Analytics
      </h2>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--card-blue)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.total_questions}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Questions Asked</div>
        </div>
        <div style={{ background: 'var(--card-purple)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.active_students}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Students</div>
        </div>
        <div style={{ background: 'var(--card-green)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.total_quizzes}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quizzes Taken</div>
        </div>
        <div style={{ background: 'var(--card-yellow)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.avg_quiz_score}%</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg Quiz Score</div>
        </div>
        <div style={{ background: 'var(--card-pink)', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{materials[selectedCourse.id]?.length || 0}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Materials</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Quiz Performance by Topic */}
        {analytics.quiz_topics && analytics.quiz_topics.length > 0 && (
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Quiz Performance by Topic
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics.quiz_topics.map((topic, idx) => (
                <div key={idx} style={{ paddingBottom: '0.75rem', borderBottom: idx < analytics.quiz_topics.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{topic.topic}</span>
                    <span style={{ fontWeight: 700, color: topic.avg_score >= 70 ? '#10b981' : topic.avg_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {topic.avg_score}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${topic.avg_score}%`,
                      height: '100%',
                      background: topic.avg_score >= 70 ? '#10b981' : topic.avg_score >= 50 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {topic.attempts} quiz attempts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Topics Discussed */}
        {analytics.common_topics && analytics.common_topics.length > 0 && (
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
            <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 Most Discussed Topics
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {analytics.common_topics.slice(0, 8).map((topic, idx) => (
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

      {/* Struggling Topics */}
      {analytics.confusion_points && analytics.confusion_points.length > 0 && analytics.confusion_points[0] !== "No struggling topics yet" && (
        <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #fed7aa' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Topics Students Struggle With
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {analytics.confusion_points.map((point, idx) => (
              <li key={idx} style={{ padding: '0.5rem 0', borderBottom: idx < analytics.confusion_points.length - 1 ? '1px solid #fed7aa' : 'none' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>• {point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Engagement Trend Chart */}
      {analytics.engagement_trend && analytics.engagement_trend.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
          <h3 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📈 7-Day Engagement Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px' }}>
            {analytics.engagement_trend.map((day, idx) => {
              const maxValue = Math.max(...analytics.engagement_trend.map(d => d.questions + d.quizzes), 1);
              const totalHeight = ((day.questions + day.quizzes) / maxValue) * 150;
              const questionHeight = (day.questions / maxValue) * 150;
              const quizHeight = (day.quizzes / maxValue) * 150;
              
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '150px', gap: '2px' }}>
                    {day.quizzes > 0 && (
                      <div style={{
                        width: '100%',
                        height: `${quizHeight}px`,
                        background: 'var(--card-green)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease'
                      }} title={`${day.quizzes} quizzes`} />
                    )}
                    {day.questions > 0 && (
                      <div style={{
                        width: '100%',
                        height: `${questionHeight}px`,
                        background: 'var(--card-blue)',
                        borderRadius: day.quizzes > 0 ? '0 0 4px 4px' : '4px',
                        transition: 'height 0.3s ease'
                      }} title={`${day.questions} questions`} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day.date}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{day.questions + day.quizzes}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--card-blue)', borderRadius: '4px' }}></div>
              <span>Questions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--card-green)', borderRadius: '4px' }}></div>
              <span>Quizzes</span>
            </div>
          </div>
        </div>
      )}

      {/* Concept Mastery Heatmap */}
      <div style={{ marginTop: '2rem' }}>
        <h3 className="heading-2" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🧠 Concept Mastery Heatmap
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Visual representation of how well students understand different concepts based on questions asked, quiz performance, and engagement patterns.
        </p>
        {loadingConcepts ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading concept mastery data...</p>
          </div>
        ) : (
          <ConceptHeatmap heatmapData={conceptMastery?.heatmap_data || []} />
        )}
      </div>
    </div>
  );
};

const TeacherPage = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMaterial, setViewMaterial] = useState(null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', objectives: '' });
  const [newMaterial, setNewMaterial] = useState({ title: '', type: 'lecture', content: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock teacher ID - in real app this would come from auth
  const teacherId = user?.id || 'teacher-demo-001';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses/`);
      setCourses(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId) => {
    try {
      const response = await axios.get(`${API_URL}/api/materials/course/${courseId}`);
      setMaterials(prev => ({ ...prev, [courseId]: response.data }));
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        title: newCourse.title,
        description: newCourse.description,
        objectives: newCourse.objectives ? newCourse.objectives.split('\n').filter(o => o.trim()) : [],
        professor_id: teacherId,
        professor_name: 'Demo Teacher'
      };
      
      const response = await axios.post(`${API_URL}/api/courses/`, courseData);
      setCourses([...courses, response.data]);
      setShowCreateCourse(false);
      setNewCourse({ title: '', description: '', objectives: '' });
      setError('');
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course');
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('course_id', selectedCourse.id);
      formData.append('title', newMaterial.title);
      formData.append('material_type', newMaterial.type);
      formData.append('content', newMaterial.content);
      
      await axios.post(`${API_URL}/api/materials/upload-text`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Reload materials for this course
      await loadMaterials(selectedCourse.id);
      setShowUploadMaterial(false);
      setShowPreview(false);
      setNewMaterial({ title: '', type: 'lecture', content: '' });
      setError('');
    } catch (err) {
      console.error('Error uploading material:', err);
      setError('Failed to upload material');
    }
  };

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    if (!materials[course.id]) {
      await loadMaterials(course.id);
    }
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this course? All associated materials will also be deleted.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/courses/${courseId}`);
      setCourses(courses.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      setError('');
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/materials/${materialId}`);
      await loadMaterials(selectedCourse.id);
      setError('');
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete material');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
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
              <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }}>| Teacher Dashboard</span>
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
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>Teacher Dashboard</h1>
          <p className="body-large" style={{ color: 'var(--text-secondary)' }}>
            Manage courses, upload materials, and track student progress
          </p>
        </div>

        {/* Tabs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('courses')}
              style={{
                padding: '0.75rem 0',
                borderBottom: activeTab === 'courses' ? '2px solid var(--text-primary)' : 'none',
                color: activeTab === 'courses' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'courses' ? 600 : 400,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '0.75rem 0',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--text-primary)' : 'none',
                color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'analytics' ? 600 : 400,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Analytics
            </button>
          </div>

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              {error && (
                <div style={{ padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', marginBottom: '1rem', color: '#c00' }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="heading-3">Courses</h2>
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  + Create Course
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No courses yet</p>
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Create Your First Course
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className="hover-lift"
                      style={{
                        background: selectedCourse?.id === course.id ? 'var(--card-purple)' : 'var(--bg-section)',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        border: selectedCourse?.id === course.id ? '2px solid var(--text-primary)' : '1px solid #e5e7eb',
                        position: 'relative'
                      }}
                    >
                      <button
                        onClick={(e) => handleDeleteCourse(course.id, e)}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        title="Delete course"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                      <h3 className="heading-3" style={{ marginBottom: '0.5rem', paddingRight: '2rem' }}>{course.title}</h3>
                      <p className="body-small" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {course.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span>{course.student_count || 0} students</span>
                        <span>{materials[course.id]?.length || 0} materials</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Course Details */}
              {selectedCourse && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-section)', borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="heading-3">Course Materials</h3>
                    <button
                      onClick={() => setShowUploadMaterial(true)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      + Upload Material
                    </button>
                  </div>

                  {!materials[selectedCourse.id] ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                  ) : materials[selectedCourse.id].length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                      No materials uploaded yet
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {materials[selectedCourse.id].map(material => (
                        <div
                          key={material.id}
                          style={{
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{
                                  background: 'var(--card-blue)',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textTransform: 'capitalize'
                                }}>
                                  {material.material_type}
                                </span>
                                <h4 style={{ fontWeight: 600 }}>{material.title}</h4>
                              </div>
                              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                                {material.content.substring(0, 100)}...
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                              <button
                                onClick={() => setViewMaterial(material)}
                                className="btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(material.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                title="Delete material"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab selectedCourse={selectedCourse} materials={materials} />
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '0.75rem', maxWidth: '600px', width: '100%', padding: '2rem' }}>
            <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Create New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                  placeholder="Introduction to Computer Science"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <textarea
                  required
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', minHeight: '100px' }}
                  placeholder="Describe your course..."
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Learning Objectives</label>
                <textarea
                  value={newCourse.objectives}
                  onChange={(e) => setNewCourse({ ...newCourse, objectives: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', minHeight: '80px' }}
                  placeholder="What will students learn? (optional)"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadMaterial && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '0.75rem', maxWidth: '900px', width: '100%', padding: '2rem', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Upload Course Material (Markdown)</h2>
            <form onSubmit={handleUploadMaterial}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Title</label>
                <input
                  type="text"
                  required
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                  placeholder="Lecture 1: Introduction"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Type</label>
                <select
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                >
                  <option value="lecture">Lecture Notes</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="assignment">Assignment</option>
                  <option value="reading">Reading Material</option>
                </select>
              </div>
              
              {/* Tab Switcher */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: !showPreview ? '2px solid var(--text-primary)' : 'none',
                    color: !showPreview ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: !showPreview ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: showPreview ? '2px solid var(--text-primary)' : 'none',
                    color: showPreview ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: showPreview ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  Preview
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {!showPreview ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Content (Markdown)
                    </label>
                    <textarea
                      required
                      value={newMaterial.content}
                      onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        borderRadius: '0.5rem', 
                        border: '1px solid #e5e7eb', 
                        minHeight: '300px',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                      placeholder="# Introduction&#10;&#10;Write your content in **markdown** format...&#10;&#10;## Topics&#10;- Topic 1&#10;- Topic 2&#10;&#10;```python&#10;print('Hello, World!')&#10;```"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Supports markdown: headings, **bold**, *italic*, lists, code blocks, etc.
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    minHeight: '300px', 
                    padding: '1rem', 
                    background: 'var(--bg-section)', 
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Preview:
                    </div>
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {newMaterial.content || '*No content yet*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadMaterial(false);
                    setShowPreview(false);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Material Modal */}
      {viewMaterial && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '0.75rem', maxWidth: '900px', width: '100%', padding: '2rem', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{
                    background: 'var(--card-blue)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {viewMaterial.material_type || viewMaterial.type}
                  </span>
                  <h2 className="heading-2">{viewMaterial.title}</h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Uploaded {new Date(viewMaterial.uploaded_at || viewMaterial.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setViewMaterial(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              padding: '1.5rem', 
              background: 'var(--bg-section)', 
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {viewMaterial.content}
                </ReactMarkdown>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setViewMaterial(null)}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPage;
