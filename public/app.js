const API = '/api'

let peers = []
let groups = []

// --- API calls ---

async function fetchPeers() {
  const res = await fetch(`${API}/peers`)
  peers = await res.json()
}

async function fetchGroups() {
  const res = await fetch(`${API}/groups`)
  groups = await res.json()
}

async function addPeer(data) {
  await fetch(`${API}/peers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

async function updatePeer(id, data) {
  await fetch(`${API}/peers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

async function deletePeer(id) {
  await fetch(`${API}/peers/${id}`, { method: 'DELETE' })
}

async function addGroup(name) {
  await fetch(`${API}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
}

// --- Render ---

function renderGroupSelects() {
  const selects = [document.getElementById('filter-group'), document.getElementById('peer-group')]
  selects.forEach((sel, i) => {
    const placeholder = i === 0 ? '<option value="">All groups</option>' : '<option value="">No group</option>'
    sel.innerHTML = placeholder + groups.map(g =>
      `<option value="${g.id}">${g.name}</option>`
    ).join('')
  })
}

function renderPeers() {
  const search = document.getElementById('search').value.toLowerCase()
  const filterGroup = document.getElementById('filter-group').value

  let filtered = peers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search) || p.peer_id.includes(search)
    const matchGroup = !filterGroup || String(p.group_id) === filterGroup
    return matchSearch && matchGroup
  })

  const list = document.getElementById('peer-list')

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>No peers yet</strong>
        <p>Click "+ Add Peer" to add your first RustDesk connection.</p>
      </div>`
    return
  }

  // Group by group_name
  const grouped = {}
  filtered.forEach(p => {
    const key = p.group_name || 'Ungrouped'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(p)
  })

  list.innerHTML = Object.entries(grouped).map(([groupName, items]) => `
    <div class="group-label">${groupName}</div>
    ${items.map(p => `
      <div class="peer-card">
        <div class="peer-card-name">${escHtml(p.name)}</div>
        <div class="peer-card-id">ID: ${escHtml(p.peer_id)}</div>
        ${p.notes ? `<div class="peer-card-notes">${escHtml(p.notes)}</div>` : ''}
        <div class="peer-card-actions">
          <button class="btn-connect" onclick="connect('${escHtml(p.peer_id)}')">Connect</button>
          <button class="btn-icon" onclick="openEdit(${p.id})">✏️</button>
          <button class="btn-icon delete" onclick="confirmDelete(${p.id}, '${escHtml(p.name)}')">🗑</button>
        </div>
      </div>
    `).join('')}
  `).join('')
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// --- Actions ---

function connect(peerId) {
  window.location.href = `rustdesk://connect/${peerId}`
}

async function confirmDelete(id, name) {
  if (!confirm(`Delete "${name}"?`)) return
  await deletePeer(id)
  await fetchPeers()
  renderPeers()
}

// --- Peer Modal ---

function openAdd() {
  document.getElementById('modal-peer-title').textContent = 'Add Peer'
  document.getElementById('peer-edit-id').value = ''
  document.getElementById('peer-name').value = ''
  document.getElementById('peer-id').value = ''
  document.getElementById('peer-group').value = ''
  document.getElementById('peer-notes').value = ''
  document.getElementById('modal-peer').classList.remove('hidden')
  document.getElementById('peer-name').focus()
}

function openEdit(id) {
  const peer = peers.find(p => p.id === id)
  if (!peer) return
  document.getElementById('modal-peer-title').textContent = 'Edit Peer'
  document.getElementById('peer-edit-id').value = peer.id
  document.getElementById('peer-name').value = peer.name
  document.getElementById('peer-id').value = peer.peer_id
  document.getElementById('peer-group').value = peer.group_id || ''
  document.getElementById('peer-notes').value = peer.notes || ''
  document.getElementById('modal-peer').classList.remove('hidden')
}

document.getElementById('btn-save-peer').addEventListener('click', async () => {
  const editId = document.getElementById('peer-edit-id').value
  const data = {
    name: document.getElementById('peer-name').value.trim(),
    peer_id: document.getElementById('peer-id').value.trim(),
    group_id: document.getElementById('peer-group').value || null,
    notes: document.getElementById('peer-notes').value.trim()
  }
  if (!data.name || !data.peer_id) return alert('Name and Peer ID are required.')

  if (editId) {
    await updatePeer(editId, data)
  } else {
    await addPeer(data)
  }

  document.getElementById('modal-peer').classList.add('hidden')
  await fetchPeers()
  renderPeers()
})

// --- Group Modal ---

document.getElementById('btn-save-group').addEventListener('click', async () => {
  const name = document.getElementById('group-name').value.trim()
  if (!name) return alert('Group name is required.')
  await addGroup(name)
  document.getElementById('modal-group').classList.add('hidden')
  document.getElementById('group-name').value = ''
  await fetchGroups()
  renderGroupSelects()
  renderPeers()
})

// --- Wire up buttons ---

document.getElementById('btn-add-peer').addEventListener('click', openAdd)
document.getElementById('btn-add-group').addEventListener('click', () => {
  document.getElementById('modal-group').classList.remove('hidden')
  document.getElementById('group-name').focus()
})

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
  })
})

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden')
  })
})

document.getElementById('search').addEventListener('input', renderPeers)
document.getElementById('filter-group').addEventListener('change', renderPeers)

// --- Init ---

async function init() {
  await Promise.all([fetchPeers(), fetchGroups()])
  renderGroupSelects()
  renderPeers()
}

init()
