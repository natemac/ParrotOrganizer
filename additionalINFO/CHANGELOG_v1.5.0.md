# ParrotOrganizer v1.5.0 - In-App Editing Release

**Release Date:** November 2, 2025

A major feature update that brings full in-app editing capabilities to ParrotOrganizer! Edit game settings, remap controls, and configure everything without ever leaving your browser.

---

## 🎮 Major Features

### In-App Game Settings Editor
Edit all game configuration directly in ParrotOrganizer - no need to open TeknoParrot UI!

**Features:**
- ⚙️ **Edit Settings Button** in game details opens comprehensive settings editor
- 📝 **All Field Types Supported:**
  - Boolean toggles (Windowed, Test Mode, Admin Required, etc.)
  - Dropdown menus (Resolution, Display Mode, etc.)
  - Text inputs (custom settings values)
  - File paths (game executable/ISO path)
- 💾 **Real-time XML Editing** - Changes saved directly to UserProfiles XML
- 🔄 **Automatic Refresh** - Game data reloads after saving
- ↩️ **Returns to Game Details** - Seamless navigation flow after save/cancel
- 🎯 **Smart Layout** - Organized, scrollable form with sticky footer buttons

**How to Use:**
1. Open any installed game's details
2. Click "⚙️ Edit Settings" in the Game Settings section
3. Modify any settings
4. Click "💾 Save Settings" or "❌ Cancel"
5. Automatically returns to game details page

---

### In-App Controls Editor
Remap game controls using your gamepad or keyboard - all from your browser!

**Features:**
- 🎮 **Real-time Input Capture** - Press any gamepad button or keyboard key
- 🔘 **Gamepad API Integration** - Detects all standard gamepad buttons
- ⌨️ **Keyboard Detection** - Captures all keyboard inputs
- ✨ **Visual Feedback** - Pulsing animation shows listening state
- 🗺️ **XInput Code Mapping** - Automatic conversion (A=4096, B=8192, etc.)
- ✕ **Clear Button** - Unmap individual controls with one click
- 📋 **Grouped Display:**
  - System Controls (Test, Service, Coin)
  - Player 1 Controls
  - Player 2 Controls
- 🎚️ **Input API Editor** - Change Input API directly in controls editor
- 🔧 **Auto-creates Missing Elements** - Generates BindName/BindNameXi if needed
- 📂 **Smart Data Loading** - Reads UserProfiles first, falls back to GameProfiles

**How to Use:**
1. Open any installed game's details
2. Click "⚙️ Edit" in the Controls section
3. Click "Remap" on any control
4. Press desired gamepad button or keyboard key
5. Control is instantly mapped with visual confirmation
6. Click ✕ to clear a binding
7. Click "💾 Save Controls" or "❌ Cancel"

**Technical Details:**
- Uses browser's Gamepad API for controller input
- Keyboard events captured in capture phase to prevent interference
- XInput button codes properly serialized to XML
- Supports all TeknoParrot control types

---

### Enhanced Install Success Modal
Improved post-installation workflow guides users through setup.

**Changes:**
- 🎯 **Three-Button Design:**
  - **Setup Game** (Primary) - Opens game details for immediate configuration
  - **Go To TeknoParrot** (Secondary) - Opens TeknoParrot UI
  - **Continue Browsing** (Secondary) - Returns to main library
- 📝 **Updated Messaging** - Explains in-app editing capabilities
- 🔄 **Smart Refresh** - X button and Escape key now refresh library properly
- 🎨 **Flexible Layout** - Buttons wrap on smaller screens

**User Flow:**
1. Install a game
2. Modal appears with setup options
3. Choose to setup in-app, use TeknoParrot, or keep browsing
4. Seamless transition to chosen action

---

## 🛡️ Smart Input Interference Prevention

All gamepad and keyboard shortcuts are automatically disabled during editing to prevent conflicts.

**Features:**
- 🎮 **Gamepad Polling Paused** - Controller inputs ignored when modals are open
- ⌨️ **Keyboard Shortcuts Disabled** - Hotkeys won't trigger during editing
- 🔒 **Event Capture Phase Interception** - Prevents events from reaching main handlers
- ✅ **Seamless Resume** - Input handlers automatically resume when returning to main view
- 🎯 **Works in All Modals** - Applies to game details, settings editor, controls editor

**Technical Implementation:**
- `gamepadManager.pollingActive = false` during editing
- `keyboardManager.enabled = false` during editing
- Event listeners use capture phase with `stopImmediatePropagation()`
- Missing modal check added to `actionSettings()` in gamepadIntegration.js

---

## 🎨 UI/UX Improvements

### Input API Reorganization
- 📍 **Moved to Controls Section** - Input API now appears in Controls (was in Game Settings)
- 🎨 **Consistent Styling** - Matches control binding display
- ✏️ **Dual Edit Locations:**
  - View in game details Controls section
  - Edit in either game details or controls editor

