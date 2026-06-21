import express from "express";
import cors from "cors";
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

// --- 1. Session & Passport Configuration ---
app.use(session({
  secret: "last-race-super-secret-key",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) return cb(null, false, { message: 'Incorrect username.' }); 
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return cb(null, false, { message: 'Incorrect password.' });
    
    // Return sanitized user object
    const safeUser = { id: user.id, username: user.username };
    return cb(null, safeUser);
  } catch (err) {
    return cb(err);
  }
}));

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

// Custom Middleware for Route Protection
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authorized. Please log in.' });
};

// --- 2. Authentication API Routes ---

app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.status(201).json(req.user);
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) res.status(200).json(req.user);
  else res.status(401).json({ error: 'Not authenticated' });
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Error during logout' });
    res.status(200).json({ message: 'Logout successful' });
  });
});

// --- 3. General Game Data API Routes ---

// --- 3. General Game Data API Routes ---

app.get('/api/games/ranking', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const rankingQuery = `
      SELECT users.username, 
        CASE WHEN SUM(games.score) < 0 THEN 0 ELSE SUM(games.score) END AS score 
      FROM games 
      JOIN users ON games.user_id = users.id 
      GROUP BY users.id 
      ORDER BY score DESC
    `;
    const ranking = await db.all(rankingQuery);
    res.status(200).json(ranking);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- 4. GAME ENGINE: Setup & Pathfinding ---

app.get('/api/game/setup', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();

    const stations = await db.all('SELECT id, name FROM stations');
    const segments = await db.all('SELECT * FROM segments');

    // Build the Graph (Adjacency List)
    const graph = {};
    stations.forEach(s => graph[s.id] = []); 
    segments.forEach(seg => {
      graph[seg.station_a_id].push(seg.station_b_id);
      graph[seg.station_b_id].push(seg.station_a_id); 
    });

    // Random Starting Station
    const startStation = stations[Math.floor(Math.random() * stations.length)];

    // BFS to calculate minimum distance
    const distances = {};
    const queue = [startStation.id];
    distances[startStation.id] = 0; 

    while (queue.length > 0) {
      const current = queue.shift();
      graph[current].forEach(neighbor => {
        if (distances[neighbor] === undefined) { 
          distances[neighbor] = distances[current] + 1;
          queue.push(neighbor);
        }
      });
    }

    // Filter valid Targets (At least 3 segments away)
    const validTargets = stations.filter(s => distances[s.id] >= 3);
    if (validTargets.length === 0) {
      return res.status(500).json({ error: "Network structure error." });
    }

    const targetStation = validTargets[Math.floor(Math.random() * validTargets.length)];

    // Format Segments for the Frontend UI
    let formattedSegments = segments.map(seg => {
      const stationA = stations.find(s => s.id === seg.station_a_id).name;
      const stationB = stations.find(s => s.id === seg.station_b_id).name;
      return {
        id: seg.id,
        name: `${stationA} ↔ ${stationB}`,
        station_a_id: seg.station_a_id, 
        station_b_id: seg.station_b_id
      };
    });
    formattedSegments = formattedSegments.sort(() => Math.random() - 0.5);

    res.json({
      start: startStation,
      target: targetStation,
      minimum_distance: distances[targetStation.id],
      coins: 20, 
      segments: formattedSegments,
      stations: stations
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. GAME ENGINE: Route Validation & Execution ---

app.post('/api/game/execute', isLoggedIn, async (req, res) => {
  try {
    const { startStationId, targetStationId, selectedSegmentIds } = req.body;
    const db = await getDBConnection(); 

    const saveZeroScore = async () => {
      await db.run('INSERT INTO games (user_id, score) VALUES (?, ?)', [req.user.id, 0]);
    };

    if (!selectedSegmentIds || selectedSegmentIds.length === 0) {
      await saveZeroScore(); 
      return res.json({ valid: false, message: "No route selected. You lost all coins!", finalCoins: 0 });
    }

    const placeholders = selectedSegmentIds.map(() => '?').join(',');
    const segments = await db.all(`SELECT * FROM segments WHERE id IN (${placeholders})`, selectedSegmentIds);

    if (segments.length !== selectedSegmentIds.length) {
      await saveZeroScore();
      return res.status(400).json({ error: "Invalid or duplicate segment data." });
    }

    // Graph Validation: Unbroken Chain Rule
    let currentNode = startStationId;
    let unvisitedSegments = [...segments];
    let pathTraversed = [];

    while (currentNode !== targetStationId) {
      const nextSegmentIndex = unvisitedSegments.findIndex(seg => 
        seg.station_a_id === currentNode || seg.station_b_id === currentNode
      );

      if (nextSegmentIndex === -1) {
        await saveZeroScore(); 
        return res.json({ valid: false, message: "Route is disconnected! You lost all coins.", finalCoins: 0 });
      }

      const segment = unvisitedSegments[nextSegmentIndex];
      pathTraversed.push(segment);
      currentNode = (segment.station_a_id === currentNode) ? segment.station_b_id : segment.station_a_id;
      unvisitedSegments.splice(nextSegmentIndex, 1);
    }

    if (unvisitedSegments.length > 0) {
      await saveZeroScore(); 
      return res.json({ valid: false, message: "Route contains extra branches! Invalid path. You lost all coins.", finalCoins: 0 });
    }

    // Event Calculation
    const allEvents = await db.all('SELECT * FROM events');
    const goodEvents = allEvents.filter(e => e.effect >= 0);
    const badEvents = allEvents.filter(e => e.effect < 0);

    let currentCoins = 20;
    let journeyLog = []; 

    for (let i = 0; i < pathTraversed.length; i++) {
      let chosenEvent;
      if (i >= 4) {
        if (Math.random() < 0.7 && badEvents.length > 0) {
          chosenEvent = badEvents[Math.floor(Math.random() * badEvents.length)];
        } else {
          chosenEvent = goodEvents[Math.floor(Math.random() * goodEvents.length)];
        }
      } else {
        chosenEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
      }

      currentCoins += chosenEvent.effect;
      
      journeyLog.push({
        step: i + 1,
        event: chosenEvent.description,
        effect: chosenEvent.effect,
        coinsAfter: currentCoins
      });
    }

    // Enforce Minimum Score Rule
    let finalValidCoins = currentCoins < 0 ? 0 : currentCoins;

    await db.run('INSERT INTO games (user_id, score) VALUES (?, ?)', [req.user.id, finalValidCoins]);

    res.json({
      valid: true,
      message: "Journey completed successfully!",
      finalCoins: finalValidCoins,
      log: journeyLog
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});