# ParrotOrganizer v2.0 — Claude Code Context

## What this project is

**Parrot Organizer** is a local web app that runs inside a TeknoParrot arcade emulator installation. A Node.js server scans TeknoParrot's GameProfile XMLs and serves a React UI for browsing, filtering, installing, and launching 500+ arcade games.

The live app is in `ParrotOrganizer_v2.0/`. Other folders (`v1.5.2`, `v1.6`, `NewDatabase`, `v2.0_DESIGN`) are historical reference — do not modify them.

---

## File Layout

```
TeknoParrot/                          ← working directory (server's "root")
  TeknoParrotUi.exe
  GameProfiles/                       ← scanned at startup to build DB1
  UserProfiles/                       ← installed games live here
  Metadata/                           ← supplemental JSON per game
  Icons/                              ← game icon PNGs

  ParrotOrganizer_v2.0/
    index.html                        ← entry point
    server.js                         ← Node.js backend (~1100 lines)
    start.bat                         ← launcher
    styles.css                        ← all CSS
    README.md                         ← GitHub landing page

    src/                              ← React JSX (no build step — Babel standalone)
      tweaks-panel.jsx                ← loaded FIRST; must use React.useState not short form
      data.jsx                        ← loadGames(), field mapping, color helpers
      components.jsx                  ← Icon, GameCard, ListRow, DetailPanel, etc.
      useGamepad.jsx                  ← rAF gamepad hook
      metadata-editor.jsx             ← Edit Info modal
      settings-editor.jsx             ← game XML settings editor
      controls-editor.jsx             ← control remapper
      debug-log.jsx                   ← server log viewer
      app-settings.jsx                ← gear icon modal
      app.jsx                         ← LAST; main App, Topbar, Sidebar, filters

    data/
      teknoparrotDB.json              ← Tier 1: auto-scanned (rebuilt on startup)
      parrotOrganizerDB.json          ← Tier 2: developer-curated metadata
      userDB.json                     ← Tier 3: user favorites, notes, hidden, edits
      teknoparrot_database.json       ← merged output (auto-generated, read by UI)

    logo/                             ← branding (icon.ico, PNG sizes)
    Media/                            ← downloaded box art — Media/{profile}/box.png etc
    storage/                          ← runtime only (debug.log)

    dev/                              ← NOT SHIPPED — developer tools only
      index.html + scraper.js         ← screenscraper.fr metadata import tool
      scraper-config.json             ← API credentials (never commit)
      teknoparrot_screenscaper_metadata.json
      migrationPhase.md
      test-checklist.md
```

---

## Database Architecture

Three-tier merge. **Higher tier wins** per field:

| File | Tier | Source | Contents |
|---|---|---|---|
| `teknoparrotDB.json` | 1 | Auto-scan on startup | Emulator, GPU compat, controls, subscription from XMLs |
| `parrotOrganizerDB.json` | 2 | Developer curated | Descriptions, tags, developer, publisher, players, genre, ESRB, ScreenScraperID, box art |
| `userDB.json` | 3 | User actions | Favorites, hidden, notes, custom name/description overrides |

`mergeAndWrite()` in server.js rebuilds `teknoparrot_database.json` any time a tier changes.  
`ALL_COLUMNS` in server.js is the schema — 32 fields.  
The merge is: `DB3[field] || DB2[field] || DB1[field]`.

---

## Key Technical Conventions

### JSX load order matters
`components.jsx` runs third and sets `useState`, `useEffect`, etc. as `window` globals. All files loading after it use short form (`useState`, not `React.useState`). `tweaks-panel.jsx` loads FIRST — it must use `React.useState`, `React.useEffect`, etc.

### Multi-genre
`Genre` in DB2 = comma-separated string (e.g. `"Racing, Driving"`).  
`data.jsx` splits this into `Genres[]` (each normalized via `normalizeGenre`).  
`GenreNorm` = `Genres[0]` — used for card pill and OKLch color.  
Sidebar filter counts each genre independently.

