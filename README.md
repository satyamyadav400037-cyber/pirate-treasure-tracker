# 🏴‍☠️ Pirate Treasure Tracker

An immersive, high-fidelity maritime cartography command center and interactive pirate dashboard built with **React, Vite, TypeScript, Leaflet JS, Web Audio API, and TRPC**.

---

## 🌟 Key Features

- **🗺️ Dynamic Interactive Map**: Chart treasure caches across the Caribbean and Indian Oceans with Leaflet JS.
- **🌐 Inter-Treasure Sea Lanes Mesh Network**: Dynamic polyline mesh connecting nodes with 4 passage safety statuses (`Safe`, `Enemy Danger`, `Storm Surge`, `Leviathan/Reef`).
- **⛵ Flagship Anchorage & Sail System**: Move the Flagship ("The Black Pearl") to any harbor and recalculate routes dynamically.
- **⚠️ Tactical Siege Alerts**: Global alert system and per-treasure `⚠️ 100% BLOCKED` popup warnings.
- **🏴‍☠️ 14 Pirate Command Deck Modules**:
  1. **Captains & Crew Roster**: Manage captain morale and Pirate Code loot shares (20% Captain, 80% Crew).
  2. **Cursed Artifacts Cipher**: Solve riddle ciphers to unlock secret coordinates.
  3. **Wind Vector Simulator**: Live map HUD wind direction & velocity overlays.
  4. **Loot Commodity Exchange**: Convert doubloons to Rum, Cannons, Dollars, and Silk.
  5. **Pirate Sound Deck Engine**: Web Audio API synthesizer for ocean waves, cannons, and coins SFX.
  6. **Fog of War Explorer Mode**: Shroud unvisited ocean sectors in parchment fog.
  7. **Wanted Bounty Board**: Track naval targets with 1-click map pins.
  8. **Tactical Radar Scanner**: Rotating circular proximity scanner overlay.
  9. **Pirate Code Rulebook**: Interactive guide to Morgan & Bartholomew Articles.
  10. **Tavern Rum Economy**: Live rum prices across Tortuga and Port Royal.
  11. **Pirate Achievements & Trophies**: Unlockable milestone trophies.
  12. **Financial Fleet Projections**: Plunder growth & ship repair forecast graphs.
  13. **Custom Jolly Roger Builder**: Canvas emblem designer to hoist custom fleet flags.
  14. **Captain's Logbook**: Coordinate-tagged voyage journal editor.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Vanilla CSS
- **Cartography**: Leaflet JS, Custom HTML Markers, Polylines, Dynamic Geo Distance
- **Audio Synthesizer**: Web Audio API
- **API & Backend**: TRPC, Drizzle ORM, Node.js
