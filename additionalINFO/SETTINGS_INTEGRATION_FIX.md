# Settings Integration Fix - v1.3.0

## Issue
Settings are being saved to `localStorage` (browser storage) instead of `storage/preferences.json` (file-based storage).

## Root Cause
The new `settingsManager.js` and `gamepadManager.js` were written to use `localStorage`, but ParrotOrganizer already has a **PreferencesManager** that saves to file storage.

## Solution

### 1. ✅ PreferencesManager Updated
- Added `gamepad` section with: enabled, vibration, navigationSpeed, deadzone
- Added `advanced` section with: autoScan, debugMode
- Added getter/setter methods for all new settings
- Added data reset methods

### 2. ✅ Made PreferencesManager Global
- Added `window.preferencesManager` in app.js initialization

### 3. ❌ TODO: Update GamepadManager
**File:** `js/gamepadManager.js`

**Changes needed:**
- Replace all `localStorage` usage with `window.preferencesManager`
- Use `window.preferencesManager.getGamepadPreferences()` to load
- Use `window.preferencesManager.setGamepadEnabled()` etc. to save
- Wait for preferences to be loaded before initializing

### 4. ❌ TODO: Update SettingsManager
**File:** `js/settingsManager.js`

**Changes needed:**
- Remove all `localStorage` usage
- Use `window.preferencesManager` for ALL operations
- Load settings from `window.preferencesManager.preferences`
- Save using PreferencesManager methods
- Handle async operations properly

### 5. ❌ TODO: Update GamepadIntegration
**File:** `js/gamepadIntegration.js`

**Changes needed:**
- No localStorage usage, should be fine
- Just ensure it waits for gamepadManager to initialize

## File Storage Structure

```json
{
  "ui": {
    "gridColumns": 5,
    "currentView": "grid",
    "theme": "dark",
    "defaultView": "grid"
  },
  "filters": {
    "lastSearch": "",
    "lastSortBy": "name",
    "lastSortDirection": "asc"
  },
  "favorites": [],
  "hiddenGames": [],
  "session": {
    "lastViewedGameId": null
  },
  "gamepad": {
    "enabled": true,
    "vibration": true,
    "navigationSpeed": 150,
    "deadzone": 0.3
  },
  "advanced": {
    "autoScan": true,
    "debugMode": false
  }
}
```

## Next Steps

1. Update `gamepadManager.js` to use PreferencesManager
2. Rewrite `settingsManager.js` to use PreferencesManager
3. Test all settings operations
4. Verify file storage is working
5. Remove localStorage fallbacks

## Testing Checklist

- [ ] Settings saved to `storage/preferences.json`
- [ ] Theme changes persist
- [ ] Gamepad settings persist
- [ ] Export/Import works
- [ ] Data reset works
- [ ] All settings load on app startup
