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