# Changelog

All notable changes to RustDesk Dashboard will be documented here.

---

## [0.1.0] - 2026-03-05

### Initial Release

#### Features
- **Peer Management**
  - Add, edit, delete peers with name, peer ID, group, and notes
  - Peers persist in local SQLite database
  - One-click connect via `rustdesk://` deep link (desktop + iOS)

- **Group Management**
  - Create custom groups (e.g. VPN, Local Network, Work, Home)
  - Peers organized and displayed by group
  - Filter peer list by group

- **Search & Filter**
  - Real-time search by peer name or peer ID
  - Filter by group via dropdown

- **Import from RustDesk**
  - One-shot import script reads `%APPDATA%\RustDesk\config\peers\*.toml`
  - Auto-detects and assigns groups based on peer ID pattern:
    - `100.64.x.x` → VPN (Tailscale)
    - `192.168.x.x` → Local Network
    - Numeric ID → RustDesk ID
  - Extracts hostname and platform from each peer file

- **Responsive UI**
  - Dark theme, mobile-friendly layout
  - Works on iPhone/iPad as a viewer dashboard
  - Works on desktop as a full launcher

#### Stack
- Node.js + Express
- `node:sqlite` (Node 24 built-in, no native compilation needed)
- Vanilla HTML / CSS / JS frontend

#### Known Limitations
- RustDesk iOS app can control machines but cannot be controlled
- No authentication/login yet (local use only)
- No online/offline status indicator yet
- No password storage per peer yet
