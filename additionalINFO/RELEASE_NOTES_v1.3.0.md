# 🎮 ParrotOrganizer v1.3.0 - The Gamepad & Settings Update

**Release Date:** October 27, 2025

**Major Features:** Full gamepad navigation support and comprehensive settings panel

---

## 🎯 What's New

### 🎮 Full Gamepad Navigation Support

Navigate ParrotOrganizer with any standard gamepad (Xbox, PlayStation, Generic)!

**Features:**
- **Complete Controller Support** - Browse and launch games using your gamepad
- **Visual Selection Indicator** - Selected game card highlights with blue outline and gamepad icon
- **Auto-Detection** - Automatic gamepad connection and disconnection handling
- **Connection Status** - Live indicator in header shows gamepad status
- **Modal Navigation** - Navigate through game details and settings with controller
- **Vibration Feedback** - Optional haptic feedback on button presses (if supported)

**Button Layout:**
- **A Button** - Launch game / Select option
- **B Button** - Back / Cancel / Close modal
- **X Button** - Toggle Favorite
- **Y Button** - Show Game Details
- **START** - Open Settings
- **SELECT** - Toggle Grid/List View
- **L3 (Click Left Stick)** - Scroll to Top
- **LB / RB (Bumpers)** - Cycle through status filters
- **D-Pad / Left Analog Stick** - Navigate the game grid

**Configuration:**
- Enable/disable gamepad navigation
- Adjust navigation speed (50-300ms)
- Toggle vibration feedback
- Auto-save: All settings saved immediately when changed

**Technical Implementation:**
- Uses Gamepad API for native browser support
- Polling-based input detection
- Configurable deadzone for analog sticks
- Event-driven architecture for UI integration
- Modal-aware navigation system
- **Smart Focus Detection** - Automatically pauses when window loses focus (when game launches)
- Resumes when you return to browser
- No interference with game controls

---

### ⚙️ Comprehensive Settings Panel

Brand new centralized settings interface with full control over the app!

**Auto-Save Design:**
- All settings save automatically when changed
- No need for "Save" button - just change and close
- Instant feedback in debug logs
- All changes written to `storage/preferences.json`

**Tabs:**

1. **Appearance**
   - Light / Dark theme toggle (auto-saves)
   - Clean, simple interface

2. **Data Management**
   - Reset Favorites - Clear all favorited games
   - Reset Hidden Games - Unhide all hidden games
   - Reset Custom Profiles - Delete all custom descriptions, tags, and YouTube links
   - Reset UI Preferences - Clear theme, grid columns, view settings
   - **Reset Everything** - Nuclear option with double confirmation

3. **Gamepad**
   - Live connection status display
   - Enable/disable gamepad navigation (auto-saves)
   - Toggle vibration feedback (auto-saves)
   - Navigation speed slider 50-300ms (auto-saves)
   - Complete button layout reference

4. **Advanced**
   - Auto-scan on startup toggle (auto-saves)
   - Debug mode toggle (auto-saves)

5. **About**
   - Version information
   - What's new summary
   - Credits
   - Links to TeknoParrot and GitHub

**Backup & Restore:**
- **Export Settings** - Download all preferences from file storage as JSON
- **Import Settings** - Restore from backup file to file storage
- Includes version info and export date
- Portable configuration management

---

### 🌗 Light & Dark Theme Support

Switch between light and dark modes to match your preference!

**Features:**
- Instant theme switching
- Proper contrast and readability in both modes
- All UI elements fully themed
- Settings saved automatically
- Clean, modern light theme design
- Existing dark theme preserved

**CSS Variables System:**
- Dynamic color scheme switching
- Consistent theming across all components
- Smooth transitions between themes

---

### 🚀 Modern Game Launch Popup

Beautiful animated loading screen when launching games!

**Features:**
- **Fancy Animations** - Smooth fade-in, rotating glow effects, pulsing game icon
- **Game Information** - Displays game icon and title during launch
- **Loading Indicator** - Animated spinner with "Now Loading..." text
- **Auto-Hide** - Automatically dismisses after 3 seconds
- **Error Handling** - Hides immediately if launch fails
- **Modern Design** - Gradient background, glassmorphism effects, responsive layout

**Technical Details:**
- Purple gradient background with animated glow
- Icon pulse animation for visual interest
- Backdrop blur for depth effect
- Smooth fade in/out transitions
- Fully responsive on all screen sizes
- Theme-aware (adjusts colors for light/dark mode)

---

## 🔧 Technical Changes

