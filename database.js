import { openDatabaseSync } from 'expo-sqlite';

// Open or create the database
const db = openDatabaseSync('users.db');

// Create the users table if it doesn't exist
db.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

// Check if 'photo' column exists
try {
  db.getFirstSync("SELECT photo FROM users LIMIT 1");
} catch (error) {
  // Column doesn't exist → add it
  db.execSync(`ALTER TABLE users ADD COLUMN photo TEXT;`);
  console.log("Added 'photo' column to users table");
}

// Create messages table if it doesn't exist
db.execSync(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

export default db;