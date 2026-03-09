const { exec } = require('child_process')
const router = require('express').Router()
const db = require('../db')

let cache = {}
let cacheTime = 0
const CACHE_TTL = 12000

function pingHost(host) {
  return new Promise(resolve => {
    const cmd = process.platform === 'win32'
      ? `ping -n 1 -w 1500 ${host}`
      : `ping -c 1 -W 2 ${host}`
    exec(cmd, { timeout: 4000 }, err => resolve(!err))
  })
}

// Find the best address to ping for a peer.
// Prefers IPs, then hostnames, skips pure numeric RustDesk relay IDs.
function pickPingTarget(peer_id, alt_id) {
  const isIP = s => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)
  const isRelayId = s => /^\d{6,}$/.test(s)
  const candidates = [peer_id, alt_id].filter(Boolean)
  // Prefer IPs first
  const ip = candidates.find(isIP)
  if (ip) return ip
  // Then hostnames (non-numeric or dot-separated non-IP)
  const host = candidates.find(s => !isRelayId(s))
  if (host) return host
  return null
}

router.get('/', async (req, res) => {
  if (Date.now() - cacheTime < CACHE_TTL) return res.json(cache)

  const peers = db.prepare('SELECT peer_id, alt_id FROM peers').all()

  const results = await Promise.all(peers.map(async ({ peer_id, alt_id }) => {
    const target = pickPingTarget(peer_id, alt_id || '')
    if (!target) return { peer_id, status: 'unknown' }
    const online = await pingHost(target)
    return { peer_id, status: online ? 'online' : 'offline' }
  }))

  cache = {}
  results.forEach(({ peer_id, status }) => { cache[peer_id] = status })
  cacheTime = Date.now()

  res.json(cache)
})

module.exports = router
