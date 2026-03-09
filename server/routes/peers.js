const express = require('express')
const router = express.Router()
const db = require('../db')

// --- Groups ---

router.get('/groups', (req, res) => {
  res.json(db.prepare('SELECT * FROM groups ORDER BY name').all())
})

router.post('/groups', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  try {
    const result = db.prepare('INSERT INTO groups (name) VALUES (?)').run(name)
    res.json({ id: result.lastInsertRowid, name })
  } catch (e) {
    res.status(409).json({ error: 'Group already exists' })
  }
})

router.delete('/groups/:id', (req, res) => {
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// --- Peers ---

router.get('/peers', (req, res) => {
  const peers = db.prepare(`
    SELECT p.*, g.name as group_name
    FROM peers p
    LEFT JOIN groups g ON p.group_id = g.id
    ORDER BY g.name, p.name
  `).all()
  res.json(peers)
})

router.post('/peers', (req, res) => {
  const { name, peer_id, group_id, notes, alt_id } = req.body
  if (!name || !peer_id) return res.status(400).json({ error: 'name and peer_id required' })
  try {
    const result = db.prepare(
      'INSERT INTO peers (name, peer_id, group_id, notes, alt_id) VALUES (?, ?, ?, ?, ?)'
    ).run(name, peer_id, group_id || null, notes || '', alt_id || '')
    res.json({ id: result.lastInsertRowid, name, peer_id, group_id, notes, alt_id })
  } catch (e) {
    res.status(409).json({ error: 'Peer ID already exists' })
  }
})

router.put('/peers/:id', (req, res) => {
  const { name, peer_id, group_id, notes, alt_id } = req.body
  db.prepare(
    'UPDATE peers SET name=?, peer_id=?, group_id=?, notes=?, alt_id=? WHERE id=?'
  ).run(name, peer_id, group_id || null, notes || '', alt_id || '', req.params.id)
  res.json({ ok: true })
})

router.delete('/peers/:id', (req, res) => {
  db.prepare('DELETE FROM peers WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
