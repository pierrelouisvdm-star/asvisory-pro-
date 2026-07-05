import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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

// Global axios response interceptor — installed once on module load.
// If ANY authenticated request returns 401 "Could not validate credentials",
// we clear the stale token and take the user back to /auth with a clean message.
let sessionExpiredHandled = false;
axios.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    // Only react to auth-failure statuses; leave normal 400s alone.
    if ((status === 401 || status === 403) && detail === 'Could not validate credentials') {
      if (!sessionExpiredHandled) {
        sessionExpiredHandled = true;
        try {
          localStorage.removeItem('advisorypro_token');
          localStorage.removeItem('advisorypro_user');
        } catch (_err) {
          // Ignore storage errors (private-mode Safari etc.)
        }
        toast.error('Your session expired. Please sign in again.');
        // Give the toast a beat, then redirect. Use hard navigation so any
        // in-flight component state is wiped.
        setTimeout(() => {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.assign('/auth');
          }
          sessionExpiredHandled = false;
        }, 400);
      }
    }
    return Promise.reject(error);
  },
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('advisorypro_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount, and validate the stored token
    // against the backend so a stale/expired token doesn't put the user
    // into a broken state (e.g. the role picker modal calling set-role
    // and getting a 401 back).
    const storedUser = localStorage.getItem('advisorypro_user');
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(JSON.parse(storedUser));
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh user object in case role / profile changed server-side.
        setUser(data);
        localStorage.setItem('advisorypro_user', JSON.stringify(data));
      } catch (err) {
        if (err?.response?.status === 401) {
          // The global interceptor above will handle redirect+toast;
          // just clear state here so consumers don't render as authed.
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
