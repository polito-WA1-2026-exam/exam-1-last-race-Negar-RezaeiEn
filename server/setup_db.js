// Import the sqlite3 library with verbose execution for better debugging
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt'; 

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

  // 1. Insert Lines (5 Lines)
  // We added 'Purple Line' to expand the network
  const lines = ['Red Line', 'Blue Line', 'Green Line', 'Yellow Line', 'Purple Line'];
  // Using INSERT OR IGNORE makes the script idempotent (safe to run multiple times)
  const insertLine = db.prepare('INSERT OR IGNORE INTO lines (name) VALUES (?)');
  lines.forEach(line => insertLine.run(line));
  insertLine.finalize();

  // 2. Insert Stations (15 Stations)
// 2. Insert Stations (15 Stations) - Generic Theme
  const stations = [
    'Central Park', 'Tim Avenue', 'Riverside', 'West End', // 1-4
    'Downtown Plaza', 'Sam Street', 'Grand Station', // 5-7
    'Union Square', 'Market Gate', // 8-9
    'Harbor View', 'East Gate', 'Highland', 'Spring Valley', // 10-13
    'Liberty Boulevard', 'Pine Hill' // 14-15
  ];
  // Prepared statements optimize performance by compiling the query only once
  const insertStation = db.prepare('INSERT OR IGNORE INTO stations (name) VALUES (?)');
  stations.forEach(station => insertStation.run(station));
  insertStation.finalize();

  // 3. Connect Stations to Lines (5 Interchange Stations)
  // Implementing the Many-to-Many relationship physical logic
  const stationLines = [
    // Red Line (Line ID 1)
    { stationId: 1, lineId: 1 }, { stationId: 2, lineId: 1 }, { stationId: 3, lineId: 1 }, { stationId: 4, lineId: 1 },
    
    // Blue Line (Line ID 2)
    // Centrale (ID 1) and Fontana Oscura (ID 5) are interchanges!
    { stationId: 1, lineId: 2 }, { stationId: 5, lineId: 2 }, { stationId: 6, lineId: 2 }, { stationId: 7, lineId: 2 },
    
    // Green Line (Line ID 3)
    // Porta Velaria (ID 2) and Fontana Oscura (ID 5) are interchanges!
    { stationId: 2, lineId: 3 }, { stationId: 5, lineId: 3 }, { stationId: 8, lineId: 3 }, { stationId: 9, lineId: 3 },
    
    // Yellow Line (Line ID 4)
    // Stazione Nord (ID 10) is an interchange!
    { stationId: 10, lineId: 4 }, { stationId: 11, lineId: 4 }, { stationId: 12, lineId: 4 }, { stationId: 13, lineId: 4 },

    // Purple Line (Line ID 5)
    // Crocevia del Falco (ID 3) and Stazione Nord (ID 10) are interchanges!
    { stationId: 3, lineId: 5 }, { stationId: 10, lineId: 5 }, { stationId: 14, lineId: 5 }, { stationId: 15, lineId: 5 }
  ];
  const insertStationLine = db.prepare('INSERT OR IGNORE INTO station_lines (station_id, line_id) VALUES (?, ?)');
  stationLines.forEach(sl => insertStationLine.run(sl.stationId, sl.lineId));
  insertStationLine.finalize();

  // 4. Insert Events (10 Events)
  const events = [
    { desc: 'Quiet journey', effect: 0 },
    { desc: 'Wrong platform', effect: -2 },
    { desc: 'Kind passenger', effect: 1 },
    { desc: 'Found a coin', effect: 3 },
    { desc: 'Pickpocketed', effect: -4 },
    { desc: 'Train delayed', effect: -1 },
    { desc: 'Ticket inspector check, all good', effect: 2 },
    { desc: 'Fell asleep, missed stop', effect: -3 },
    { desc: 'Musician played a great song', effect: 1 }, // Extra event 1
    { desc: 'Lost map, walked in circles', effect: -2 }  // Extra event 2
  ];
  const insertEvent = db.prepare('INSERT OR IGNORE INTO events (description, effect) VALUES (?, ?)');
  events.forEach(event => insertEvent.run(event.desc, event.effect));
  insertEvent.finalize();
  // 5. Insert Users with Hashed Passwords (3 Users)
  console.log('Generating secure passwords and inserting users...');
  
  const users = [
    { username: 'Negar', plainPassword: 'passWord123!' },
    { username: 'Sam', plainPassword: '123456789' },
    { username: 'Mike', plainPassword: '123456789' },
    { username: 'Bob', plainPassword: 'asdfg1245' }
  ];

  // Using INSERT OR IGNORE for idempotency
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, salt) VALUES (?, ?, ?)');
  
  users.forEach(user => {
    // Generate a Salt with 10 rounds (standard complexity)
    const salt = bcrypt.genSaltSync(10);
    // Create the Hash combining the plain password and the salt
    const hashedPassword = bcrypt.hashSync(user.plainPassword, salt);
    
    // Insert into database
    insertUser.run(user.username, hashedPassword, salt);
  });
  insertUser.finalize();

  // 6. Insert Historical Games for at least 2 users
  // Assuming player1 (id: 1) and player2 (id: 2) have played games
  console.log('Inserting game history...');
  
  const games = [
    { userId: 1, score: 17 },
    { userId: 1, score: 23 }, // player1 played twice
    { userId: 2, score: 5 },  // player2 played once
    { userId: 2, score: 0 }   // player2 failed a game
  ];

  const insertGame = db.prepare('INSERT OR IGNORE INTO games (user_id, score) VALUES (?, ?)');
  games.forEach(game => {
    insertGame.run(game.userId, game.score);
  });
  insertGame.finalize();

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