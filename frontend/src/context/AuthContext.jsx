import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
  const [token, setToken] = useState(localStorage.getItem('advisorypro_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('advisorypro_user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('advisorypro_token', data.access_token);
      localStorage.setItem('advisorypro_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Invalid email or password');
    }
  };

  const register = async (email, password, fullName, company) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName,
        company
      });
      
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('advisorypro_token', data.access_token);
      localStorage.setItem('advisorypro_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('advisorypro_token');
    localStorage.removeItem('advisorypro_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
