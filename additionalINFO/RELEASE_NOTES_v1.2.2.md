# ParrotOrganizer v1.2.2 Release Notes

## 🔧 Patch Release - Folder Name Compatibility Fix

This release completes the folder name auto-detection feature started in v1.2.1.

### What Was Fixed

**v1.2.1** fixed the server-side paths but missed the batch script paths. **v1.2.2** completes the fix by updating all batch scripts.

### Changes

**Modified Files:**
- `start.bat` - Now auto-detects folder name and uses `%APP_FOLDER%` variable throughout
- `start-python.bat` - Same auto-detection added
- All hardcoded `ParrotOrganizer` references replaced with dynamic `%APP_FOLDER%`
- Browser URLs now correctly open to `http://localhost:8000/%APP_FOLDER%/`

**Version Updates:**
- `index.html` - Updated to v1.2.2
- `README.md` - Updated version badge and footer

### Technical Details

**Auto-detection code added:**
```batch
REM Detect current folder name (supports ParrotOrganizer, ParrotOrganizer-1.2.2, etc.)
for %%I in (.) do set APP_FOLDER=%%~nxI
```

**Paths updated in both batch files:**
- `..\ParrotOrganizer\data\` → `..\%APP_FOLDER%\data\`
- `cd ..\ParrotOrganizer` → `cd ..\%APP_FOLDER%`
- `/ParrotOrganizer/` → `/%APP_FOLDER%/`
- `ParrotOrganizer\scripts\server.js` → `%APP_FOLDER%\scripts\server.js`

### Result

✅ **Fully portable** - Works with ANY folder name downloaded from GitHub:
- `ParrotOrganizer` ✅
- `ParrotOrganizer-1.2.2` ✅
- `ParrotOrganizer-main` ✅
- `ParrotOrganizer-custom-fork` ✅

### Installation

**No changes from v1.2.1** - Still fully automatic:
1. Download and extract ZIP
2. Move to TeknoParrot folder
3. Run `start.bat`
4. Everything works!

### Upgrade Notes

- If upgrading from v1.2.1: This completes the folder name fix
- If upgrading from v1.2: This includes all v1.2.1 and v1.2.2 fixes
- User data in `storage/` folder is preserved across all updates

---

**No new features** - This is purely a compatibility fix for GitHub folder naming.
