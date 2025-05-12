// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated when component mounts
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setAuthMessage(false);
    
    // Check if there's a return path in sessionStorage
    const returnPath = sessionStorage.getItem('returnPath');
    if (returnPath) {
      sessionStorage.removeItem('returnPath'); // Clear it after use
      return returnPath; // Return the path for redirection
    }
    
    return '/'; // Default return path
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Show auth required message
  const showAuthMessage = () => {
    setAuthMessage(true);
  };

  // Hide auth required message
  const hideAuthMessage = () => {
    setAuthMessage(false);
  };
  
  // Context value
  const value = {
    isAuthenticated,
    loading,
    authMessage,
    login,
    logout,
    showAuthMessage,
    hideAuthMessage
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};