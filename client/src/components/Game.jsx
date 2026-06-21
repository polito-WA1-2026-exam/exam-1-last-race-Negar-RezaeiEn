import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Spinner, Alert, Card, Button, Row, Col, Badge, ListGroup, ProgressBar } from 'react-bootstrap';

const Game = () => {
  const [phase, setPhase] = useState('LOADING'); 
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90); 
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [journeyResult, setJourneyResult] = useState(null);
  const [visibleLogIndex, setVisibleLogIndex] = useState(-1);

  // Initialize game session and fetch network data
  const fetchSetupData = useCallback(async () => {
    setPhase('LOADING');
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
  }, []);

  useEffect(() => {
    fetchSetupData();
  }, [fetchSetupData]);

  // Handle countdown timer during the planning phase
  useEffect(() => {
    let timer;
    if (phase === 'PLANNING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'PLANNING' && timeLeft === 0) {
      clearInterval(timer);
      handleExecuteRoute(); 
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Handle sequential rendering of event logs
  useEffect(() => {
    if (phase === 'RESULT' && journeyResult?.valid && journeyResult.log) {
      if (visibleLogIndex < journeyResult.log.length - 1) {
        const timer = setTimeout(() => setVisibleLogIndex(prev => prev + 1), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, journeyResult, visibleLogIndex]);

  const handleStartPlanning = () => {
    setPhase('PLANNING');
    setTimeLeft(90);
  };

  const handleAddSegment = (segment) => {
    if (!selectedSegments.some(s => s.id === segment.id)) {
      setSelectedSegments(prev => [...prev, segment]);
    }
  };

  const handleRemoveSegment = (segmentId) => {
    setSelectedSegments(prev => prev.filter(s => s.id !== segmentId));
  };

  const handlePlayAgain = () => {
    setGameData(null);
    setError(null);
    setSelectedSegments([]);
    setIsExecuting(false);
    setJourneyResult(null);
    setVisibleLogIndex(-1);
    fetchSetupData(); 
  };

  // Submit the selected route for backend validation
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
          selectedSegmentIds: selectedSegments.map(s => s.id)
        })
      });

      if (!response.ok) throw new Error('Failed to execute route.');
      const resultData = await response.json();
      setJourneyResult(resultData);
      setPhase('RESULT'); 
    } catch (err) {
      console.error("Execution Error:", err);
      setError(err.message);
      setPhase('ERROR');
    } finally {
      setIsExecuting(false);
    }
  };

  // Calculate dynamic score display during log rendering
  let runningCoins = gameData?.coins || 20;
  if (phase === 'RESULT') {
    if (journeyResult?.valid && visibleLogIndex >= 0) {
      const visibleLogs = journeyResult.log.slice(0, visibleLogIndex + 1);
      runningCoins += visibleLogs.reduce((sum, log) => sum + log.effect, 0);
    } else if (!journeyResult?.valid) {
      runningCoins = 0; 
    }
  }

  // Memoized SVG coordinates for the metro map
  const stationCoords = useMemo(() => {
    if (!gameData?.stations) return {};
    
    const layout = {
      'Massaua': { x: 10, y: 20 },
      'Rivoli': { x: 25, y: 20 },
      'Racconigi': { x: 40, y: 20 },
      'Bernini': { x: 55, y: 20 },
      'Principi d\'Acaja': { x: 70, y: 20 },
      'Porta Susa': { x: 85, y: 20 },
      'Vinzaglio': { x: 85, y: 50 },
      'Porta Nuova': { x: 55, y: 50 },
      'Marconi': { x: 40, y: 50 },
      'Nizza': { x: 25, y: 50 },
      'Spezia': { x: 10, y: 50 },
      'Re Umberto': { x: 70, y: 70 }, 
      'Lingotto': { x: 10, y: 80 },
      'Politecnico': { x: 70, y: 85 },
      'Piazza Castello': { x: 55, y: 85 }
    };

    const coords = {};
    gameData.stations.forEach((st, index) => {
      const matchedKey = Object.keys(layout).find(k => st.name.includes(k));
      if (matchedKey) {
        coords[st.id] = layout[matchedKey];
      } else {
        coords[st.id] = { x: 10 + (index * 15 % 80), y: 90 }; 
      }
    });
    return coords;
  }, [gameData]);

  // Determine line colors based on segment name identifiers
  const getLineColor = (segmentName) => {
    const name = segmentName || "";
    if (name.includes('Politecnico') && name.includes('Vinzaglio')) return '#0d6efd';
    if (name.includes('Vinzaglio') && name.includes('Porta Nuova')) return '#0d6efd';
    if (name.includes('Porta Nuova') && name.includes('Piazza Castello')) return '#0d6efd';
    if (name.includes('Politecnico') && name.includes('Re Umberto')) return '#198754';
    if (name.includes('Politecnico') && name.includes('Bernini')) return '#ffc107';
    return '#dc3545';
  };

  const renderMetroMap = (hideUnselectedLines) => {
    if (!gameData || !gameData.segments) return null;

    const segmentsToDraw = hideUnselectedLines 
      ? gameData.segments.filter(seg => selectedSegments.some(s => s.id === seg.id))
      : gameData.segments;

    return (
      <div className="w-100 position-relative mb-4 bg-white shadow-sm" style={{ height: '400px', border: '3px dashed #c2dbfe', borderRadius: '24px', overflow: 'hidden' }}>
        <svg width="100%" height="100%">
          {segmentsToDraw.map(seg => {
            const start = stationCoords[seg.station_a_id];
            const end = stationCoords[seg.station_b_id];
            if (!start || !end) return null;

            const strokeColor = getLineColor(seg.name);

            return (
              <line 
                key={seg.id} 
                x1={`${start.x}%`} y1={`${start.y}%`} 
                x2={`${end.x}%`} y2={`${end.y}%`} 
                stroke={strokeColor} 
                strokeWidth={hideUnselectedLines ? "8" : "6"} 
                strokeLinecap="round"
                className={hideUnselectedLines ? "animated-line" : ""}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}

          {gameData.stations.map(station => {
            const coords = stationCoords[station.id];
            if (!coords) return null;

            const isStart = phase === 'PLANNING' && station.id === gameData?.start?.id;
            const isTarget = phase === 'PLANNING' && station.id === gameData?.target?.id;
            
            let circleColor = "#fff";
            let strokeColor = "#6ea8fe"; 
            let radius = "8";
            
            if (isStart) { strokeColor = "#198754"; radius = "12"; circleColor = "#e8f5e9"; }
            if (isTarget) { strokeColor = "#dc3545"; radius = "12"; circleColor = "#ffebee"; }

            return (
              <g key={station.id}>
                <circle 
                  cx={`${coords.x}%`} cy={`${coords.y}%`} r={radius} 
                  fill={circleColor} stroke={strokeColor} strokeWidth="3" 
                  style={{ transition: 'all 0.3s ease' }}
                />
                <circle cx={`${coords.x}%`} cy={`${coords.y}%`} r="3" fill={strokeColor} />
                <text 
                  x={`${coords.x}%`} y={`${coords.y - 5}%`} 
                  textAnchor="middle" fontSize={isStart || isTarget ? "14" : "12"} 
                  fontWeight="600" fill="#495057"
                  style={{ textShadow: "2px 2px 4px #fff, -2px -2px 4px #fff" }}
                >
                  {station.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (error || phase === 'ERROR') return <Container className="mt-5"><Alert variant="danger" className="rounded-4">{error}</Alert></Container>;
  if (phase === 'LOADING') return <Container className="mt-5 text-center"><Spinner animation="border" variant="info" /></Container>;

  return (
    <Container className="mt-4 mb-5" style={{ fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0 text-primary">The Last Race</h3>
        <Badge bg="secondary" text="white" className="fs-6 p-3 shadow-sm rounded-pill border border-white border-2">
          Total Score: {runningCoins}
        </Badge>
      </div>

      {/* Mission Briefing Section */}
      <Card className="mb-4 shadow-sm border-0 rounded-4" style={{ backgroundColor: '#f1f8ff' }}>
        <Card.Body className="text-center p-4">
          <Row>
            <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
              <span className="text-muted fw-bold mb-1">START STATION</span>
              {phase === 'SETUP' ? (
                <Badge bg="secondary" className="p-2 fs-5 shadow-sm rounded-pill opacity-50">
                  [ ENCRYPTED ]
                </Badge>
              ) : (
                <h3 className="text-success fw-bold m-0">{gameData?.start?.name}</h3>
              )}
            </Col>

            <Col md={4} className="d-flex align-items-center justify-content-center my-3 my-md-0">
              {phase === 'SETUP' ? (
                <div className="text-info d-flex align-items-center gap-2 fw-bold fs-5">
                  <Spinner animation="border" variant="info" size="sm" />
                  System Standby...
                </div>
              ) : (
                <Badge bg="info" className="fs-6 py-2 px-4 rounded-pill shadow-sm text-white">
                  Minimum Stops Required: {gameData?.minimum_distance}
                </Badge>
              )}
            </Col>

            <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
              <span className="text-muted fw-bold mb-1">GOAL STATION</span>
              {phase === 'SETUP' ? (
                <Badge bg="secondary" className="p-2 fs-5 shadow-sm rounded-pill opacity-50">
                  [ ENCRYPTED ]
                </Badge>
              ) : (
                <h3 className="text-danger fw-bold m-0">{gameData?.target?.name}</h3>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Phase 1: Setup & Memorization */}
      {phase === 'SETUP' && (
        <Card className="shadow-sm border-0 slide-in rounded-4">
          <Card.Header className="bg-primary bg-gradient text-white text-center py-3 rounded-top-4 border-0">
            <h4 className="fw-bold m-0">Phase 1: Network Memorization</h4>
          </Card.Header>
          <Card.Body className="p-4 text-center bg-white rounded-bottom-4">
            <p className="text-muted fs-5 mb-4">Analyze the network structure. Navigation lines will be concealed upon protocol initiation.</p>
            
            {renderMetroMap(false)}

            <Button variant="primary" size="lg" onClick={handleStartPlanning} className="mt-3 px-5 py-3 fw-bold rounded-pill shadow-sm">
              Start Route Selection
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Phase 2: Route Planning */}
      {phase === 'PLANNING' && (
        <Card className="shadow-sm border-0 fade-in rounded-4">
          <Card.Header className="bg-info bg-gradient text-white text-center py-3 rounded-top-4 border-0">
            <h4 className="fw-bold m-0">Phase 2: Draw Your Path</h4>
          </Card.Header>
          <Card.Body className="p-4 bg-white rounded-bottom-4">
            <div className="text-center mb-4">
              <h5 className={`fw-bold ${timeLeft <= 15 ? 'text-danger' : 'text-secondary'}`}>
                Time Remaining: {timeLeft}s
              </h5>
              <ProgressBar 
                animated 
                variant={timeLeft <= 15 ? "danger" : "info"} 
                now={(timeLeft / 90) * 100} 
                style={{ height: '18px', backgroundColor: '#e9ecef', borderRadius: '10px' }} 
                className="shadow-sm mt-2" 
              />
            </div>

            {renderMetroMap(true)}

            <Row className="mt-4 gx-4">
              <Col md={6}>
                <h5 className="text-center mb-3 fw-bold text-primary">Available Segments</h5>
                <div className="d-flex flex-wrap gap-2 justify-content-center p-3 bg-light rounded-4 border border-light shadow-sm" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {gameData?.segments.map(seg => {
                    if (selectedSegments.some(s => s.id === seg.id)) return null; 
                    const btnColor = getLineColor(seg.name);
                    
                    return (
                      <Button
                        key={seg.id}
                        variant="light"
                        size="sm"
                        className="rounded-pill px-3 py-2 fw-bold shadow-sm border transition-hover"
                        style={{ color: '#495057', borderColor: '#dee2e6' }}
                        onClick={() => handleAddSegment(seg)}
                      >
                        <div style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: btnColor, borderRadius: '50%', marginRight: '6px' }}></div>
                        {seg.name} <span className="text-primary ms-1">+</span>
                      </Button>
                    );
                  })}
                </div>
              </Col>

              <Col md={6}>
                <h5 className="text-center mb-3 fw-bold text-primary">Planned Route</h5>
                <div style={{ minHeight: '230px' }} className="border-2 border-primary border p-3 bg-white shadow-sm mb-3 rounded-4">
                  {selectedSegments.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <p className="fs-5 mb-1">Route is empty.</p>
                      <small>Select segments from the left to draw them.</small>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {selectedSegments.map(seg => {
                        const bdColor = getLineColor(seg.name);
                        return (
                          <ListGroup.Item key={seg.id} className="d-flex justify-content-between align-items-center mb-2 rounded-3 shadow-sm border-0" style={{ backgroundColor: '#f8f9fa', borderLeft: `6px solid ${bdColor} !important` }}>
                            <span className="fw-bold text-dark">{seg.name}</span>
                            <Button variant="danger" size="sm" onClick={() => handleRemoveSegment(seg.id)} className="fw-bold rounded-circle">
                              ✕
                            </Button>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </div>
                <div className="d-flex justify-content-center">
                  <Button 
                    variant="success" 
                    size="lg"
                    className="px-5 py-3 fw-bold shadow-sm rounded-pill text-white"
                    disabled={selectedSegments.length === 0 || isExecuting}
                    onClick={handleExecuteRoute}
                  >
                    {isExecuting ? <Spinner size="sm" animation="border" /> : 'Submit Final Route'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Phase 3: Result & Journey Log */}
      {phase === 'RESULT' && journeyResult && (
        <Card className="shadow-sm mt-4 border-0 rounded-4 slide-in">
          <Card.Header className="bg-primary bg-gradient text-white text-center py-3 rounded-top-4 border-0">
            <h4 className="fw-bold m-0">Mission Report</h4>
          </Card.Header>
          <Card.Body className="p-5 text-center bg-white rounded-bottom-4">
            <Alert variant={journeyResult.valid ? "success" : "danger"} className="shadow-sm border-0 py-4 rounded-4">
              <Alert.Heading className="display-6 fw-bold">
                {journeyResult.valid ? "Validation Successful" : "Validation Failed"}
              </Alert.Heading>
              <p className="fs-5 mb-0 mt-3">{journeyResult.message}</p>
            </Alert>

            {journeyResult.valid && journeyResult.log && (
              <ListGroup className="mt-4 text-start mx-auto shadow-sm rounded-4" style={{ maxWidth: '600px' }}>
                {journeyResult.log.map((logItem, index) => (
                  <ListGroup.Item 
                    key={index} 
                    className={`d-flex justify-content-between align-items-center p-3 border-0 border-bottom transition-all ${index <= visibleLogIndex ? 'opacity-100' : 'd-none'}`}
                  >
                    <span className="fs-6 text-secondary"><strong>Step {logItem.step}:</strong> {logItem.event}</span>
                    <Badge bg={logItem.effect >= 0 ? "success" : "danger"} className="fs-6 px-3 rounded-pill">
                      {logItem.effect > 0 ? '+' : ''}{logItem.effect}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            {(!journeyResult.valid || visibleLogIndex === journeyResult.log.length - 1) && (
              <div className="mt-5 fade-in">
                <h2 className="fw-bold mb-4">Final Score: <span className={runningCoins > 0 ? 'text-success' : 'text-danger'}>{runningCoins}</span></h2>
                <Button variant="primary" size="lg" onClick={handlePlayAgain} className="px-5 py-3 shadow-sm fw-bold rounded-pill">
                  Restart Mission
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <style>{`
        .animated-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 0.8s ease-out forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        .slide-in { animation: slideIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .transition-hover:hover { filter: brightness(0.95); transform: scale(1.02); }
      `}</style>
    </Container>
  );
};

export default Game;