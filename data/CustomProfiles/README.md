# Creator CustomProfiles

This folder contains **creator-recommended** CustomProfile files.

## Purpose

These profiles are curated by the ParrotOrganizer creator to provide:
- Corrected metadata (e.g., fixing games mislabeled as gun games)
- Additional game information (descriptions, YouTube links)
- Helpful tags and categorization
- GPU compatibility data

## Hierarchy

ParrotOrganizer uses a **three-tier data hierarchy**:

1. **TeknoParrot Data** (lowest priority) - Base game profiles and metadata
2. **data/CustomProfiles** (medium priority) - Creator-recommended profiles (this folder)
3. **storage/CustomProfiles** (highest priority) - User's personal edits

User edits always take precedence over creator recommendations.

## Persistence

- Files in this folder are **NOT deleted** when users reset CustomProfiles via Settings
- Only `storage/CustomProfiles` is cleared during reset operations
- This ensures creator recommendations persist while giving users full control

## For Creators

To promote a user CustomProfile to a creator recommendation:
1. Create/edit the profile normally (saves to `storage/CustomProfiles`)
2. Move the XML file from `storage/CustomProfiles` to `data/CustomProfiles`
3. The profile will now be available to all users as a recommended baseline

## For Users

- You can override any creator recommendation by editing the game
- Your edits are saved to `storage/CustomProfiles` and take priority
- To revert to creator recommendation: delete your edit via the Edit modal
- To see creator recommendations: reset CustomProfiles in Settings (your folder is cleared)
