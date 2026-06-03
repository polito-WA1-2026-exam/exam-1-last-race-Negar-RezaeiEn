// Import the sqlite3 library with verbose execution for better debugging
import sqlite3 from 'sqlite3';

// Initialize a new SQLite database file named 'database.sqlite'
// If the file does not exist, SQLite will automatically create it in the root of the server folder
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Successfully connected to the SQLite database.');
  }
});

// Use db.serialize to ensure that database queries are executed sequentially, one after another
db.serialize(() => {

  // 1. Create the 'users' table to store player credentials
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  )`);

  // 2. Create the 'events' table to store the random events that happen during the game
  // The 'effect' column will store values between -4 and +4
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL
  )`);

  // 3. Create the 'lines' table to store the metro lines (e.g., Red Line)
  db.run(`CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // 4. Create the 'stations' table to store individual stations
  db.run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // 5. Create a junction table 'station_lines' to handle the Many-to-Many relationship
  // This is crucial for defining 'interchange stations' that belong to multiple lines
  db.run(`CREATE TABLE IF NOT EXISTS station_lines (
    station_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    PRIMARY KEY (station_id, line_id),
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
  )`);

  // 6. Create the 'games' table to track the score of each registered user
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  
  // --- SEEDING DATA ---

  console.log('Inserting seed data...');

  // 1. Insert Lines 
  const lines = ['Red Line', 'Blue Line', 'Green Line', 'Yellow Line'];
  const insertLine = db.prepare('INSERT OR IGNORE INTO lines (name) VALUES (?)');
  lines.forEach(line => insertLine.run(line));
  insertLine.finalize();

  // 2. Insert Stations 
  const stations = [
    'Centrale', 'Porta Velaria', 'Crocevia del Falco', 'Piazza delle Lanterne', // Stations for Red Line
    'Fontana Oscura', 'Borgo Sereno', 'Viale dei Mosaici', // Additional for Blue Line
    'Torre Cinerea', 'Campo dell Eco', // Additional for Green Line
    'Stazione Nord', 'Polo Sud', 'Oasi Ovest' // Extra stations to reach 12
  ];
  const insertStation = db.prepare('INSERT OR IGNORE INTO stations (name) VALUES (?)');
  stations.forEach(station => insertStation.run(station));
  insertStation.finalize();

  // 3. Connect Stations to Lines
  
  const stationLines = [
    // Red Line (Line ID 1)
    { stationId: 1, lineId: 1 }, { stationId: 2, lineId: 1 }, { stationId: 3, lineId: 1 }, { stationId: 4, lineId: 1 },
    // Blue Line (Line ID 2)
    // Centrale (ID 1) is an interchange!
    { stationId: 1, lineId: 2 }, { stationId: 5, lineId: 2 }, { stationId: 6, lineId: 2 }, { stationId: 7, lineId: 2 },
    // Green Line (Line ID 3)
    // Porta Velaria (ID 2) and Fontana Oscura (ID 5) are interchanges!
    { stationId: 2, lineId: 3 }, { stationId: 5, lineId: 3 }, { stationId: 8, lineId: 3 }, { stationId: 9, lineId: 3 },
    // Yellow Line (Line ID 4)
    { stationId: 10, lineId: 4 }, { stationId: 11, lineId: 4 }, { stationId: 12, lineId: 4 }
  ];
  const insertStationLine = db.prepare('INSERT OR IGNORE INTO station_lines (station_id, line_id) VALUES (?, ?)');
  stationLines.forEach(sl => insertStationLine.run(sl.stationId, sl.lineId));
  insertStationLine.finalize();

  // 4. Insert Events
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

  console.log('All database tables have been created successfully.');
});

// Close the database connection gracefully once all queries are queued
db.close((err) => {
  if (err) {
    console.error('Error closing database', err.message);
  } else {
    console.log('Database connection closed.');
  }
});