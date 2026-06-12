import React from 'react';
import { Container, Row, Col, Card, Button, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
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
              <h3 className="mb-4 text-center text-primary fw-bold">📜 How to Play (Rules)</h3>
              
              <ListGroup variant="flush" className="fs-5 shadow-sm rounded-3">
                <ListGroup.Item className="py-3">
                  <strong>⏱️ The Clock is Ticking:</strong> You have exactly <span className="text-danger fw-bold">90 seconds</span> to plan and execute your route. If time runs out, an incomplete route will be submitted!
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🗺️ Mission Briefing:</strong> You will be assigned a random <span className="text-success fw-bold">Start</span> station and a <span className="text-danger fw-bold">Destination</span> station.
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🔗 Unbroken Chain:</strong> Click on the segments to build a continuous path. <br/>
                  <small className="text-muted">⚠️ Warning: Selecting disconnected segments, dead ends, or extra branches will result in a crash and 0 coins!</small>
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🎲 Random Events:</strong> Traveling through 5 or more stations increases the chance of unexpected encounters. Some give you coins, others steal them!
                </ListGroup.Item>
                
                <ListGroup.Item className="py-3">
                  <strong>🏆 Leaderboard:</strong> Survive the journey with the most coins to rank up globally.
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-2 col-md-8 mx-auto mt-5">
                <Button as={Link} to="/login" variant="success" size="lg" className="py-3 fw-bold shadow">
                  Access Control Room to Play 🚀
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