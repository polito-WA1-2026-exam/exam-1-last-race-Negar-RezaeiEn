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

  useEffect(() => {
    let timer;
    if (phase === 'PLANNING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'PLANNING' && timeLeft === 0) {
      clearInterval(timer);
      handleTimeUp(); 
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

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

  const handleTimeUp = () => {
    handleExecuteRoute();
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
      console.error(err);
      setError(err.message);
      setPhase('ERROR');
    } finally {
      setIsExecuting(false);
    }
  };

  let runningCoins = gameData?.coins || 20;
  if (phase === 'RESULT') {
    if (journeyResult?.valid && visibleLogIndex >= 0) {
      const visibleLogs = journeyResult.log.slice(0, visibleLogIndex + 1);
      runningCoins += visibleLogs.reduce((sum, log) => sum + log.effect, 0);
    } else if (!journeyResult?.valid) {
      runningCoins = 0; 
    }
  }

  const stationCoords = useMemo(() => {
    if (!gameData?.stations) return {};
    
    const layout = {
      'Massaua': { x: 10, y: 15 },
      'Rivoli': { x: 25, y: 15 },
      'Racconigi': { x: 40, y: 15 },
      'Bernini': { x: 55, y: 15 },
      'Principi d\'Acaja': { x: 70, y: 15 },
      'Porta Susa': { x: 85, y: 15 },
      'Vinzaglio': { x: 85, y: 45 },
      'Re Umberto': { x: 70, y: 45 },
      'Porta Nuova': { x: 55, y: 45 },
      'Marconi': { x: 40, y: 45 },
      'Nizza': { x: 25, y: 45 },
      'Spezia': { x: 10, y: 45 },
      'Lingotto': { x: 10, y: 75 },
      'Politecnico': { x: 70, y: 80 },
      'Piazza Castello': { x: 55, y: 80 }
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
      <div className="w-100 position-relative mb-4 bg-light shadow-sm" style={{ height: '400px', border: '2px solid #343a40', borderRadius: '8px', overflow: 'hidden' }}>
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
            let strokeColor = "#343a40";
            let radius = "7";
            
            if (isStart) { strokeColor = "#198754"; radius = "10"; circleColor = "#e8f5e9"; }
            if (isTarget) { strokeColor = "#dc3545"; radius = "10"; circleColor = "#ffebee"; }

            return (
              <g key={station.id}>
                <circle 
                  cx={`${coords.x}%`} cy={`${coords.y}%`} r={radius} 
                  fill={circleColor} stroke={strokeColor} strokeWidth="3" 
                  style={{ transition: 'all 0.3s ease' }}
                />
                <circle cx={`${coords.x}%`} cy={`${coords.y}%`} r="3" fill={strokeColor} />
                <text 
                  x={`${coords.x}%`} y={`${coords.y - 4}%`} 
                  textAnchor="middle" fontSize={isStart || isTarget ? "14" : "12"} 
                  fontWeight="bold" fill="#212529"
                  style={{ textShadow: "1px 1px 2px #fff, -1px -1px 2px #fff" }}
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

  if (error || phase === 'ERROR') return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (phase === 'LOADING') return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="mt-4 mb-5">
      
      {/* COINS INDICATOR - TERMINAL STYLE */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-2 border-dark">
        <h4 className="fw-bold m-0 text-uppercase tracking-wider">Control Panel</h4>
        <Badge bg="dark" className="fs-5 p-2 px-3 shadow-sm rounded-0 border border-warning text-warning">
          💳 Credits: {runningCoins}
        </Badge>
      </div>

      {/* MISSION BRIEFING CARD */}
      <Card className="mb-4 shadow-sm border-dark rounded-0">
        <Card.Body className="bg-light text-center p-4">
          <Row>
            <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted text-uppercase fw-bold">Origin Point</h6>
              {phase === 'SETUP' ? (
                <Badge bg="secondary" className="p-2 fs-5 shadow-sm text-uppercase tracking-wider rounded-0">
                  🔒 Encrypted
                </Badge>
              ) : (
                <h3 className="text-success fw-bold m-0">{gameData?.start?.name}</h3>
              )}
            </Col>

            <Col md={4} className="d-flex align-items-center justify-content-center my-3 my-md-0">
              {phase === 'SETUP' ? (
                <div className="text-danger d-flex align-items-center gap-2">
                  <Spinner animation="grow" variant="danger" size="sm" />
                  <span className="fw-bold tracking-wider">STANDBY MODE</span>
                  <Spinner animation="grow" variant="danger" size="sm" />
                </div>
              ) : (
                <Badge bg="dark" className="fs-6 py-2 px-3 rounded-0 text-warning">
                  ► Min. {gameData?.minimum_distance} Stops Required ►
                </Badge>
              )}
            </Col>

            <Col md={4} className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted text-uppercase fw-bold">Target Destination</h6>
              {phase === 'SETUP' ? (
                <Badge bg="secondary" className="p-2 fs-5 shadow-sm text-uppercase tracking-wider rounded-0">
                  🔒 Encrypted
                </Badge>
              ) : (
                <h3 className="text-danger fw-bold m-0">{gameData?.target?.name}</h3>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* --- SETUP --- */}
      {phase === 'SETUP' && (
        <Card className="shadow-lg border-0 slide-in">
          <Card.Header className="bg-dark text-white text-center py-3">
            <h4 className="fw-bold m-0">📡 System Calibration: Network Overview</h4>
          </Card.Header>
          <Card.Body className="p-4 text-center bg-white">
            <p className="text-muted fs-5 mb-4">Memorize the connection pathways. The visual grid will disconnect during active navigation.</p>
            
            {renderMetroMap(false)}

            <Button variant="outline-dark" size="lg" onClick={handleStartPlanning} className="mt-2 px-5 py-3 fw-bold border-2 text-uppercase">
              Initiate Navigation Protocol ⚡
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* --- PLANNING --- */}
      {phase === 'PLANNING' && (
        <Card className="shadow-lg border-0 fade-in">
          <Card.Header className="bg-warning text-dark text-center py-3">
            <h4 className="fw-bold m-0">🕹️ Active Navigation Override</h4>
          </Card.Header>
          <Card.Body className="p-4 bg-white">
            <div className="text-center mb-4">
              <h5 className={`fw-bold text-uppercase ${timeLeft <= 15 ? 'text-danger' : 'text-dark'}`}>
                Time Remaining: {timeLeft}s
              </h5>
              <ProgressBar 
                striped 
                animated 
                variant={timeLeft <= 15 ? "danger" : "dark"} 
                now={(timeLeft / 90) * 100} 
                style={{ height: '15px', backgroundColor: '#e9ecef' }} 
                className="shadow-sm rounded-0" 
              />
            </div>

            {renderMetroMap(true)}

            <Row className="mt-4 gx-4">
              <Col md={6}>
                <h5 className="text-center mb-3 fw-bold text-uppercase border-bottom pb-2">Available Connections</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }} className="border border-dark p-2 bg-light rounded-0">
                  <ListGroup variant="flush">
                    {gameData?.segments.map(seg => {
                      if (selectedSegments.some(s => s.id === seg.id)) return null; 
                      const btnColor = getLineColor(seg.name);
                      
                      return (
                        <ListGroup.Item key={seg.id} className="d-flex justify-content-between align-items-center mb-2 rounded-0 border border-secondary shadow-sm">
                          <div className="d-flex align-items-center">
                            <div style={{ width: '10px', height: '10px', backgroundColor: btnColor, marginRight: '12px' }}></div>
                            <span className="fw-bold text-dark">{seg.name}</span>
                          </div>
                          <Button variant="dark" size="sm" onClick={() => handleAddSegment(seg)} className="fw-bold rounded-0">
                            + ADD
                          </Button>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </div>
              </Col>

              <Col md={6}>
                <h5 className="text-center mb-3 fw-bold text-uppercase border-bottom pb-2">Formulated Route</h5>
                <div style={{ minHeight: '230px' }} className="border border-primary p-3 bg-white shadow-sm mb-3 rounded-0">
                  {selectedSegments.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <p className="fs-5 mb-1">Route array is empty.</p>
                      <small>Inject connections from the left panel.</small>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {selectedSegments.map(seg => {
                        const bdColor = getLineColor(seg.name);
                        return (
                          <ListGroup.Item key={seg.id} className="d-flex justify-content-between align-items-center mb-2 border border-dark rounded-0 shadow-sm" style={{ borderLeft: `8px solid ${bdColor} !important` }}>
                            <span className="fw-bold">{seg.name}</span>
                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveSegment(seg.id)} className="fw-bold rounded-0">
                              REMOVE
                            </Button>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </div>
                <Button 
                  variant="success" 
                  size="lg"
                  className="w-100 py-3 fw-bold shadow-sm rounded-0 text-uppercase border-2 border-dark"
                  disabled={selectedSegments.length === 0 || isExecuting}
                  onClick={handleExecuteRoute}
                >
                  {isExecuting ? <Spinner size="sm" animation="border" /> : 'Execute Sequence'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* --- RESULT --- */}
      {phase === 'RESULT' && journeyResult && (
        <Card className="shadow-lg mt-4 border-dark rounded-0 slide-in">
          <Card.Header className="bg-dark text-white text-center py-3">
            <h4 className="fw-bold m-0">📊 Mission Debrief</h4>
          </Card.Header>
          <Card.Body className="p-5 text-center bg-light">
            <Alert variant={journeyResult.valid ? "success" : "danger"} className="shadow-sm border-0 py-4 rounded-0">
              <Alert.Heading className="display-6 fw-bold text-uppercase">{journeyResult.valid ? "Sequence Verified" : "System Crash"}</Alert.Heading>
              <p className="fs-5 mb-0 mt-3 font-monospace">{journeyResult.message}</p>
            </Alert>

            {journeyResult.valid && journeyResult.log && (
              <ListGroup className="mt-4 text-start mx-auto shadow-sm font-monospace" style={{ maxWidth: '600px' }}>
                {journeyResult.log.map((logItem, index) => (
                  <ListGroup.Item 
                    key={index} 
                    className={`d-flex justify-content-between align-items-center p-3 rounded-0 border-dark transition-all ${index <= visibleLogIndex ? 'opacity-100' : 'd-none'}`}
                  >
                    <span className="fs-6"><strong>Log {logItem.step}:</strong> {logItem.event}</span>
                    <Badge bg={logItem.effect >= 0 ? "success" : "danger"} className="fs-6 px-3 rounded-0 border border-dark">
                      {logItem.effect > 0 ? '+' : ''}{logItem.effect}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            {(!journeyResult.valid || visibleLogIndex === journeyResult.log.length - 1) && (
              <div className="mt-5 fade-in">
                <h2 className="fw-bold mb-4 text-uppercase">Total Credits: <span className={runningCoins > 0 ? 'text-success' : 'text-danger'}>{runningCoins}</span></h2>
                <Button variant="outline-dark" size="lg" onClick={handlePlayAgain} className="px-5 py-3 shadow-sm fw-bold border-2 text-uppercase rounded-0">
                  Reboot System
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
        .tracking-wider { letter-spacing: 0.1em; }
      `}</style>
    </Container>
  );
};

export default Game;