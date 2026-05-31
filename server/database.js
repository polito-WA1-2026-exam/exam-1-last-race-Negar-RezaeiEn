// import the necessary modules from the sqlite and sqlite3 packages
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Create an asynchronous function to establish and return a database connection
async function getDBConnection() {
    // open() returns a promise that resolves to a database instance
    const db = await open({
        filename: './database.sqlite', 
        driver: sqlite3.Database // Specifying the database driver to use
    });
    return db;
}

// Export the function so it can be used in other files (like route handlers)
export default getDBConnection;