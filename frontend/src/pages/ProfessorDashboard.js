import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { coursesAPI, materialsAPI, analyticsAPI } from '../utils/api';

const ProfessorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Professor Dashboard" />
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/course/:courseId" element={<CourseDetail />} />
      </Routes>
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    objectives: ['']
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getMyCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        ...newCourse,
        objectives: newCourse.objectives.filter(obj => obj.trim() !== '')
      };
      await coursesAPI.create(courseData);
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', objectives: [''] });
      loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesAPI.delete(courseId);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const addObjective = () => {
    setNewCourse({ ...newCourse, objectives: [...newCourse.objectives, ''] });
  };

  const updateObjective = (index, value) => {
    const updated = [...newCourse.objectives];
    updated[index] = value;
    setNewCourse({ ...newCourse, objectives: updated });
  };

  const removeObjective = (index) => {
    const updated = newCourse.objectives.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, objectives: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">Manage your courses and track student progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:shadow-xl transition"
        >
          + Create Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Create your first course to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 cursor-pointer"
              onClick={() => navigate(`/professor/course/${course.id}`)}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">
                    <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {course.student_count} students
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Introduction to Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="4"
                  placeholder="Describe what students will learn in this course..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives
                </label>
                {newCourse.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder={`Objective ${index + 1}`}
                    />
                    {newCourse.objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addObjective}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add Objective
                </button>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:shadow-xl transition"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    material_type: 'lecture',
    content: '',
    file: null
  });

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const [courseRes, materialsRes, analyticsRes] = await Promise.all([
        coursesAPI.getById(courseId),
        materialsAPI.getByCourse(courseId),
        analyticsAPI.getByCourse(courseId).catch(() => ({ data: null }))
      ]);
      setCourse(courseRes.data);
      setMaterials(materialsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('course_id', courseId);
      formData.append('title', uploadData.title);
      formData.append('material_type', uploadData.material_type);

      if (uploadData.file) {
        formData.append('file', uploadData.file);
        await materialsAPI.upload(formData);
      } else {
        formData.append('content', uploadData.content);
        await materialsAPI.uploadText(formData);
      }

      setShowUploadModal(false);
      setUploadData({ title: '', material_type: 'lecture', content: '', file: null });
      loadCourseData();
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Failed to upload material');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await materialsAPI.delete(materialId);
      loadCourseData();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete material');
    }
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Link to="/professor" className="text-primary-600 hover:text-primary-700 mb-6 inline-flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
        <p className="text-gray-600 mb-4">{course.description}</p>
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <span>{course.student_count} students enrolled</span>
          {course.objectives && course.objectives.length > 0 && (
            <span>{course.objectives.length} learning objectives</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-8">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-2 font-medium transition ${
                activeTab === 'materials'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Course Materials
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-2 font-medium transition ${
                activeTab === 'analytics'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'materials' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Materials</h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  + Upload Material
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No materials uploaded yet</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Upload your first material
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded capitalize">
                              {material.material_type}
                            </span>
                            <h3 className="font-semibold text-gray-900">{material.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{material.content.substring(0, 200)}...</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Course Analytics</h2>
              
              {!analytics || analytics.total_questions === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No analytics data yet. Students need to start asking questions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <div className="text-3xl font-bold text-blue-700">{analytics.total_questions}</div>
                      <div className="text-sm text-blue-600">Total Questions Asked</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                      <div className="text-3xl font-bold text-purple-700">{analytics.active_students}</div>
                      <div className="text-sm text-purple-600">Active Students</div>
                    </div>
                  </div>

                  {/* Common Topics */}
                  {analytics.common_topics && analytics.common_topics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Topics Discussed</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {analytics.common_topics.map((topic, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-lg font-semibold text-gray-900">{topic.topic}</div>
                            <div className="text-sm text-gray-500">{topic.count} mentions</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confusion Points */}
                  {analytics.confusion_points && analytics.confusion_points.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Confusion Points</h3>
                      <div className="space-y-2">
                        {analytics.confusion_points.map((point, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-900">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Material</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Lecture 1: Introduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  required
                  value={uploadData.material_type}
                  onChange={(e) => setUploadData({ ...uploadData, material_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="syllabus">Syllabus</option>
                  <option value="lecture">Lecture Notes</option>
                  <option value="assignment">Assignment</option>
                  <option value="notes">General Notes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Upload File (PDF, DOCX, TXT)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0], content: '' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="text-center text-gray-500">OR</div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Paste Text Content</label>
                    <textarea
                      value={uploadData.content}
                      onChange={(e) => setUploadData({ ...uploadData, content: e.target.value, file: null })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="8"
                      placeholder="Paste your content here..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:shadow-xl transition"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;
