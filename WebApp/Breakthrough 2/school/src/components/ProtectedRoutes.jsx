// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthRequiredMessage from './AuthRequiredMessage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff4757]"></div>
      </div>
    );
  }

  // Show message and redirect to login if not authenticated
  if (!isAuthenticated) {
    // Update the context to show the auth required message
    return (
      <>
        <AuthRequiredMessage returnPath={location.pathname} />
        <Navigate to="/Login" state={{ from: location.pathname }} replace />
      </>
    );
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;