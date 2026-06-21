import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Asynchronous function to establish and return a database connection
async function getDBConnection() {
    const db = await open({
        filename: './database.sqlite', 
        driver: sqlite3.Database
    });
    return db;
}

export default getDBConnection;