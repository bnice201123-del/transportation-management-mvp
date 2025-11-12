import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from '../config/axios.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const initialToken = localStorage.getItem('token');
  console.log('AuthProvider - Initializing with token from localStorage:', initialToken?.substring(0, 20) + '...' || 'null');
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/verify');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext - useEffect triggered, token:', token?.substring(0, 20) + '...' || 'null');
    if (token) {
      console.log('AuthContext - Token exists, setting axios header and fetching profile');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      console.log('AuthContext - No token, setting loading to false');
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email, password) => {
    try {
      setLoading(true); // Set loading during login
      console.log('AuthContext - Making login request to:', '/api/auth/login');
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('AuthContext - Login response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      
      // console.log('AuthContext - Setting token and user:', { token: newToken?.substring(0, 20) + '...', user: userData });
      
      // Set all state synchronously
      setToken(newToken);
      setUser(userData);
      setLoading(false);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('AuthContext - Login completed successfully');
      console.log('AuthContext - Auth state should now be: token exists:', !!newToken, 'user exists:', !!userData);
      
      // Wait a moment for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      console.error('AuthContext - Login error:', error);
      console.error('AuthContext - Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token && !!user;
  
  // Debug logging for auth state changes
  React.useEffect(() => {
    console.log('AuthContext - Auth state changed:'); 
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - hasToken:', !!token);
    console.log('  - hasUser:', !!user);
    console.log('  - token length:', token?.length || 0);
    console.log('  - userEmail:', user?.email);
    console.log('  - userRole:', user?.role);
    console.log('  - user object:', user);
  }, [isAuthenticated, token, user]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};