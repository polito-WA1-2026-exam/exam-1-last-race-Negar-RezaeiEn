import express from "express";
import cors from "cors";
// Import authentication modules
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";
import getDBConnection from "./database.js";

const app = express();
const port = 3001;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(express.json());

// --- 1. Session Configuration ---
app.use(session({
  secret: "last-race-super-secret-key",
  resave: false,
  saveUninitialized: false,
}));

// --- 2. Passport Initialization ---
app.use(passport.authenticate('session'));

// --- 3. Local Strategy Implementation ---
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) { 
      return cb(null, false, { message: 'Incorrect username.' }); 
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return cb(null, false, { message: 'Incorrect password.' });
    }
    
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
}));

// --- 4. User Serialization and Deserialization ---
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function(id, cb) {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});



//API ROUTES SECTION
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is successfully connected to the client!' });
});

// --- Authentication API Routes ---
app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.status(201).json(req.user);
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});


// --- Custom Middleware for Route Protection ---
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authorized. Please log in.' });
};


// --- Game Data API Routes (Protected) ---

// 1. Get all Metro Lines
app.get('/api/lines', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const lines = await db.all('SELECT * FROM lines');
    res.status(200).json(lines);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get all Stations
app.get('/api/stations', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const stations = await db.all('SELECT * FROM stations');
    res.status(200).json(stations);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get all Events
app.get('/api/events', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const events = await db.all('SELECT * FROM events');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Save a new Game Score
app.post('/api/games', isLoggedIn, async (req, res) => {
  const { score } = req.body;
  if (score === undefined || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score provided' });
  }
  try {
    const db = await getDBConnection();
    const result = await db.run(
      'INSERT INTO games (user_id, score) VALUES (?, ?)',
      [req.user.id, score]
    );
    res.status(201).json({ message: 'Game saved successfully', gameId: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Get General Ranking
app.get('/api/games/ranking', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const rankingQuery = `
      SELECT users.username, games.score 
      FROM games 
      JOIN users ON games.user_id = users.id 
      ORDER BY games.score DESC
    `;
    const ranking = await db.all(rankingQuery);
    res.status(200).json(ranking);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});



// --- GAME ENGINE API: Setup & Pathfinding ---

app.get('/api/game/setup', isLoggedIn, (req, res) => {
  // 1. Fetch all stations and connections (segments)
  db.all('SELECT * FROM stations', [], (err, stations) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all('SELECT * FROM segments', [], (err, segments) => {
      if (err) return res.status(500).json({ error: err.message });

      // 2. Build the Graph (Adjacency List)
      // This allows the server to know exactly which station is connected to which
      const graph = {};
      stations.forEach(s => graph[s.id] = []); // Initialize empty arrays for each station
      
      segments.forEach(seg => {
        // Since a metro line goes both ways, the graph is Undirected
        graph[seg.station_a_id].push(seg.station_b_id);
        graph[seg.station_b_id].push(seg.station_a_id); 
      });

      // 3. Pick a completely random Starting Station (Node A)
      const startStation = stations[Math.floor(Math.random() * stations.length)];

      // 4. Run Breadth-First Search (BFS) to calculate distances from Node A
      const distances = {};
      const queue = [startStation.id];
      distances[startStation.id] = 0; // Distance to itself is 0

      while (queue.length > 0) {
        const current = queue.shift();
        
        graph[current].forEach(neighbor => {
          if (distances[neighbor] === undefined) { // If not visited yet
            distances[neighbor] = distances[current] + 1;
            queue.push(neighbor);
          }
        });
      }

      // 5. Filter valid Targets: Must be at least 3 segments away
      const validTargets = stations.filter(s => distances[s.id] >= 3);

      if (validTargets.length === 0) {
        return res.status(500).json({ error: "Network structure error: Could not find a station 3 segments away." });
      }

      // 6. Pick a random Target Station (Node B) from the valid options
      const targetStation = validTargets[Math.floor(Math.random() * validTargets.length)];

      // 7. Send the setup data back to the React frontend
      res.json({
        start: startStation,
        target: targetStation,
        minimum_distance: distances[targetStation.id],
        coins: 20 // The project requires starting with 20 coins
      });
    });
  });
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});