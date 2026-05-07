# ParrotOrganizer v2.0 — Test Checklist

Mark items with `[x]` when passing, `[!]` for bugs. Add notes below each section as needed.

---

## Startup & First Run

- [X] App loads normally — game list appears, no setup screen
- [X] Rename/break TeknoParrot.exe path → **Setup Screen** appears with correct message and path
- [X] Restore exe path → normal load resumes

**Notes:**
Updated the Folder and corrasponding files to remove the "_2.0" App is now just called ParrotOrganizer.
---

## Game Library & Search

- [X] Search by **title** — results filter correctly
- [X] Search by **Emulator** name (e.g. "Sega") — hits appear
- [X] Search by a **tag** word — tag search works
- [-] Search by a word from a **description** — description search works
- [X] Clear search — full list returns

**Notes:**
- [X] Lets add an update to the search, the user can click the spyglass to choose how to search, default is all fields, then the dropdown also show, Game Name, Game ID, Publisher, Developer, Tags. 
- [X] Find out also why when I was searching Hummer and typed "Hum" 48 games were shown including Aliens: Extermination, SiN and many other. what set it off that so many games were showing. Also searching "fighter jet" which After Burner Climax is tagged, also popped up Super Bike 2.
- [X] Lets also add autocomplete to search bar similar to Google.
- [X] Remove searching from description, this might be whats causing our mass amount of games on limited search letters
---

## Sidebar Filters

- [X] **Favorites only** toggle — shows only starred games
- [X] **Installed only** toggle — shows only installed games
- [X] **Hidden** toggle — hidden games appear/disappear
- [X] **Subscription only** — non-subscription games removed
- [X] Multiple filters stacked simultaneously — all apply correctly
- [X] **Reset Filters** — all filters clear

**Notes:**
- [X] Remove "Has icon artwork" & "Has YouTube link" from the quick filters
---

## Card & List View

- [X] Card size **S / M / L** in Tweaks — layout reflows correctly
- [X] **Card view** renders correctly
- [X] **List view** renders correctly
- [-] **Show Meta** toggle in Tweaks — metadata on cards toggles

**Notes:**
- [X] Turning off MetaData should not remove the name of the game.
---

## Detail Panel

- [X] Click a game — detail panel opens with correct data
- [X] Click a **different game** — panel re-mounts, animation replays, no stale data
- [X] Click same game twice — no double-render issues

**Notes:**
- [X] Clicking a game a second time should close the details panel.
---

## Metadata / Settings / Controls Editors

- [X] **Metadata Editor** — open, edit a field, save, confirm persists after refresh
- [X] **Settings Editor** — open, make a change, save without error
- [X] **Controls Editor** — opens and loads without error

**Notes:**

---

## Favorites & Hidden

- [X] Star a game — appears in Favorites filter
- [X] Hide a game — disappears from main list
- [X] App Settings → **Reset Favorites** — confirm dialog appears, confirm clears favorites
- [X] App Settings → **Reset Hidden Games** — hidden games reappear

**Notes:**
- [X] In the tweaks menu should be the setting to have favorite games at beginning of list. and this should effect the grid or list view.
- [X] Setting confirm windows appears behind the settings window, for example you need to press "reset favorites" the screen behind the settings window blurs, not till you close the settings window can you see the confirm change window to set the change.
---

## App Settings Panel (Gear Icon)

- [X] Gear icon opens **App Settings** modal
- [X] Click outside modal — closes (overlay dismiss)
- [X] X button — closes modal

### Refresh Game List
- [X] **Refresh Game List** — spinner shows, success message with game count

### Data Management
- [X] **Reset Custom Profiles** — confirm dialog appears, action clears custom edits
- [X] **Reset Everything** — danger-styled dialog, confirms, all personal data cleared

**Notes:**
- [X] Chance the name from "Reset Custom Profiles" to "Reset Users Database"

### Backup & Restore
- [X] **Export Settings** — `.json` file downloads to Downloads folder, file is valid JSON
- [X] **Import Settings** — favorite/hide some games, export, import the file, data restores and list refreshes

**Notes:**
- [X] Add a date and time to the export filename.

### Developer
- [X] **Push Custom Profiles to DB2** — confirm dialog with correct description appears, confirms, success message shows promoted count

**Notes:**
- [X] Rename these to our new database names. In the confirmation it should say Cancel and "Who Are You?" and a place to type and hit confirm. If the user doesn't type "Nate" say, sorry you are not the developer, you don't need to do this. the password can be in plaintext no encrypition or anything this is just a deturent. 
---

## Tweaks Panel

- [X] **Mode toggle** (dark/light) visible in Tweaks panel
- [X] Switch to **Light mode** — entire UI switches to light colors
- [X] Switch back to **Dark mode** — reverts correctly
- [X] Change **accent color** — color changes throughout UI
- [X] Change **density** — spacing changes
- [X] **Reset UI Preferences** — resets to defaults (dark, cyan, comfy, S)

**Notes:**
- [X] In light mode the favorite icon is still dark in the top left corner of each game in grid and list mode.
---

## Confirm Dialog

- [X] Trigger any destructive action (uninstall, reset) — **ConfirmDialog** appears (not browser `window.confirm`)
- [X] Click **Cancel** — nothing happens, state unchanged
- [X] Click **Confirm** — action executes correctly

**Notes:**

---

## Uninstall

- [X] Click **Uninstall** on an installed game — ConfirmDialog appears
- [X] Cancel — game remains installed
- [X] Confirm — game uninstalls, list updates

**Notes:**
- [X] If a game is not installed, the "Launch Game" button should be "Install Game" and the small button would only be needed for uninstall.
- [X] Open Game Folder should take you to where the exe file is not the xml file. so this button wouldn't be shown if the game is not installed.
---

## Gamepad Navigation

- [ ] Gamepad connected — d-pad/analog moves game selection
- [ ] Open **App Settings** modal — gamepad navigation disabled
- [ ] Close modal — gamepad navigation resumes
- [ ] Open any other modal (metadata/settings/controls) — gamepad similarly disabled

**Notes:**

---

## Bug Log

| # | Area | Description | Status |
|---|------|-------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
