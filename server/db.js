const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const db = new DatabaseSync(path.join(__dirname, '../data.sqlite'))

db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS peers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    peer_id TEXT NOT NULL UNIQUE,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

module.exports = db
