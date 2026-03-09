const API = '/api'
let peers = []
let groups = []

// --- API ---
async function fetchPeers() { const r = await fetch(`${API}/peers`); peers = await r.json() }
async function fetchGroups() { const r = await fetch(`${API}/groups`); groups = await r.json() }
async function addPeer(data) { await fetch(`${API}/peers`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }) }
async function updatePeer(id, data) { await fetch(`${API}/peers/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }) }
async function deletePeer(id) { await fetch(`${API}/peers/${id}`, { method:'DELETE' }) }
async function addGroup(name) { await fetch(`${API}/groups`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name }) }) }

// --- Render Peers ---
function renderGroupSelects() {
  const selects = [document.getElementById('filter-group'), document.getElementById('peer-group')]
  selects.forEach((sel, i) => {
    sel.innerHTML = (i===0 ? '<option value="">All groups</option>' : '<option value="">No group</option>')
      + groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')
  })
}

function renderPeers() {
  const search = document.getElementById('search').value.toLowerCase()
  const filterGroup = document.getElementById('filter-group').value
  const filtered = peers.filter(p => {
    return (p.name.toLowerCase().includes(search) || p.peer_id.includes(search)) &&
           (!filterGroup || String(p.group_id) === filterGroup)
  })
  const list = document.getElementById('peer-list')
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><strong>No peers yet</strong><p>Click "+ Add Peer" to get started.</p></div>`
    return
  }
  const grouped = {}
  filtered.forEach(p => { const k = p.group_name||'Ungrouped'; if(!grouped[k]) grouped[k]=[]; grouped[k].push(p) })
  list.innerHTML = Object.entries(grouped).map(([g, items]) => `
    <div class="group-label">${g}</div>
    ${items.map(p => `
      <div class="peer-card">
        <div class="peer-card-name">${escHtml(p.name)}</div>
        <div class="peer-card-id">ID: ${escHtml(p.peer_id)}</div>
        ${p.notes ? `<div class="peer-card-notes">${escHtml(p.notes)}</div>` : ''}
        <div class="peer-card-actions">
          <button class="btn-connect" onclick="connect('${escHtml(p.peer_id)}')" title="${escHtml(p.peer_id)}">Direct</button>
          ${p.alt_id ? `<button class="btn-connect btn-connect-alt" onclick="connect('${escHtml(p.alt_id)}')" title="${escHtml(p.alt_id)}">Relay</button>` : ''}
          <button class="btn-icon" onclick="openEdit(${p.id})">&#9998;</button>
          <button class="btn-icon delete" onclick="confirmDelete(${p.id},'${escHtml(p.name)}')">&#128465;</button>
        </div>
      </div>`).join('')}
  `).join('')
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function connect(peerId) { window.location.href = `rustdesk://connect/${peerId}` }
async function confirmDelete(id, name) {
  if (!confirm(`Delete "${name}"?`)) return
  await deletePeer(id); await fetchPeers(); renderPeers()
}

// --- Peer Modal ---
function openAdd() {
  document.getElementById('modal-peer-title').textContent = 'Add Peer'
  ;['peer-edit-id','peer-name','peer-id','peer-notes','peer-alt-id'].forEach(id => document.getElementById(id).value = '')
  document.getElementById('peer-group').value = ''
  document.getElementById('modal-peer').classList.remove('hidden')
  document.getElementById('peer-name').focus()
}
function openEdit(id) {
  const peer = peers.find(p => p.id === id); if (!peer) return
  document.getElementById('modal-peer-title').textContent = 'Edit Peer'
  document.getElementById('peer-edit-id').value = peer.id
  document.getElementById('peer-name').value = peer.name
  document.getElementById('peer-id').value = peer.peer_id
  document.getElementById('peer-group').value = peer.group_id || ''
  document.getElementById('peer-notes').value = peer.notes || ''
  document.getElementById('peer-alt-id').value = peer.alt_id || ''
  document.getElementById('modal-peer').classList.remove('hidden')
}
document.getElementById('btn-save-peer').addEventListener('click', async () => {
  const editId = document.getElementById('peer-edit-id').value
  const data = {
    name: document.getElementById('peer-name').value.trim(),
    peer_id: document.getElementById('peer-id').value.trim(),
    group_id: document.getElementById('peer-group').value || null,
    notes: document.getElementById('peer-notes').value.trim(),
    alt_id: document.getElementById('peer-alt-id').value.trim()
  }
  if (!data.name || !data.peer_id) return alert('Name and Peer ID are required.')
  if (editId) await updatePeer(editId, data); else await addPeer(data)
  document.getElementById('modal-peer').classList.add('hidden')
  await fetchPeers(); renderPeers(); renderWorkspace()
})
document.getElementById('btn-save-group').addEventListener('click', async () => {
  const name = document.getElementById('group-name').value.trim()
  if (!name) return alert('Group name is required.')
  await addGroup(name)
  document.getElementById('modal-group').classList.add('hidden')
  document.getElementById('group-name').value = ''
  await fetchGroups(); renderGroupSelects(); renderPeers()
})
document.getElementById('btn-add-peer').addEventListener('click', openAdd)
document.getElementById('btn-add-group').addEventListener('click', () => {
  document.getElementById('modal-group').classList.remove('hidden')
  document.getElementById('group-name').focus()
})
document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () =>
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
))
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.add('hidden')
}))
document.getElementById('search').addEventListener('input', renderPeers)
document.getElementById('filter-group').addEventListener('change', renderPeers)

