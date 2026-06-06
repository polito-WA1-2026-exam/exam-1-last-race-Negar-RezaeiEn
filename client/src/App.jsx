import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

// --- Placeholder Components ---

const Home = () => <h2>Welcome to Last Race! (Anonymous View)</h2>;
const Game = () => <h2>Game Board (Protected View)</h2>;
const Ranking = () => <h2>Leaderboard (Protected View)</h2>;
const Login = () => <h2>Login Form</h2>;
const NotFound = () => <h2>404 - Page Not Found</h2>;

// --- Main Application Component ---
function App() {
  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">🚇 Last Race</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/game">Play Game</Nav.Link>
              <Nav.Link as={Link} to="/ranking">Ranking</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Page Content (Routes) */}
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;