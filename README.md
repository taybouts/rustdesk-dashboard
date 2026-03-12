# Taydesk

A native desktop app to organize, monitor, and launch RustDesk remote desktop connections. Runs as a system tray app with a compact always-on-top Mission Control overlay.

## What it does

- Manage all your RustDesk peers organized into custom groups
- **Mission Control**: Compact frameless overlay showing your room layout — always on top, one-click connect
- **Room layouts**: Drag-and-drop pods into named rooms, switch between setups
- Online/offline status indicators with ping-based monitoring
- One-click connect from desktop or mobile (via `rustdesk://` deep link)
- Runs silently in the system tray — no browser, no console window

## Screenshots

| Dashboard | Mission Control |
|---|---|
| Full peer management + room layout editor | Compact always-on-top room overlay |

## Stack

- **Desktop App**: Python (pywebview + pystray + Pillow)
- **Backend**: Node.js + Express
- **Database**: SQLite (via Node 24 built-in `node:sqlite`)
- **Frontend**: Vanilla HTML/CSS/JS

## Getting Started

### Requirements
- Node.js 24+
- Python 3.11+ with `pywebview`, `pystray`, `Pillow`
- RustDesk installed on machines you want to connect to

### Install

```bash
npm install
pip install pywebview pystray Pillow
python generate_icon.py
```

### Run

Double-click `taydesk.pyw` or use the desktop shortcut.

The app:
1. Starts the Node.js server silently on port 3777
2. Opens the Taydesk dashboard window
3. Adds a system tray icon with menu

### Tray Menu

| Option | Description |
|---|---|
| Show Dashboard | Open the full dashboard |
| Mission Control | Compact room overlay (always on top) |
| Dashboard on Top | Toggle always-on-top for dashboard |
| Control on Top | Toggle always-on-top for Mission Control |
| Quit | Shut down server and exit |

### Import existing RustDesk peers

```bash
node import-peers.js
```

Reads peers from `%APPDATA%\RustDesk\config\peers\` and imports them with auto-grouping.

## How connecting works

Clicking a pod in Mission Control or a peer in the dashboard opens `rustdesk://<peer_id>` which:
- On **Windows/Mac/Linux** → launches RustDesk and connects
- On **iOS/Android** → opens RustDesk mobile app and connects

## Recommended host setup

1. On each host: **RustDesk → Menu → Install Service** (runs as Windows service, auto-starts)
2. On each host: **Settings → Security → Set permanent password**
3. Optional: Set `allow-hide-cm = "Y"` in `%APPDATA%\RustDesk\config\RustDesk2.toml` for silent connections

## Project Structure

```
taydesk.pyw           — Desktop app (tray + pywebview windows)
generate_icon.py      — Generates taydesk.ico (retro TV icon)
create_shortcut.vbs   — Creates desktop shortcut
server/index.js       — Express server (port 3777)
server/db.js          — SQLite setup (groups, peers, room_layouts)
server/routes/peers.js — REST API for peers, groups, and layouts
server/routes/status.js — Ping-based online/offline status
public/index.html     — Dashboard UI
public/style.css      — Dashboard styles
public/app.js         — Dashboard logic + room workspace
public/compact.html   — Mission Control (compact room view)
import-peers.js       — One-time import from RustDesk peer files
```