// ============================================================
// ROOM WORKSPACE
// ============================================================

const SETUPS_KEY  = 'roomSetups'
const CANVAS_KEY  = 'roomCanvasDims'
const TOKEN_W     = 110   // pod size in px
const TOKEN_H     = 110
const SNAP_GRID   = 55    // fine grid: 2 squares per pod (55×2=110)
const POD_GRID    = 110   // major grid = exact pod size
const ROOM_SNAP   = 110   // rooms snap to pod-sized grid on workspace
const ROOM_W_MIN  = 220
const ROOM_H_MIN  = 160
const CANVAS_H_MIN = 200
const CANVAS_H_MAX = 1800

// Viewport height
let canvasDims = { h: 620 }
try { canvasDims = JSON.parse(localStorage.getItem(CANVAS_KEY) || '{"h":620}') } catch(e) {}
function applyCanvasDims() { document.getElementById('room-canvas').style.height = canvasDims.h + 'px' }

// --- Setup data ---
let roomData = {
  active: 'Default',
  setups: { Default: { positions:{}, hidden:[], password:null, x:20, y:20, w:880, h:530 } }
}

function migrateSetup(s, idx) {
  if (!s || typeof s !== 'object') return { positions:{}, hidden:[], password:null, x:20+idx*940, y:20, w:880, h:530 }
  if (!s.positions && !('x' in s)) s = { positions:{...s}, hidden:[], password:null }
  if (!s.positions) s.positions = {}
  if (!s.hidden) s.hidden = []
  if (!('password' in s)) s.password = null
  if (!('x' in s)) s.x = 20 + idx * 940
  if (!('y' in s)) s.y = 20
  if (!('w' in s)) s.w = 880
  if (!('h' in s)) s.h = 530
  return s
}

try {
  const saved = localStorage.getItem(SETUPS_KEY)
  if (saved) {
    roomData = JSON.parse(saved)
    Object.keys(roomData.setups).forEach((k, i) => { roomData.setups[k] = migrateSetup(roomData.setups[k], i) })
  } else {
    const old = localStorage.getItem('roomLayout')
    if (old) roomData.setups['Default'].positions = JSON.parse(old)
  }
} catch(e) {}

function saveSetups() { localStorage.setItem(SETUPS_KEY, JSON.stringify(roomData)) }

function getSetup(name) {
  if (!roomData.setups[name]) roomData.setups[name] = migrateSetup({}, Object.keys(roomData.setups).length)
  return roomData.setups[name]
}

// --- Setup tabs ---
function renderSetupTabs() {
  const tabsEl = document.getElementById('setup-tabs')
  tabsEl.innerHTML = Object.keys(roomData.setups).map(name => {
    const locked = !!roomData.setups[name].password
    return `<button class="setup-tab ${name===roomData.active?'active':''}" data-setup="${escHtml(name)}">
      ${escHtml(name)}${locked?' &#128274;':''}
    </button>`
  }).join('')
  tabsEl.querySelectorAll('.setup-tab').forEach(tab => {
    tab.addEventListener('click', () => activateRoom(tab.dataset.setup))
  })
  document.getElementById('btn-delete-setup').disabled = Object.keys(roomData.setups).length <= 1
}

function activateRoom(name) {
  const setup = roomData.setups[name]
  if (!setup) return
  if (setup.password) {
    const input = prompt(`"${name}" is password protected.\nEnter password:`)
    if (input === null) return
    if (input !== setup.password) { alert('Incorrect password.'); return }
  }
  roomData.active = name
  saveSetups()
  renderSetupTabs()
  updateActiveRoomHighlight()
  const setup2 = getSetup(name)
  document.getElementById('btn-set-password').textContent = setup2.password ? 'Unlock' : 'Lock'
}

function updateActiveRoomHighlight() {
  document.querySelectorAll('.room-box').forEach(box => {
    box.classList.toggle('active-room', box.dataset.room === roomData.active)
  })
}

