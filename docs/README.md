# ParrotOrganizer <small>v1.0 by Nate Mac</small> - TeknoParrot Game Manager

A modern, portable web interface for organizing and managing TeknoParrot arcade games.

## Quick Install

1. Locate your TeknoParrot installation directory (for example `D:\Emulation\TeknoParrot`).
2. Copy the `ParrotOrganizer` folder into the parent directory so that it sits next to `TeknoParrot`.
3. Open `ParrotOrganizer\index.html` in a modern web browser to launch the app.

```
Emulation/
|-- TeknoParrot/
|   |-- TeknoParrotUi.exe
|   |-- GameProfiles/
|   |-- UserProfiles/
|   `-- ...
`-- ParrotOrganizer/
    |-- index.html
    `-- assets/
```

## Project Overview

ParrotOrganizer provides a comprehensive interface for:
- Browsing all available TeknoParrot games
- Filtering and sorting by metadata (genre, year, platform, etc.)
- Managing installed games
- Configuring game profiles
- Launching games directly
- Batch editing configurations

## Implemented Features

### Remove from Library
- Added `/__remove` server endpoint to delete `UserProfile` XML files
- Added "Remove from Library" button in the game details modal with confirmation dialog
- Only shows the button for games that are currently installed
- Refreshes the game list after removal completes

### Favorites System
- Dedicated `FavoritesManager` module backed by `localStorage`
- Star button in the game details modal toggles favorite status
- Favorites filter that integrates with the existing filter manager
- Star badges overlayed on game cards with new CSS styling

### Multi-Select & Batch Operations
- Selection mode toggle that reveals checkboxes on each game card
- `SelectionManager` keeps track of the active selection state
- Checkboxes appear and hide automatically as selection mode toggles
- Batch toolbar offers add/remove library actions and add-to-favorites
- Reuses install/remove endpoints for batch flows and adds confirmation prompts
- Displays per-action success and failure counts when a batch completes
- Clears the current selection and exits selection mode after each batch
- Adds targeted CSS styling for the selection checkboxes and toolbar

## Technology Stack

- Pure HTML/CSS/JavaScript (no build process)
- ES6 modules
- File System Access API
- Native XML/JSON parsing
- Modern CSS Grid/Flexbox

## Feature Breakdown

### Filtering Features
- Text search with real-time filtering by game name
- Installation status filter (All, Installed, Not Installed)
- Genre and platform filters (Shooter, Fighting, Racing, Lindbergh, Namco, etc.)
- Release year range slider (2000-2024)
- GPU compatibility filters (Nvidia, AMD, Intel) with issue indicators
- Emulator type filters (Lindbergh, OpenParrot, Segaboot)
- Advanced flags for test mode, gun games, 64-bit, requires admin

### Sorting Features
- Name (A-Z / Z-A)
- Release year (Newest-Oldest / Oldest-Newest)
- Platform (A-Z / Z-A)
- Genre (A-Z / Z-A)
- Installation status (Installed first / Not installed first)
- Recently added (Newest-Oldest)

## Data Sources

### GameProfiles (XML)
Template configuration files for all games containing:
- Default settings
- Input mappings
- Emulator parameters
- Technical configuration

### UserProfiles (XML)
User-customized configurations for installed games:
- Game executable paths
- Modified settings
- Input customizations
- Icon references

### Metadata (JSON)
Rich game information:
- Game name, genre, platform
- Release year
- GPU compatibility (Nvidia/AMD/Intel)
- Known issues

### GameSetup (XML)
Executable location references:
- Main executable path
- Test executable path

### Icons (PNG)
Game artwork and icons

## Launch Command Format

```bash
"path_to_TeknoParrotUi.exe" --profile="path_to_game_profile.xml"
```

The app auto-detects paths relative to the ParrotOrganizer location for full portability.

## Contributing

This is a personal project for managing TeknoParrot installations. Feel free to fork and customize for your needs.

## License

MIT License - free to use and modify.

---

Current status: feature set complete.  
Last updated: 2025-10-09.
