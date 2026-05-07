# ParrotOrganizer v2.0 — Migration Phase Plan

Tracks every feature from v1.5.2 and its migration status into v2.0.
Reference sources: `ParrotOrganizer_v1.5.2/` (full-featured original) and `ParrotOrganizer_NewDatabase/CLAUDE.md` (build plan).

---

## Already Migrated (Done)

| Feature | v1.5.2 Source | v2.0 File |
|---|---|---|
| Browse 515 games from DB | `dataLoader.js` | `data.jsx`, `server.js` (DB1 scan) |
| 3-tier JSON database (DB1/DB2/DB3) | *(new architecture)* | `server.js`, `data/db*.json` |
| Genre / Platform / Emulator / Controller filters | `filterManager.js` | `app.jsx` Sidebar |
| Year range slider | `filterManager.js` | `app.jsx` YearRange |
| Favorites only / Installed only / Has icon / Has YouTube / Hide subscription filters | `filterManager.js` | `app.jsx` Sidebar |
| Active filter chips + Clear all | `filterManager.js` | `app.jsx` |
| Sort: Name, Year, Genre, Platform, Random shuffle | `uiManager.js` | `app.jsx` SORTS |
| Grid view + List view toggle | `uiManager.js` | `app.jsx` |
| Game card with icon, name, genre, GPU pills | `uiManager.js` | `components.jsx` |
| Detail panel (GPU compat, general issues, versions, wheel rotation) | `uiManager.js` | `components.jsx` DetailPanel |
| Install game (copy GameProfile → UserProfile) | `launchManager.js` | `app.jsx` installGame → `/__install` |
| Uninstall game | `launchManager.js` | `app.jsx` uninstallGame → `/__remove` |
| One-click launch via TeknoParrotUi.exe | `launchManager.js` | `app.jsx` launch → `/__launch` |
| Favorites — toggle, persist to DB3, seed from DB on load | `preferencesManager.js` | `app.jsx` toggleFav, `saveUserField` |
| Notes — edit, persist to DB3 (debounced 800ms) | `preferencesManager.js` | `app.jsx` updateNotes |
| Keyboard nav: Arrow keys, Enter (launch), F (favorite), Escape | `keyboardManager.js` | `app.jsx` keyboard useEffect |
| Search by name, profile, platform | `filterManager.js` | `app.jsx` filtered useMemo |
| Settings Editor (all field types, Restore Defaults, save XML) | `settingsEditManager.js` | `settings-editor.jsx` |
| Controls Editor (remap gamepad/keyboard, Input API card, XInput codes) | `controlsEditManager.js` | `controls-editor.jsx` |
| Tweaks panel (accent, density, card size, background, metadata toggle) | `settingsManager.js` | `tweaks-panel.jsx` |
| Node.js server with all 16 endpoints | `scripts/server.js` | `server.js` |
| Icons served from `../Icons/` via Node server | `pathManager.js` | `server.js` static serving |
| Live launch status indicator | `launchManager.js` | `app.jsx` |
| Statistics display (filtered / total games, favorited count) | `uiManager.js` | `app.jsx` Topbar |
| Focus-coloring mode for filter categories | *(new in v2.0)* | `app.jsx` FilterGroup |
| OKLch color system (genre hue, accent, GPU pills) | *(new in v2.0)* | `styles.css` |
| Installed game detection (UserProfiles/ scan) | `dataLoader.js` | `/__userProfiles` endpoint |
| DB2 developer curated overrides (descriptions, YouTube, tags) | *(new architecture)* | `data/db2.json`, `server.js` mergeAndWrite |

---

## Phase A — Quick Wins ✅ COMPLETE

### A1 — Background Effects CSS ✅
CSS was already written (`styles.css` lines 43–53). Tweaks panel options work.

### A2 — Keyboard Shortcut Completion ✅
**Added:** `V` (toggle view), `S` (tweaks panel), `H` (first game), `Page Up/Down` (page nav), Arrow keys now start from first game when nothing selected. Scroll-into-view added via `useEffect` on `selected` + `data-profile` attribute on card/list-row DOM nodes.
**Files:** `app.jsx`, `components.jsx`

### A3 — Debug Log Viewer ✅
Topbar terminal button opens modal panel. Fetches `/__serverLogs`, shows entries in monospace grid (time / level / endpoint / message / data). Refresh + Clear buttons. Auto-scrolls to bottom on load.
**Files:** New `debug-log.jsx`, `app.jsx`, `index.html`, `styles.css`

