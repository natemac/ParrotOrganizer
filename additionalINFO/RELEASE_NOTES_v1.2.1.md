# ParrotOrganizer v1.2.1 Release Notes

## 🔧 Bug Fix Release

### Fixed: GitHub Folder Name Compatibility

**Problem:** When downloading from GitHub, the folder is named `ParrotOrganizer-1.2.1` (with version suffix) instead of `ParrotOrganizer`, which broke path detection in both the server and batch scripts.

**Solution:** The app now automatically detects its own folder name and works with any folder name:
- ✅ `ParrotOrganizer`
- ✅ `ParrotOrganizer-1.2.1`
- ✅ `ParrotOrganizer-main`
- ✅ `ParrotOrganizer-dev`
- ✅ Any custom folder name you use

### Changes

**Modified Files:**

**Server-side:**
- `scripts/server.js` - Auto-detects app folder name using `path.resolve(__dirname, '..')` instead of hardcoded `'ParrotOrganizer'`
- All hardcoded `'ParrotOrganizer'` paths replaced with dynamic `appFolder` variable

**Batch scripts:**
- `start.bat` - Added `APP_FOLDER` auto-detection using `for %%I in (.) do set APP_FOLDER=%%~nxI`
- `start-python.bat` - Added same `APP_FOLDER` auto-detection
- All hardcoded `ParrotOrganizer` paths replaced with `%APP_FOLDER%` variable
- URLs now use `http://localhost:8000/%APP_FOLDER%/` instead of hardcoded path

**Version Updates:**
- `index.html` - Updated version to v1.2.1
- `README.md` - Updated version badge and footer to 1.2.1

### Installation

**No special steps required!** Simply:
1. Download and extract the ZIP
2. The folder will be named `ParrotOrganizer-1.2.1` - **that's fine!**
3. Move into TeknoParrot folder
4. Run `start.bat`

**Note:** You can rename the folder to anything you want - it will still work!

---

**Upgrade from v1.2:** Just replace the folder - all your data in `storage/` is preserved!
