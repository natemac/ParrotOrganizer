# ParrotOrganizer v2.0 - Modern React Rebuild

ParrotOrganizer v2.0 is a full rebuild of the TeknoParrot library manager with a modern React interface, richer metadata, media support, and a safer database system for user data.

---

## What's New

### Modern Browser Interface

The app has been rebuilt with React 18 while keeping the same simple launch flow: double-click `start.bat` and manage your TeknoParrot library from the browser.

New interface highlights:
- Grid and list views
- Collapsible sidebar
- Fast search and filters
- Game detail panel
- Dark/light themes
- Accent colors and layout tweaks
- Keyboard and gamepad navigation

---

### New Database System

v2.0 uses a three-tier database so app updates and personal data no longer fight each other.

- `teknoparrotDB.json` - scanned from TeknoParrot files
- `parrotOrganizerDB.json` - curated ParrotOrganizer metadata
- `userDB.json` - your favorites, hidden games, notes, and edits
- `teknoparrot_database.json` - merged database used by the app

Your personal data stays in the User Database and can be exported or imported from App Settings.

---

### Rich Metadata and Media

The game library now supports:
- Box art
- Wheel logos
- Screenshots
- Descriptions
- Multi-genre metadata
- Developer and publisher
- Player count
- ESRB rating
- Release dates
- GPU compatibility
- Tags and gameplay video links

Metadata is sourced from TeknoParrot, Screenscraper.fr, curated ParrotOrganizer data, and user edits.

---

### Better Search and Filtering

Search now has a mode menu from the magnifying glass:
- All Fields
- Game Name
- Game ID
- Publisher
- Developer
- Tags

Autocomplete supports mouse and keyboard control:
- Up/Down selects suggestions
- Enter accepts a selected suggestion
- Enter with no selected suggestion keeps the typed search
- Esc hides the menu until typing changes

Description text is no longer searched by default, which avoids broad false positives from common words.

---

### Powerful Library Controls

v2.0 includes filters for:
- Genre
- Platform
- Emulator
- Controller/input type
- Publisher
- Developer
- Players
- Year
- GPU compatibility
- Favorites
- Installed/not installed
- Hidden games
- Subscription status

Sorting includes name, year, genre, platform, emulator, controls, subscription, installed status, favorites, and random shuffle.

---

### Full Game Detail Panel

Each game now has a rich detail panel with:
- Media hero
- Launch or install button
- Uninstall button for installed games
- Open Game Folder for installed games
- Edit Info
- Description and tags
- Settings and controls editors
- GPU compatibility
- Notes
- Hide/unhide game

Open Game Folder now opens the configured game path from the installed profile and attempts to bring Explorer to the front.

---

### App Settings and Tweaks

The new App Settings panel includes:
- Refresh Game List
- Reset Favorites
- Reset Hidden Games
- Reset Users Database
- Reset Everything
- Export Settings
- Import Settings
- Developer database promotion tool

The Tweaks panel includes:
- Dark/light mode
- Accent color
- Background style
- Card size
- Density
- Show metadata
- Favorites first
- Reset UI Preferences

---

## Key Fixes

- Search no longer matches descriptions, reducing noisy results
- Search menu closes when clicking outside
- Autocomplete supports Esc, Up/Down, and Enter behavior
- Show Metadata no longer hides game names
- Hidden-metadata cards have better title spacing
- Same-game click closes the detail panel
- Confirm dialogs appear above App Settings
- Light-mode favorite icons are readable
- Uninstalled games show Install Game instead of disabled Launch Game
- Open Game Folder is hidden for uninstalled games
- Export filenames include date and time
- Reset Custom Profiles was renamed to Reset Users Database

---

## Installation

### New Users
1. Put `ParrotOrganizer` inside your TeknoParrot folder.
2. Make sure Node.js is installed.
3. Double-click `start.bat`.
4. Open `http://localhost:8000/ParrotOrganizer/` if needed.

### Upgrading
1. Back up your current ParrotOrganizer folder.
2. Install the v2.0 `ParrotOrganizer` folder into your TeknoParrot directory.
3. Launch with `start.bat`.
4. Use App Settings -> Export Settings to back up the new User Database after setup.

Note: v2.0 uses a new `data/userDB.json` personal data system. Older storage-based settings may need to be reconfigured.

---

## Full Changelog

For complete technical details, see [CHANGELOG_v2.0.md](CHANGELOG_v2.0.md).

---

## Links

- **Documentation:** README.md
- **TeknoParrot:** https://teknoparrot.com
- **Metadata:** https://www.screenscraper.fr

---

**Version:** 2.0  
**Release Date:** May 7, 2026  
**Compatibility:** Windows, TeknoParrot, Node.js LTS