---

## Phase B — Game Features (4–8 hours total)

---

### B1 — GPU Compatibility Filter ✅
**Reference:** `ParrotOrganizer_v1.5.2/js/modules/filterManager.js`

v1.5.2 had GPU compatibility filters (Nvidia / AMD / Intel confirmed). The DB already tracks `Nvidia`, `AMD`, `Intel` columns (values: `ok`, `issues`, `no`, `unknown`).

**Work needed:**
- Add GPU filter section to `app.jsx` Sidebar with three toggles: Nvidia OK, AMD OK, Intel OK
- Add `gpuFilters: { nvidia: false, amd: false, intel: false }` to filter state
- Add filter logic in `filtered` useMemo: if `gpuFilters.nvidia` is on, require `g.Nvidia === 'ok'`
- Add active chips for GPU filters

**Files:** `app.jsx` Sidebar + filtered useMemo + initialFilters

---

### B2 — Hide Games ✅
**Reference:** `ParrotOrganizer_v1.5.2/js/modules/preferencesManager.js`

v1.5.2 let users hide games from the main view, togglable via "Show Hidden Games" filter.

**v2.0 approach:** Store `Hidden: "yes"` in DB3 (same pattern as `Favorite`).

**Work needed:**
- Add `hidden` Set to App state (seeded from DB on load like favorites)
- `toggleHide(profile)` — updates Set + `saveUserField(profile, { Hidden: 'yes'|'' })`
- Add "Hide this game" button in DetailPanel (only for installed games or all games?)
- Add `filters.showHidden` toggle (default false) to sidebar Quick filters
- In `filtered` useMemo: skip games where `hidden.has(g.Profile)` unless `filters.showHidden`
- DB3 column: `Hidden` (not in DB1 or DB2, same as `Favorite`)
- Update `server.js` DB3 column handling to preserve `Hidden` field through merges
- Update `data.jsx` to seed `Hidden` from the merged DB

**Files:** `app.jsx`, `data.jsx`, `components.jsx` (hide button in DetailPanel), `server.js` (DB3 merge)

---

### B3 — Game Metadata Editor ✅
**Reference:** `ParrotOrganizer_v1.5.2/js/modules/profileEditManager.js`

v1.5.2 let users add custom name, description, YouTube link, tags, and genre via an "Edit Details" modal. Data was stored in `storage/CustomProfiles/[gameId].xml`.

**v2.0 approach:** Write to DB3 (same `/__saveUserData` endpoint, same merge priority). No XML — just DB3 fields.

**Editable fields:**
| Field | DB column | Notes |
|---|---|---|
| Custom Name | `Name` | Overrides DB2/DB1 display name |
| Description | `Description` | Free text |
| YouTube Link | `YouTube Link` | URL |
| Tags | `Tags` | Comma-separated |
| Genre | `Genre` | Overrides genre classification |
| Platform | `Arcade Platform` | Overrides platform |

**Work needed:**
- New `metadata-editor.jsx` modal (similar structure to `settings-editor.jsx`)
- "Edit Info" button in DetailPanel (visible for all games, not just installed)
- Loads current values from `game` object (already merged from DB)
- On save: `saveUserField(profile, { Name: ..., Description: ..., ... })` for all changed fields
- On cancel: no changes
- In `app.jsx`: add `metadataGame` state + render `<MetadataEditor>` when set
- Need to refresh game data after save (re-fetch merged DB or patch in-memory)

**Files:** New `metadata-editor.jsx`, `components.jsx` (Edit Info button), `app.jsx`, `index.html` (add script tag), `styles.css`

---

### B4 — Launch Popup Animation ✅
**Priority:** Low-Medium
**Effort:** ~1.5 hours
**Reference:** `ParrotOrganizer_v1.5.2/js/launchPopup.js`, `css/launch-popup.css`

v1.5.2 showed an animated overlay (game icon + title, purple gradient, pulsing glow) when launching a game, auto-hiding after 3 seconds.

**Work needed:**
- Add `launchingGame` state (the game object, not just a boolean)
- Render a `<LaunchPopup game={launchingGame}>` overlay in App
- Overlay: full-screen, dark purple gradient, centered card with game icon + name + spinner
- Auto-dismiss after 3 seconds or when `/__launchStatus` shows TeknoParrotUi is running
- CSS keyframe animations for fade-in, pulse glow

