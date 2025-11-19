import { openDatabaseSync } from 'expo-sqlite';

// Open or create the database
const db = openDatabaseSync('users.db');

// --- USERS TABLE ---
db.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
`);

// Check if 'photo' column exists in users table
try {
  db.getFirstSync("SELECT photo FROM users LIMIT 1");
} catch (error) {
  db.execSync(`ALTER TABLE users ADD COLUMN photo TEXT;`);
  console.log("Added 'photo' column to users table");
}

// --- MESSAGES TABLE ---
db.execSync(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

// Check if 'image' column exists in messages table
try {
  db.getFirstSync("SELECT image FROM messages LIMIT 1");
} catch (error) {
  db.execSync(`ALTER TABLE messages ADD COLUMN image TEXT;`);
  console.log("Added 'image' column to messages table");
}

export default db;
