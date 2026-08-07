/** Root App component with client-side routing. */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Workspace from './pages/Workspace';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/workspace" 
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
