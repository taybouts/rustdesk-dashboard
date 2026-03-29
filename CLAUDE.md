# T-Desk — Remote Desktop Peer Manager

Native Windows app for organizing and launching RustDesk remote desktop connections. Manages 16+ machines across Tailscale/LAN/relay networks.

## Quick Start
- Launch: `T-Desk.bat` (runs pythonw t-desk.pyw)
- Dashboard: pywebview window (1100x750)
- Mission Control: compact overlay (420x320, always-on-top, frameless)
- API: http://localhost:5043

## Tech Stack
- Desktop: Python 3.11 (pywebview, pystray, Pillow)
- Backend: Node.js 24+ (Express, node:sqlite)
- Frontend: Vanilla HTML/CSS/JS
- Database: SQLite (data.sqlite)
- Port: 5043

## Architecture
```
T-Desk.bat → pythonw t-desk.pyw
  ├─ System tray icon (pystray)
  ├─ Node.js server (npm start, port 5043)
  ├─ Main dashboard window (pywebview)
  └─ Mission Control window (pywebview, frameless)
```

## Key Features
- Peer management with groups, search, filtering
- Room layout editor (drag-and-drop, multiple setups, password-protected)
- Mission Control: compact always-on-top overlay for quick connects
- Online/offline via Tailscale status + ping fallback (12s cache TTL)
- RustDesk deep links: `rustdesk://connect/<peer_id>`

## Rules
1. **node:sqlite** (not better-sqlite3) — VS Build Tools missing Windows SDK, node:sqlite works fine
2. **ExperimentalWarning on startup** is harmless — ignore it
3. Design system migration pending — awaiting T-Design language file

## Current State (v0.3.0)
- Renamed Taydesk → T-Desk
- Awaiting design language migration to T-Design system
