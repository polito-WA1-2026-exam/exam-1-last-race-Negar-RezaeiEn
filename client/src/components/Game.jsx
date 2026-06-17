import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button, Row, Col, Badge, ListGroup } from 'react-bootstrap';

const Game = () => {
  // 1. Game State Machine: 'LOADING' -> 'SETUP' -> 'PLANNING' -> 'RESULT' -> 'ERROR'
  const [phase, setPhase] = useState('LOADING'); 
  
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90); 
  
  const [selectedSegments, setSelectedSegments] = useState([]);
  
  // --- Execution and Result Phase States ---
  const [isExecuting, setIsExecuting] = useState(false);
  const [journeyResult, setJourneyResult] = useState(null);

useEffect(() => {
    const initializeGame = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/game/setup', {
          cache: 'no-store', 
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to start the game engine.');
        const data = await response.json();
        setGameData(data); 
        setPhase('SETUP'); 
      } catch (err) {
        console.error("Setup Error:", err);
        setError(err.message);
        setPhase('ERROR'); 
      }
    };
    initializeGame();
  }, []);
  useEffect(() => {
    let timer;
    if (phase === 'PLANNING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && phase === 'PLANNING') {
      clearInterval(timer);
      handleTimeUp(); // Automatically submit the current (likely incomplete) route
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleStartPlanning = () => {
    setPhase('PLANNING'); 
  };

  const toggleSegment = (segmentId) => {
    setSelectedSegments((prev) => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  // Function executed when the countdown reaches zero
  const handleTimeUp = () => {
    console.log("⏰ Time is up! Auto-submitting incomplete route...");
    handleExecuteRoute();
  };

  // --- Execute Route API Call (The Server Referee) ---
  const handleExecuteRoute = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch('http://localhost:3001/api/game/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startStationId: gameData.start.id,
          targetStationId: gameData.target.id,
          selectedSegmentIds: selectedSegments
        })
      });

      if (!response.ok) throw new Error('Failed to execute route on the server.');

      const resultData = await response.json();
      setJourneyResult(resultData);
      setPhase('RESULT'); 

    } catch (err) {
      console.error(err);
      setError(err.message);
      setPhase('ERROR');
    } finally {
      setIsExecuting(false);
    }
  };

  if (error || phase === 'ERROR') {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>Connection / Graph Error</h4>
          <p>{error || "An unexpected error occurred during game initialization."}</p>
        </Alert>
      </Container>
    );
  }

  if (phase === 'LOADING') {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h4 className="mt-3">Connecting to Control Room...</h4>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="mb-4">
        <Col>
          <h2 className="text-center fw-bold">🚇 The Last Race</h2>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm border-primary">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <strong>Mission Briefing</strong>
          <Badge bg="warning" text="dark" className="fs-6">
            🪙 Coins: {phase === 'RESULT' ? journeyResult?.finalCoins : gameData.coins}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row className="text-center">
            <Col md={4}>
              <h5 className="text-muted">Start Station</h5>
              <h3 className="text-success">{gameData?.start?.name}</h3>
            </Col>
            <Col md={4} className="d-flex align-items-center justify-content-center">
              <h5>➡️ {gameData?.minimum_distance} Stops Minimum ➡️</h5>
            </Col>
            <Col md={4}>
              <h5 className="text-muted">Destination</h5>
              <h3 className="text-danger">{gameData?.target?.name}</h3>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* --- SETUP PHASE --- */}
      {phase === 'SETUP' && (
        <div className="text-center mt-4">
          <Alert variant="info" className="fs-5 shadow-sm">
            <strong>Phase 1: Memorize the Network!</strong><br/>
            Study the network map below. When ready, start the timer to plan your route!
          </Alert>
          
          {/* Full Network Map */}
          {/* ✅ Organized Network Map (Grouped by Lines) */}
          <Card className="mb-4 shadow-sm border-secondary text-start">
            <Card.Header className="bg-secondary text-white">
              <strong>🗺️ Full Network Map (Lines & Connections)</strong>
            </Card.Header>
            <Card.Body>
              {gameData?.networkMap && gameData.networkMap.map((lineData, index) => {
          
                let badgeColor = "secondary";
                const nameStr = lineData.lineName.toLowerCase();
                if (nameStr.includes('red')) badgeColor = "danger";
                else if (nameStr.includes('blue')) badgeColor = "primary";
                else if (nameStr.includes('green')) badgeColor = "success";
                else if (nameStr.includes('yellow')) badgeColor = "warning text-dark";

                return (
                  <div key={index} className="mb-4">
                    <h5 className="fw-bold border-bottom pb-2">
                      🚇 {lineData.lineName}
                    </h5>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {lineData.connections.map((conn, idx) => (
                        <Badge bg={badgeColor} key={idx} className="p-2 fs-6 fw-normal shadow-sm">
                          {conn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card.Body>
          </Card>

          <Button variant="success" size="lg" className="rounded-pill px-5 py-3 fw-bold shadow" onClick={handleStartPlanning}>
            Start Planning (90s) ⏱️
          </Button>
        </div>
      )}

      {/* --- PLANNING PHASE --- */}
      {phase === 'PLANNING' && (
        <div className="text-center mt-4">
          <h1 className={`display-1 fw-bold ${timeLeft <= 10 ? 'text-danger' : 'text-dark'}`}>
            ⏱️ {timeLeft}s
          </h1>
          <hr />
          
          {/* Blind Map (Only Stations) */}
          <Card className="mb-4 shadow-sm border-warning text-start">
            <Card.Header className="bg-warning text-dark">
              <strong>🗺️ Network Map (Memory Mode)</strong>
            </Card.Header>
            <Card.Body>
              <p className="text-muted small mb-2">The connecting lines have been hidden. Rely on your memory!</p>
              <div className="d-flex flex-wrap gap-2">
                {gameData?.stations && gameData.stations.map(station => (
                  <Badge bg="secondary" key={`blind-station-${station.id}`} className="p-2 fw-normal fs-6">
                    {station.name}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>

          <h4>Route Builder</h4>
          <p className="text-muted mb-4">
            Select the connections to build your route from <strong>{gameData.start.name}</strong> to <strong>{gameData.target.name}</strong>.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-2 mt-4 mb-4">
            {gameData.segments && gameData.segments.map(seg => {
              const isSelected = selectedSegments.includes(seg.id);
              return (
                <Button
                  key={seg.id}
                  variant={isSelected ? 'success' : 'outline-primary'}
                  onClick={() => toggleSegment(seg.id)}
                  className="rounded-pill px-3 py-2 fw-bold shadow-sm"
                >
                  {seg.name}
                </Button>
              );
            })}
          </div>

          <div className="mt-5">
            <Button 
              variant="primary" 
              size="lg" 
              disabled={selectedSegments.length === 0 || isExecuting}
              onClick={handleExecuteRoute}
              className="px-5 py-3 rounded-pill fw-bold"
            >
              {isExecuting ? (
                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/> Executing...</>
              ) : (
                'Confirm Route & Execute 🚀'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* --- RESULT PHASE --- */}
      {phase === 'RESULT' && journeyResult && (
        <div className="mt-4">
          <Alert variant={journeyResult.valid ? "success" : "danger"} className="text-center shadow-sm">
            <Alert.Heading>{journeyResult.valid ? "🎉 Mission Accomplished!" : "💥 Mission Failed!"}</Alert.Heading>
            <p className="fs-5">{journeyResult.message}</p>
            <hr />
            <h4 className="mb-0">Final Coins: <strong>{journeyResult.finalCoins}</strong></h4>
          </Alert>

          {journeyResult.valid && journeyResult.log && journeyResult.log.length > 0 && (
            <Card className="mt-4 shadow-sm">
              <Card.Header className="bg-info text-white"><strong>📝 Journey Log</strong></Card.Header>
              <ListGroup variant="flush">
                {journeyResult.log.map((logItem, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <span>
                      <strong>Step {logItem.step}:</strong> {logItem.event}
                    </span>
                    <Badge bg={logItem.effect >= 0 ? "success" : "danger"} pill>
                      {logItem.effect > 0 ? '+' : ''}{logItem.effect}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}

          <div className="text-center mt-4 mb-5">
            <Button variant="primary" size="lg" onClick={() => window.location.reload()} className="px-5 py-3 rounded-pill fw-bold">
              🔄 Play Again
            </Button>
          </div>
        </div>
      )}

    </Container>
  );
};

export default Game;