### Improved Modal Navigation
- ↩️ **Save/Cancel Return to Details** - Settings and controls editors return to game details
- 🔄 **Smart Refresh on Close** - Install success modal refreshes library when closed
- ⌨️ **Escape Key Support** - Close any modal with Escape key
- 🖱️ **Click Outside to Close** - Click modal background to dismiss

### Better User Flow
- 🔄 **Consistent Navigation** - Predictable behavior throughout app
- 💾 **Auto-refresh After Save** - Game data updates reflect immediately
- 📋 **Breadcrumb-like Flow** - Always know where you'll return to
- ⚡ **No Unnecessary Reloads** - Stay in context when editing

---

## 🔧 Technical Improvements

### New Server Endpoints
- `/__getGameProfile?id=gameId` - Retrieve game profile XML (UserProfile or GameProfile)
- `/__updateGameSettings?id=gameId` - Update game settings and controls XML

### New Files Added
- `js/modules/settingsEditManager.js` - Game settings editor (400+ lines)
- `js/modules/controlsEditManager.js` - Controls remapping editor (580+ lines)
- `js/modules/profileEditManager.js` - Shared edit field definitions
- `css/settings-edit.css` - Settings editor styling
- `css/controls-edit.css` - Controls editor styling

### Code Architecture
- 📦 **Modular Design** - Separate managers for settings and controls editing
- 🔄 **Shared Field Definitions** - Reusable edit field configuration
- 🎯 **XML Parsing & Serialization** - Proper handling of TeknoParrot XML structure
- 🧪 **Defensive Programming** - Creates missing XML elements automatically
- 📊 **Event-driven Updates** - Clean separation of concerns

---

## 🐛 Bug Fixes

### Fixed: Hotkeys Active in Modals
- **Issue:** Pressing gamepad/keyboard shortcuts in modals would trigger main screen actions
- **Fix:** Added modal checks and disabled input managers when modals are open
- **Example:** Pressing Start in controls editor no longer opens settings menu

### Fixed: Controls Editor Shows Wrong Data
- **Issue:** Controls editor showed default values instead of user-configured bindings
- **Fix:** Server now reads UserProfiles first, falls back to GameProfiles
- **Result:** Displays actual configured controls accurately

### Fixed: Missing XML Elements
- **Issue:** Some games missing BindName/BindNameXi elements caused save errors
- **Fix:** Code now creates elements if they don't exist
- **Games Affected:** Test, Service buttons, and some game-specific controls

### Fixed: Install Modal Not Refreshing Library
- **Issue:** Closing install success modal didn't refresh game list
- **Fix:** X button and Escape key now trigger library refresh
- **Result:** Installed status updates immediately

---

## 📊 Improvements Since v1.3.1

### v1.4.0 (Internal - Settings Editor Foundation)
- Collapsible settings sections
- Settings edit framework
- ProfileEditManager for shared edit logic

### v1.5.0 (This Release - Full Editing Suite)
- **In-app settings editing** - Edit all game configuration
- **In-app controls remapping** - Gamepad/keyboard button mapping
- **Enhanced install flow** - Guided setup with three options
- **Input interference prevention** - Smart hotkey disabling
- **Input API reorganization** - Better UI organization
- **Improved navigation** - Consistent modal flow
- **Bug fixes** - Hotkey conflicts, data loading, XML handling

---

## 📈 Statistics

- **Files Added:** 5 new files (2 JS modules, 2 CSS, 1 changelog)
- **Files Modified:** 8 existing files
- **Lines of Code Added:** ~1,200+ lines
- **New Server Endpoints:** 2
- **Bug Fixes:** 4 major issues resolved

---

## 🎯 What's Next?

### Potential Future Features
- Save filter presets
- Export game lists (CSV/JSON)
- Play count and last played tracking
- Batch control remapping for multiple games
- Custom control schemes/profiles

---

## 🙏 Acknowledgments

This release represents a major step forward in making ParrotOrganizer a complete, standalone game management solution. Thanks to all users who provided feedback and feature requests!

---

## 📥 Installation & Upgrade

### New Users
1. Extract ParrotOrganizer folder into your TeknoParrot directory
2. Double-click `start.bat`
3. Enjoy full in-app editing!

### Upgrading from v1.3.1 or Earlier
1. **Backup your data:** Copy the `storage/` folder (preserves preferences, favorites, custom profiles)
2. Delete old ParrotOrganizer folder
3. Extract new v1.5.0 folder
4. Copy your `storage/` folder back
5. Launch with `start.bat`

**Note:** Your preferences, favorites, and custom profiles are preserved!

---

## 🔗 Resources

- **GitHub:** [ParrotOrganizer Repository](#)
- **README:** Complete documentation in README.md
- **Support:** Report issues on GitHub Issues
- **TeknoParrot:** https://teknoparrot.com

---

**Version:** 1.5.0
**Release Date:** November 2, 2025
**Compatibility:** TeknoParrot 1.0+, Node.js 14+, Windows 10/11

**Happy Gaming! 🎮🦜**
