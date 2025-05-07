import React from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Contact from "./pages/contact";
import Upload from "./pages/upload";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoutes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/Upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;