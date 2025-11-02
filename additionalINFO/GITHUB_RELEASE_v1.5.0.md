# v1.5.0 - In-App Editing Release

The biggest update yet! Edit game settings and remap controls without ever leaving your browser.

## 🎯 Major Features

### In-App Settings Editor
- Edit all game configuration directly in ParrotOrganizer
- Modify game paths, display settings, and all config values
- Boolean toggles, dropdowns, text fields, and file paths supported
- Real-time XML editing with automatic refresh
- Returns to game details after save/cancel

### In-App Controls Editor
- Remap controls using gamepad or keyboard input
- Real-time button capture using browser Gamepad API
- Visual feedback with pulsing animation during input listening
- XInput button code mapping (A=4096, B=8192, etc.)
- Clear button (✕) to unmap individual controls
- Input API dropdown integrated into controls editor
- Grouped display: System Controls, Player 1, Player 2
- Auto-creates missing XML elements (BindName/BindNameXi)

### Enhanced Install Success Modal
- Three-button design: Setup Game, Go To TeknoParrot, Continue Browsing
- "Setup Game" opens game details for immediate configuration
- Updated messaging reflects in-app editing capabilities
- Escape key and X button now refresh library properly

### Smart Input Interference Prevention
- Gamepad shortcuts automatically paused when modals are open
- Keyboard shortcuts disabled in all edit modes
- Event capture phase interception prevents conflicts
- Seamless resume when returning to main view

## 🎨 UI/UX Improvements

- Input API moved to Controls section (better organization)
- Save/Cancel in editors return to game details (improved navigation)
- Escape key closes any modal
- Consistent navigation throughout app
- Auto-refresh after saving changes

## 🐛 Bug Fixes

- Fixed hotkeys triggering in modals (e.g., Start button opening settings during editing)
- Fixed controls editor showing default values instead of user-configured bindings
- Fixed missing XML elements (BindName/BindNameXi) causing save errors
- Fixed install success modal not refreshing library on close

## 📊 Technical Details

**New Files:**
- `js/modules/settingsEditManager.js` - Game settings editor (400+ lines)
- `js/modules/controlsEditManager.js` - Controls remapping editor (580+ lines)
- `js/modules/profileEditManager.js` - Shared edit field definitions
- `css/settings-edit.css` - Settings editor styling
- `css/controls-edit.css` - Controls editor styling

**New Server Endpoints:**
- `/__getGameProfile?id=gameId` - Retrieve game profile XML
- `/__updateGameSettings?id=gameId` - Update game settings/controls XML

**Code Changes:**
- ~1,200+ lines of new code
- 8 existing files modified
- 4 major bug fixes

## 📥 Installation

### New Users
Extract into your TeknoParrot folder and double-click `start.bat`

### Upgrading
1. Backup your `storage/` folder (preserves all your data)
2. Delete old ParrotOrganizer folder
3. Extract v1.5.0
4. Copy your `storage/` folder back
5. Launch with `start.bat`

## 🎯 What You Can Do Now

With v1.5.0, you can manage everything from ParrotOrganizer:
- ✅ Browse and filter 450+ games
- ✅ Install/remove games
- ✅ Edit game paths
- ✅ Edit all game settings
- ✅ Remap all controls
- ✅ Add custom profiles
- ✅ Mark favorites
- ✅ Launch games
- ✅ Configure preferences

**No need to open TeknoParrot UI unless you want to!**

---

**Full Documentation:** See README.md for complete usage guide
**Previous Version:** v1.3.1
**Release Date:** November 2, 2025
