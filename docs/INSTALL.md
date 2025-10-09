# Installation & Setup Guide

## Quick Install (TL;DR)

1. **Run the game list generator:**
   ```bash
   # In ParrotOrganizer folder:
   scripts\generateGameLists.bat
   ```

2. **Start the app:**
   ```bash
   # Double-click this file:
   start.bat
   ```

3. **Done!** Browser opens automatically at http://localhost:8000

---

## Why Can't I Just Open index.html?

**Short Answer:** Browser security (CORS) blocks ES6 modules from `file://` protocol.

**Longer Answer:**
Modern JavaScript uses ES6 modules (`import/export`). When you open an HTML file directly, the browser sees:
```
file:///D:/Emulation/TeknoParrot/ParrotOrganizer/index.html
```

The browser blocks module imports from `file://` URLs for security. You'll see errors like:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at file:///...
```

**Solution:** Run a local web server so the browser sees:
```
http://localhost:8000/index.html
```

Now modules work perfectly! ✅

---

## Setup Options

### Option 1: Python (Easiest)

**Requirements:** Python 3 (most systems have this)

**Check if you have Python:**
```bash
python --version
# or
python3 --version
```

**Install Python:**
- Windows: https://www.python.org/downloads/
- Linux: `sudo apt install python3` (usually pre-installed)
- Mac: Pre-installed, or use `brew install python3`

**Launch:**
```bash
# Double-click:
start.bat

# Or manually:
python -m http.server 8000
# Then open: http://localhost:8000
```

---

### Option 2: Node.js

**Requirements:** Node.js

**Check if you have Node:**
```bash
node --version
```

**Install Node.js:**
- Download from: https://nodejs.org/

**Launch:**
```bash
# Double-click:
start-node.bat

# Or manually:
npx serve -p 8000
# Then open: http://localhost:8000
```

---

### Option 3: Live Server (VS Code)

If you use VS Code:

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

### Option 4: Other Web Servers

Any web server works! Examples:

**PHP:**
```bash
php -S localhost:8000
```

**Ruby:**
```bash
ruby -run -ehttpd . -p8000
```

**BusyBox (Git Bash):**
```bash
busybox httpd -f -p 8000
```

---

## First-Time Setup

### Step 1: Generate Game Lists

ParrotOrganizer needs to know what games exist. Run this once:

**Windows:**
```bash
cd ParrotOrganizer
scripts\generateGameLists.bat
```

**Linux/Mac/Git Bash:**
```bash
cd ParrotOrganizer
chmod +x scripts/generateGameLists.sh
./scripts/generateGameLists.sh
```

**Manual (Git Bash):**
```bash
cd ../GameProfiles
ls *.xml | sed 's/.xml$//' > ../ParrotOrganizer/data/gameProfiles.txt

cd ../UserProfiles
ls *.xml 2>/dev/null | sed 's/.xml$//' > ../ParrotOrganizer/data/userProfiles.txt
```

This creates:
- `data/gameProfiles.txt` - List of all available games (~454 games)
- `data/userProfiles.txt` - List of installed games

### Step 2: Verify Installation

Check that these files exist:
```
ParrotOrganizer/
├── data/
│   ├── gameProfiles.txt   ← Should have ~454 lines
│   └── userProfiles.txt   ← Number of your installed games
├── index.html
└── start.bat
```

### Step 3: Launch

```bash
start.bat
```

Browser opens at http://localhost:8000

---

## Updating

When TeknoParrot adds new games:

1. Re-run the game list generator:
   ```bash
   scripts\generateGameLists.bat
   ```

2. Click the 🔄 Refresh button in the app

Or just reload the page (F5).

---

## Folder Structure

```
TeknoParrot/                    ← Main TeknoParrot folder
├── GameProfiles/               ← Game templates (454+ games)
├── UserProfiles/               ← Your installed games
├── Metadata/                   ← Game info (JSON)
├── Icons/                      ← Game artwork
├── GameSetup/                  ← Executable paths
├── TeknoParrotUi.exe          ← Main TeknoParrot launcher
└── ParrotOrganizer/           ← This app
    ├── index.html
    ├── start.bat              ← Launch this!
    ├── css/                   ← Stylesheets
    ├── js/                    ← JavaScript modules
    ├── data/                  ← Game lists (generated)
    └── scripts/               ← Helper scripts
```

---

## Troubleshooting

### Server won't start
- **Python not found:** Install Python 3
- **Port 8000 in use:** Change port in start.bat (8001, 8080, etc.)
- **Permission denied:** Run as administrator

### Games not loading
- **Check console (F12):** Look for error messages
- **Verify game lists exist:** Check `data/` folder
- **Re-run generator:** `scripts\generateGameLists.bat`

### Can't access from other devices
The server only runs on localhost. To access from other devices:

```bash
# Python (listen on all interfaces):
python -m http.server 8000 --bind 0.0.0.0

# Then access from other devices:
# http://YOUR_PC_IP:8000
```

---

## Advanced: Portable USB Installation

Want to run from a USB drive?

1. Install Python Portable: https://www.python.org/downloads/
2. Add Python to USB drive
3. Modify `start.bat` to use portable Python:
   ```batch
   set PATH=%~dp0\Python;%PATH%
   python -m http.server 8000
   ```

---

## Need Help?

- **Quick Start:** See [QUICKSTART.md](QUICKSTART.md)
- **Full Docs:** See [README.md](README.md)
- **Issues:** Check browser console (F12) for errors

**Common Solutions:**
1. ✅ Use `start.bat`, not `index.html`
2. ✅ Run `generateGameLists.bat` first
3. ✅ Make sure ParrotOrganizer is inside TeknoParrot folder
4. ✅ Access via http://localhost:8000, not file://

---

**Happy Gaming! 🎮🦜**
