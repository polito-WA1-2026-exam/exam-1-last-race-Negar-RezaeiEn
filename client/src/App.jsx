import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

// --- Context & Security ---
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// --- Page Components ---
import Navigation from './components/Navigation';
import Login from './components/Login';
import Game from './components/Game';
import Ranking from './components/Ranking';

// --- Placeholder Components (Upgraded with Bootstrap UI) ---
const Home = () => (
  <div className="text-center mt-5">
    <h1 className="display-4 fw-bold">🚇 Welcome to The Last Race</h1>
    <p className="lead text-muted mt-3">
      Navigate the underground network, avoid events, and reach your destination.
    </p>
    <div className="mt-4">
      <Button variant="primary" size="lg" href="/login">
        Login to Start Playing
      </Button>
    </div>
  </div>
);

const NotFound = () => (
  <div className="text-center mt-5">
    <h1 className="display-1 fw-bold text-danger">404</h1>
    <h2>Route Not Found</h2>
    <p className="text-muted">The station you are looking for does not exist on this line.</p>
    <Button variant="outline-primary" className="mt-3" href="/">
      Return to Home Station
    </Button>
  </div>
);

function App() {
  return (
    // 1. AuthProvider wraps the entire app to provide global user state
    <AuthProvider>
      <BrowserRouter>
        {/* 2. Navigation bar remains persistent across all routes */}
        <Navigation />
        
        {/* 3. Container adds horizontal padding and centers the main content */}
        <Container className="mb-5">
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* --- Protected Routes (Require Authentication) --- */}
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
            
            {/* --- Fallback Route (Catch-all for invalid URLs) --- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;