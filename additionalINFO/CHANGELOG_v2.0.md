# ParrotOrganizer v2.0 - Modern React Rebuild

**Release Date:** May 7, 2026

ParrotOrganizer v2.0 is a full rebuild of the app: a modern browser interface, a new Node.js backend, richer metadata, downloaded media, and a safer three-tier database system for TeknoParrot libraries.

This release replaces the older vanilla JavaScript app with a faster React-based interface while preserving the core goal: browse, organize, install, configure, and launch TeknoParrot games from one local web app.

---

## Major Features

### Complete React Interface Rebuild

The entire frontend has been rebuilt as a no-build React 18 app loaded directly in the browser.

**Highlights:**
- Modern card and list views
- Collapsible sidebar with grouped filters
- Persistent UI preferences
- Detail panel with media, metadata, notes, editors, and actions
- Keyboard and gamepad navigation support
- Debug log viewer and App Settings panel

---

### Three-Tier Database System

v2.0 introduces a safer database architecture that separates scanned TeknoParrot data, curated app metadata, and personal user data.

**Database tiers:**
- `teknoparrotDB.json` - auto-scanned TeknoParrot data from GameProfiles and Metadata
- `parrotOrganizerDB.json` - curated ParrotOrganizer metadata and overrides
- `userDB.json` - personal data such as favorites, hidden games, notes, and custom edits
- `teknoparrot_database.json` - merged output used by the UI

**Benefits:**
- App updates can improve metadata without overwriting user data
- Personal favorites, notes, hidden games, and edits stay isolated
- Developer edits can be promoted from the User Database into the Parrot Organizer Database

---

### Rich Metadata and Media

v2.0 adds full metadata support from TeknoParrot, Screenscraper.fr, and user edits.

**Metadata fields include:**
- Game title and profile ID
- Genre and multi-genre classification
- Platform and emulator
- Developer and publisher
- Player count and ESRB rating
- Release date and year
- Controls/input type
- GPU compatibility
- Tags, description, and gameplay video link

**Media support:**
- Box art
- Wheel logos
- Screenshots
- Existing TeknoParrot icon art fallback

---

### Advanced Search and Filtering

Search and filtering have been expanded across the entire library.

**Search:**
- Search mode menu from the magnifying glass
- Modes: All Fields, Game Name, Game ID, Publisher, Developer, Tags
- Autocomplete suggestions
- Keyboard support for suggestions: Up/Down to select, Enter to accept, Esc to dismiss
- Description text removed from search to prevent broad false positives

**Filters:**
- Genre
- Platform
- Emulator
- Controller/input type
- Publisher
- Developer
- Players
- Year range
- GPU compatibility
- Favorites
- Installed / not installed
- Hidden games
- Subscription status

---

### Improved Sorting and Views

v2.0 includes 19 sort modes and two main library views.

**Views:**
- Grid view with game cards
- List view with sortable columns

**Sorting includes:**
- Name
- Year
- Genre
- Platform
- Emulator
- Controls
- Subscription status
- Installed status
- Favorites
- Random shuffle

**New preference:**
- Favorites can be pinned to the beginning of the library from the Tweaks panel.

---

### Game Detail Panel

The detail panel has been rebuilt with richer metadata and clearer actions.

**Detail panel includes:**
- Box art hero or icon fallback
- Launch or install button based on install state
- Uninstall action for installed games
- Open game folder for installed games
- Edit Info button
- Genre tags
- Description with read-more expansion
- Settings and controls editors for installed games
- Spec grid
- Control/input tags
- GPU compatibility details
- Personal notes
- Hide/unhide game action
- Metadata courtesy attribution

**Behavior changes:**
- Clicking the selected game again closes the detail panel
- Open Game Folder now opens the configured game path folder from the installed UserProfile

---

### In-App Editors

The editing tools from v1.5.0 are carried forward into the new interface.

**Metadata Editor:**
- Edit title, developer, publisher, players, genre, platform, controls, tags, YouTube link, description, and metadata source
- Saves to the User Database

**Settings Editor:**
- Edit game path and XML settings for installed games
- Reads installed UserProfiles first

**Controls Editor:**
- Remap gamepad and keyboard controls
- Real-time input capture
- Clear individual bindings

---

### App Settings Panel

The gear icon opens a dedicated App Settings modal.

