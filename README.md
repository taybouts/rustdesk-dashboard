# RustDesk Dashboard

A clean, self-hosted web dashboard to organize and launch your RustDesk remote desktop connections from any device.

## What it does

- Manage all your RustDesk peers in one place — organized into custom groups
- One-click connect from desktop (launches RustDesk via `rustdesk://` deep link)
- View and search your peer list from iPhone/iPad in the browser
- Import your existing peers automatically from the RustDesk app

## Features

| Feature | Description |
|---|---|
| Peer list | Add, edit, delete peers with name, ID, group, notes |
| Groups | Organize peers into custom groups |
| Search & filter | Real-time search by name or peer ID |
| One-click connect | Launches RustDesk native app directly |
| Import | Auto-import from local RustDesk peer files |
| Responsive | Works on desktop, iPhone, iPad |

## Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (via Node 24 built-in `node:sqlite`)
- **Frontend**: Vanilla HTML/CSS/JS

## Getting Started

### Requirements
- Node.js 24+
- RustDesk installed on machines you want to connect to

### Install & Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Import existing RustDesk peers

```bash
node import-peers.js
```

Reads peers from `%APPDATA%\RustDesk\config\peers\` and imports them with auto-grouping.

## How connecting works

Clicking **Connect** on a peer opens `rustdesk://<peer_id>` which:
- On **Windows/Mac/Linux** → launches RustDesk desktop app and connects
- On **iOS/Android** → opens RustDesk mobile app and connects

## Recommended host setup (for passwordless connect)

1. On each host machine: **RustDesk → Menu → Install Service** (runs elevated, auto-starts)
2. On each host machine: **Settings → Security → Set permanent password**
3. RustDesk client remembers the password after first connect → one-tap from then on

## Roadmap

- [ ] Password storage per peer (masked, tap to reveal)
- [ ] Online/offline status indicator
- [ ] Login / authentication
- [ ] Deploy online guide
- [ ] Bulk import from CSV
