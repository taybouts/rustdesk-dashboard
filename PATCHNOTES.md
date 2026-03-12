## v0.2.0 — Taydesk Desktop App & Mission Control
_Released: 2026-03-12_

### New Features
- **Taydesk Desktop App**: Full native desktop wrapper using pywebview + pystray — no browser needed
  - System tray icon with retro TV icon (generated via Pillow)
  - Frameless Mission Control window for compact room monitoring
  - Custom window controls (minimize, maximize, close) in the title bar
  - Always-on-top toggle per window from tray menu
  - Server launches silently as hidden subprocess (no console window)
- **Mission Control**: Compact, frameless overlay window showing a single room
  - Exact same design as dashboard room layout (grid, pods, status dots)
  - Overview mode to switch between rooms
  - Scales content proportionally on resize
  - Always-on-top by default — works as a persistent mission control panel
  - Custom drag-to-resize edges for frameless window
- **Database-backed room layouts**: Room setups now stored in SQLite instead of localStorage
  - Layouts persist across browsers and pywebview
  - Auto-migration from localStorage on first load
  - Debounced saves to avoid API hammering during drags
- **Layouts REST API**: `GET /api/layouts` and `PUT /api/layouts` for room data

### Improvements
- Renamed project from "RustDesk Dashboard" to **Taydesk**
- Updated all window titles, tray labels, and file names to Taydesk branding
- `start.bat` now launches RustDesk minimized to tray alongside the dashboard
- Set Windows AppUserModelID for proper taskbar icon grouping
- Improved window icon loading with LoadImage Win32 API (48px + 16px sizes)

### Architecture
- `taydesk.pyw` — Python desktop app (pywebview + pystray + subprocess server management)
- `public/compact.html` — Self-contained Mission Control UI (HTML/CSS/JS)
- `server/db.js` — Added `room_layouts` table (single-row JSON blob)
- `server/routes/peers.js` — Added `/api/layouts` GET/PUT routes
- `generate_icon.py` — Generates `taydesk.ico` with retro TV + SMPTE color bars
- `create_shortcut.vbs` — Creates Windows desktop shortcut
- Dependencies: `pywebview`, `pystray`, `Pillow` (Python); existing Node.js stack unchanged

---

## v0.1.2 — Status Indicators, Alt ID, Room Layout
_Released: 2026-03-07_

### New Features
- Ping-based online/offline status per peer (12s cache)
- `alt_id` column for Tailscale/LAN IP fallback
- Room Layout tab with canvas drag/drop, multi-room setup tabs, overview mode
- `start.bat` double-click launcher

---

## v0.1.1 — Port Fix
_Released: 2026-03-04_

### Improvements
- Changed default port from 3000 to 3777

---

## v0.1.0 — Initial Release
_Released: 2026-03-04_

### New Features
- Express server with SQLite (node:sqlite)
- Peer CRUD with groups
- Search & filter
- One-click RustDesk connect via deep links
- Auto-import from RustDesk peer files
- Responsive dark theme UI