// Add new room — positioned below all existing rooms
document.getElementById('btn-add-setup').addEventListener('click', () => {
  const name = prompt('New room name:')
  if (!name || !name.trim()) return
  const trimmed = name.trim()
  if (roomData.setups[trimmed]) return alert('A room with that name already exists.')
  let maxBottom = 0
  Object.values(roomData.setups).forEach(s => { maxBottom = Math.max(maxBottom, (s.y||0) + (s.h||530)) })
  const firstSetup = Object.values(roomData.setups)[0]
  roomData.setups[trimmed] = {
    positions:{}, hidden:[], password:null,
    x: firstSetup ? firstSetup.x : 20,
    y: maxBottom + 40,
    w: firstSetup ? firstSetup.w : 880,
    h: firstSetup ? firstSetup.h : 530
  }
  roomData.active = trimmed
  saveSetups()
  selectedPeers.clear(); selectionRoom = null
  renderSetupTabs()
  renderWorkspace()
})

document.getElementById('btn-delete-setup').addEventListener('click', () => {
  if (Object.keys(roomData.setups).length <= 1) return
  const setup = getSetup(roomData.active)
  if (setup.password) {
    const input = prompt(`Enter password to delete "${roomData.active}":`)
    if (input === null) return
    if (input !== setup.password) { alert('Incorrect password.'); return }
  }
  if (!confirm(`Delete room "${roomData.active}"?`)) return
  delete roomData.setups[roomData.active]
  roomData.active = Object.keys(roomData.setups)[0]
  saveSetups()
  selectedPeers.clear(); selectionRoom = null
  renderSetupTabs(); renderWorkspace()
})

// --- Edit mode ---
let editMode = false
let overviewMode = false
let selectedPeers = new Set()
let selectionRoom = null

function setEditControls(visible) {
  ;['btn-reset-setup','btn-copy-setup','btn-set-password'].forEach(id =>
    document.getElementById(id).classList.toggle('hidden', !visible)
  )
}

document.getElementById('btn-edit-layout').addEventListener('click', () => {
  editMode = !editMode
  selectedPeers.clear(); selectionRoom = null
  const setup = getSetup(roomData.active)
  document.getElementById('room-canvas').classList.toggle('edit-mode', editMode)
  document.getElementById('btn-edit-layout').textContent = editMode ? 'Done' : 'Edit Layout'
  document.getElementById('room-mode-label').textContent = editMode ? 'Edit — drag rooms & pods' : 'View Mode'
  document.getElementById('btn-set-password').textContent = setup.password ? 'Unlock' : 'Lock'
  setEditControls(editMode)
  renderWorkspace()
})

// --- Overview ---
function toggleOverview(on) {
  overviewMode = on
  document.getElementById('room-canvas').classList.toggle('hidden', on)
  document.getElementById('canvas-resize-handle').classList.toggle('hidden', on)
  document.getElementById('setup-bar').classList.toggle('hidden', on)
  document.getElementById('room-overview').classList.toggle('hidden', !on)
  document.getElementById('btn-overview').textContent = on ? 'Back' : 'Overview'
  document.getElementById('btn-edit-layout').classList.toggle('hidden', on)
  setEditControls(on ? false : editMode)
}

document.getElementById('btn-overview').addEventListener('click', () => {
  toggleOverview(!overviewMode)
  if (overviewMode) renderOverview()
})

function renderOverview() {
  const overview = document.getElementById('room-overview')
  const SCALE = 0.25, LOGICAL_H = 620
  overview.innerHTML = Object.entries(roomData.setups).map(([name, setup]) => {
    const positions = setup.positions || {}
    const hidden = setup.hidden || []
    const tokens = peers.filter(p => !hidden.includes(p.peer_id) && positions[p.peer_id]).map(p => {
      const pos = positions[p.peer_id]
      return `<div class="sim-token" style="left:${pos.x}px;top:${pos.y}px">
        <div class="sim-label" style="font-size:1.8rem">${escHtml(simLabel(p.name))}</div>
      </div>`
    }).join('')
    return `
      <div class="overview-card ${name===roomData.active?'active':''}" data-setup="${escHtml(name)}">
        <div class="overview-card-header">
          <span>${escHtml(name)}</span>${setup.password?'<span>&#128274;</span>':''}
        </div>
        <div class="overview-canvas-wrapper">
          <div class="overview-inner" style="height:${LOGICAL_H}px;transform:scale(${SCALE});transform-origin:top left">${tokens}</div>
        </div>
      </div>`
  }).join('')
  overview.querySelectorAll('.overview-card').forEach(card => {
    card.addEventListener('click', () => { toggleOverview(false); activateRoom(card.dataset.setup) })
  })
}

// --- Reset / Copy / Password ---
document.getElementById('btn-reset-setup').addEventListener('click', () => {
  if (!confirm('Reset layout? Restores all removed pods and resets positions.')) return
  const setup = getSetup(roomData.active)
  setup.positions = {}; setup.hidden = []
  selectedPeers.clear(); selectionRoom = null
  saveSetups(); renderWorkspace()
})

