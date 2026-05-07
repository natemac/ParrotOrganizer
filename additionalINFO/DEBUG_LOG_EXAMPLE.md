# Debug Log Example

This document shows an example of what information is logged to `storage/debug.log` when ParrotOrganizer starts up.

## Server-Side Logging (Node.js)

### 1. System Information
```
2025-10-26T10:30:40.100Z [+0.00s] 🖥️ [SERVER] [Server] System Information
{
  "nodeVersion": "v20.10.0",
  "platform": "win32",
  "arch": "x64",
  "osRelease": "10.0.22631",
  "osType": "Windows_NT",
  "cpuCount": 8,
  "totalMemoryGB": "31.75"
}
```

### 2. Server Initialization
```
2025-10-26T10:30:40.150Z [+0.05s] 🖥️ [SERVER] [Server] Server script initialized
{
  "root": "D:\\Emulation\\TeknoParrot",
  "appFolder": "ParrotOrganizer-1.2.2",
  "workingDirectory": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\scripts"
}
```

### 3. ParrotOrganizer Installation Verification
```
2025-10-26T10:30:40.200Z [+0.10s] 🖥️ [SERVER] [Server] Verifying ParrotOrganizer installation

2025-10-26T10:30:40.220Z [+0.12s] ✅ [SERVER] [Server] All ParrotOrganizer operational files found
{
  "filesChecked": 5
}

2025-10-26T10:30:40.240Z [+0.14s] ✅ [SERVER] [Server] ParrotOrganizer location verified - inside TeknoParrot folder
{
  "teknoParrotExe": "D:\\Emulation\\TeknoParrot\\TeknoParrotUi.exe"
}

2025-10-26T10:30:40.260Z [+0.16s] 🖥️ [SERVER] [Server] Storage folder exists
{
  "path": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\storage",
  "files": ["CustomProfiles", "debug.log", "preferences.json", "README.md"],
  "message": "This folder contains user-specific data (preferences, custom profiles, debug logs)"
}
```

### 4. TeknoParrot Folder Structure Scan
```
2025-10-26T10:30:40.200Z [+0.10s] 🖥️ [SERVER] [Server] Scanning TeknoParrot folder structure

2025-10-26T10:30:40.250Z [+0.15s] ✅ [SERVER] [Server] GameProfiles folder scanned
{
  "folder": "D:\\Emulation\\TeknoParrot\\GameProfiles",
  "xmlFileCount": 156
}

2025-10-26T10:30:40.270Z [+0.17s] ✅ [SERVER] [Server] UserProfiles folder scanned
{
  "folder": "D:\\Emulation\\TeknoParrot\\UserProfiles",
  "xmlFileCount": 42
}

2025-10-26T10:30:40.290Z [+0.19s] 🖥️ [SERVER] [Server] Metadata folder scanned
{
  "folder": "D:\\Emulation\\TeknoParrot\\Metadata",
  "jsonFileCount": 145
}

2025-10-26T10:30:40.310Z [+0.21s] 🖥️ [SERVER] [Server] Icons folder scanned
{
  "folder": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\Icons",
  "imageFileCount": 127
}
```

### 5. Folder Scan Summary
```
2025-10-26T10:30:40.330Z [+0.23s] ✅ [SERVER] [Server] Folder structure scan complete
{
  "gameProfilesAvailable": 156,
  "userProfilesInstalled": 42,
  "metadataFiles": 145,
  "iconFiles": 127
}
```

### 6. Game List Verification
```
2025-10-26T10:30:40.350Z [+0.25s] 🖥️ [SERVER] [Server] Verifying game list generation from startup scan

2025-10-26T10:30:40.370Z [+0.27s] ✅ [SERVER] [Server] data/ folder exists
{
  "dataFolder": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\data"
}

2025-10-26T10:30:40.400Z [+0.30s] ✅ [SERVER] [Server] gameProfiles.txt loaded successfully
{
  "file": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\data\\gameProfiles.txt",
  "gameCount": 156,
  "sampleGames": ["segartv", "hod4", "maimai", "wmmt5", "initiald"]
}

2025-10-26T10:30:40.420Z [+0.32s] ✅ [SERVER] [Server] userProfiles.txt loaded successfully
{
  "file": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\data\\userProfiles.txt",
  "installedCount": 42,
  "installedGames": ["segartv", "maimai", "wmmt5", "hod4", "initiald"]
}
```

---

## Client-Side Logging (Browser)

### 1. Client Environment Information
```
2025-10-26T10:30:45.123Z [+0.00s] 🦜 [CLIENT] [App] Client Environment Information
{
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "platform": "Win32",
  "language": "en-US",
  "cookiesEnabled": true,
  "onLine": true,
  "screenResolution": "1920x1080",
  "windowSize": "1900x1040",
  "pixelRatio": 1,
  "url": "http://localhost:8000/ParrotOrganizer-1.2.2/",
  "protocol": "http:",
  "hostname": "localhost",
  "port": "8000"
}
```

### 2. Application Initialization
```
2025-10-26T10:30:45.150Z [+0.03s] 🦜 [CLIENT] [App] Application initialization started
```

### 3. Installation Verification
```
2025-10-26T10:30:45.200Z [+0.08s] 🦜 [CLIENT] [PathManager] Starting installation verification
2025-10-26T10:30:45.350Z [+0.23s] ✅ [CLIENT] [PathManager] Node.js server running
{
  "nodeVersion": "v20.10.0",
  "platform": "win32",
  "cwd": "D:\\Emulation\\TeknoParrot\\ParrotOrganizer-1.2.2\\scripts"
}
2025-10-26T10:30:45.400Z [+0.28s] 🦜 [CLIENT] [PathManager] Installation verification complete
{
  "passed": 8,
  "total": 8,
  "checks": { ... }
}
```

### 4. Game Data Loading
```
2025-10-26T10:30:45.500Z [+0.38s] 🦜 [CLIENT] [DataLoader] Starting game data load

2025-10-26T10:30:45.600Z [+0.48s] 📊 [CLIENT] [DataLoader] Game profile list loaded
{
  "count": 156
}

2025-10-26T10:30:45.650Z [+0.53s] 📊 [CLIENT] [DataLoader] User profile list loaded
{
  "count": 42
}

2025-10-26T10:30:45.700Z [+0.58s] 🦜 [CLIENT] [DataLoader] Game scan summary
{
  "totalAvailableGames": 156,
  "installedGames": 42,
  "notYetInstalled": 114,
  "sampleAvailableGames": ["segartv", "hod4", "maimai", "wmmt5", ...],
  "sampleInstalledGames": ["segartv", "maimai", "wmmt5", ...]
}
```

### 5. Game Loading Completion
```
2025-10-26T10:30:47.500Z [+2.38s] ✅ [CLIENT] [DataLoader] Game data loading complete
{
  "totalGamesScanned": 156,
  "totalGamesLoaded": 156,
  "installedGames": 42,
  "notInstalledGames": 114,
  "failedToLoad": 0,
  "dataBreakdown": {
    "gameProfiles": 156,
    "userProfiles": 42,
    "metadata": 145,
    "gameSetup": 12
  },
  "performance": {
    "gameLoadDuration": "1.80s",
    "totalDuration": "1.85s"
  }
}
```

### 6. Application Initialization Complete
```
2025-10-26T10:30:48.000Z [+2.88s] ✅ [CLIENT] [App] Application initialization completed successfully
{
  "totalDuration": 2877.45,
  "gameCount": 156,
  "installedCount": 42
}
```

---

## Summary of Information Logged

### System & Environment
- **Node.js version** - Which Node.js version the server is running
- **Operating System** - Windows version, architecture (x64/x86)
- **Hardware** - CPU count, total RAM
- **Browser** - User agent, screen resolution, window size
- **Paths** - All critical folder paths and working directories

### ParrotOrganizer Installation
- **Required files verified** - All operational files (HTML, JS, CSS, scripts) exist
- **Location verified** - Confirms ParrotOrganizer is inside TeknoParrot folder
- **TeknoParrotUi.exe found** - Confirms correct installation location
- **Storage folder** - Lists user-specific data files (preferences, custom profiles, debug logs)

### TeknoParrot Folder Structure
- **GameProfiles** - How many XML files found
- **UserProfiles** - How many installed games found
- **Metadata** - How many metadata JSON files found
- **Icons** - How many icon image files found

### Game Scanning Results
- **Total games scanned** - From gameProfiles.txt
- **Total games loaded successfully** - Actually processed by app
- **Installed games count** - From UserProfiles folder
- **Not installed games count** - Available but not installed
- **Failed to load count** - Games that had errors during loading
- **Sample game names** - First 5-10 games for verification

### Data File Breakdown
- **GameProfiles loaded** - How many game profile XMLs were parsed
- **UserProfiles loaded** - How many user profile XMLs were parsed
- **Metadata loaded** - How many metadata JSON files were loaded
- **GameSetup loaded** - How many game setup XMLs were loaded

### Performance Metrics
- **Total initialization time** - How long the entire startup took
- **Game loading duration** - How long just loading games took
- **Individual operation timings** - Each major step is timed

---

## How This Helps Diagnose Issues

### If a user reports "No games showing up":

1. **Check Server Logs** - Did GameProfiles folder scan succeed?
   - If `xmlFileCount: 0` → GameProfiles folder is empty or missing
   - If folder path is wrong → Installation location issue

2. **Check Game List Generation** - Did gameProfiles.txt get created?
   - If file missing → start.bat didn't run correctly
   - If empty → GameProfiles folder has no XML files

3. **Check Client Loading** - Did browser load the game list?
   - If `totalGamesScanned: 0` → gameProfiles.txt is empty
   - If `failedToLoad: 156` → Major compatibility issue

4. **Check Installation Verification** - Are all 8 checks passing?
   - If TeknoParrotUi.exe check fails → Wrong installation location
   - If folders missing → Incomplete installation

### If a user reports "Games not installing":

1. **Check UserProfiles count** - Is it increasing after install?
2. **Check server install logs** - Look for `/__install` endpoint errors
3. **Check folder permissions** - Can server write to UserProfiles folder?

### If performance is slow:

1. **Check total duration** - Is initialization taking too long?
2. **Check game count** - Is the user trying to load 1000+ games?
3. **Check metadata count** - Missing metadata can slow things down
4. **Check system specs** - Low RAM or CPU count?

---

## Log File Location

All logs are saved to:
```
ParrotOrganizer/storage/debug.log
```

This file persists across sessions and can be sent to support for troubleshooting.
