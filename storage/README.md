# ParrotOrganizer Storage Folder

This folder contains user-specific data and debug logs for ParrotOrganizer.

## Contents

### debug.log
**Automatic debug logging file** - This file is automatically created and updated every time you run ParrotOrganizer.

**What it contains:**
- Application startup events
- Game loading operations
- User actions (launch, install, remove games)
- Errors and warnings
- Performance metrics
- Server operations

**When to use it:**
- If games aren't loading or populating correctly
- If you encounter errors or bugs
- When reporting issues to support

**How to access:**
1. Click **"Debug Tools"** in the sidebar (bottom of filters)
2. Click **"Open Log Folder"** to open this folder in Windows Explorer
3. Find `debug.log` and send it to support

**File format:** Plain text with timestamps and categories for easy reading

**Example log entry:**
```
2025-10-25T10:30:45.123Z [+2.45s] 🦜 [CLIENT] [DataLoader] Game data loaded {"gameCount":150}
```

### Other files in this folder:
- `preferences.json` - Your favorites and user preferences
- `customProfiles.json` - Custom game descriptions and YouTube links
- `CustomProfiles/` - Custom XML profiles for individual games

## Notes

- All files in this folder are **portable** - you can copy this entire TeknoParrot folder to another PC
- Deleting `debug.log` won't affect your app - it will be recreated on next startup
- The log file appends data, so it grows over time (you can clear it from Debug Tools)
- Browser data is **NOT** used - everything is stored in files for portability
