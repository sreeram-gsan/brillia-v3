import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import AdminPage from './pages/AdminPage';
import TeacherAuth from './pages/TeacherAuth';
import AdminAuth from './pages/AdminAuth';
import StudentAuth from './pages/StudentAuth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teacher" element={
          <TeacherAuth>
            <TeacherPage />
          </TeacherAuth>
        } />
        <Route path="/admin" element={
          <AdminAuth>
            <AdminPage />
          </AdminAuth>
        } />
        <Route path="/student" element={
          <StudentAuth>
            <StudentPage />
          </StudentAuth>
        } />
      </Routes>
    </Router>
  );
}

export default App;
