# 🎮 ParrotOrganizer v1.5.0 - In-App Editing Release

**The biggest update yet!** Edit game settings and remap controls without ever leaving your browser.

---

## ✨ What's New

### 🎛️ In-App Settings Editor
Configure every aspect of your games directly in ParrotOrganizer:
- Edit game paths and installation directories
- Toggle boolean settings (Windowed, Test Mode, Admin Required, etc.)
- Change display modes and resolutions
- Modify all game-specific settings
- Changes save directly to your UserProfiles

**Access:** Game Details → "⚙️ Edit Settings" button

---

### 🎮 In-App Controls Editor
Remap your controls using gamepad or keyboard - all from your browser:
- **Real-time input capture** - Click "Remap" and press any button/key
- **Visual feedback** - Pulsing animation shows when listening for input
- **XInput support** - Automatic button code mapping
- **Keyboard support** - Capture any keyboard key
- **Clear bindings** - ✕ button to unmap controls
- **Input API editor** - Change input method (XInput/DirectInput/etc.)
- **Organized by player** - System, Player 1, Player 2 sections

**Access:** Game Details → "⚙️ Edit" button in Controls section

---

### 🚀 Enhanced Post-Install Flow
Better guidance after installing a game:
- **Setup Game** - Jump directly to configuration (NEW!)
- **Go To TeknoParrot** - Open TeknoParrot UI
- **Continue Browsing** - Return to library

---

### 🛡️ Smart Input Management
- Gamepad shortcuts automatically disabled during editing
- Keyboard hotkeys won't interfere with input capture
- Seamless resume when returning to main view

---

### 🎨 UI Improvements
- **Input API moved to Controls section** for better organization
- **Escape key support** - Close modals with Escape
- **Smart navigation** - Save/Cancel return you to game details
- **Auto-refresh** - Changes reflect immediately

---

## 🐛 Bug Fixes

- Fixed hotkeys triggering while editing (e.g., Start button opening settings)
- Fixed controls editor showing default values instead of user configs
- Fixed missing XML elements causing save errors
- Fixed install modal not refreshing library on close

---

## 📊 Changes Since v1.3.1

### New Features
- ✅ Complete in-app settings editor
- ✅ Complete in-app controls remapping
- ✅ Real-time gamepad/keyboard input capture
- ✅ Enhanced install success modal with setup flow
- ✅ Input API relocated to Controls section
- ✅ Escape key modal closing

### Technical Improvements
- ✅ 2 new server endpoints for game profile editing
- ✅ 5 new files (settingsEditManager, controlsEditManager, CSS)
- ✅ ~1,200+ lines of new code
- ✅ Smart input interference prevention
- ✅ XML auto-creation for missing elements

### Bug Fixes
- ✅ Hotkey conflicts in modals
- ✅ UserProfile data loading
- ✅ XML element creation
- ✅ Library refresh on modal close

---

## 📥 Installation

### New Users
1. Extract into your TeknoParrot folder
2. Double-click `start.bat`
3. Done!

### Upgrading from v1.3.1 or Earlier
1. **Backup your `storage/` folder** (preserves all your data)
2. Delete old ParrotOrganizer folder
3. Extract v1.5.0
4. Copy your `storage/` folder back
5. Launch with `start.bat`

Your preferences, favorites, and custom profiles are preserved!

---

## 🎯 Key Capabilities Now Available

With v1.5.0, you can now do **everything** from ParrotOrganizer:
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

## 📖 Full Changelog

For complete technical details, see [CHANGELOG_v1.5.0.md](CHANGELOG_v1.5.0.md)

---

## 🔗 Links

- **Documentation:** [README.md](README.md)
- **Report Issues:** GitHub Issues
- **TeknoParrot:** https://teknoparrot.com

---

**Happy Gaming! 🎮🦜**
