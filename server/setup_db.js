import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt'; 

// Initialize the SQLite database
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Successfully connected to the SQLite database.');
  }
});

// Ensure queries execute sequentially
db.serialize(() => {

  // --- 1. SCHEMA DEFINITION ---

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // Segments represent physical connections between stations on a specific line
  db.run(`CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_a_id INTEGER NOT NULL,
    station_b_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    FOREIGN KEY (station_a_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (station_b_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  
  // --- 2. SEEDING INITIAL DATA ---
  console.log('Inserting seed data...');

  // Lines
  const lines = ['Red Line (M1)', 'Blue Line', 'Green Line', 'Yellow Line'];
  const insertLine = db.prepare('INSERT OR IGNORE INTO lines (name) VALUES (?)');
  lines.forEach(line => insertLine.run(line));
  insertLine.finalize();

  // Stations
  const stations = [
    'Lingotto', 'Spezia', 'Nizza', 'Marconi', 'Porta Nuova', 
    'Re Umberto', 'Vinzaglio', 'Porta Susa', "Principi d'Acaja", 'Bernini', 
    'Racconigi', 'Rivoli', 'Massaua', 
    'Politecnico', 'Piazza Castello' 
  ];
  const insertStation = db.prepare('INSERT OR IGNORE INTO stations (name) VALUES (?)');
  stations.forEach(station => insertStation.run(station));
  insertStation.finalize();

  // Segments (Graph Edges)
  const segments = [
    { a: 1, b: 2, line: 1 }, { a: 2, b: 3, line: 1 }, { a: 3, b: 4, line: 1 },
    { a: 4, b: 5, line: 1 }, { a: 5, b: 6, line: 1 }, { a: 6, b: 7, line: 1 },
    { a: 7, b: 8, line: 1 }, { a: 8, b: 9, line: 1 }, { a: 9, b: 10, line: 1 },
    { a: 10, b: 11, line: 1 }, { a: 11, b: 12, line: 1 }, { a: 12, b: 13, line: 1 },
    { a: 14, b: 7, line: 2 }, { a: 7, b: 5, line: 2 }, { a: 5, b: 15, line: 2 }, 
    { a: 14, b: 6, line: 3 }, 
    { a: 14, b: 10, line: 4 } 
  ];
  const insertSegment = db.prepare('INSERT OR IGNORE INTO segments (station_a_id, station_b_id, line_id) VALUES (?, ?, ?)');
  segments.forEach(seg => insertSegment.run(seg.a, seg.b, seg.line));
  insertSegment.finalize();

  // Events
  const events = [
    { desc: 'Quiet journey', effect: 0 },
    { desc: 'Wrong platform', effect: -2 },
    { desc: 'Kind passenger', effect: 1 },
    { desc: 'Found a coin', effect: 3 },
    { desc: 'Pickpocketed', effect: -4 },
    { desc: 'Train delayed', effect: -1 },
    { desc: 'Ticket inspector check, all good', effect: 2 },
    { desc: 'Fell asleep, missed stop', effect: -3 }
  ];
  const insertEvent = db.prepare('INSERT OR IGNORE INTO events (description, effect) VALUES (?, ?)');
  events.forEach(event => insertEvent.run(event.desc, event.effect));
  insertEvent.finalize();

  // Users (MUST be inserted before Games)
  console.log('Generating secure passwords and inserting users...');
  const users = [
    { username: 'Negar', plainPassword: 'passWord123!' },
    { username: 'Sam', plainPassword: '9127435395' },
    { username: 'Mike', plainPassword: '9127435395' }
  ];
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, salt) VALUES (?, ?, ?)');
  users.forEach(user => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(user.plainPassword, salt);
    insertUser.run(user.username, hashedPassword, salt);
  });
  insertUser.finalize();

  // Game Records
  console.log('Inserting initial game records for leaderboard...');
  const initialGames = [
    { userId: 2, score: 15 },
    { userId: 2, score: 8 },  
    { userId: 3, score: 22 }, 
    { userId: 3, score: 0 } 
  ];
  const insertGame = db.prepare('INSERT INTO games (user_id, score) VALUES (?, ?)');
  initialGames.forEach(game => insertGame.run(game.userId, game.score));
  insertGame.finalize();

  console.log('All database tables have been created and seeded successfully.');
});

db.close((err) => {
  if (err) console.error('Error closing database', err.message);
  else console.log('Database connection closed.');
});