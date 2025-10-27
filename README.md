# 🦜 ParrotOrganizer

**A modern, feature-rich web interface for managing your TeknoParrot arcade game library.**

Browse, filter, search, and organize 450+ TeknoParrot games with a beautiful, intuitive UI. Add games to your library, hide unwanted titles, and launch games with one click - all from your browser.

![Version](https://img.shields.io/badge/version-1.2.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---
<img width="2717" height="1906" alt="Screenshot 2025-10-09 165214" src="https://github.com/user-attachments/assets/ec3f428e-30b4-4994-97fa-bd2d4ecfbc56" />


## ✨ Features

### 🎮 Game Management
- **Browse 450+ Games** - Complete TeknoParrot game library with rich metadata
- **Add to Library** - Copy game profiles from GameProfiles to UserProfiles instantly
- **Remove from Library** - Remove games from your library with one click
- **One-Click Launch** - Launch installed games directly from the app (Node.js version)
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
- **Advanced Filters** - Subscription-only, Test Mode, Gun Games, 64-bit, Requires Admin, Hide Subscription Games
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
- **Dark Theme** - Easy on the eyes
- **GPU Indicators** - Visual indicators for Nvidia/AMD/Intel compatibility
- **Subscription Badges** - See which games require Patreon subscription
- **Enhanced Game Details Modal** - View full game information with organized sections:
  - **Controls Section** - Complete keybindings display (System/Player 1/Player 2)
  - **Game Settings** - All configuration values (Input API, Display Mode, Game Path, etc.)
  - Known issues, metadata, and installation info
- **Smart Keybindings Display** - Shows actual controller buttons (A, B, X, Y, LeftThumb, etc.)
- **Dynamic Clear Filters** - Sleek button with gradient styling, only visible when needed
- **Network Access** - Server can be accessed from other devices on local network or Tailscale

### ⚙️ Convenience Features
- **Auto-Scan on Startup** - Automatically scans for new games when launched
- **Refresh Button** - Manually refresh game list without restarting
- **Exit Button** - Cleanly shutdown server and close app
- **Keyboard Shortcuts** - Ctrl+R to refresh, Esc to close modals
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
3. Success modal appears
4. Click **Go To TeknoParrot** to configure game settings
   - Or click **Continue Browsing** to keep browsing
5. Game now shows as **✅ Installed**

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
- **Advanced**: Subscription-only, Test Mode, Gun Games, 64-bit, Admin Required, Hide Subscription Games, Show Hidden

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

- `Ctrl+R` - Refresh game list
- `Esc` - Close modal
- `F5` - Reload page

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
│   ├── styles.css         # Main styles
│   ├── filters.css        # Filter sidebar styles
│   └── game-grid.css      # Game grid/card styles
├── js/
│   ├── app.js             # Main application entry
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

### 🔄 Future Ideas
- 🔄 Edit game settings directly in ParrotOrganizer
- 🔄 Save filter presets
- 🔄 Export game lists (CSV/JSON)
- 🔄 Play count and last played tracking
- 🔄 Custom game notes

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

**Version:** 1.2.3
**Last Updated:** 2025-10-26
**Games Supported:** 450+

**Happy Gaming! 🎮🦜**