document.getElementById('btn-copy-setup').addEventListener('click', () => {
  const others = Object.keys(roomData.setups).filter(n => n !== roomData.active)
  const sel = document.getElementById('copy-target-select')
  sel.innerHTML = others.map(n => `<option value="${escHtml(n)}">${escHtml(n)}</option>`).join('')
    + '<option value="__new__">-- Create new room --</option>'
  document.getElementById('copy-new-name').value = ''
  document.getElementById('modal-copy').classList.remove('hidden')
})

document.getElementById('btn-confirm-copy').addEventListener('click', () => {
  const sel = document.getElementById('copy-target-select').value
  const newName = document.getElementById('copy-new-name').value.trim()
  const target = (sel === '__new__' || !sel) ? newName : sel
  if (!target) return alert('Please select or enter a target room name.')
  if (target === roomData.active) return alert('Cannot copy to the same room.')
  if (roomData.setups[target] && !confirm(`Overwrite "${target}"?`)) return
  const source = getSetup(roomData.active)
  roomData.setups[target] = JSON.parse(JSON.stringify(source))
  roomData.setups[target].password = null
  saveSetups(); renderSetupTabs()
  document.getElementById('modal-copy').classList.add('hidden')
})

document.getElementById('btn-set-password').addEventListener('click', () => {
  const setup = getSetup(roomData.active)
  if (setup.password) {
    const input = prompt('Enter current password to remove protection:')
    if (input === null) return
    if (input !== setup.password) { alert('Incorrect password.'); return }
    setup.password = null
    document.getElementById('btn-set-password').textContent = 'Lock'
  } else {
    const pwd = prompt('Set a password for this room:')
    if (!pwd || !pwd.trim()) return
    const c = prompt('Confirm password:')
    if (pwd !== c) { alert('Passwords do not match.'); return }
    setup.password = pwd
    document.getElementById('btn-set-password').textContent = 'Unlock'
  }
  saveSetups(); renderSetupTabs()
})

// --- Status polling ---
let peerStatus = {}  // { peer_id: 'online'|'offline'|'unknown' }

async function fetchStatus() {
  try {
    const res = await fetch('/api/status')
    peerStatus = await res.json()
    // Update dots in-place without full re-render
    document.querySelectorAll('.status-dot').forEach(dot => {
      const token = dot.closest('.sim-token')
      if (!token) return
      const st = peerStatus[token.dataset.peerId] || 'unknown'
      dot.className = `status-dot ${st}`
    })
  } catch(e) {}
}

// Poll every 15 seconds; first call after peers load
function startStatusPolling() {
  fetchStatus()
  setInterval(fetchStatus, 15000)
}

// --- Label & positions ---
function simLabel(name) {
  const n = name.toLowerCase(); let m
  m = n.match(/^pods-(\d+)/); if (m) return 'S' + m[1]
  m = n.match(/^podm-(\d+)/); if (m) return 'M' + m[1]
  m = n.match(/^broadcast-(\d+)/); if (m) return 'B' + m[1]
  m = name.match(/^([A-Za-z]{1,3})[^0-9]*?(\d+)?/)
  if (m) return m[1].toUpperCase() + (m[2] || '')
  return name.substring(0, 2).toUpperCase()
}

function ensureDefaultPositions(setup) {
  const cols = 5, stepX = POD_GRID, stepY = POD_GRID
  peers.forEach((p, i) => {
    if (!setup.hidden.includes(p.peer_id) && !setup.positions[p.peer_id]) {
      setup.positions[p.peer_id] = { x: (i % cols) * stepX, y: Math.floor(i / cols) * stepY }
    }
  })
}

function snapPod(x, y) {
  return { x: Math.round(x / SNAP_GRID) * SNAP_GRID, y: Math.round(y / SNAP_GRID) * SNAP_GRID }
}

function snapRoom(x, y) {
  return { x: Math.round(x / ROOM_SNAP) * ROOM_SNAP, y: Math.round(y / ROOM_SNAP) * ROOM_SNAP }
}

function snapRoomSize(w, h) {
  return {
    w: Math.max(ROOM_W_MIN, Math.round(w / ROOM_SNAP) * ROOM_SNAP),
    h: Math.max(ROOM_H_MIN, Math.round(h / ROOM_SNAP) * ROOM_SNAP)
  }
}

