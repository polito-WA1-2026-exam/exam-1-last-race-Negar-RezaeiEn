import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './AuthContext';

// Import our components
import Navigation from './components/Navigation';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// --- Placeholder Components ---
const Home = () => <h2>Welcome to Last Race! (Anonymous View)</h2>;
const Game = () => <h2>Game Board (Protected View)</h2>;
const Ranking = () => <h2>Leaderboard (Protected View)</h2>;
const NotFound = () => <h2>404 - Page Not Found</h2>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Container>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;