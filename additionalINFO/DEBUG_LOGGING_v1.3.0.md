# Debug Logging for v1.3.0 Features

This document describes all the debug log entries that are automatically written to `storage/debug.log` for the new v1.3.0 features.

---

## 🎮 Gamepad Manager Logging

### Initialization
```
[SUCCESS] [Gamepad] Gamepad Manager initialized
  - Data: { enabled: true/false, vibration: true/false, navigationSpeed: 150, deadzone: 0.3 }
```

### Preference Loading
```
[INFO] [Gamepad] Loaded gamepad preferences
  - Data: { enabled: true/false, vibration: true/false, speed: 150, deadzone: 0.3 }
```

### Preference Saving
```
[INFO] [Gamepad] Saved gamepad preferences
  - Data: { enabled: true/false, vibration: true/false, speed: 150, deadzone: 0.3 }
```

### Gamepad Connection Events
```
[SUCCESS] [Gamepad] Found existing gamepad on startup
  - Data: { gamepadId: "Xbox 360 Controller (XInput STANDARD GAMEPAD)", buttons: 17, axes: 4 }

[SUCCESS] [Gamepad] Gamepad connected
  - Data: { gamepadId: "...", buttons: 17, axes: 4, vibrationSupport: true/false }

[INFO] [Gamepad] Gamepad disconnected
  - Data: { gamepadId: "..." }
```

### Settings Changes
```
[INFO] [Gamepad] Gamepad navigation enabled
[INFO] [Gamepad] Gamepad navigation disabled

[INFO] [Gamepad] Gamepad vibration enabled
[INFO] [Gamepad] Gamepad vibration disabled

[INFO] [Gamepad] Navigation speed changed to 150ms

[INFO] [Gamepad] Deadzone changed to 0.3
```

---

## ⚙️ Settings Manager Logging

### Initialization
```
[SUCCESS] [Settings] Settings Manager initialized
  - Data: { currentTheme: "dark" }

[INFO] [Settings] Loaded theme: dark
```

### Theme Changes
```
[INFO] [Settings] Theme changed to: light
[INFO] [Settings] Theme changed to: dark
```

### Opening Settings Panel
```
[INFO] [Settings] Opening settings panel

[DEBUG] [Settings] Current preferences
  - Data: { theme: "dark", gridColumns: 5, defaultView: "grid", gamepadEnabled: true, autoScan: true }
```

### Saving Settings
```
[INFO] [Settings] Saving settings

[SUCCESS] [Settings] Settings saved successfully
  - Data: { theme: "dark", gridColumns: 5, defaultView: "grid", autoScan: true, debugMode: false }
```

### Data Reset Operations
```
[WARN] [Settings] Resetting favorites
[SUCCESS] [Settings] Cleared 5 favorites

[WARN] [Settings] Resetting hidden games
[SUCCESS] [Settings] Unhid 3 games

[WARN] [Settings] Resetting custom profiles
[SUCCESS] [Settings] Custom profiles deleted

[WARN] [Settings] Resetting UI preferences
[SUCCESS] [Settings] UI preferences reset to defaults

[WARN] [Settings] ⚠️ RESETTING EVERYTHING - All user data will be cleared
[SUCCESS] [Settings] All user data cleared
```

### Export/Import Operations
```
[INFO] [Settings] Exporting settings to JSON file
[SUCCESS] [Settings] Settings exported successfully
  - Data: { preferences: 8, customProfiles: 12, exportDate: "2025-10-27T..." }

[INFO] [Settings] Importing settings from JSON file
  - Data: { fileName: "ParrotOrganizer_Settings_2025-10-27.json", fileSize: 4567 }

[INFO] [Settings] Settings file parsed successfully
  - Data: { version: "1.3.0", exportDate: "2025-10-27T...", preferences: 8, customProfiles: 12 }

[SUCCESS] [Settings] Settings imported successfully

[WARN] [Settings] Invalid settings file - missing preferences or version

[INFO] [Settings] Import cancelled by user

[ERROR] [Settings] Failed to import settings
  - Data: { error: "Unexpected token...", fileName: "..." }
```

---

## 🎮 Gamepad Integration Logging

### Initialization
```
[SUCCESS] [Gamepad] Gamepad UI integration initialized
```

---

## 📊 What Gets Logged

### On App Startup (with gamepad connected):
1. ✅ Gamepad Manager initialization
2. ✅ Loaded gamepad preferences
3. ✅ Found existing gamepad on startup (with device info)
4. ✅ Gamepad UI integration initialized
5. ✅ Settings Manager initialized
6. ✅ Loaded theme

### When User Opens Settings:
1. ℹ️ Opening settings panel
2. 🔍 Current preferences (all settings values)

