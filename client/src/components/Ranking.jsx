import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Card, Badge } from 'react-bootstrap';

const Ranking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Leaderboard Data
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/games/ranking', {
          credentials: 'include' 
        });
        
        if (!response.ok) throw new Error('Failed to fetch ranking data.');
        
        const data = await response.json();
        setRankings(data);
      } catch (err) {
        console.error("Ranking Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="warning" />
        <h4 className="mt-3">Loading Global Leaderboard...</h4>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>System Error</h4>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="shadow border-warning">
        <Card.Header className="bg-warning text-dark text-center py-3">
          <h3 className="mb-0">🏆 Global Leaderboard</h3>
        </Card.Header>
        <Card.Body>
          {rankings.length === 0 ? (
            <Alert variant="info" className="text-center">
              No games have been played yet. Be the first to race!
            </Alert>
          ) : (
            <Table striped bordered hover responsive className="text-center align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Rank</th>
                  <th>Agent (Username)</th>
                  <th>Final Score (Coins)</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((user, index) => (
                  <tr key={index}>
                    <td className="fs-5">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </td>
                    <td className="fw-bold">{user.username}</td>
                    <td>
                      <Badge bg={user.score > 0 ? 'success' : 'danger'} pill className="fs-6 px-3">
                        {user.score}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Ranking;