// --- Render workspace ---
function renderWorkspace() {
  if (overviewMode) { renderOverview(); return }
  const canvas = document.getElementById('room-canvas')
  applyCanvasDims()
  canvas.classList.toggle('edit-mode', editMode)

  // Auto-size workspace to contain all rooms
  let wsW = 800, wsH = 600
  Object.values(roomData.setups).forEach(s => {
    wsW = Math.max(wsW, (s.x||0) + (s.w||880) + 120)
    wsH = Math.max(wsH, (s.y||0) + (s.h||530) + 120)
  })

  const roomsHtml = Object.entries(roomData.setups).map(([name, setup]) => {
    ensureDefaultPositions(setup)
    const isActive = name === roomData.active
    const visiblePeers = peers.filter(p => !setup.hidden.includes(p.peer_id))

    const pods = visiblePeers.map(p => {
      const pos = setup.positions[p.peer_id]
      if (!pos) return ''
      const label = simLabel(p.name)
      const isSel = selectionRoom === name && selectedPeers.has(p.peer_id)
      const st = peerStatus[p.peer_id] || 'unknown'
      const altId = p.alt_id || ''
      const connectBtns = ''
      return `<div class="sim-token${isSel?' selected':''}" data-peer-id="${escHtml(p.peer_id)}" data-alt-id="${escHtml(altId)}" data-room="${escHtml(name)}"
                   style="left:${pos.x}px;top:${pos.y}px">
        <div class="status-dot ${st}"></div>
        <div class="sim-label">${escHtml(label)}</div>
        <div class="sim-name">${escHtml(p.name)}</div>
        ${editMode ? `<button class="sim-delete" data-peer-id="${escHtml(p.peer_id)}" data-room="${escHtml(name)}" title="Remove">&#x2715;</button>` : ''}
        ${connectBtns}
      </div>`
    }).join('')

    const resizeHandles = editMode ? `
      <div class="resize-handle rh-e" data-room="${escHtml(name)}" data-dir="e"></div>
      <div class="resize-handle rh-s" data-room="${escHtml(name)}" data-dir="s"></div>
      <div class="resize-handle rh-se" data-room="${escHtml(name)}" data-dir="se"></div>` : ''

    return `<div class="room-box${isActive?' active-room':''}" data-room="${escHtml(name)}"
                 style="left:${setup.x}px;top:${setup.y}px;width:${setup.w}px;height:${setup.h}px">
      <div class="room-header">
        <div class="room-grab-handle" data-room="${escHtml(name)}" title="Drag to move room"></div>
        <span class="room-title">${escHtml(name)}</span>
        ${setup.password ? '<span class="room-lock">&#128274;</span>' : ''}
      </div>
      <div class="room-body" data-room="${escHtml(name)}">
        ${pods}
        ${resizeHandles}
        <div class="sel-rect" id="selrect-${escHtml(name)}"></div>
      </div>
    </div>`
  }).join('')

  canvas.innerHTML = `<div class="workspace" style="min-width:${wsW}px;min-height:${wsH}px">${roomsHtml}</div>`
}

function hideSimFromRoom(peerId, roomName) {
  const setup = getSetup(roomName)
  if (!setup.hidden.includes(peerId)) setup.hidden.push(peerId)
  delete setup.positions[peerId]
  if (selectionRoom === roomName) selectedPeers.delete(peerId)
  saveSetups(); renderWorkspace()
}

function updateSelectionVisual() {
  document.querySelectorAll('.room-body .sim-token').forEach(el => {
    el.classList.toggle('selected', el.dataset.room === selectionRoom && selectedPeers.has(el.dataset.peerId))
  })
}

// ---- Interaction state ----
let movingRoom    = null  // { name, startMouse, startPos }
let resizingRoom  = null  // { name, dir, startMouse, startDims }
let draggingPod   = null  // { el, roomName }
let podDragOffset = { x:0, y:0 }
let podDragMoved  = false
let groupPodMove  = null  // { roomName, startMouse, startPos:{pid:{x,y}} }
let selRectState  = null  // { roomName, start, bodyEl }
let resizingCanvas = false, resizeCanvasStartY = 0, resizeCanvasStartH = 0

// ---- Canvas viewport resize handle (outside the canvas) ----
document.getElementById('canvas-resize-handle').addEventListener('mousedown', e => {
  e.preventDefault()
  resizingCanvas = true
  resizeCanvasStartY = e.clientY
  resizeCanvasStartH = canvasDims.h
})

// ---- Workspace event delegation ----
const roomCanvas = document.getElementById('room-canvas')

roomCanvas.addEventListener('mousedown', e => {
  // Grab handle — move room
  const grab = e.target.closest('.room-grab-handle')
  if (grab && editMode) {
    e.preventDefault()
    const name = grab.dataset.room
    const s = getSetup(name)
    movingRoom = { name, startMouse:{x:e.clientX,y:e.clientY}, startPos:{x:s.x,y:s.y} }
    roomData.active = name; renderSetupTabs(); updateActiveRoomHighlight()
    return
  }

  // Resize handle — resize room
  const rh = e.target.closest('.resize-handle')
  if (rh && editMode) {
    e.preventDefault()
    const name = rh.dataset.room, dir = rh.dataset.dir
    const s = getSetup(name)
    resizingRoom = { name, dir, startMouse:{x:e.clientX,y:e.clientY}, startDims:{x:s.x,y:s.y,w:s.w,h:s.h} }
    return
  }

  // Delete pod button
  const del = e.target.closest('.sim-delete')
  if (del) { e.preventDefault(); hideSimFromRoom(del.dataset.peerId, del.dataset.room); return }

  // Sim token
  const token = e.target.closest('.sim-token')
  if (token && editMode) {
    e.preventDefault()
    const peerId = token.dataset.peerId, roomName = token.dataset.room

    // Shift+click: toggle in selection
    if (e.shiftKey) {
      if (selectionRoom && selectionRoom !== roomName) { selectedPeers.clear(); selectionRoom = roomName }
      selectionRoom = roomName
      if (selectedPeers.has(peerId)) selectedPeers.delete(peerId); else selectedPeers.add(peerId)
      updateSelectionVisual(); return
    }

    // Already selected in same room with multiple selected: group move
    if (selectionRoom === roomName && selectedPeers.has(peerId) && selectedPeers.size > 1) {
      const positions = getSetup(roomName).positions
      groupPodMove = { roomName, startMouse:{x:e.clientX,y:e.clientY}, startPos:{} }
      selectedPeers.forEach(pid => { if (positions[pid]) groupPodMove.startPos[pid] = {...positions[pid]} })
      podDragMoved = false; return
    }

    // Single drag
    if (selectionRoom !== roomName) { selectedPeers.clear(); selectionRoom = roomName }
    else if (!e.shiftKey) selectedPeers.clear()
    selectedPeers.add(peerId); selectionRoom = roomName
    updateSelectionVisual()
    draggingPod = { el: token, roomName }
    token.classList.add('dragging')
    const r = token.getBoundingClientRect()
    podDragOffset.x = e.clientX - r.left
    podDragOffset.y = e.clientY - r.top
    podDragMoved = false
    return
  }

  // Click on room body (empty space): start selection rect or activate room
  const body = e.target.closest('.room-body')
  if (body && editMode) {
    e.preventDefault()
    const roomName = body.dataset.room
    // Activate room
    if (roomData.active !== roomName) {
      roomData.active = roomName; saveSetups(); renderSetupTabs(); updateActiveRoomHighlight()
      document.getElementById('btn-set-password').textContent = getSetup(roomName).password ? 'Unlock' : 'Lock'
    }
    if (!e.shiftKey) { selectedPeers.clear(); selectionRoom = roomName }
    selectionRoom = roomName
    const br = body.getBoundingClientRect()
    const start = { x: e.clientX - br.left, y: e.clientY - br.top }
    selRectState = { roomName, start, bodyEl: body }
    const srEl = body.querySelector('.sel-rect')
    if (srEl) Object.assign(srEl.style, { left:start.x+'px', top:start.y+'px', width:'0', height:'0', display:'block' })
    return
  }

  // Click on room header (not grab): just activate
  const box = e.target.closest('.room-box')
  if (box && editMode) {
    const roomName = box.dataset.room
    roomData.active = roomName; saveSetups(); renderSetupTabs(); updateActiveRoomHighlight()
    document.getElementById('btn-set-password').textContent = getSetup(roomName).password ? 'Unlock' : 'Lock'
  }
})

function smartConnect(peerId, altId) {
  // If alt_id (direct IP) is reachable, prefer it; otherwise fall back to peer_id (relay)
  if (altId && peerStatus[peerId] === 'online') connect(altId)
  else connect(peerId)
}
function handleConnectTap(e) {
  if (editMode || podDragMoved) { podDragMoved = false; return }
  const btn = e.target.closest('.connect-btn')
  if (btn && btn.dataset.connectId) { connect(btn.dataset.connectId); return }
  const token = e.target.closest('.sim-token')
  if (token && !e.target.closest('.connect-btns')) smartConnect(token.dataset.peerId, token.dataset.altId)
}
roomCanvas.addEventListener('click', handleConnectTap)

// ---- Global move/up ----
document.addEventListener('mousemove', e => {
  // Canvas viewport resize
  if (resizingCanvas) {
    canvasDims.h = Math.max(CANVAS_H_MIN, Math.min(CANVAS_H_MAX, resizeCanvasStartH + e.clientY - resizeCanvasStartY))
    document.getElementById('room-canvas').style.height = canvasDims.h + 'px'
    return
  }

  // Move room
  if (movingRoom) {
    const dx = e.clientX - movingRoom.startMouse.x
    const dy = e.clientY - movingRoom.startMouse.y
    const box = document.querySelector(`.room-box[data-room="${CSS.escape(movingRoom.name)}"]`)
    if (box) { box.style.left = (movingRoom.startPos.x + dx) + 'px'; box.style.top = (movingRoom.startPos.y + dy) + 'px' }
    return
  }

  // Resize room
  if (resizingRoom) {
    const dx = e.clientX - resizingRoom.startMouse.x
    const dy = e.clientY - resizingRoom.startMouse.y
    const { startDims: d } = resizingRoom
    const box = document.querySelector(`.room-box[data-room="${CSS.escape(resizingRoom.name)}"]`)
    if (!box) return
    if (resizingRoom.dir === 'e' || resizingRoom.dir === 'se') box.style.width = Math.max(ROOM_W_MIN, d.w + dx) + 'px'
    if (resizingRoom.dir === 's' || resizingRoom.dir === 'se') box.style.height = Math.max(ROOM_H_MIN, d.h + dy) + 'px'
    return
  }

  // Single pod drag
  if (draggingPod) {
    podDragMoved = true
    const bodyEl = draggingPod.el.closest('.room-body')
    if (!bodyEl) return
    const br = bodyEl.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - br.left - podDragOffset.x, br.width - TOKEN_W))
    const y = Math.max(0, Math.min(e.clientY - br.top  - podDragOffset.y, br.height - TOKEN_H))
    draggingPod.el.style.left = x + 'px'
    draggingPod.el.style.top  = y + 'px'
    return
  }

  // Group pod move
  if (groupPodMove) {
    podDragMoved = true
    const dx = e.clientX - groupPodMove.startMouse.x
    const dy = e.clientY - groupPodMove.startMouse.y
    const bodyEl = document.querySelector(`.room-body[data-room="${CSS.escape(groupPodMove.roomName)}"]`)
    if (!bodyEl) return
    const br = bodyEl.getBoundingClientRect()
    selectedPeers.forEach(pid => {
      const start = groupPodMove.startPos[pid]; if (!start) return
      const x = Math.max(0, Math.min(start.x + dx, br.width  - TOKEN_W))
      const y = Math.max(0, Math.min(start.y + dy, br.height - TOKEN_H))
      const el = bodyEl.querySelector(`.sim-token[data-peer-id="${CSS.escape(pid)}"]`)
      if (el) { el.style.left = x+'px'; el.style.top = y+'px' }
    })
    return
  }

  // Selection rect
  if (selRectState) {
    const br = selRectState.bodyEl.getBoundingClientRect()
    const cur = { x: Math.max(0,Math.min(e.clientX-br.left,br.width)), y: Math.max(0,Math.min(e.clientY-br.top,br.height)) }
    const rx = Math.min(selRectState.start.x,cur.x), ry = Math.min(selRectState.start.y,cur.y)
    const rw = Math.abs(cur.x-selRectState.start.x), rh = Math.abs(cur.y-selRectState.start.y)
    const srEl = selRectState.bodyEl.querySelector('.sel-rect')
    if (srEl) Object.assign(srEl.style, { left:rx+'px', top:ry+'px', width:rw+'px', height:rh+'px' })
  }
})

document.addEventListener('mouseup', e => {
  // Canvas resize save
  if (resizingCanvas) {
    localStorage.setItem(CANVAS_KEY, JSON.stringify(canvasDims))
    resizingCanvas = false; return
  }

  // Room move snap
  if (movingRoom) {
    const dx = e.clientX - movingRoom.startMouse.x
    const dy = e.clientY - movingRoom.startMouse.y
    const setup = getSetup(movingRoom.name)
    const snapped = snapRoom(movingRoom.startPos.x + dx, movingRoom.startPos.y + dy)
    snapped.x = Math.max(0, snapped.x); snapped.y = Math.max(0, snapped.y)
    setup.x = snapped.x; setup.y = snapped.y
    saveSetups(); movingRoom = null; renderWorkspace(); return
  }

  // Room resize snap
  if (resizingRoom) {
    const dx = e.clientX - resizingRoom.startMouse.x
    const dy = e.clientY - resizingRoom.startMouse.y
    const { startDims: d } = resizingRoom
    const setup = getSetup(resizingRoom.name)
    const snapped = snapRoomSize(
      (resizingRoom.dir === 'e' || resizingRoom.dir === 'se') ? d.w + dx : d.w,
      (resizingRoom.dir === 's' || resizingRoom.dir === 'se') ? d.h + dy : d.h
    )
    setup.w = snapped.w; setup.h = snapped.h
    saveSetups(); resizingRoom = null; renderWorkspace(); return
  }

  // Single pod drop + snap
  if (draggingPod) {
    const bodyEl = draggingPod.el.closest('.room-body')
    if (bodyEl) {
      const br = bodyEl.getBoundingClientRect()
      const rawX = Math.max(0, Math.min(e.clientX - br.left - podDragOffset.x, br.width  - TOKEN_W))
      const rawY = Math.max(0, Math.min(e.clientY - br.top  - podDragOffset.y, br.height - TOKEN_H))
      const snapped = snapPod(rawX, rawY)
      draggingPod.el.style.left = snapped.x + 'px'
      draggingPod.el.style.top  = snapped.y + 'px'
      getSetup(draggingPod.roomName).positions[draggingPod.el.dataset.peerId] = snapped
      saveSetups()
    }
    draggingPod.el.classList.remove('dragging')
    draggingPod = null; return
  }

  // Group pod drop + snap
  if (groupPodMove) {
    const dx = e.clientX - groupPodMove.startMouse.x
    const dy = e.clientY - groupPodMove.startMouse.y
    const bodyEl = document.querySelector(`.room-body[data-room="${CSS.escape(groupPodMove.roomName)}"]`)
    const setup = getSetup(groupPodMove.roomName)
    if (bodyEl) {
      const br = bodyEl.getBoundingClientRect()
      selectedPeers.forEach(pid => {
        const start = groupPodMove.startPos[pid]; if (!start) return
        const rawX = Math.max(0, Math.min(start.x + dx, br.width  - TOKEN_W))
        const rawY = Math.max(0, Math.min(start.y + dy, br.height - TOKEN_H))
        const snapped = snapPod(rawX, rawY)
        setup.positions[pid] = snapped
        const el = bodyEl.querySelector(`.sim-token[data-peer-id="${CSS.escape(pid)}"]`)
        if (el) { el.style.left = snapped.x+'px'; el.style.top = snapped.y+'px' }
      })
      saveSetups()
    }
    groupPodMove = null; return
  }

  // Selection rect finalize
  if (selRectState) {
    const br = selRectState.bodyEl.getBoundingClientRect()
    const cur = { x: Math.max(0,Math.min(e.clientX-br.left,br.width)), y: Math.max(0,Math.min(e.clientY-br.top,br.height)) }
    const rx = Math.min(selRectState.start.x,cur.x), ry = Math.min(selRectState.start.y,cur.y)
    const rw = Math.abs(cur.x-selRectState.start.x), rh = Math.abs(cur.y-selRectState.start.y)
    if (rw > 5 || rh > 5) {
      const roomName = selRectState.roomName
      selRectState.bodyEl.querySelectorAll('.sim-token').forEach(el => {
        const x = parseFloat(el.style.left), y = parseFloat(el.style.top)
        if (x < rx+rw && x+TOKEN_W > rx && y < ry+rh && y+TOKEN_H > ry) selectedPeers.add(el.dataset.peerId)
      })
      updateSelectionVisual()
    }
    const srEl = selRectState.bodyEl.querySelector('.sel-rect')
    if (srEl) srEl.style.display = 'none'
    selRectState = null
  }
})

// ---- Keyboard ----
document.addEventListener('keydown', e => {
  if (!editMode) return
  const tag = document.activeElement.tagName
  if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return

  if ((e.key==='Delete'||e.key==='Backspace') && selectedPeers.size > 0 && selectionRoom) {
    e.preventDefault()
    const setup = getSetup(selectionRoom)
    selectedPeers.forEach(pid => {
      if (!setup.hidden.includes(pid)) setup.hidden.push(pid)
      delete setup.positions[pid]
    })
    selectedPeers.clear(); selectionRoom = null
    saveSetups(); renderWorkspace()
    return
  }
  if (e.key==='Escape') { selectedPeers.clear(); updateSelectionVisual() }
  if (e.key==='a' && (e.ctrlKey||e.metaKey) && selectionRoom) {
    e.preventDefault()
    const setup = getSetup(selectionRoom)
    peers.filter(p => !setup.hidden.includes(p.peer_id)).forEach(p => selectedPeers.add(p.peer_id))
    updateSelectionVisual()
  }
})

// ---- Tab switching ----
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t===tab))
    document.getElementById('main-view').classList.toggle('hidden', target!=='peers')
    document.getElementById('room-view').classList.toggle('hidden', target!=='room')
    document.getElementById('peers-actions').classList.toggle('hidden', target!=='peers')
    document.getElementById('room-actions').classList.toggle('hidden', target!=='room')
    if (target==='room') { renderSetupTabs(); renderWorkspace() }
  })
})

// ---- Init ----
async function init() {
  await Promise.all([fetchPeers(), fetchGroups()])
  renderGroupSelects(); renderPeers()
  startStatusPolling()
  // Default to Room Layout tab
  document.getElementById('main-view').classList.add('hidden')
  document.getElementById('room-view').classList.remove('hidden')
  document.getElementById('peers-actions').classList.add('hidden')
  document.getElementById('room-actions').classList.remove('hidden')
  renderSetupTabs(); renderWorkspace()
}
init()
