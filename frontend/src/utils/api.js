import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/api/courses'),
  getMyCourses: () => api.get('/api/courses/my-courses'),
  getById: (id) => api.get(`/api/courses/${id}`),
  create: (data) => api.post('/api/courses', data),
  delete: (id) => api.delete(`/api/courses/${id}`),
  enroll: (courseId) => api.post('/api/courses/enroll', { course_id: courseId }),
};

// Materials API
export const materialsAPI = {
  upload: (data) => api.post('/api/materials/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadText: (data) => api.post('/api/materials/upload-text', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getByCourse: (courseId) => api.get(`/api/materials/course/${courseId}`),
  delete: (id) => api.delete(`/api/materials/${id}`),
};

// Chat API
export const chatAPI = {
  send: (data) => api.post('/api/chat/send', data),
  getHistory: (courseId) => api.get(`/api/chat/history/${courseId}`),
  getSessions: (courseId) => api.get(`/api/chat/sessions/${courseId}`),
};

// Analytics API
export const analyticsAPI = {
  getByCourse: (courseId) => api.get(`/api/analytics/course/${courseId}`),
};

export default api;
