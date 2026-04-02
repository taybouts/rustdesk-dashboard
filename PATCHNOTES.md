## v0.4.0 — RustDesk Native Integration & Bootstrap Auto-Registration
_Released: 2026-04-02_

### New Features
- **Self-hosted RustDesk server**: hbbs + hbbr running on ONEO7 via Docker. All agents connect through `192.168.1.102:21116/21117` with dedicated public key.
- **rustdesk_id field**: New DB column and UI field for the numeric RustDesk peer ID (e.g. `177929952`). Connect button prefers `rustdesk_id` over `peer_id` automatically.
- **Bootstrap auto-registration**: Remote machines running `setup-ssh.ps1` (T-Admin) auto-install RustDesk, configure the self-hosted server, grab their ID, and POST it to `desk.taybouts.com/api/peers/register-rustdesk` — no manual entry needed.
- **`POST /api/peers/register-rustdesk`**: New endpoint. Matches incoming registration by `peer_id` or `name`; updates existing peer or creates new one.
- **`GET /api/config`**: Exposes `rustdeskWebUrl` and `rustdeskServer` to frontend — config-driven, no hardcoded URLs.
- **`/rustdesk` proxy**: `http-proxy-middleware` proxies the RustDesk Flutter web client with `<base href>` rewriting for correct asset paths (parked — use when WSS becomes available).

### Improvements
- **No more flashing console windows**: All `exec()` calls use `windowsHide: true`. ICMP ping replaced with TCP socket connect to port 3389 (RDP) — no process spawned at all.
- **Smart status polling**: Polling only runs when browser tab is visible. Switches to 30s interval (was 15s). Stops on tab hide, resumes with immediate fetch on tab show.
- **Unified Connect button**: "Direct" / "Relay" split replaced with single "Connect" button. Always uses `rustdesk_id` if set, falls back to `peer_id`. Room layout `smartConnect()` updated to same logic.
- **`http-proxy-middleware` added**: Replaces manual `http-proxy` setup for the `/rustdesk` route.
- **Removed `guacamole-common-js`**: Full VNC/Guacamole code purged. `server/routes/guacamole.js` deleted, `/guac-tunnel` WebSocket proxy removed.

### Architecture
- `server/db.js` — Safe migration: `ALTER TABLE peers ADD COLUMN rustdesk_id TEXT DEFAULT ""`
- `server/routes/peers.js` — Added `register-rustdesk` POST endpoint; `rustdesk_id` included in all peer INSERT/UPDATE operations
- `server/routes/status.js` — `windowsHide: true` on exec; TCP socket ping via `net.Socket` on port 3389 instead of spawning `ping.exe`
- `server/index.js` — Added `/api/config`, `/rustdesk` proxy middleware; removed Guacamole WebSocket tunnel; uses plain `app.listen` (no `http.createServer`)
- `public/app.js` — `connectPeer(id)` function; status polling visibility-aware; `smartConnect()` uses `rustdesk_id`; `rustdesk_id` field wired into modal
- `public/index.html` — RustDesk ID input field added to peer edit/add modal
- `public/remote.html` — New stub viewer page (parked pending WSS fix for web client)
- `server/.env` — `RUSTDESK_WEB_URL`, `RUSTDESK_SERVER`, `RUSTDESK_KEY` (not committed)
- Dependencies: added `http-proxy-middleware`, `dotenv`; removed `guacamole-common-js`, old `http-proxy`

### Known Pending
- Bootstrap silent install: kill RustDesk UI process after install, remove tray/shortcut — T-Admin working on this
- RustDesk web client (WSS): Caddy WSS proxy on ports 21118/21119 not yet working — mixed content blocks ws:// from https:// pages

---

## v0.3.0 — T-Desk Rename & T-Design Migration
_Released: 2026-03-29_

### New Features
- **T-Design system applied**: Sky blue accent (`#0ea5e9` → `#38bdf8`), glass-morphism cards, Rajdhani + Share Tech Mono typography
- **Peer card upgrade**: Redesigned peer cards with proper hierarchy and action buttons

### Improvements
- **Renamed**: Taydesk → T-Desk throughout (titles, tray labels, comments, CLAUDE.md)
- **Port moved**: 3777 → 5043 to fit the T-Admin ecosystem (5040–5049 range)

### Architecture
- `public/style.css` — Full T-Design token application
- `public/index.html` — Updated branding and card markup
- `server/index.js` — Port updated to 5043 via env var

---

## v0.2.1 — Tailscale Status & Tray-Only Launch
_Released: 2026-03-14_

### Improvements
- **Tailscale-aware status**: Peer online/offline now checks `tailscale status` first — idle peers show green instead of false-red from blocked ICMP pings. Falls back to ping for non-Tailscale peers.
- **Tray-only launch**: Dashboard starts hidden in the system tray — open it from the tray menu when needed instead of it popping up on every launch.
- **Renamed launcher**: `start.bat` → `T-Desk.bat` — cleaner branding, launches `pythonw t-desk.pyw` silently.
- **Crash fix**: Removed invalid `allow_external_links` pywebview parameter that prevented the app from starting.

### Architecture
- `server/routes/status.js` — Rewired to parse `tailscale status` CLI output, matching peers by Tailscale IP (100.64.x.x). Ping fallback retained for LAN/hostname peers.
- `T-Desk.bat` replaces `start.bat` as the launcher (no longer starts RustDesk separately).

---

## v0.2.0 — T-Desk Desktop App & Mission Control
_Released: 2026-03-12_

### New Features
- **T-Desk Desktop App**: Full native desktop wrapper using pywebview + pystray — no browser needed
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
- Renamed project from "RustDesk Dashboard" to **T-Desk**
- Updated all window titles, tray labels, and file names to T-Desk branding
- `start.bat` now launches RustDesk minimized to tray alongside the dashboard
- Set Windows AppUserModelID for proper taskbar icon grouping
- Improved window icon loading with LoadImage Win32 API (48px + 16px sizes)

### Architecture
- `t-desk.pyw` — Python desktop app (pywebview + pystray + subprocess server management)
- `public/compact.html` — Self-contained Mission Control UI (HTML/CSS/JS)
- `server/db.js` — Added `room_layouts` table (single-row JSON blob)
- `server/routes/peers.js` — Added `/api/layouts` GET/PUT routes
- `generate_icon.py` — Generates `t-desk.ico` with retro TV + SMPTE color bars
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
