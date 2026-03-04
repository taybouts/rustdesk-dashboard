const { DatabaseSync } = require('node:sqlite')
const fs = require('fs')
const path = require('path')

const PEERS_DIR = path.join(process.env.APPDATA, 'RustDesk/config/peers')
const db = new DatabaseSync(path.join(__dirname, 'data.sqlite'))

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

function getOrCreateGroup(name) {
  let row = db.prepare('SELECT id FROM groups WHERE name = ?').get(name)
  if (!row) {
    const result = db.prepare('INSERT INTO groups (name) VALUES (?)').run(name)
    return result.lastInsertRowid
  }
  return row.id
}

function detectGroup(peerId) {
  if (peerId.startsWith('100.64.')) return 'VPN'
  if (peerId.startsWith('192.168.')) return 'Local Network'
  if (/^\d+$/.test(peerId)) return 'RustDesk ID'
  return 'Other'
}

function parseToml(content) {
  const info = {}
  const infoMatch = content.match(/\[info\]([\s\S]*?)(\[|$)/)
  if (infoMatch) {
    const block = infoMatch[1]
    const hostname = block.match(/hostname = '([^']*)'/)
    const platform = block.match(/platform = '([^']*)'/)
    if (hostname) info.hostname = hostname[1]
    if (platform) info.platform = platform[1]
  }
  return info
}

const files = fs.readdirSync(PEERS_DIR).filter(f => f.endsWith('.toml'))
let imported = 0, skipped = 0

for (const file of files) {
  const peerId = path.basename(file, '.toml')
  const content = fs.readFileSync(path.join(PEERS_DIR, file), 'utf8')
  const info = parseToml(content)

  const name = info.hostname || peerId
  const notes = info.platform ? `Platform: ${info.platform}` : ''
  const groupName = detectGroup(peerId)
  const groupId = getOrCreateGroup(groupName)

  try {
    db.prepare('INSERT INTO peers (name, peer_id, group_id, notes) VALUES (?, ?, ?, ?)').run(name, peerId, groupId, notes)
    console.log(`  ✓ ${name} (${peerId}) → ${groupName}`)
    imported++
  } catch (e) {
    console.log(`  ~ skipped ${peerId} (already exists)`)
    skipped++
  }
}

console.log(`\nDone: ${imported} imported, ${skipped} skipped.`)
