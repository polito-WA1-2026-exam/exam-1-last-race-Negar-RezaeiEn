import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true); 

    try {
      await login(username, password);
      navigate('/'); 
    } catch (err) {
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Header className="bg-primary text-white text-center py-4 border-0 rounded-top-4">
              <h3 className="mb-0 fw-bold">🚇 Control Room Login</h3>
            </Card.Header>
            <Card.Body className="p-4 p-md-5 bg-light">
              
              {error && (
                <Alert variant="danger" className="text-center rounded-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formUsername">
                  <Form.Label className="fw-bold text-secondary">Agent Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formPassword">
                  <Form.Label className="fw-bold text-secondary">Access Code</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <div className="d-grid mt-5">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
                    className="py-3 fw-bold rounded-pill shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/> Authenticating...</>
                    ) : (
                      'Access Control Room 🚀'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;