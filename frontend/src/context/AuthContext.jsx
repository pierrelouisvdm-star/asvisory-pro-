import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Auto-detect API URL: use current domain in production, env variable in development
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
  ? window.location.origin 
  : process.env.REACT_APP_BACKEND_URL;

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

  const login = async (email, password, rememberMe = false) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { 
        email, 
        password,
        remember_me: rememberMe
      });
      
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('advisorypro_token', data.access_token);
      localStorage.setItem('advisorypro_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Invalid email or password');
    }
  };

  const register = async (email, password, fullName, company, role = null) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName,
        company,
        role,
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

  const setRole = async (role) => {
    const { data } = await axios.post(
      `${API_URL}/api/auth/set-role`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUser(data);
    localStorage.setItem('advisorypro_user', JSON.stringify(data));
    return data;
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
    role: user?.role || null,
    needsRoleSelection: !!user && !user.role && !user.is_admin ? true : (!!user && !user.role),
    isAdvisor: user?.role === 'advisor',
    isIndividual: user?.role === 'individual',
    login,
    register,
    setRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
