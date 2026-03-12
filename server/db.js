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

// Safe migration — add alt_id if not yet present
try { db.exec('ALTER TABLE peers ADD COLUMN alt_id TEXT DEFAULT ""') } catch(e) {}

// Room layouts stored in DB (not localStorage)
db.exec(`
  CREATE TABLE IF NOT EXISTS room_layouts (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL DEFAULT '{}'
  );
`)
// Seed single row if empty
try { db.prepare('INSERT OR IGNORE INTO room_layouts (id, data) VALUES (1, ?)').run('{}') } catch(e) {}

module.exports = db
