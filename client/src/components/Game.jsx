import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';

const Game = () => {
  // 1. State variables to store the raw game data from the backend
  const [lines, setLines] = useState([]);
  const [stations, setStations] = useState([]);
  
  // 2. UI State variables for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch game data as soon as the component mounts
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        // Using Promise.all to fetch both endpoints simultaneously for better performance
        const [linesResponse, stationsResponse] = await Promise.all([
          fetch('http://localhost:3001/api/lines', { credentials: 'include' }),
          fetch('http://localhost:3001/api/stations', { credentials: 'include' })
        ]);

        // Check if both requests were successful (e.g., 200 OK)
        if (!linesResponse.ok || !stationsResponse.ok) {
          throw new Error('Failed to load game data from the server.');
        }

        // Parse the JSON data
        const linesData = await linesResponse.json();
        const stationsData = await stationsResponse.json();

        // Update the state with the fetched data
        setLines(linesData);
        setStations(stationsData);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false); // Turn off the loading spinner
      }
    };

    fetchGameData();
  }, []);

  // --- Conditional Rendering for UI States ---
  
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" variant="primary" />
        <h4 className="mt-3">Loading Metro Map...</h4>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Connection Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  // --- Main Game Dashboard (Test View) ---
  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">🚇 The Last Race: Control Room</h2>
      
      <Row>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Metro Lines Available</Card.Title>
              <Card.Text className="display-6 text-primary">
                {lines.length} Lines
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Total Stations Available</Card.Title>
              <Card.Text className="display-6 text-success">
                {stations.length} Stations
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Alert variant="info" className="mt-3">
        Data successfully loaded! The game engine is ready to be built.
      </Alert>
    </Container>
  );
};

export default Game;