### New Files
- `js/settingsManager.js` - Settings panel implementation
- `js/gamepadManager.js` - Gamepad input handling
- `js/gamepadIntegration.js` - UI integration for gamepad
- `js/launchPopup.js` - Modern game launch popup manager
- `css/settings.css` - Settings panel and theme styles
- `css/launch-popup.css` - Launch popup animations and styling

### Updated Files
- `index.html` - Added settings CSS and scripts, launch popup HTML structure, version bump to 1.3.0
- `css/game-grid.css` - Added gamepad selection styles and indicator
- `js/modules/uiManager.js` - Connected showSettings() to settings manager, integrated launch popup
- `README.md` - Comprehensive documentation for new features

### Architecture Improvements
- **Modular Gamepad System** - Separate manager and integration layers
- **Event-Driven Communication** - Custom events for gamepad actions
- **Preference Persistence** - All settings saved to localStorage
- **Tab-Based UI** - Organized settings into logical categories
- **Confirmation Dialogs** - Safety checks for destructive operations

---

## 🎨 UI/UX Improvements

### Gamepad Visual Feedback
- Blue outline with shadow on selected card
- Gamepad emoji indicator on selected game
- Smooth scrolling to selected card
- Clear connection status in header

### Settings Panel Design
- Clean tabbed interface
- Organized into 5 logical sections
- Inline help text for all options
- Responsive layout for all screen sizes
- Auto-save design with single "Close" button

### Theme Toggle
- Instant visual feedback
- Proper contrast in both modes
- Professional light mode design
- Consistent with modern UI standards

### Launch Popup Design
- Eye-catching purple gradient background
- Smooth fade-in and scale animations
- Rotating glow effect for visual interest
- Pulsing game icon animation
- Modern loading spinner
- Responsive on all screen sizes
- Backdrop blur for depth

---

## 📝 Documentation Updates

### README.md
- Complete gamepad controls section
- Settings panel documentation
- Updated feature list
- New file structure
- Version bump to 1.3.0

### Release Notes
- This comprehensive v1.3.0 changelog
- Feature breakdown
- Technical details
- Migration notes

---

## 🚀 Getting Started with New Features

### Using Gamepad Navigation

1. Connect any standard gamepad to your PC
2. Look for the gamepad indicator in the header (🎮 Connected)
3. Use D-pad or left stick to navigate the grid
4. Press A to launch games, B to go back
5. Customize settings in Settings > Gamepad tab

### Accessing Settings

1. Click the ⚙️ button in the header
2. Browse through the 5 tabs
3. Make your changes
4. Click "Save Changes" to apply

### Switching Themes

1. Open Settings (⚙️ button)
2. Go to "Appearance" tab
3. Select Light or Dark mode
4. Theme changes instantly!

### Exporting Your Settings

1. Open Settings > Data Management
2. Click "Export Settings"
3. JSON file downloads with all preferences
4. Keep this file as a backup

### Importing Settings

1. Open Settings > Data Management
2. Click "Import Settings"
3. Select your backup JSON file
4. Confirm import
5. All settings restored!

---

## ⚠️ Breaking Changes

**None!** This update is fully backward compatible.

- Existing preferences are preserved
- All custom profiles remain intact
- No changes to file structure
- No server endpoint changes

---

## 🐛 Bug Fixes

- Fixed modal keyboard navigation when gamepad is connected
- Improved grid column calculation accuracy
- Better error handling in settings save/load

---

## 📊 Statistics

**Lines of Code Added:** ~1,800+
**New Files:** 6
**Updated Files:** 5
**New Features:** 4 major (Gamepad, Settings, Themes, Launch Popup)

---

## 🔜 What's Next (v1.4)

Potential features for the next release:
- Filter presets (save/load custom filter combinations)
- Play count and last played tracking
- Recent games quick access
- Custom game collections/playlists
- Keyboard shortcuts configuration

---

## 🙏 Credits

- **Gamepad API** - Modern browser gamepad support
- **CSS Variables** - Dynamic theming system
- **TeknoParrot Community** - Continued support and feedback

---

## 📥 Download

Latest version available in the GitHub repository:
- **Source Code:** [GitHub Repository](https://github.com/natemac47/ParrotOrganizer)
- **Installation:** Extract to TeknoParrot folder and run `start.bat`

---

## 🆘 Support

If you encounter any issues:
1. Check the Debug Tools in the sidebar
2. Review the debug.log file
3. Report issues on GitHub with log file attached

---

**Enjoy the new gamepad support and settings panel! 🎮⚙️**

**Happy Gaming!** 🦜
