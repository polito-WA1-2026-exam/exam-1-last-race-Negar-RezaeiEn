import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); 
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 py-3 shadow-sm">
      <Container fluid className="px-4">
        
        <Navbar.Brand as={Link} to="/" className="fs-4 fw-bold">🚇 Last Race</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto ms-4">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/game">Play Game</Nav.Link>
                <Nav.Link as={Link} to="/ranking">Ranking</Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <div className="d-flex align-items-center">
                <Navbar.Text className="me-3 text-white d-flex align-items-center">
               
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                  </svg>
                  Welcome, <strong>{user.username}</strong>
                </Navbar.Text>
                
              
                <Button variant="danger" size="sm" onClick={handleLogout} className="rounded-pill px-3 fw-bold">
                  Logout
                </Button>
              </div>
            ) : (
              <Nav.Link as={Link} to="/login" className="d-flex align-items-center fw-bold text-white">
             
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                </svg>
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
        
      </Container>
    </Navbar>
  );
};

export default Navigation;