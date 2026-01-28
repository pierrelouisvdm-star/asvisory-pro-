import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Clone response to safely handle both success and error cases
    const responseClone = response.clone();
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('advisorypro_token', data.access_token);
      localStorage.setItem('advisorypro_user', JSON.stringify(data.user));
      return data;
    } catch (parseError) {
      // If JSON parsing fails, try to get error from clone
      if (!response.ok) {
        try {
          const errorData = await responseClone.json();
          throw new Error(errorData.detail || 'Login failed');
        } catch {
          throw new Error('Login failed');
        }
      }
      throw parseError;
    }
  };

  const register = async (email, password, fullName, company) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password, 
        full_name: fullName,
        company 
      }),
    });

    // Clone response to safely handle both success and error cases
    const responseClone = response.clone();
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('advisorypro_token', data.access_token);
      localStorage.setItem('advisorypro_user', JSON.stringify(data.user));
      return data;
    } catch (parseError) {
      // If JSON parsing fails, try to get error from clone
      if (!response.ok) {
        try {
          const errorData = await responseClone.json();
          throw new Error(errorData.detail || 'Registration failed');
        } catch {
          throw new Error('Registration failed');
        }
      }
      throw parseError;
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
