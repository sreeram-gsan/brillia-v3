import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
      {/* Navigation */}
      <nav className="container mx-auto px-6" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Brillia
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/hashtag/vibecon?src=hashtag_click"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 hover:opacity-70 transition"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              About Us
            </a>
            <button
              onClick={() => navigate('/admin')}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{ padding: '5rem 0 8rem 0', textAlign: 'center' }}>
        <div className="container">
          <div className="hero-announcement" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--badge-bg)', borderRadius: '999px', marginBottom: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
            </svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Upgrading Classrooms to the GenAI Era
            </span>
          </div>
          
          <h1 className="heading-hero" style={{ marginBottom: '1.5rem', maxWidth: '900px', margin: '0 auto 1.5rem' }}>
            From Answers to Understanding
          </h1>
          
          <p className="body-large" style={{ color: 'var(--text-secondary)', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: '1.8' }}>
            LLMs answer questions; Brillia helps students truly learn. Brillia is an agentic learning platform that understands both course content and each student, delivering personalized education for the GenAI era.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button
              onClick={() => navigate('/teacher')}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              I'm a Teacher
            </button>
            <button
              onClick={() => navigate('/student')}
              className="btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              I'm a Student
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Brillia */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-page)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="heading-1" style={{ marginBottom: '1rem' }}>Bridging the Classroom to the GenAI Era</h2>
            <p className="body-large" style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
              Brillia transforms AI from an answer machine into an intelligent teaching partner
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="voice-card accent-purple hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Teaches, Not Just Answers</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Unlike LLMs that give quick answers, Brillia guides students through concepts with adaptive explanations until they master the material.
              </p>
            </div>

            <div className="voice-card accent-blue hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Contextual Intelligence</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Trained on your course materials, Brillia provides context-aware guidance rooted in your syllabus, not generic knowledge.
              </p>
            </div>

            <div className="voice-card accent-orange hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M12 7v14"></path>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Guides to Mastery</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Tracks each student's learning journey, adapting content and difficulty to guide them from confusion to mastery.
              </p>
            </div>

            <div className="voice-card accent-green hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Deep Learning Insights</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Professors see exactly how students learn—confusion points, mastery levels, and engagement patterns—enabling data-driven teaching.
              </p>
            </div>

            <div className="voice-card accent-yellow hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Lecture Hall to AI Future</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Upload course materials and transform your classroom in minutes. Brillia bridges traditional teaching with GenAI's potential.
              </p>
            </div>

            <div className="voice-card accent-pink hover-lift">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Unlocks GenAI's True Potential</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Move beyond simple Q&A. Brillia harnesses GenAI to create genuine educational experiences that scale to every student.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '5rem 0', background: 'var(--bg-page)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="heading-1" style={{ marginBottom: '1rem' }}>How Brillia Works</h2>
            <p className="body-large" style={{ color: 'var(--text-secondary)' }}>Three simple steps to transform your classroom</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                1
              </div>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Professors Upload Materials</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Upload lecture slides, syllabi, and assignments—or connect your existing LMS. Brillia builds a structured knowledge graph of your course content to deliver precise, context-aware responses.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                2
              </div>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Students Get 24/7 Personalized TA</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Students interact with Brillia anytime, getting instant help with concepts. Brillia adapts explanations, gamifies the learning experience, and guides students to true mastery—not just quick answers.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                3
              </div>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Professors Gain Deep Insights</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Access a treasure trove of analytics showing which concepts students struggle with, which they master quickly, and engagement patterns—empowering you to adjust teaching strategies in real-time and for future courses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-page)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="heading-1" style={{ marginBottom: '1rem' }}>Perfect For</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>High-Enrollment Courses</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Give every student personalized attention at scale. Track concept mastery across hundreds of students and identify struggling learners before they fall behind—without expanding your TA budget.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Conceptually Dense Subjects</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Perfect for STEM, economics, and theory-heavy courses. Brillia breaks down complex concepts with adaptive explanations, interactive quizzes, and visual knowledge graphs that show how ideas connect.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3 className="heading-3" style={{ marginBottom: '0.75rem' }}>Professors Seeking Data-Driven Teaching</h3>
              <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
                Move beyond gut feelings. See exactly which concepts confuse students, who's engaged, and who's at risk. Use real-time analytics and concept mastery heatmaps to refine your teaching approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, #fceee7 0%, #e8d9f1 100%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="heading-1" style={{ marginBottom: '1rem' }}>Every Student Deserves True Understanding</h2>
          <p className="body-large" style={{ color: 'var(--text-secondary)', margin: '0 auto 2.5rem', maxWidth: '750px', lineHeight: '1.8' }}>
            Brillia isn't just another tool—it's an agentic teaching platform that guides students to mastery. Give your students a teaching assistant that's always there, adapts to how they learn, and helps you understand what's really happening in your classroom.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/teacher')}
              className="btn-primary"
            >
              Request Early Access as Teacher
            </button>
            <button 
              onClick={() => navigate('/student')}
              className="btn-secondary"
            >
              Request Early Access as Student
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 0', background: 'var(--bg-card)', borderTop: '1px solid #e5e7eb' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Brillia
            </span>
          </div>
          <p className="body-small" style={{ color: 'var(--text-secondary)' }}>
            From Answers to Understanding — Where Education Meets Intelligence
          </p>
          <p className="body-small" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            © 2024 Brillia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
