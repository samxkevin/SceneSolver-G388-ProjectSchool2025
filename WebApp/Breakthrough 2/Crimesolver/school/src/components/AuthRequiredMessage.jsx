// src/components/AuthRequiredMessage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AuthRequiredMessage = ({ returnPath }) => {
  // Store the return path in session storage so it can be accessed after login
  useEffect(() => {
    sessionStorage.setItem('returnPath', returnPath);
  }, [returnPath]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#0f0f0f] border border-gray-700 rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-[#ff4757]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Authentication Required
        </h2>
        
        <div className="my-6">
          <p className="text-gray-300 mb-4">
            You need to be logged in to access this page. Please log in with your credentials to continue.
          </p>
          <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-800 bg-opacity-20">
            <p className="text-yellow-300 text-sm">
              You will be redirected to the login page automatically.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link 
            to="/Login" 
            state={{ from: returnPath }}
            className="bg-[#ff4757] hover:bg-[#ff6b81] text-white font-semibold py-2 px-6 rounded transition-colors duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredMessage;