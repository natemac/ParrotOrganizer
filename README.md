# 🦜 ParrotOrganizer

**A modern, feature-rich web interface for managing your TeknoParrot arcade game library.**

Browse, filter, search, and organize 450+ TeknoParrot games with a beautiful, intuitive UI. Add games to your library, hide unwanted titles, and launch games with one click - all from your browser.

![Version](https://img.shields.io/badge/version-1.0-blue)
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
- **Favorites System** - Mark games as favorites with star badges and filtering
- **Multi-Select & Batch Operations** - Select multiple games and batch add/remove/favorite
- **Hide Games** - Hide games you don't want to see with persistent localStorage
- **Installation Tracking** - See which games are installed vs available
- **Live Launch Status** - Real-time indicator shows if TeknoParrotUI is running

### 🔍 Search & Filter
- **Real-time Search** - Search games by name instantly
- **Installation Status** - Filter by All / Installed / Not Installed
- **Genre Filter** - Shooter, Fighting, Racing, Sports, Rhythm, and more
- **Platform Filter** - Lindbergh, Namco System, Taito Type X, RingEdge, etc.
- **Emulator Filter** - Filter by emulator type (Lindbergh, OpenParrot, etc.)
- **Release Year** - Filter by year range
- **GPU Compatibility** - Filter by Nvidia/AMD/Intel confirmed compatibility
- **Advanced Filters** - Subscription-only, Test Mode, Gun Games, 64-bit, Requires Admin
- **Show Hidden Games** - Toggle to reveal games you've hidden

### 📊 Sorting & Views
- **Multiple Sort Options** - Name, Year, Platform, Genre, Installation Status
- **Grid View** - Beautiful game cards with icons (adjustable 2-8 columns)
- **List View** - Compact table layout
- **Statistics** - Total games, installed count, filtered results

### 💻 Modern Interface
- **Responsive Design** - Works on all screen sizes
- **Dark Theme** - Easy on the eyes
- **GPU Indicators** - Visual indicators for Nvidia/AMD/Intel compatibility
- **Subscription Badges** - See which games require Patreon subscription
- **Game Details Modal** - View full game information, metadata, and known issues

### ⚙️ Convenience Features
- **Auto-Scan on Startup** - Automatically scans for new games when launched
- **Refresh Button** - Manually refresh game list without restarting
- **Exit Button** - Cleanly shutdown server and close app
- **Keyboard Shortcuts** - Ctrl+R to refresh, Esc to close modals
- **Portable** - Works from any drive or folder location

---

## 🚀 Quick Start

### Prerequisites
- **TeknoParrot** installed
- **Node.js** `https://nodejs.org/en/download` (recommended) or Python 3
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

### Filtering & Searching

**Text Search:**
- Type in the search box to filter by game name

**Filters:**
- **Installation Status**: All / Installed Only / Not Installed
- **Genre**: Multi-select genre filter
- **Platform**: Multi-select platform filter
- **Emulator**: Multi-select emulator type filter
- **Year Range**: Min/max year inputs
- **GPU Compatibility**: Nvidia / AMD / Intel confirmed
- **Advanced**: Subscription, Test Mode, Gun Games, 64-bit, Admin Required, Show Hidden

**Sorting:**
- Click **Sort By** dropdown: Name, Year, Platform, Genre, Status
- Click **↑/↓** button to toggle ascending/descending

**Clear All:**
- Click **Clear All Filters** button to reset everything

### Adjusting Grid Columns

- Use the **Columns** slider at the top of the game grid
- Adjust from 2 to 8 columns per row
- Setting is saved in your browser

### Keyboard Shortcuts

- `Ctrl+R` - Refresh game list
- `Esc` - Close modal
- `F5` - Reload page

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
│       ├── pathManager.js       # File path handling
│       ├── dataLoader.js        # XML/JSON parsing
│       ├── gameManager.js       # Game data management
│       ├── filterManager.js     # Filtering logic
│       ├── uiManager.js         # UI rendering
│       ├── launchManager.js     # Game launching
│       └── hiddenGamesManager.js # Hidden games (localStorage)
├── scripts/
│   ├── server.js                # Node.js server
│   └── generateGameLists.bat    # Manual game list generator
├── data/
│   ├── gameProfiles.txt         # Auto-generated game list
│   ├── userProfiles.txt         # Auto-generated installed list
│   └── platformAliases.json     # Platform name normalization
└── docs/
    ├── HOW_TO_USE.txt
    ├── QUICKSTART.md
    └── INSTALL.md
```

### Server Endpoints (Node.js version)

- `/__launch?profile=GameName.xml` - Launch a game
- `/__install?profile=GameName.xml` - Add a game to library (copy XML)
- `/__openTeknoParrot` - Open TeknoParrotUi.exe
- `/__shutdown` - Shutdown server and close app

---

## 🔧 Troubleshooting

### "Loading spinner forever" / CORS error

**Problem:** Opening `index.html` directly doesn't work

**Solution:**
- ✅ Use `start.bat` to launch via web server
- ❌ Don't double-click `index.html` directly

Modern browsers block ES6 modules from `file://` protocol. You must use `http://localhost`.

### "No games found"

**Solution:**
1. Verify ParrotOrganizer is inside TeknoParrot folder
2. Check that `GameProfiles/` folder exists with XML files
3. Restart using `start.bat`

### "Node.js is not installed"

**Solution:**
- Download Node.js from https://nodejs.org/
- Or use `start-python.bat` instead (requires Python 3)

### One-click launch not working

**Solution:**
- Make sure you're using `start.bat` (Node.js version)
- `start-python.bat` doesn't support one-click launch
- Verify `TeknoParrotUi.exe` exists in parent folder

### Icons not loading

**Solution:**
- Check that `Icons/` folder exists in TeknoParrot root
- Make sure you're accessing via `http://localhost`, not `file://`
- Some games may not have icons

### Command prompt stays open after exit

**Solution:**
- This is expected behavior when using Ctrl+C
- Use the ❌ Exit button in the app for clean shutdown

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
2. **Hide games you don't want** using the Hide checkbox in game details
3. **Filter installed games** to see only your library
4. **GPU indicators** show compatibility - hover for details
5. **Subscription badge** means game requires TeknoParrot Patreon
6. **Refresh button** updates the game list if you install games while app is running
7. **Exit button** cleanly shuts down server and closes app

---

## 📋 Feature Roadmap

### ✅ Implemented (v1.0)
- ✅ Browse all TeknoParrot games
- ✅ Rich filtering and search
- ✅ Game installation (copy GameProfile to UserProfile)
- ✅ One-click game launching
- ✅ Hide games with localStorage persistence
- ✅ GPU compatibility filtering
- ✅ Platform name normalization
- ✅ Adjustable grid columns
- ✅ Exit button with server shutdown

### 🔄 Future Ideas
- 🔄 Edit game settings directly in ParrotOrganizer
- 🔄 Batch operations (install multiple games)
- 🔄 Save filter presets
- 🔄 Export game lists (CSV/JSON)
- 🔄 Play count and last played tracking
- 🔄 Custom game notes
- 🔄 Favorites system

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
- **Documentation:** See `/docs` folder for detailed guides
- **Quick Start:** See `START_HERE.txt`

---

**Version:** 1.0
**Last Updated:** 2025-01-09
**Games Supported:** 450+

**Happy Gaming! 🎮🦜**
