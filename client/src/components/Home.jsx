import React, { useContext } from 'react';
import { Container, Row, Col, Card, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// FIXED: Using named import (with curly braces) instead of default import
// This matches the export style in your AuthContext.jsx file
import { AuthContext } from '../AuthContext';

const Home = () => {
  // Consume the global authentication state
  const auth = useContext(AuthContext);
  
  // Determine if the user is logged in by checking the context values
  // This gracefully handles different potential state structures (user, loggedIn, etc.)
  const isLoggedIn = !!(auth && (auth.user || auth.loggedIn || auth.isAuthenticated));

  return (
    <Container className="mt-5 mb-5">
      <Row className="justify-content-center">
        <Col md={9} lg={8}>
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-dark text-white text-center py-4 border-bottom border-warning border-4">
              <h1 className="display-5 fw-bold mb-0">🚇 The Last Race</h1>
              <p className="lead text-light mb-0 mt-2">Underground Navigation Challenge</p>
            </Card.Header>
            
            <Card.Body className="p-4 p-md-5 bg-light">
              <h3 className="mb-4 text-center text-primary fw-bold">📜 Mission Rules & Guidelines</h3>
              
              <ListGroup variant="flush" className="fs-5 shadow-sm rounded-3">
                <ListGroup.Item className="py-3">
                  <strong>🎯 The Mission:</strong> You start with <span className="text-warning fw-bold">20 Coins</span>. You will be assigned a random <span className="text-success fw-bold">Start</span> and <span className="text-danger fw-bold">Destination</span> station, which are guaranteed to be at least 3 stops apart.
                </ListGroup.Item>

                <ListGroup.Item className="py-3">
                  <strong>🧠 Phase 1 - Memorization:</strong> Before the timer starts, you will see the full network map showing all lines and connections. Study it carefully!
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>⏱️ Phase 2 - Blind Planning:</strong> Once you start, the connecting lines disappear! You have exactly <span className="text-danger fw-bold">90 seconds</span> to rebuild your route from memory by selecting the correct segments. 
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>⚠️ Strict Network Rules:</strong> 
                  <ul className="mt-2 mb-0 fs-6 text-muted">
                    <li>The route must be a continuous chain from Start to Destination.</li>
                    <li>You can ONLY change lines at valid <strong>Interchange Stations</strong>.</li>
                    <li>Selecting disconnected segments or running out of time results in a crash and <strong>0 coins</strong>!</li>
                  </ul>
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🎲 Random Events:</strong> Every segment you travel through triggers a probabilistic event. Kind passengers might give you coins (+), while pickpockets or wrong platforms will cost you (-).
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🏆 Global Leaderboard:</strong> Survive the journey with the highest remaining coins to rank up globally against other agents.
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-2 col-md-8 mx-auto mt-5">
                {/* Smart Navigation Button: 
                  Reads the context directly to determine the routing path 
                */}
                <Button 
                  as={Link} 
                  to={isLoggedIn ? "/game" : "/login"} 
                  variant="success" 
                  size="lg" 
                  className="py-3 fw-bold shadow rounded-pill"
                >
                  {isLoggedIn ? "Access Control Room to Play 🚀" : "Login to Play 🚀"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;