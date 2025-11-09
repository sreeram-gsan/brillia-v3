import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/login?email=${email}&password=${password}`
    );
    
    const { access_token, user: userData } = response.data;
    
    setUser(userData);
    setToken(access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    return userData;
  };

  const register = async (name, email, password, role) => {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/auth/register`,
      { name, email, password, role }
    );
    
    const { access_token, user: userData } = response.data;
    
    setUser(userData);
    setToken(access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
