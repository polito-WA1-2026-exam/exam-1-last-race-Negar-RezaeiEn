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
  // 'secret' is used to cryptographically sign the session ID cookie
  secret: "last-race-super-secret-key",
  // resave: false prevents saving the session back to the store if it wasn't modified
  resave: false,
  // saveUninitialized: false prevents creating a session for unauthenticated users, saving memory
  saveUninitialized: false,
}));

// --- 2. Passport Initialization ---
app.use(passport.authenticate('session'));

// --- 3. Local Strategy Implementation ---
// This strategy dictates HOW we verify a user's credentials against our database
passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const db = await getDBConnection();
    // Query the database for the user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) { 
      return cb(null, false, { message: 'Incorrect username.' }); 
    }
    
    // Compare the provided plain password with the hashed password in the DB
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return cb(null, false, { message: 'Incorrect password.' });
    }
    
    // If credentials are correct, return the user object
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
}));

// --- 4. User Serialization and Deserialization ---
// Serialize: What data of the user should be stored in the session cookie? (Just the ID to keep it lightweight)
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

// Deserialize: On subsequent requests, how do we get the full user object from the stored ID?
passport.deserializeUser(async function(id, cb) {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});
// 3. Get all Events (Protected)
app.get('/api/events', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    const events = await db.all('SELECT * FROM events');
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error while fetching events' });
  }
});

// 4. Save a new Game Score (Protected)
app.post('/api/games', isLoggedIn, async (req, res) => {
  // The client will send the final score in the request body
  const { score } = req.body;

  if (score === undefined || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score provided' });
  }

  try {
    const db = await getDBConnection();
    // req.user.id is securely provided by Passport.js session!
    const result = await db.run(
      'INSERT INTO games (user_id, score) VALUES (?, ?)',
      [req.user.id, score]
    );
    res.status(201).json({ message: 'Game saved successfully', gameId: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error while saving the game' });
  }
});

// 5. Get General Ranking (Protected)
app.get('/api/games/ranking', isLoggedIn, async (req, res) => {
  try {
    const db = await getDBConnection();
    // Using a SQL JOIN to combine user data with their game scores, ordered by highest score
    const rankingQuery = `
      SELECT users.username, games.score 
      FROM games 
      JOIN users ON games.user_id = users.id 
      ORDER BY games.score DESC
    `;
    const ranking = await db.all(rankingQuery);
    res.status(200).json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error while fetching ranking' });
  }
});
// --- Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is successfully connected to the client!' });
});

// --- Authentication API Routes ---

// 1. Login Endpoint (Create a new session)
app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  // If the middleware 'passport.authenticate' succeeds, 
  // it automatically attaches the authenticated user object to 'req.user'
  res.status(201).json(req.user);
});

// 2. Get Current User Endpoint (Check authentication status)
app.get('/api/sessions/current', (req, res) => {
  // 'req.isAuthenticated()' is a method provided by Passport
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 3. Logout Endpoint (Destroy the session)
app.delete('/api/sessions/current', (req, res) => {
  // 'req.logout()' clears the login session and removes the req.user property
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});