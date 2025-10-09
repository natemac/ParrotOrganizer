# ParrotOrganizer - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- TeknoParrot installed
- Modern web browser (Chrome, Firefox, Edge)
- **Python 3** or **Node.js** (for local web server)

### Installation

1. **Place ParrotOrganizer in TeknoParrot folder:**
   ```
   TeknoParrot/
   ├── GameProfiles/
   ├── UserProfiles/
   ├── Metadata/
   ├── Icons/
   ├── TeknoParrotUi.exe
   └── ParrotOrganizer/     ← This folder
       └── start.bat        ← Run this file!
   ```

2. **Launch the app:**

   **⚠️ IMPORTANT: You cannot just open index.html directly!**

   Due to browser security (CORS), you must run a local web server.

   **Option A - Python (Recommended):**
   - Double-click `start.bat`
   - Automatically scans for games
   - Browser opens at http://localhost:8000

   **Option B - Node.js:**
   - Double-click `start-node.bat`
   - Automatically scans for games
   - Browser opens at http://localhost:8000

   The launchers **automatically scan for games** every time, so new games
   appear immediately after TeknoParrot updates - no manual steps needed!

   **Manual Options (if you prefer):**

   Python:
   ```bash
   cd ParrotOrganizer
   scripts\generateGameLists.bat  # Only needed if not using start.bat
   python -m http.server 8000
   ```

   Node.js:
   ```bash
   cd ParrotOrganizer
   scripts\generateGameLists.bat  # Only needed if not using start-node.bat
   npx serve -p 8000
   ```

## 📋 Features

### Current Features (v0.1)
✅ Browse all TeknoParrot games (454+ titles)
✅ Filter by genre, platform, year, GPU compatibility
✅ Search games by name
✅ Sort by name, year, platform, genre, installation status
✅ View game details and metadata
✅ See installed vs not installed games
✅ Grid and list view options
✅ GPU compatibility indicators (Nvidia/AMD/Intel)
✅ Advanced filters (test mode, gun games, 64-bit, etc.)
✅ Launch command generation (copy to clipboard)

### Coming Soon (Phase 2)
🔄 Install/configure games directly
🔄 Batch edit controller bindings
🔄 Save filter presets
🔄 Export game lists
🔄 Direct game launching (requires protocol handler)

## 🎮 Usage

### Browsing Games
- All games load automatically on startup
- Use the sidebar filters to narrow down games
- Click on a game card to see full details

### Searching
- Type in the search box to filter by game name
- Search is case-insensitive and searches partial matches

### Filtering
- **Status**: All / Installed Only / Not Installed
- **Genre**: Shooter, Fighting, Racing, etc.
- **Platform**: Lindbergh, Namco, Taito, etc.
- **Year**: Range slider (2000-2024)
- **GPU**: Filter by Nvidia/AMD/Intel compatibility
- **Advanced**: Test mode, gun games, 64-bit, requires admin

### Sorting
- Choose sort field from dropdown
- Click arrow button to toggle ascending/descending
- Available sorts: Name, Year, Platform, Genre, Status

### Launching Games
1. Click "Launch" button on installed game
2. Copy the command shown in the dialog
3. Paste into Command Prompt or PowerShell
4. Game launches in TeknoParrot!

**Command format:**
```
"D:\Emulation\TeknoParrot\TeknoParrotUi.exe" --profile="D:\Emulation\TeknoParrot\UserProfiles\GameName.xml"
```

## 🔧 Troubleshooting

### "Spinning loading circle forever" or "CORS error"
**Problem:** Opening index.html directly causes CORS errors
**Solution:** Use `start.bat` or `start-node.bat` to run a local web server
- You MUST use a web server, browsers block ES6 modules from file://
- Install Python 3 or Node.js if you don't have them
- See installation instructions above

### "No games found"
- Make sure you've run `generateGameLists.bat`
- Check that `data/gameProfiles.txt` exists and has content
- Refresh the page (F5)

### "TeknoParrot installation not found"
- Verify ParrotOrganizer is inside TeknoParrot folder
- Check that `TeknoParrotUi.exe` exists in parent folder
- Make sure you're accessing via http://localhost, not file://

### Icons not loading
- Check that Icons folder exists in TeknoParrot directory
- Some games may not have icons yet

### Games not launching
- For now, you must manually copy/paste the command
- Future versions will support direct launching

## ⌨️ Keyboard Shortcuts

- `Ctrl+R` / `Cmd+R`: Refresh game list
- `Escape`: Close modal dialog

## 📝 Tips

1. **First Time**: Run the batch script to generate game lists
2. **Updates**: When TeknoParrot updates, click Refresh button
3. **Performance**: Filtering 454 games is instant!
4. **GPU Issues**: Hover over GPU icons to see known issues
5. **Installed Games**: Games show ✅ Installed badge if configured

## 🆘 Need Help?

- Check the main [README.md](README.md) for full documentation
- Report issues on GitHub
- All game data comes from TeknoParrot's own files

---

**Current Version:** 0.1 Beta
**Last Updated:** 2025-01-08
**Games Supported:** 454+
