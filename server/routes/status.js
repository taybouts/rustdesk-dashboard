const { exec } = require('child_process')
const router = require('express').Router()
const db = require('../db')

let cache = {}
let cacheTime = 0
const CACHE_TTL = 12000

// Parse `tailscale status` output into a map of IP -> status
function getTailscaleStatus() {
  return new Promise(resolve => {
    exec('tailscale status', { timeout: 5000, windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null)
      const statuses = {}
      for (const line of stdout.split('\n')) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 5) continue
        const ip = parts[0]
        const rest = parts.slice(4).join(' ')
        if (rest.includes('offline')) {
          statuses[ip] = 'offline'
        } else if (rest.includes('active')) {
          statuses[ip] = 'online'
        } else {
          // "-" means idle but connected to Tailscale — reachable
          statuses[ip] = 'online'
        }
      }
      resolve(statuses)
    })
  })
}

// Find the Tailscale IP for a peer
function findTailscaleIP(peer_id, alt_id) {
  const isIP = s => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)
  const isTailscale = s => s.startsWith('100.64.')
  const candidates = [peer_id, alt_id].filter(Boolean)
  return candidates.find(s => isIP(s) && isTailscale(s)) || null
}

// Fallback ping using TCP connect — no console windows
function pingHost(host) {
  return new Promise(resolve => {
    const net = require('net')
    const socket = new net.Socket()
    socket.setTimeout(2000)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => { socket.destroy(); resolve(false) })
    // Try common ports: RDP (3389), then HTTP (80), then SMB (445)
    socket.connect(3389, host)
  })
}

function pickPingTarget(peer_id, alt_id) {
  const isIP = s => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)
  const isRelayId = s => /^\d{6,}$/.test(s)
  const candidates = [peer_id, alt_id].filter(Boolean)
  const ip = candidates.find(isIP)
  if (ip) return ip
  const host = candidates.find(s => !isRelayId(s))
  if (host) return host
  return null
}

router.get('/', async (req, res) => {
  if (Date.now() - cacheTime < CACHE_TTL) return res.json(cache)

  const peers = db.prepare('SELECT peer_id, alt_id FROM peers').all()
  const tsStatus = await getTailscaleStatus()

  const results = await Promise.all(peers.map(async ({ peer_id, alt_id }) => {
    // Try Tailscale status first
    if (tsStatus) {
      const tsIP = findTailscaleIP(peer_id, alt_id || '')
      if (tsIP && tsStatus[tsIP]) {
        return { peer_id, status: tsStatus[tsIP] }
      }
    }

    // Fallback to ping for non-Tailscale peers
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
