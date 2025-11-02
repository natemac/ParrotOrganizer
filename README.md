<p align="center">
  <img width="512" height="512" alt="ParrotOrganizer_1024" src="https://github.com/user-attachments/assets/79f69c3d-ace3-43f0-9f87-7c94d0221e1d" />
</p>
<img src="https://github.com/user-attachments/assets/2a952bba-2039-4a5f-9ccc-b4c47d62339c" alt="Screenshot 1" width="100%" />

<div style="display:flex;">
  <img src="https://github.com/user-attachments/assets/b2117528-7c8f-481a-8a31-553843e17cf8" alt="Screenshot 2" style="width:49.5%;">
  <img src="https://github.com/user-attachments/assets/7a084d0b-9e15-489f-8dee-f53375687ef4" alt="Screenshot 3" style="width:49.5%;">
</div>

**A modern, feature-rich web interface for managing your TeknoParrot arcade game library.**

Browse, filter, search, and organize 450+ TeknoParrot games with a beautiful, intuitive UI. **NEW in v1.5.0:** Complete game setup from your browser - install games, configure paths, edit settings, and remap controls without ever opening TeknoParrot UI!

![Version](https://img.shields.io/badge/version-1.5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---
<img width="2717" height="1906" alt="Screenshot 2025-10-09 165214" src="https://github.com/user-attachments/assets/ec3f428e-30b4-4994-97fa-bd2d4ecfbc56" />

## 🆕 What's New in v1.5.0

**Complete In-App Game Setup!** You can now do everything from ParrotOrganizer:

- ⚙️ **Edit Game Settings** - Modify paths, display modes, graphics settings, and all game configuration
- 🎮 **Remap Controls** - Real-time gamepad/keyboard button mapping with visual feedback
- 🚀 **Streamlined Workflow** - Install → Setup → Launch all from one interface
- 🛡️ **Smart Input Management** - Hotkeys automatically disabled during editing

**No need to open TeknoParrot UI unless you want to!**

---

## ✨ Features

### 🎮 Game Management
- **Browse 450+ Games** - Complete TeknoParrot game library with rich metadata
- **Add to Library** - Copy game profiles from GameProfiles to UserProfiles instantly
- **🆕 Complete In-App Setup** - Configure everything without TeknoParrot UI:
  - **Edit Game Paths** - Set executable/ISO paths directly
  - **Edit Game Settings** - Modify all configuration values (display, graphics, etc.)
  - **Remap Controls** - Map gamepad buttons and keyboard keys in real-time
  - **No Context Switching** - Setup workflow keeps you in ParrotOrganizer
- **One-Click Launch** - Launch installed games directly from the app (Node.js version)
- **Modern Launch Popup** - Beautiful animated loading screen with game icon and title when launching
- **Launch TeknoParrot** - Quick button to open TeknoParrotUI from the header
- **Custom Game Profiles** - Add personal descriptions, YouTube links, tags, and custom names (stored as XML files)
- **Favorites System** - Mark games as favorites with star badges and filtering
- **Multi-Select & Batch Operations** - Select multiple games and batch add/remove/favorite
- **Hide Games** - Hide games you don't want to see (stored in preferences.json)
- **Installation Tracking** - See which games are installed vs available
- **Live Launch Status** - Real-time indicator shows if TeknoParrotUI is running

### 🔍 Search & Filter
- **Real-time Search** - Search games by name instantly
- **Smart Sorting** - Positioned at top for quick access (Name, Year, Platform, Genre, Status)
- **Installation Status** - Filter by All / Installed / Not Installed
- **Genre Filter** - Shooter, Fighting, Racing, Sports, Rhythm, and more (with game counts)
- **Platform Filter** - Lindbergh, Namco System, Taito Type X, RingEdge, etc. (with game counts)
- **Emulator Filter** - Filter by emulator type (Lindbergh, OpenParrot, etc.) (with game counts)
- **Release Year** - Filter by year range
- **GPU Compatibility** - Filter by Nvidia/AMD/Intel confirmed compatibility
- **Advanced Filters** - Subscription-only, Test Mode, Lightgun Games, 64-bit, Requires Admin, Hide Subscription Games
- **Show Hidden Games** - Toggle to reveal games you've hidden
- **Dynamic Clear Filters** - Modern button appears only when filters are active
- **Genre Aliases** - Automatic genre normalization (e.g., "Dino Fighter" → "Fighting")

### 📊 Sorting & Views
- **Multiple Sort Options** - Name, Year, Platform, Genre, Installation Status (conveniently at top)
- **Grid View** - Beautiful game cards with icons (adjustable 2-8 columns)
- **List View** - Compact table layout
- **Statistics** - Total games, installed count, filtered results
- **Game Counts** - See counts next to each filter option (e.g., "Fighting (109)", "Flying (5)")

### 💻 Modern Interface
- **Responsive Design** - Works on all screen sizes
- **Light & Dark Themes** - Toggle between light and dark modes
- **GPU Indicators** - Visual indicators for Nvidia/AMD/Intel compatibility
- **Subscription Badges** - See which games require Patreon subscription
- **Gamepad Navigation** - Full controller support for browsing and launching games
- **Enhanced Game Details Modal** - View full game information with organized sections:
  - **Controls Section** - Complete keybindings display (System/Player 1/Player 2) with Input API
  - **Game Settings** - All configuration values (Display Mode, Game Path, etc.)
  - **In-App Editing** - Edit game settings, controls, and game path directly in ParrotOrganizer
  - Known issues, metadata, and installation info
- **Smart Keybindings Display** - Shows actual controller buttons (A, B, X, Y, LeftThumb, etc.)
- **Controls Editor** - Remap game controls without leaving your browser:
  - Click Remap button and press any gamepad button or keyboard key
  - Real-time input capture from gamepad/keyboard
  - Clear button to unmap individual bindings
  - Edit Input API setting directly in controls editor
- **Settings Editor** - Edit game configuration in-app:
  - Modify game path and settings without TeknoParrot UI
  - Boolean, text, file, and dropdown field support
  - Returns to game details after saving
- **Dynamic Clear Filters** - Sleek button with gradient styling, only visible when needed
- **Network Access** - Server can be accessed from other devices on local network or Tailscale

### ⚙️ Convenience Features
- **Comprehensive Settings Panel** - Centralized control for all app settings
- **Auto-Scan on Startup** - Automatically scans for new games when launched
- **Export/Import Settings** - Backup and restore all preferences and custom data
- **Data Reset Options** - Clear favorites, hidden games, custom profiles, or everything
- **Refresh Button** - Manually refresh game list without restarting
- **Exit Button** - Cleanly shutdown server and close app
- **Keyboard & Gamepad Shortcuts** - Multiple control options
- **Portable** - Works from any drive or folder location
- **Debug Logging** - Automatic troubleshooting logs for support (see Debug Tools)

---

## 🚀 Quick Start

### Prerequisites
- **TeknoParrot** installed
- **Node.js** (recommended) or Python 3
- Modern web browser (Chrome, Firefox, Edge)

### Installation

1. **Extract ParrotOrganizer into your TeknoParrot folder:**
   ```
   TeknoParrot/
   ├── GameProfiles/
   ├── UserProfiles/
   ├── Metadata/
   ├── Icons/
   ├── TeknoParrotUi.exe
   └── ParrotOrganizer/     ← Extract here
       └── start.bat        ← Double-click this!
   ```

2. **Launch the app:**
   - Double-click `start.bat`
   - Browser opens automatically at `http://localhost:8000/ParrotOrganizer/`
   - Games load automatically!

3. **Done!** 🎉

---

## 📖 Usage Guide

### Adding a Game to Your Library

1. Find a game that shows "Not Installed"
2. Click the **📥 Add to Library** button
3. Success modal appears with three options:
   - **Setup Game** - Opens game details to configure path, settings, and controls in-app
   - **Go To TeknoParrot** - Opens TeknoParrot UI for configuration
   - **Continue Browsing** - Returns to game library
4. Game now shows as **✅ Installed**

### Launching a Game

1. Find an installed game
2. Click **🚀 Launch** button
3. Game launches directly in TeknoParrot!

> **Note:** One-click launch requires using `start.bat` (Node.js version). The Python version (`start-python.bat`) only supports browsing and filtering.

### Hiding Games

1. Open any game's detail page
2. Check **👁️ Hide this game from library**
3. Game is hidden from the main view
4. To view hidden games: Enable **Show Hidden Games** in Advanced Filters

### Editing Game Details

1. Open any game's detail page
2. Click **✏️ Edit Details** button
3. Add custom information:
   - **Custom Name**: Override the display name
   - **Description**: Add gameplay notes, tips, or any information
   - **YouTube Link**: Link to gameplay videos or tutorials
   - **Tags**: Add custom tags for better organization (comma-separated)
4. Click **💾 Save Changes**
5. Custom data is stored in `storage/CustomProfiles/[gameId].xml` and won't modify game files
6. Click **🗑️ Delete Custom Data** to remove all custom information

### Editing Game Settings (New in v1.5.0)

1. Open any installed game's detail page
2. Click **⚙️ Edit Settings** button in the Game Settings section
3. Modify game configuration:
   - **Game Path**: Change the executable/ISO path
   - **Boolean Settings**: Toggle checkboxes (Windowed, Test Mode, etc.)
   - **Dropdown Settings**: Select from available options
   - **Text Settings**: Edit values directly
4. Click **💾 Save Settings** to apply changes
5. Settings are saved to `UserProfiles/[gameId].xml`
6. Click **❌ Cancel** to return to game details without saving

### Editing Controls (New in v1.5.0)

1. Open any installed game's detail page
2. Click **⚙️ Edit** button in the Controls section
3. Configure controls:
   - **Input API**: Select XInput, DirectInput, or other options
   - **Remap Buttons**: Click "Remap" and press desired gamepad button or keyboard key
   - **Clear Bindings**: Click ✕ button to unmap a control
   - Real-time input capture detects button presses instantly
4. Click **💾 Save Controls** to apply changes
5. Controls are saved to `UserProfiles/[gameId].xml`
6. Click **❌ Cancel** to return to game details without saving

**Note:** Gamepad and keyboard shortcuts are automatically disabled while editing to prevent interference

### Filtering & Searching

**Text Search:**
- Type in the search box to filter by game name

**Filters:**
- **Installation Status**: All / Installed Only / Not Installed
- **Genre**: Multi-select genre filter (with game counts)
- **Platform**: Multi-select platform filter (with game counts)
- **Emulator**: Multi-select emulator type filter (with game counts)
- **Year Range**: Min/max year inputs
- **GPU Compatibility**: Nvidia / AMD / Intel confirmed
- **Advanced**: Subscription-only, Test Mode, Lightgun Games, 64-bit, Admin Required, Hide Subscription Games, Show Hidden

**Sorting:**
- **Sort By** dropdown at top: Name, Year, Platform, Genre, Status
- Click **↑/↓** button to toggle ascending/descending

**Clear All:**
- Modern **✕ Clear** button appears next to "Filters" title when filters are active
- Resets all filters and search with one click

### Adjusting Grid Columns

- Use the **Columns** slider at the top of the game grid
- Adjust from 2 to 8 columns per row
- Setting is saved in your browser

### Keyboard Shortcuts

ParrotOrganizer supports full keyboard navigation! Use your keyboard to browse and launch games:

**Navigation:**
- **Arrow Keys** - Navigate the game grid (syncs with mouse hover)
- **Enter** - Launch game / Install game
- **Space or D** - Show Game Details
- **F** - Toggle Favorite
- **G** - Quick Filter Menu

**Quick Actions:**
- **S** - Open Settings
- **Escape** - Close modal / Back
- **H** - Jump to first game (Home)
- **V** - Toggle Grid/List View
- **Page Up/Down** - Navigate by page

**System:**
- **F5** - Reload page

**Features:**
- Smart input detection (doesn't interfere when typing in search/input fields)
- Unified selection (keyboard, mouse, and gamepad all sync together)
- Visual selection ring shows current position
- Works seamlessly with mouse hover

### Gamepad Controls

ParrotOrganizer supports full gamepad navigation! Connect any controller (Xbox, PlayStation, etc.) and use it to browse and launch games:

**Navigation:**
- **D-Pad / Left Analog Stick** - Navigate the game grid
- **A Button** - Launch game / Select option
- **B Button** - Back / Cancel / Close modal
- **X Button** - Toggle Favorite
- **Y Button** - Show Game Details

**Quick Actions:**
- **START Button** - Open Settings
- **SELECT Button** - Toggle Grid/List View
- **L3 (Click Left Stick)** - Scroll to Top
- **LB / RB (Bumpers)** - Cycle through status filters (All / Installed / Not Installed)

**Settings:**
- Visual indicator shows gamepad connection status in header
- Enable/disable gamepad in Settings > Gamepad
- Adjust navigation speed and vibration feedback
- All settings saved automatically

**Gamepad Support Features:**
- Automatic detection and connection
- Visual selection highlight on game cards
- Navigate modals and menus
- Optional vibration feedback
- Works with any standard gamepad (Xbox, PlayStation, Generic)
- **Smart Focus Detection** - Automatically pauses when you launch a game, resumes when you return to browser

### Debug Tools (Troubleshooting)

ParrotOrganizer automatically logs all events to help diagnose issues:

**Accessing Debug Logs:**
1. Expand **🐛 Debug Tools** section in the sidebar (bottom of filters)
2. Click **📁 Open Log Folder** to view the `debug.log` file
3. Send this file to support if you encounter issues

**What Gets Logged:**
- Application startup and initialization
- Game data loading (successes and failures)
- Installation verification checks
- User actions (launch, install, remove)
- Errors with full details
- Performance metrics
- Node.js version and system information

**Log File Location:** `ParrotOrganizer/storage/debug.log`

**Debug Tools Options:**
- **📁 Open Log Folder** - Opens the storage folder in Windows Explorer
- **📄 View Logs in Console** - Displays logs in browser DevTools (F12)
- **🗑️ Clear Log File** - Deletes the log file (will be recreated on next startup)

**When to Send Logs:**
- Games aren't loading or populating
- Installation/launch errors
- Performance issues
- Any unexpected behavior

The log file is plain text and safe to share - it doesn't contain personal information.

---

## 🛠️ Technical Details

### Architecture

**Frontend:**
- Pure HTML5/CSS3/JavaScript (ES6 modules)
- No build process or dependencies
- Modular design with clean separation of concerns

**Backend:**
- Node.js HTTP server with file operations
- Python SimpleHTTPServer (read-only alternative)

**Data Sources:**
- `GameProfiles/` - Template XML files for all games
- `UserProfiles/` - Installed game configurations
- `Metadata/` - Rich JSON metadata (genre, year, GPU compatibility)
- `Icons/` - Game artwork and icons
- `storage/` - User preferences, custom profiles, and debug logs (portable file-based storage)

### File Structure

```
ParrotOrganizer/
├── start.bat              # Main launcher (Node.js - recommended)
├── start-python.bat       # Alternative launcher (Python - view only)
├── index.html             # Main application
├── README.md              # This file
├── START_HERE.txt         # Quick start guide
├── css/
│   ├── styles.css              # Main styles
│   ├── filters.css             # Filter sidebar styles
│   ├── game-grid.css           # Game grid/card styles
│   ├── settings.css            # Settings panel styles
│   ├── launch-popup.css        # Launch popup animations
│   ├── settings-edit.css       # Settings editor modal styles
│   └── controls-edit.css       # Controls editor modal styles
├── js/
│   ├── app.js                  # Main application entry
│   ├── settingsManager.js      # Settings panel
│   ├── gamepadManager.js       # Gamepad input handling
│   ├── gamepadIntegration.js   # Gamepad UI integration
│   ├── launchPopup.js          # Launch popup manager
│   └── modules/
│       ├── pathManager.js            # File path handling
│       ├── dataLoader.js             # XML/JSON parsing
│       ├── gameManager.js            # Game data management
│       ├── filterManager.js          # Filtering logic
│       ├── uiManager.js              # UI rendering
│       ├── launchManager.js          # Game launching
│       ├── preferencesManager.js     # User preferences (unified)
│       ├── customProfileManager.js   # Custom game profiles
│       ├── selectionManager.js       # Multi-select mode
│       ├── settingsEditManager.js    # Game settings editor (NEW v1.5.0)
│       ├── controlsEditManager.js    # Controls remapping editor (NEW v1.5.0)
│       ├── profileEditManager.js     # Shared edit field definitions
│       └── debugLogger.js            # Debug logging system
├── scripts/
│   ├── server.js                # Node.js server
│   └── generateGameLists.bat    # Manual game list generator
├── storage/                     # User data (portable)
│   ├── preferences.json         # All user preferences
│   ├── debug.log                # Automatic debug logging
│   ├── README.md                # Storage folder documentation
│   └── CustomProfiles/          # Individual XML files per game
│       ├── [gameId].xml
│       └── ...
└── data/
    ├── gameProfiles.txt         # Auto-generated game list
    ├── userProfiles.txt         # Auto-generated installed list
    ├── platformAliases.json     # Platform name normalization
    └── genreAliases.json        # Genre name normalization
```

### Server Endpoints (Node.js version)

**Game Operations:**
- `/__launch?profile=GameName.xml` - Launch a game
- `/__install?profile=GameName.xml` - Add a game to library (copy XML)
- `/__remove?profile=GameName.xml` - Remove a game from library
- `/__openTeknoParrot` - Open TeknoParrotUi.exe
- `/__userProfiles` - Get list of installed games (dynamic endpoint)
- `/__launchStatus` - Check if TeknoParrotUI is running
- `/__getGameProfile?id=gameId` - Get game profile XML (UserProfile or GameProfile)
- `/__updateGameSettings?id=gameId` - Update game settings/controls XML

**User Data:**
- `/__storage/read?file=` - Read user preference files
- `/__storage/write?file=` - Write user preference files
- `/__customProfile/read?id=` - Read custom game profile XML
- `/__customProfile/write?id=` - Write custom game profile XML
- `/__customProfile/delete?id=` - Delete custom game profile XML

**Debug & Diagnostics:**
- `/__writeDebugLog` - Append logs to debug.log file
- `/__serverLogs` - Get server-side logs
- `/__openLogFolder` - Open storage folder in Windows Explorer
- `/__clearDebugLog` - Clear the debug.log file
- `/__checkTeknoParrotExe` - Verify TeknoParrotUi.exe exists
- `/__serverInfo` - Get Node.js version and system info

**System:**
- `/__shutdown` - Shutdown server and close app

### Network Access

The server binds to `0.0.0.0` by default, allowing access from:
- **Local network**: `http://<your-ip>:8000/ParrotOrganizer/`
- **Tailscale**: `http://<tailscale-ip>:8000/ParrotOrganizer/`
- **Localhost**: `http://localhost:8000/ParrotOrganizer/`

You can customize the bind address and port using environment variables:
- `BIND_ADDR` - Default: `0.0.0.0`
- `PORT` - Default: `8000`

---

## 🔧 Troubleshooting

### "Loading spinner forever" / CORS error

**Problem:** Opening `index.html` directly doesn't work

**Solution:**
- ✅ Use `start.bat` to launch via web server
- ❌ Don't double-click `index.html` directly

Modern browsers block ES6 modules from `file://` protocol. You must use `http://localhost`.

### "No games found" or "Games not loading"

**Solution:**
1. Verify ParrotOrganizer is inside TeknoParrot folder
2. Check that `GameProfiles/` folder exists with XML files
3. Restart using `start.bat`
4. **Check debug logs:** Expand "Debug Tools" and click "Open Log Folder" to view `debug.log`

**What the logs will show:**
- Which folders are accessible
- How many games were found
- Which games failed to load and why
- Installation verification results

### "Node.js is not installed"

**Solution:**
- Download Node.js from https://nodejs.org/
- Or use `start-python.bat` instead (requires Python 3)

**Check Node.js version in logs:**
The debug log automatically records your Node.js version and system info.

### One-click launch not working

**Solution:**
- Make sure you're using `start.bat` (Node.js version)
- `start-python.bat` doesn't support one-click launch
- Verify `TeknoParrotUi.exe` exists in parent folder
- **Check debug logs** to see if TeknoParrotUi.exe was detected

### Icons not loading

**Solution:**
- Check that `Icons/` folder exists in TeknoParrot root
- Make sure you're accessing via `http://localhost`, not `file://`
- Some games may not have icons

### Command prompt stays open after exit

**Solution:**
- This is expected behavior when using Ctrl+C
- Use the ❌ Exit button in the app for clean shutdown

### Getting Help

**When reporting issues, always include your debug.log file:**
1. Open Debug Tools in the sidebar
2. Click "Open Log Folder"
3. Attach `debug.log` to your issue report

The log file contains:
- System information (OS, Node.js version)
- Installation verification results
- Game loading details
- Error messages with context
- Performance metrics

---

## 🎯 Comparison: Node.js vs Python Version

| Feature | Node.js (`start.bat`) | Python (`start-python.bat`) |
|---------|----------------------|----------------------------|
| Browse Games | ✅ | ✅ |
| Filter & Search | ✅ | ✅ |
| View Game Details | ✅ | ✅ |
| **Add Games to Library** | ✅ | ❌ |
| **Launch Games** | ✅ | ❌ |
| **Exit Button** | ✅ | ❌ |
| Hide Games | ✅ | ✅ |

**Recommendation:** Use **Node.js version** for full features!

---

## 💡 Tips & Best Practices

1. **Use Node.js version** for full features (install, launch, exit)
2. **Add custom game info** - Use Edit Details to add descriptions, YouTube links, and tags
3. **Hide games you don't want** using the Hide checkbox in game details
4. **Filter installed games** to see only your library
5. **GPU indicators** show compatibility - hover for details
6. **Subscription badge** means game requires TeknoParrot Patreon
7. **Refresh button** updates the game list if you install games while app is running
8. **Exit button** cleanly shuts down server and closes app
9. **Game counts** next to filters help you see available games at a glance
10. **Dynamic clear button** appears only when you have active filters
11. **Access from other devices** - use your IP address on local network or Tailscale
12. **Custom data is portable** - All preferences stored in `storage/` folder (copy it to backup or transfer)
13. **Debug logs are automatic** - If something goes wrong, check Debug Tools → Open Log Folder for `debug.log`

---

## 📋 Feature Roadmap

### ✅ Implemented (v1.0)
- ✅ Browse all TeknoParrot games
- ✅ Rich filtering and search
- ✅ Game installation (copy GameProfile to UserProfile)
- ✅ One-click game launching
- ✅ Hide games with localStorage persistence
- ✅ Favorites system with star badges
- ✅ Multi-select & batch operations
- ✅ GPU compatibility filtering
- ✅ Platform name normalization
- ✅ Genre name normalization with aliases
- ✅ Adjustable grid columns
- ✅ Exit button with server shutdown
- ✅ Game counts in filter dropdowns
- ✅ Dynamic clear filters button
- ✅ Network access (LAN/Tailscale support)
- ✅ Hide subscription games filter
- ✅ Sort controls at top of filters

### ✅ New in v1.2
- ✅ **Launch TeknoParrot Button** - Quick access to open TeknoParrotUI from header
- ✅ **Complete Controls Display** - View all keybindings in game details
  - System controls (Test, Service, Coin)
  - Player 1 & Player 2 controls side-by-side
  - Smart detection of configured vs unassigned buttons
  - Clean button names (A, B, X, Y, LeftThumb, etc.)
- ✅ **Comprehensive Game Settings Section** - View all game configuration:
  - Game path and installation directory
  - Input API, display mode, and graphics settings
  - Game-specific settings grouped by category
  - Boolean settings show as ✅ Enabled / ❌ Disabled
- ✅ **Custom Game Profiles** - Add your own metadata without modifying game files:
  - ✏️ Edit button in game details modal
  - Custom game names (override display name)
  - Personal descriptions and gameplay notes
  - YouTube video links for gameplay/tutorials
  - Custom tags for better organization
  - Data stored as individual XML files in `storage/CustomProfiles/`
  - Delete custom data at any time
- ✅ **Unified Preferences System** - All user data in portable file storage:
  - Single `preferences.json` file for all settings
  - Favorites list (portable across browsers)
  - Hidden games list (portable across browsers)
  - UI preferences (grid columns, view mode, theme)
  - No more localStorage - fully portable
- ✅ **Improved Modal Organization** - Better layout flow in game details
- ✅ **Automatic Debug Logging** - Comprehensive troubleshooting system:
  - Automatic logging to `storage/debug.log`
  - Client-side and server-side event tracking
  - Installation verification with detailed checks
  - Performance metrics and timing
  - Node.js version and system information
  - Debug Tools UI for easy log access
  - One-click folder opening
  - Plain text format for easy sharing

### ✅ New in v1.3.1
- ✅ **Keyboard Navigation** - Complete keyboard control support
  - Arrow keys for grid navigation (synced with mouse and gamepad)
  - Enter to launch/install games
  - Space or D for game details
  - F to toggle favorites
  - G for quick filter menu
  - S for settings
  - Escape to close modals
  - H for home, V for view toggle
  - Page Up/Down for fast navigation
  - Smart input detection (doesn't interfere with typing)
  - Unified selection system (keyboard, mouse, and gamepad all sync)
- ✅ **Enhanced UI Polish** - Refined visual experience
  - Mouse hover shows selection ring (matches keyboard/gamepad selection)
  - Unified selection system (mouse position syncs with keyboard/gamepad navigation)
  - Larger, cleaner loading screen with breathing logo animation
  - Loading text and spinner tripled in size for better visibility
  - Debug tools removed from sidebar (accessible via Settings)
  - Genre field added to CustomProfile editing (single and batch edit)
  - Improved loading screen layout (logo → text → spinner)

### ✅ New in v1.3.0
- ✅ **Full Gamepad Navigation** - Complete controller support
  - Navigate grid with D-pad/analog stick
  - Page navigation with LT/RT triggers (jump 3 rows at a time)
  - Button mapping: A (select), B (back), X (favorite), Y (details)
  - Quick filter menu with SELECT button (navigate and toggle favorites)
  - Quick actions: START (settings), LB/RB (cycle filters), L3 (home)
  - Visual selection indicator with blue glow and pulse animation
  - Auto-detection and connection status
  - Configurable navigation speed and vibration
  - Smart focus detection (pauses when game launches)
- ✅ **Comprehensive Settings Panel** - Centralized configuration
  - Tabbed interface: Appearance, Data Management, Gamepad, Advanced, About
  - Light & Dark theme toggle with proper text contrast
  - Auto-save design (no manual save button needed)
  - Grid columns slider (2-8 columns with persistence)
  - Grid view information toggles (Genre, Platform, Year, GPU)
  - Auto-scan and debug mode toggles
  - Refresh game list from Advanced tab
  - 2-column grid layout for space efficiency
- ✅ **Modern Game Launch Popup** - Beautiful loading experience
  - Animated popup with game icon and title
  - Purple gradient background with rotating glow effects
  - Pulsing game icon and loading spinner
  - Auto-hides after 3 seconds
  - Smooth fade-in/out animations
  - Responsive design for all screen sizes
- ✅ **Unified Editing Framework** - Consistent data management
  - Single source of truth for edit fields (single and batch edit)
  - Pre-populates with existing TeknoParrot data (GPU, platform, year, emulator, lightgun game)
  - Sticky footer for save buttons (always visible, prevents accidental data loss)
  - Condensed form layout with reduced spacing and no hint text
  - Tri-state lightgun game property (keep/add/remove)
  - Batch edit with accurate success count reporting
- ✅ **Two-Tier CustomProfile System** - Creator & user profiles
  - `data/CustomProfiles/` - Creator-recommended profiles (persistent, not reset)
  - `storage/CustomProfiles/` - User's personal edits (can be reset)
  - Three-tier hierarchy: TeknoParrot → Creator → User (user always wins)
  - Allows curated recommendations while preserving user control
  - Refresh properly clears cache and reloads from disk
- ✅ **Enhanced Search** - Comprehensive text search
  - Searches game names, internal names, emulation profiles
  - **NEW:** Searches custom tags, genres, platforms, emulators, and descriptions
  - Case-insensitive partial matching
  - Helps find games by any metadata field
- ✅ **Quick Filter Menu** - Fast controller-friendly filtering
  - SELECT button opens quick filter popup
  - Navigate with D-pad, select with A button
  - Shows current filter state with visual indicators (blue dots)
  - Toggle favorites on/off (menu stays open)
  - All/Installed/Not Installed status filters (menu closes after selection)
  - Gamepad-optimized with selection highlighting
- ✅ **UI Optimizations** - Cleaner, more efficient interface
  - View toggle buttons moved to sidebar (always visible)
  - Settings reorganized with 2-column grid layout (minimal scrolling)
  - Light theme text contrast fixes for readability
  - Data management with confirmation prompts (no redundant success alerts)
  - Removed redundant UI elements (close buttons, unnecessary text)
  - Grid columns slider integrated into Settings → Appearance
- ✅ **Data Management Tools** - Complete control over user data
  - Reset favorites, hidden games, or custom profiles individually
  - Reset all UI preferences to defaults
  - Nuclear "Reset Everything" option with double confirmation
  - Creator profiles preserved during reset operations
  - All actions confirmed with single prompt (no extra alerts)
- ✅ **Export/Import Settings** - Backup and restore
  - Export all preferences and custom profiles to JSON
  - Import settings from backup file
  - Includes version info and export date
  - Portable configuration management
- ✅ **Enhanced About Section** - Clean and informative
  - Prominent GitHub link for updates and changelogs
  - Credits and TeknoParrot official link
  - Removed redundant close button
  - Clean layout with essential information only

### ✅ New in v1.5.0
- ✅ **In-App Game Settings Editor** - Edit game configuration without TeknoParrot UI
  - Modify game paths, display settings, and all config values
  - Boolean toggles, dropdowns, text fields, and file paths
  - Real-time XML editing with proper serialization
  - Returns to game details after saving
  - Automatic refresh to reflect changes
- ✅ **In-App Controls Editor** - Remap controls directly in browser
  - Real-time gamepad button capture using Gamepad API
  - Keyboard input detection with proper event handling
  - Visual feedback during input listening (pulsing animation)
  - XInput button code mapping (A=4096, B=8192, etc.)
  - Clear button (✕) to unmap individual controls
  - Input API dropdown integrated into controls editor
  - Grouped display: System Controls, Player 1, Player 2
  - Creates missing XML elements (BindName/BindNameXi) automatically
  - Reads from UserProfiles first, falls back to GameProfiles
- ✅ **Enhanced Install Success Modal** - Better post-installation workflow
  - Three-button design: Setup Game, Go To TeknoParrot, Continue Browsing
  - "Setup Game" opens game details for immediate configuration
  - Updated messaging reflects in-app editing capabilities
  - Escape key and X button now refresh library properly
- ✅ **Smart Input Interference Prevention** - Hotkeys disabled during editing
  - Gamepad shortcuts automatically paused when modals open
  - Keyboard shortcuts disabled in all edit modes
  - Event capture phase interception prevents conflicts
  - Seamless resume when returning to main view
- ✅ **Input API Moved to Controls Section** - Better organization
  - Input API setting now in Controls section (was in Game Settings)
  - Styled consistently with control bindings
  - Editable in both game details and controls editor
- ✅ **Improved Modal Navigation** - Better user flow
  - Save/Cancel in settings/controls editors return to game details
  - Modal close actions properly refresh library when needed
  - Consistent navigation throughout app

### 🔄 Future Ideas
- 🔄 Save filter presets
- 🔄 Export game lists (CSV/JSON)
- 🔄 Play count and last played tracking
- 🔄 Batch control remapping

---

## 🤝 Contributing

This is a personal project for managing TeknoParrot installations. Feel free to:
- Fork and customize for your needs
- Submit bug reports
- Suggest features
- Share improvements

---

## 📄 License

**MIT License** - Free to use and modify

---

## 🙏 Credits

- **TeknoParrot Team** for the amazing emulator
- **Game metadata** from TeknoParrot's official repositories
- **Icons** from TeknoParrot's icon collection

---

## 📞 Support

- **Issues:** Report bugs via GitHub Issues
- **Documentation:** This README contains complete documentation
- **Quick Start:** Double-click `start.bat` and you're ready!

---

**Version:** 1.5.0
**Last Updated:** 2025-11-02
**Games Supported:** 450+

**Happy Gaming! 🎮🦜**
