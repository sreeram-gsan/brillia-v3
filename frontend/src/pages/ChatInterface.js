import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { chatAPI, coursesAPI } from '../utils/api';

const ChatInterface = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCourseAndHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCourseAndHistory = async () => {
    try {
      const [courseRes, historyRes] = await Promise.all([
        coursesAPI.getById(courseId),
        chatAPI.getHistory(courseId)
      ]);
      setCourse(courseRes.data);
      setMessages(historyRes.data);
      
      // Get the last session ID if exists
      if (historyRes.data.length > 0) {
        setSessionId(historyRes.data[historyRes.data.length - 1].session_id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 403) {
        alert('You must be enrolled in this course');
        navigate('/student');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatAPI.send({
        course_id: courseId,
        message: userMessage,
        session_id: sessionId
      });

      // Add AI response
      const aiMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: response.data.message,
        timestamp: response.data.timestamp
      };
      setMessages(prev => [...prev, aiMessage]);
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Can you explain this topic to me?",
    "I don't understand this concept",
    "Can you give me an example?",
    "How does this relate to what we learned earlier?",
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Loading..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title={course.title} />
      
      {/* Course Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/student" className="text-primary-600 hover:text-primary-700 text-sm inline-flex items-center mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
              <p className="text-sm text-gray-600">{course.description}</p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Brillia AI Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-3xl">B</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to Brillia AI 👋
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                I'm your personalized teaching assistant for {course.title}. I'm here to help you understand concepts deeply, 
                not just provide quick answers. Ask me anything!
              </p>

              <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition text-sm text-gray-700"
                  >
                    <span className="text-primary-600 mr-2">→</span>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary-600 to-secondary-600 text-white rounded-2xl rounded-tr-none'
                        : 'bg-white text-gray-900 rounded-2xl rounded-tl-none shadow-md'
                    } px-6 py-4`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">B</span>
                        </div>
                        <span className="text-xs font-medium text-gray-600">Brillia AI</span>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      {message.content.split('\n').map((line, i) => (
                        <p key={i} className={message.role === 'user' ? 'mb-2 last:mb-0' : 'mb-3 last:mb-0'}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none shadow-md px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-6 py-4 max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
            <div className="flex-1">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows="3"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed h-fit"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Brillia AI is here to guide your learning. Ask questions, seek clarification, or explore concepts in depth.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
