import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { coursesAPI } from '../utils/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrolled');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const [enrolledRes, allCoursesRes] = await Promise.all([
        coursesAPI.getMyCourses(),
        coursesAPI.getAll()
      ]);
      
      setEnrolledCourses(enrolledRes.data);
      
      // Filter out already enrolled courses
      const enrolledIds = new Set(enrolledRes.data.map(c => c.id));
      const available = allCoursesRes.data.filter(c => !enrolledIds.has(c.id));
      setAvailableCourses(available);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await coursesAPI.enroll(courseId);
      loadCourses();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.detail || 'Failed to enroll in course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Student Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Student Dashboard" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-600 mt-1">Learn with AI-powered personalized assistance</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`py-4 px-2 font-medium transition ${
                  activeTab === 'enrolled'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Courses ({enrolledCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-2 font-medium transition ${
                  activeTab === 'available'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Courses ({availableCourses.length})
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'enrolled' && (
              <>
                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses enrolled yet</h3>
                    <p className="text-gray-600 mb-6">Browse available courses and start learning with Brillia</p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-md hover:shadow-xl transition p-6 cursor-pointer border border-primary-100"
                        onClick={() => navigate(`/chat/${course.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            Enrolled
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{course.professor_name}</span>
                          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                            Start Learning →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'available' && (
              <>
                {availableCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500">No more courses available. Check back later!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            {course.student_count} students
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm text-gray-500">{course.professor_name}</span>
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                          >
                            Enroll Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
