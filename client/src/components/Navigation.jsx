import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Navigation = () => {
  // 1. Get user data and logout function from the Context
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 2. Handle the logout process and redirect to home
  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to the anonymous home page
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">🚇 Last Race</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            
            {/* 3. ALWAYS show these links for discoverability. 
                Security is handled by the ProtectedRoute component! */}
            <Nav.Link as={Link} to="/game">Play Game</Nav.Link>
            <Nav.Link as={Link} to="/ranking">Ranking</Nav.Link>
          </Nav>
          
          <Nav>
            {/* 4. Conditional Rendering: User Profile vs Login Button */}
            {user ? (
              <div className="d-flex align-items-center">
                <Navbar.Text className="me-3 text-white">
                  Welcome, <strong>{user.username}</strong>
                </Navbar.Text>
                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
        
      </Container>
    </Navbar>
  );
};

export default Navigation;