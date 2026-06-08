// Import the sqlite3 library with verbose execution for better debugging
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt'; 

// Initialize a new SQLite database file named 'database.sqlite'
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Successfully connected to the SQLite database.');
  }
});

// Use db.serialize to ensure that database queries are executed sequentially
db.serialize(() => {

  // 1. Create 'users' table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  )`);

  // 2. Create 'events' table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL
  )`);

  // 3. Create 'lines' table
  db.run(`CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // 4. Create 'stations' table
  db.run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  )`);

  // 5. Create 'station_lines' junction table
  db.run(`CREATE TABLE IF NOT EXISTS station_lines (
    station_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    PRIMARY KEY (station_id, line_id),
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
  )`);

  // 6. Create 'segments' table (Crucial for Graph/Pathfinding algorithms)
  // This explicitly states that Station A is directly connected to Station B.
  db.run(`CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_a_id INTEGER NOT NULL,
    station_b_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    FOREIGN KEY (station_a_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (station_b_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
  )`);

  // 7. Create 'games' table
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  
  // ==========================================
  // --- SEEDING DATA (Turin Metro Network) ---
  // ==========================================
  console.log('Inserting seed data...');

  // 1. Insert Lines (4 Lines to satisfy requirements)
  const lines = ['Red Line (M1)', 'Blue Line', 'Green Line', 'Yellow Line'];
  const insertLine = db.prepare('INSERT OR IGNORE INTO lines (name) VALUES (?)');
  lines.forEach(line => insertLine.run(line));
  insertLine.finalize();

  // 2. Insert Turin Stations (15 Stations)
  const stations = [
    'Lingotto', 'Spezia', 'Nizza', 'Marconi', 'Porta Nuova', // 1-5
    'Re Umberto', 'Vinzaglio', 'Porta Susa', "Principi d'Acaja", 'Bernini', // 6-10
    'Racconigi', 'Rivoli', 'Massaua', // 11-13 (End of Red Line)
    'Politecnico', 'Piazza Castello' // 14-15 (Fictional Hubs)
  ];
  const insertStation = db.prepare('INSERT OR IGNORE INTO stations (name) VALUES (?)');
  stations.forEach(station => insertStation.run(station));
  insertStation.finalize();

  // 3. Connect Stations to Lines (Mapping the Turin network)
  // Interchange stations: Porta Nuova, Re Umberto, Vinzaglio, Bernini, Politecnico (5 interchanges <= 15/2)
  const stationLines = [
    // Red Line (1) covers stations 1 to 13
    ...Array.from({length: 13}, (_, i) => ({ stationId: i + 1, lineId: 1 })),
    // Blue Line (2): Politecnico(14) - Vinzaglio(7) - Porta Nuova(5) - Piazza Castello(15)
    { stationId: 14, lineId: 2 }, { stationId: 7, lineId: 2 }, { stationId: 5, lineId: 2 }, { stationId: 15, lineId: 2 },
    // Green Line (3): Politecnico(14) - Re Umberto(6)
    { stationId: 14, lineId: 3 }, { stationId: 6, lineId: 3 },
    // Yellow Line (4): Politecnico(14) - Bernini(10)
    { stationId: 14, lineId: 4 }, { stationId: 10, lineId: 4 }
  ];
  const insertStationLine = db.prepare('INSERT OR IGNORE INTO station_lines (station_id, line_id) VALUES (?, ?)');
  stationLines.forEach(sl => insertStationLine.run(sl.stationId, sl.lineId));
  insertStationLine.finalize();

  // 4. Insert Segments (Defining the physical graph connections)
  const segments = [
    // Red Line Segments (A to B)
    { a: 1, b: 2, line: 1 }, { a: 2, b: 3, line: 1 }, { a: 3, b: 4, line: 1 },
    { a: 4, b: 5, line: 1 }, { a: 5, b: 6, line: 1 }, { a: 6, b: 7, line: 1 },
    { a: 7, b: 8, line: 1 }, { a: 8, b: 9, line: 1 }, { a: 9, b: 10, line: 1 },
    { a: 10, b: 11, line: 1 }, { a: 11, b: 12, line: 1 }, { a: 12, b: 13, line: 1 },
    
    // Blue Line Segments
    { a: 14, b: 7, line: 2 }, // Politecnico <-> Vinzaglio
    { a: 7, b: 5, line: 2 },  // Vinzaglio <-> Porta Nuova
    { a: 5, b: 15, line: 2 }, // Porta Nuova <-> Piazza Castello
    
    // Green Line Segments
    { a: 14, b: 6, line: 3 }, // Politecnico <-> Re Umberto
    
    // Yellow Line Segments
    { a: 14, b: 10, line: 4 } // Politecnico <-> Bernini
  ];
  const insertSegment = db.prepare('INSERT OR IGNORE INTO segments (station_a_id, station_b_id, line_id) VALUES (?, ?, ?)');
  segments.forEach(seg => insertSegment.run(seg.a, seg.b, seg.line));
  insertSegment.finalize();

  // 5. Insert Events
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

  // 6. Insert Users
  console.log('Generating secure passwords and inserting users...');
  const users = [
    { username: 'Negar', plainPassword: 'passWord123!' },
    { username: 'Sam', plainPassword: '123456789' },
    { username: 'Mike', plainPassword: '123456789' }
  ];
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, salt) VALUES (?, ?, ?)');
  users.forEach(user => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(user.plainPassword, salt);
    insertUser.run(user.username, hashedPassword, salt);
  });
  insertUser.finalize();

  console.log('All database tables have been created successfully.');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database', err.message);
  } else {
    console.log('Database connection closed.');
  }
});