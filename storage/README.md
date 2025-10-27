# ParrotOrganizer Storage Folder

**IMPORTANT:** This folder contains ONLY user-specific data. Everything in this folder is unique to you and your settings.

## What's in This Folder?

This folder stores:
- ✅ Your personal preferences and settings
- ✅ Your custom game profiles and descriptions
- ✅ Your debug logs for troubleshooting
- ✅ Any data specific to YOUR usage

This folder does **NOT** contain any ParrotOrganizer application files.

## First-Time User Test

**You can delete this entire folder** and ParrotOrganizer will work like a first-time installation:
- All your preferences will reset to defaults
- All custom profiles will be removed
- All favorites will be cleared
- Debug logs will start fresh

The app will recreate this folder automatically on next startup.

---

## Contents

### gameProfiles.txt ✨ NEW LOCATION!
**List of ALL available TeknoParrot games** - Auto-generated every time you run start.bat

This file is scanned from `../GameProfiles/*.xml` and contains the names of all games available in your TeknoParrot installation (installed or not).

**Note:** This file is now stored in `storage/` (not `data/`) because it's specific to YOUR TeknoParrot installation.

### userProfiles.txt ✨ NEW LOCATION!
**List of YOUR installed games** - Auto-generated every time you run start.bat

This file is scanned from `../UserProfiles/*.xml` and contains only the games YOU have installed.

**Note:** This file is now stored in `storage/` (not `data/`) because it's specific to YOUR installation.

### debug.log
**Automatic debug logging file** - Created and updated every time you run ParrotOrganizer.

**What it logs:**
- System information (OS, Node.js version, RAM, CPU)
- Installation verification (folders found, games detected)
- Game scanning results (how many games scanned, loaded, installed)
- Application startup events
- User actions (launch, install, remove games)
- Errors and warnings
- Performance metrics

**When to use it:**
- If games aren't loading or populating correctly
- If you encounter errors or bugs
- When reporting issues to support

**How to access:**
1. Click **"Debug Tools"** in the sidebar
2. Click **"Open Log Folder"**
3. Send `debug.log` to support

**Example log entry:**
```
2025-10-26T10:30:40.200Z [+0.10s] ✅ [SERVER] [Server] Folder structure scan complete
{"gameProfilesAvailable":156,"userProfilesInstalled":42,"metadataFiles":145,"iconFiles":127}
```

### preferences.json
**Your personal app preferences:**
- Favorite games
- Filter settings
- UI preferences
- Any saved user settings

### CustomProfiles/ folder
**Your custom game profiles:**
- Custom XML files for individual games
- Personal game configurations

---

## Portability

✅ **Fully portable** - Copy the entire TeknoParrot folder (including this storage folder) to another PC and everything works
✅ **No browser data** - Everything is stored in files, not browser localStorage
✅ **User-specific only** - Only YOUR data is here, not application code

## Deleting This Folder

**Safe to delete:** Yes! You can delete this entire folder to reset to factory defaults.

**What happens:**
1. ParrotOrganizer detects missing storage folder
2. Logs "first-time user" message
3. Creates new storage folder
4. All settings reset to defaults
5. App works normally

**What you'll lose:**
- Your favorites
- Your custom profiles
- Your debug logs (you may want to keep these for troubleshooting)
- Your personal preferences

**What you WON'T lose:**
- The ParrotOrganizer app itself
- Your installed games (stored in TeknoParrot/UserProfiles)
- Any TeknoParrot data