**Files:** New `launch-popup.jsx` (or add to `components.jsx`), `styles.css`, `app.jsx`

---

## Phase C — Gamepad Navigation (3–5 hours)

### C1 — Gamepad Grid Navigation ✅
**Priority:** High (listed #1 in build plan remaining items)
**Effort:** ~3–5 hours
**Reference:** `ParrotOrganizer_v1.5.2/js/gamepadManager.js`, `js/gamepadIntegration.js`

Full controller support for browsing and launching games.

**Button mapping (matching v1.5.2):**
| Button | Index | Action |
|---|---|---|
| D-Pad / Left Stick | 12–15 / axes 0–1 | Navigate game grid |
| A | 0 | Launch game / confirm |
| B | 1 | Close detail panel / back |
| X | 2 | Toggle Favorite |
| Y | 3 | Show Detail panel |
| LB | 4 | Cycle filter (previous) |
| RB | 5 | Cycle filter (next) |
| LT | 6 | Page up (jump rows) |
| RT | 7 | Page down (jump rows) |
| SELECT | 8 | Toggle Grid/List view |
| START | 9 | Open Tweaks panel |
| L3 | 10 | Jump to first game |

**Critical constraint:** Gamepad polling MUST be suspended while Controls Editor is in remapping mode. Controls editor already uses `rafRef` — expose a global flag or use a React context/ref.

**v1.5.2 implementation pattern:**
- `requestAnimationFrame` polling loop (`startPolling()`)
- Deadzone threshold (0.3 default)
- Navigation cooldown (150ms between moves)
- `window.addEventListener('gamepadconnected'/'gamepaddisconnected')`
- Window focus/blur detection (pauses when TeknoParrot launches)
- `navigator.getGamepads()` to read current state each frame
- Dispatches custom events or calls UI callbacks directly

**v2.0 implementation:** React hook `useGamepad(callbacks, enabled)` that encapsulates the rAF loop, button edge detection, and deadzone logic. Pass callbacks from App component. `enabled` prop can be set to `false` when any editor modal is open.

**Files:** New `useGamepad.js` hook + wire into `app.jsx` + `styles.css` (gamepad connection indicator in topbar)

---

## Phase D — Advanced Features (3–5 hours)

### D1 — Advanced Filters ✅
Sidebar "Input Type" section added: Light Gun only, Steering Wheel only, Has Wheel Rotation toggles.
Also added "Subscription only" toggle (previously only "hide subscription" existed).
Filter chips and removeChip updated. `subscription === 'only'` check added to filtered useMemo.
**Files:** `app.jsx` Sidebar + filtered useMemo + initialFilters + activeChips + removeChip

---

### D2 — First-Run / Path Detection ✅
On load, calls `/__checkTeknoParrotExe` (now returns `expectedPath`). If `exists: false`, renders
`<SetupScreen>` full-page with path display and Retry button instead of the game grid.
**Files:** `app.jsx` (teknoFound/teknoPath state, early return), `components.jsx` (SetupScreen), `styles.css`, `server.js`

---

### D3 — Data Management & Reset Options ✅
Server endpoint `/__resetUserData` (POST `{ fields }` or `{ all: true }`) added.
"Data" section in TweaksPanel with 5 reset buttons: Favorites, Notes, Hidden, Custom Info, All.
All destructive resets require confirmation via `<ConfirmDialog>` before executing.
**Files:** `server.js` (new endpoint), `app.jsx` (TweaksPanel section + resetUserData callback), `components.jsx` (ConfirmDialog), `styles.css`

---

## Phase E — Polish ✅ COMPLETE

### E1 — Scroll Selected Card Into View ✅
Already done in Phase A2 via `useEffect` on `selected` + `data-profile` attribute lookup.

### E2 — Detail Panel Transition ✅
Added `key={selected.Profile}` to `<DetailPanel>` — forces remount on game change, retriggering
the existing `slideIn` animation. Panel state is App-managed so remount is safe.
**Files:** `app.jsx`

### E3 — Custom Uninstall Confirm Dialog ✅
`window.confirm()` replaced with `<ConfirmDialog>`. New reusable `ConfirmDialog` component handles
title, message, Cancel, and danger-colored Confirm. Also used for D3 data reset actions.
**Files:** `components.jsx` (ConfirmDialog), `app.jsx`, `styles.css`

### E4 — Search Enhancement ✅
`hay` in `filtered` useMemo now includes `g.Emulator + g.Tags.join(' ') + g.Description`.
**Files:** `app.jsx` filtered useMemo

---

## Not Migrating (v1.5.2-only, not needed in v2.0)

| Feature | Reason |
|---|---|
| `preferences.json` file system | Replaced by DB3 JSON (same portability, simpler) |
| `storage/CustomProfiles/[gameId].xml` per-game XML | Replaced by DB3 fields — no XML needed for user data |
| Multi-Select & Batch Operations | Complexity vs. value low for current scope; defer to v2.1 |
| Export / Import Settings backup | Low priority; DB3 is already a portable file — users can copy it |
| `start-python.bat` Python alternative | Node.js only in v2.0 |
| `/__openTeknoParrot` endpoint (open TeknoParrotUi without a game) | Could add if requested |
| `/__customProfile/read/write/delete` XML endpoints | Replaced by `/__saveUserData` → DB3 |
| Quick Filter popup (SELECT button gamepad menu) | Merge into gamepad nav (Phase C); separate popup not needed |

---

## Recommended Build Order

```
A1 Background Effects CSS      ← 30 min, visual payoff immediately
A2 Keyboard Shortcut Complete  ← 1 hr, makes the app feel complete
B1 GPU Filter                  ← 1 hr, often-requested filter
B2 Hide Games                  ← 1.5 hr, clean up library
B3 Metadata Editor             ← 3 hr, flagship remaining feature
C1 Gamepad Navigation          ← 4 hr, biggest complexity, do after UI is stable
A3 Debug Log Viewer            ← 1.5 hr, dev/support utility
B4 Launch Popup                ← 1.5 hr, fun polish
D1 Advanced Filters            ← 1 hr, easy extension of existing filter system
D2 First-Run Detection         ← 1.5 hr, needed for clean user onboarding
E1–E4 Polish                   ← 2 hr total, final pass before release
D3 Data Management             ← 1.5 hr, power-user feature, do last
```

**Estimated total remaining:** ~0 hours — all phases complete ✅

---

## Final Status: MIGRATION COMPLETE

All v1.5.2 features migrated. All Phase A–E items done.
The app is feature-complete for v2.0.

---

## Phase F — Settings Panel & Theme (user-directed 2026-05-06)

### F1 — Light / Dark Mode ✅
Add `theme: 'dark'|'light'` to `window.__TWEAKS__` and Tweaks panel.
CSS `[data-theme="light"]` overrides all `--bg-*` and `--text-*` variables.
`data-theme` attribute set on `<html>` via tweaks `useEffect`.
**Files:** `index.html`, `styles.css`, `app.jsx`

---

### F2 — Reset UI Preferences ✅
Button in Tweaks panel → clears `po-tweaks`, `po-sort`, `po-view` from localStorage and resets state to defaults. No confirm dialog needed (no data loss).
**Files:** `app.jsx` (TweaksPanel Data block replaced)

---

### F3 — App Settings Panel (gear icon) ✅
New modal triggered by ⚙ icon in topbar. Replaces the Data Management block from TweaksPanel.

**Sections:**
| Section | Items |
|---|---|
| Game Library | Refresh Game List → `/__rebuildDB` |
| Data Management | Reset Favorites, Reset Hidden Games, Reset Custom Profiles, Reset Everything |
| Backup & Restore | Export Settings (downloads DB3 as JSON), Import Settings (uploads JSON → DB3 → rebuild) |
| Developer | Push Custom Profiles to DB2 → `/__promoteToDb2` |

`Push Custom Profiles` writes curated fields (Name, Description, YouTube Link, Tags, Genre, Platform, Interface) from DB3 → DB2, then clears them from DB3. Used by developer before shipping updates. Not promoted: Favorite, Hidden, Notes, Status (personal data).

**Files:** New `app-settings.jsx`, `app.jsx`, `components.jsx` (icons), `server.js`, `styles.css`, `index.html`

---

## v1.5.2 Settings Panel — Gap Analysis

Comparing the v1.5.2 dedicated Settings modal (5 tabs) against what v2.0 currently exposes.
User to mark each item **Add** or **Omit**.

---

### Tab 1 — Appearance

| Feature | v2.0 status | Notes |
|---|---|---|
| **Light Mode / Dark Mode toggle** | ❌ Missing | v2.0 is dark-only. v1.5.2 had a full light theme. |
| **Show Genre on cards** (toggle) | ⚠️ Partial | v2.0 has one "Show metadata" toggle that hides *all* card text. v1.5.2 let you toggle each field independently. |
| **Show Platform on cards** (toggle) | ⚠️ Partial | Same as above. |
| **Show Release Year on cards** (toggle) | ⚠️ Partial | Same as above. |
| **Show GPU Compatibility on cards** (toggle) | ❌ Missing | No GPU pill toggle in v2.0 cards at all. |
| **Columns per Row slider** (1–10) | ⚠️ Partial | v2.0 has S / M / L card sizes (auto-fill columns). v1.5.2 let you set an exact column count. |

---

### Tab 2 — Data Management

| Feature | v2.0 status | Notes |
|---|---|---|
| **Reset Favorites** | ✅ Done | In Tweaks → Data section. |
| **Reset Hidden Games** | ✅ Done | In Tweaks → Data section. |
| **Reset Custom Profiles** | ✅ Done | "Reset Custom Info" in Tweaks → Data. |
| **Reset UI Preferences** | ❌ Missing | Clears localStorage (accent, card size, sort, view). v2.0 has no equivalent. |
| **Reset Everything** | ✅ Done | "Reset ALL Data" in Tweaks → Data. |
| **Export Settings (backup)** | ❌ Missing | Exports DB3 + localStorage prefs as a zip/JSON. Already listed as "Not Migrating" — flagging again since it appears prominently in v1.5.2. |
| **Import Settings (restore)** | ❌ Missing | Same as above. |

---

### Tab 3 — Gamepad

| Feature | v2.0 status | Notes |
|---|---|---|
| **Gamepad status display** (connected / not connected) | ✅ Done | Dot indicator in topbar. |
| **Enable Gamepad Navigation toggle** | ❌ Missing | v2.0 always has gamepad on (disabled only during modals). No user toggle to fully turn it off. |
| **Enable Vibration Feedback toggle** | ❌ Missing | v2.0 has no haptic/rumble support at all. |
| **Navigation Speed slider** (ms cooldown) | ❌ Missing | v2.0 hardcodes 160ms. v1.5.2 let users dial this in. |
| **Button layout reference table** | ❌ Missing | v2.0 shows keyboard shortcuts in Tweaks but no gamepad button map. |

---

### Tab 4 — Advanced

| Feature | v2.0 status | Notes |
|---|---|---|
| **Refresh Game List button** | ⚠️ Partial | Server has `/__rebuildDB` endpoint, but no UI button is exposed to the user. |
| **Auto-scan games on startup** (toggle) | ✅ Done (hardcoded) | v2.0 always auto-scans on startup. No toggle needed. |
| **Show Debug Tools** (toggle) | ✅ Done | Terminal icon in topbar opens Debug Log panel. |
| **Push Custom Profiles to Data** (admin) | ❌ Not applicable | Developer-only workflow (merging DB2). End users don't need this. |

---

### Tab 5 — About

| Feature | v2.0 status | Notes |
|---|---|---|
| **App version display** | ❌ Missing | v2.0 shows "v2.0" in topbar brand tag only. No formal About panel. |
| **View on GitHub link** | ❌ Missing | — |
| **Credits** (Created by, Built for, Powered by) | ❌ Missing | — |
| **TeknoParrot Official link** | ❌ Missing | — |

---

### Summary of Gaps

**Clearly new additions (not in v2.0 at all):**
- Light / Dark mode toggle
- Per-field card info toggles (Genre, Platform, Year, GPU compat)
- Exact columns-per-row slider
- Reset UI Preferences (clear localStorage)
- Enable / disable gamepad navigation globally
- Navigation Speed slider (adjustable cooldown)
- Gamepad button layout reference in settings
- "Refresh Game List" button in UI
- About tab (version, GitHub, credits)

**Already covered, no action needed:**
- Reset Favorites / Hidden / Custom / All ✅
- Gamepad status indicator ✅
- Debug log viewer ✅
- Auto-scan on startup ✅

**Likely omit (same reasoning as before):**
- Vibration Feedback — browser Gamepad API vibration is poorly supported
- Export / Import Settings — DB3 is a portable file; low ROI
- Push Custom Profiles to Data — developer-only, not for users