### Media paths
`mediaUrlFor(profile, 'box.png')` → `/ParrotOrganizer_v2.0/Media/{profile}/box.png`  
`PrimaryProfile` field redirects media to another profile's folder (alias system for variant ROMs).  
`img onError` handles missing files gracefully — no server-side existence check needed.

### Sidebar collapse
`.sidebar-tab` is `position: fixed`, using CSS custom property `--sb-w` (set to `280px` or `0px` on `.app.sidebar-collapsed`) so the tab tracks the sidebar edge during the CSS `width` transition.

### Export/import
- **Export:** reads `data/userDB.json` directly via static file server
- **Import:** `POST /__importUserDB` → writes to `dataDir/userDB.json` → rebuilds
- Never use `/__storage/write` for userDB — that writes to `storage/` (wrong folder)

### Scraper tool
The `/dev/` tool at `http://localhost:8000/ParrotOrganizer_v2.0/dev/` talks to `/__scraper/*` endpoints on the same server. System ID **269** = TeknoParrot on screenscraper.fr. Primary lookup uses `jeuInfos.php?romnom={profile}.xml` (not title search). Credentials go in `dev/scraper-config.json`.

---

## Server Endpoints

| Endpoint | Method | What it does |
|---|---|---|
| `/__rebuildDB` | POST | Rescan DB1, merge all tiers, rebuild output |
| `/__saveUserData` | POST | Write fields to userDB.json, rebuild |
| `/__importUserDB` | POST | Restore full userDB.json from JSON body |
| `/__resetUserData` | POST | Clear specific fields or wipe all of DB3 |
| `/__promoteToDb2` | POST | Move curated fields DB3 → DB2 (developer workflow) |
| `/__scraper/importJson` | POST | Bulk import teknoparrot_screenscaper_metadata.json → DB2 |
| `/__scraper/save` | POST | Save scraped fields to DB2 + download media files |
| `/__scraper/lookup` | GET | Direct ROM lookup: `jeuInfos.php?romnom={profile}.xml&systemeid=269` |
| `/__scraper/search` | GET | Title search on screenscraper |
| `/__scraper/verify` | GET | Validate screenscraper credentials via ssuserInfos.php |
| `/__scraper/config` | GET/POST | Read/write dev/scraper-config.json |
| `/__openTeknoParrot` | POST | Spawn TeknoParrotUi.exe (no game profile) |
| `/__launch` | GET | Spawn TeknoParrotUi.exe with `--profile={name}.xml` |
| `/__launchStatus` | GET | tasklist check — is TeknoParrotUi.exe running? |
| `/__install` | GET | Copy GameProfile XML → UserProfiles |
| `/__remove` | POST | Delete from UserProfiles |
| `/__getGameProfile` | GET | Read GameProfile or UserProfile XML |
| `/__updateGameSettings` | POST | Write UserProfile XML |
| `/__checkTeknoParrotExe` | GET | Does TeknoParrotUi.exe exist? Returns path |

Static files are served from the TeknoParrot root, so URLs like `/Icons/`, `/GameProfiles/`, `/ParrotOrganizer_v2.0/Media/` all resolve correctly.

---

## Coding Conventions

- No comments unless the WHY is non-obvious
- No TypeScript — plain JSX with Babel standalone
- CSS uses OKLch color variables: `--bg-0` through `--bg-4`, `--text-0` through `--text-3`, `--accent`, `--line`, `--accent-dim`, `--accent-line`
- Light theme overrides via `[data-theme="light"]` on `<html>`
- Keep DB3 sparse — delete keys when value is empty string
- `mergeAndWrite()` must be called after any DB1/DB2/DB3 file write
- New DB fields → add to `ALL_COLUMNS`, to `scanDB1()` defaults, to `PROMOTE` list in `/__promoteToDb2`, and to `loadGames()` mapping in data.jsx

---

## User / Developer Info

- **Nate** — the developer building and curating this app for personal use and the TeknoParrot community
- He curates DB2 metadata (descriptions, tags, YouTube links) and uses the Push tool to ship it with updates
- The `dev/` folder is his private workspace — never shipped to end users
- Screenscraper.fr is the metadata source; he has a member account (ssid/sspassword) and needs developer credentials (devid/devpassword) from screenscraper.fr to use the API