**Game Library:**
- Refresh Game List

**Data Management:**
- Reset Favorites
- Reset Hidden Games
- Reset Users Database
- Reset Everything

**Backup and Restore:**
- Export Settings with date/time filename
- Import Settings from a JSON backup

**Developer:**
- Push User Database metadata into the Parrot Organizer Database
- Developer confirmation gate requires typing `Nate`

---

### Tweaks Panel

The Tweaks panel now controls UI appearance and layout.

**Options:**
- Dark/light mode
- Accent color
- Background style
- Card size
- Density
- Show/hide metadata on cards
- Favorites first
- Reset UI Preferences

---

### Gamepad and Keyboard Navigation

v2.0 includes full controller-friendly navigation.

**Gamepad support:**
- D-pad / left stick navigation
- A to launch selected game
- B to close/back
- X to favorite
- Y to open details
- LB/RB to cycle install filters
- Start to open Tweaks
- Select to toggle grid/list
- Left stick click to jump home

**Keyboard support:**
- Ctrl+K / Cmd+K to focus search
- Arrow keys to navigate
- Page Up / Page Down
- Enter to launch
- F to favorite
- V to toggle grid/list
- S to open Tweaks
- Esc to close panels

Gamepad navigation is disabled while modals or editors are open.

---

## Technical Improvements

### Backend
- New Node.js server architecture
- Startup database scan and merge
- Static serving for app files, icons, media, and data
- Launch, install, uninstall, settings, controls, backup, import, export, and developer endpoints
- Debug logging to `storage/debug.log`
- TeknoParrot executable detection and setup screen support

### Frontend
- React 18 components loaded without a build step
- Shared component system for cards, list rows, detail panel, modals, editors, and controls
- OKLch theme variables
- Persistent localStorage UI preferences
- requestAnimationFrame gamepad polling with edge detection

### Data
- Multi-genre support
- Screenscraper.fr metadata import workflow
- Media folder per game profile
- User data separated from distributable metadata

---

## Bug Fixes and Polish

- Removed description text from search to avoid broad false positives
- Fixed search mode menu closing on outside click
- Added Esc behavior for autocomplete, App Settings, and Tweaks panel
- Added keyboard autocomplete selection
- Fixed Show Metadata so game names remain visible
- Added padding under card titles when metadata is hidden
- Removed quick filters for icon art and YouTube link
- Fixed confirm dialogs appearing behind App Settings
- Fixed light-mode favorite icon readability
- Updated Launch/Install button behavior for uninstalled games
- Hid Open Game Folder for uninstalled games
- Open Game Folder now targets the configured game path instead of UserProfiles
- Added best-effort Explorer focus when opening a game folder
- Renamed Reset Custom Profiles to Reset Users Database
- Added timestamp to exported settings filename
- Added developer confirmation gate for database promotion

---

## Statistics

- **Major rewrite:** Vanilla JavaScript app rebuilt as React 18 interface
- **Database architecture:** 3-tier merge system
- **Game count:** 500+ TeknoParrot games supported
- **Sort modes:** 19
- **Major UI panels:** Sidebar, detail panel, Tweaks, App Settings, Debug Log
- **Editors:** Metadata, settings, controls
- **Primary platform:** Windows

---

## Installation and Upgrade

### New Users
1. Place the `ParrotOrganizer` folder inside your TeknoParrot folder.
2. Make sure Node.js is installed.
3. Double-click `start.bat`.
4. Open `http://localhost:8000/ParrotOrganizer/` if the browser does not open automatically.

### Upgrading from v1.5.x or Earlier
1. Back up your existing ParrotOrganizer folder.
2. Back up any personal data before replacing files.
3. Install the new `ParrotOrganizer` folder inside your TeknoParrot directory.
4. Launch with `start.bat`.
5. Use App Settings -> Import Settings if restoring a `userDB.json` backup.

**Important:** v2.0 uses the new `data/userDB.json` system for personal data. Older storage-based preferences may need to be migrated or reconfigured.

---

## Resources

- **README:** See `README.md`
- **TeknoParrot:** https://teknoparrot.com
- **Metadata:** Screenscraper.fr

---

**Version:** 2.0  
**Release Date:** May 7, 2026  
**Compatibility:** Windows, TeknoParrot, Node.js LTS

