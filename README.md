# T-Desk

A native desktop app to organize, monitor, and launch RustDesk remote desktop connections. Runs as a system tray app with a compact always-on-top Mission Control overlay.

## What it does

- Manage all your RustDesk peers organized into custom groups
- **Mission Control**: Compact frameless overlay showing your room layout — always on top, one-click connect
- **Room layouts**: Drag-and-drop pods into named rooms, switch between setups
- Online/offline status via Tailscale CLI (with TCP ping fallback) — no console windows
- One-click connect via `rustdesk://` deep link → native RustDesk app opens
- **Bootstrap auto-registration**: Remote machines self-register their RustDesk ID via `POST /api/peers/register-rustdesk`
- Self-hosted RustDesk server on ONEO7 (hbbs + hbbr via Docker)
- Runs silently in the system tray

## Screenshots

| Dashboard | Mission Control |
|---|---|
| Full peer management + room layout editor | Compact always-on-top room overlay |

## Stack

- **Desktop App**: Python (pywebview + pystray + Pillow)
- **Backend**: Node.js + Express
- **Database**: SQLite (via Node 24 built-in `node:sqlite`)
- **Frontend**: Vanilla HTML/CSS/JS
- **Remote Desktop**: RustDesk (self-hosted server on ONEO7)

## Getting Started

### Requirements
- Node.js 24+
- Python 3.11+ with `pywebview`, `pystray`, `Pillow`
- RustDesk installed on machines you want to connect from

### Install

```bash
npm install
pip install pywebview pystray Pillow
python generate_icon.py
```

### Environment

Create `server/.env`:
```
RUSTDESK_WEB_URL=https://rustdesk.yourdomain.com
RUSTDESK_SERVER=your-server-ip
RUSTDESK_KEY=your-public-key
```

### Run

Double-click `T-Desk.bat` or use the desktop shortcut (`T-Desk.lnk`).

The app:
1. Starts the Node.js server silently on port 5043
2. Minimizes to the system tray (no window pops up)
3. Open the dashboard or Mission Control from the tray menu

### Tray Menu

| Option | Description |
|---|---|
| Show Dashboard | Open the full dashboard |
| Mission Control | Compact room overlay (always on top) |
| Dashboard on Top | Toggle always-on-top for dashboard |
| Control on Top | Toggle always-on-top for Mission Control |
| Quit | Shut down server and exit |

## How connecting works

Clicking a peer or pod opens `rustdesk://<rustdesk_id>`:
- On **Windows/Mac/Linux** → launches RustDesk and connects
- On **iOS/Android** → opens RustDesk mobile app and connects

The `rustdesk_id` field stores the numeric RustDesk peer ID (e.g. `177929952`). If not set, falls back to `peer_id`.

## Bootstrap Auto-Registration

Remote machines can self-register via the T-Admin bootstrap script (`setup-ssh.ps1`):
1. Installs RustDesk silently
2. Configures the self-hosted server
3. Grabs the machine's numeric RustDesk ID
4. POSTs to `desk.taybouts.com/api/peers/register-rustdesk`

No manual peer entry needed for bootstrapped machines.

## Self-Hosted RustDesk Server

Running on ONEO7 via Docker:
- hbbs (coordination): port 21116
- hbbr (relay): port 21117

Configure RustDesk agents with your server IP and public key.

## Project Structure

```
t-desk.pyw               — Desktop app (tray + pywebview windows)
generate_icon.py         — Generates t-desk.ico
create_shortcut.vbs      — Creates desktop shortcut
server/index.js          — Express server (port 5043), /api/config, /rustdesk proxy
server/db.js             — SQLite schema + safe migrations
server/routes/peers.js   — REST API: peers, groups, layouts, register-rustdesk
server/routes/status.js  — Tailscale CLI + TCP socket status checks
public/index.html        — Dashboard UI
public/style.css         — T-Design system styles
public/app.js            — Dashboard logic + room workspace
public/compact.html      — Mission Control (compact room view)
public/remote.html       — RustDesk web client viewer (parked)
import-peers.js          — One-time import from RustDesk peer files
```
