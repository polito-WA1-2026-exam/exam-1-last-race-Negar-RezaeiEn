import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navigation from './components/Navigation';
import Login from './components/Login';
import Game from './components/Game';
import Ranking from './components/Ranking';
import Home from './components/Home';

const NotFound = () => (
  <div className="text-center mt-5">
    <h1 className="display-1 fw-bold text-danger">404</h1>
    <h2>Route Not Found</h2>
    <p className="text-muted">The station you are looking for does not exist on this network.</p>
    <Button variant="outline-primary" className="mt-3" href="/">
      Return to Home Station
    </Button>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Container className="mb-5">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/game" 
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ranking" 
              element={
                <ProtectedRoute>
                  <Ranking />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;