### When User Changes Settings:
1. ℹ️ Theme changed to: [theme]
2. ℹ️ Gamepad settings changes
3. ℹ️ Saving settings
4. ✅ Settings saved successfully (with values)

### When User Connects/Disconnects Gamepad:
1. ✅ Gamepad connected (with full device info)
2. ℹ️ Gamepad disconnected

### When User Resets Data:
1. ⚠️ Resetting [data type]
2. ✅ Cleared [count] [data type]

### When User Exports/Imports:
1. ℹ️ Exporting/Importing
2. ✅ Success or ⚠️ Warning/❌ Error

---

## 📁 Log File Location

All logs are written to:
```
ParrotOrganizer/storage/debug.log
```

---

## 🔍 Viewing Logs

### Method 1: Debug Tools (Recommended)
1. Open ParrotOrganizer
2. Expand "🐛 Debug Tools" in sidebar
3. Click "📁 Open Log Folder"
4. Open `debug.log` in text editor

### Method 2: Settings Panel
1. Click ⚙️ Settings button
2. Go to "Advanced" tab
3. Click "📁 Open Folder" under Storage Location

### Method 3: Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. All logs are also shown here in real-time

---

## 📋 Example Debug Log Session

Here's what a typical log session looks like with v1.3.0 features:

```
[2025-10-27T10:00:00.123Z] [INFO] [App] Application initialization started
[2025-10-27T10:00:00.234Z] [SUCCESS] [Settings] Settings Manager initialized { currentTheme: "dark" }
[2025-10-27T10:00:00.245Z] [INFO] [Settings] Loaded theme: dark
[2025-10-27T10:00:00.256Z] [INFO] [Gamepad] Initializing Gamepad Manager
[2025-10-27T10:00:00.267Z] [INFO] [Gamepad] Loaded gamepad preferences { enabled: true, vibration: true, speed: 150, deadzone: 0.3 }
[2025-10-27T10:00:00.278Z] [SUCCESS] [Gamepad] Found existing gamepad on startup { gamepadId: "Xbox 360 Controller (XInput STANDARD GAMEPAD)", buttons: 17, axes: 4 }
[2025-10-27T10:00:00.289Z] [SUCCESS] [Gamepad] Gamepad Manager initialized { enabled: true, vibration: true, navigationSpeed: 150, deadzone: 0.3 }
[2025-10-27T10:00:00.300Z] [SUCCESS] [Gamepad] Gamepad UI integration initialized
[2025-10-27T10:00:01.123Z] [SUCCESS] [App] Application initialization completed successfully

... user navigates and uses gamepad ...

[2025-10-27T10:05:00.000Z] [INFO] [Settings] Opening settings panel
[2025-10-27T10:05:00.010Z] [DEBUG] [Settings] Current preferences { theme: "dark", gridColumns: 5, defaultView: "grid", gamepadEnabled: true, autoScan: true }

... user changes theme to light ...

[2025-10-27T10:05:15.000Z] [INFO] [Settings] Theme changed to: light
[2025-10-27T10:05:20.000Z] [INFO] [Settings] Saving settings
[2025-10-27T10:05:20.010Z] [INFO] [Gamepad] Gamepad navigation enabled
[2025-10-27T10:05:20.020Z] [INFO] [Gamepad] Saved gamepad preferences { enabled: true, vibration: true, speed: 150, deadzone: 0.3 }
[2025-10-27T10:05:20.030Z] [SUCCESS] [Settings] Settings saved successfully { theme: "light", gridColumns: 5, defaultView: "grid", autoScan: true, debugMode: false }

... user exports settings ...

[2025-10-27T10:06:00.000Z] [INFO] [Settings] Exporting settings to JSON file
[2025-10-27T10:06:00.100Z] [SUCCESS] [Settings] Settings exported successfully { preferences: 8, customProfiles: 12, exportDate: "2025-10-27T10:06:00.100Z" }
```

---

## 🎯 Benefits of Debug Logging

### For Users:
- **Easy Troubleshooting** - See exactly what's happening
- **Feature Verification** - Confirm gamepad and settings are working
- **Support Help** - Share log file when reporting issues

### For Developers:
- **User Behavior Tracking** - Understand how features are used
- **Error Detection** - Catch issues early
- **Performance Monitoring** - Track initialization times

### For Support:
- **Quick Diagnosis** - Identify problems immediately
- **Configuration Review** - See user's settings at a glance
- **Event Timeline** - Understand sequence of events

---

## ✅ Best Practices

1. **Check logs after major changes** - Verify settings are saved correctly
2. **Review logs if features don't work** - See connection status and errors
3. **Share logs when reporting bugs** - Include the debug.log file
4. **Clear logs periodically** - Use "Clear Log File" in Debug Tools if it gets too large

---

**All v1.3.0 features are fully logged and ready for troubleshooting!** 🎮⚙️
