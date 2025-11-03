# ParrotOrganizer Data Folder

**This folder contains application configuration files.**

## Contents

### platformAliases.json
**Platform name normalization configuration** - Maps variant platform names to canonical values.

Example:
```json
{
  "aliases": [
    {
      "canonical": "Taito Type X",
      "aliases": ["TaitoTypeX", "Taito Type-X", "TypeX"]
    }
  ]
}
```

### genreAliases.json
**Genre name normalization configuration** - Maps variant genre names to canonical values.

Example:
```json
{
  "aliases": [
    {
      "canonical": "Racing",
      "aliases": ["Race", "Driving", "Racer"]
    }
  ]
}
```

---

## Important Note

**Game lists have been moved!**

As of v1.2.3, `gameProfiles.txt` and `userProfiles.txt` are now stored in the `storage/` folder because they are user-specific (they reflect YOUR TeknoParrot installation).

The `data/` folder now contains **ONLY** application configuration files that are the same for everyone.

---

## What's User-Specific vs. Application Data?

### Application Data (this folder):
- ✅ **platformAliases.json** - Same for everyone
- ✅ **genreAliases.json** - Same for everyone
- ✅ NOT user-specific, NOT deleted when resetting

### User-Specific Data (storage/ folder):
- 📝 **gameProfiles.txt** - YOUR available games
- 📝 **userProfiles.txt** - YOUR installed games
- 📝 **preferences.json** - YOUR favorites and settings
- 📝 **debug.log** - YOUR debug logs
- 📝 **CustomProfiles/** - YOUR custom game profiles

---

## Safe to Delete?

**This folder:** NO - Contains application configuration needed for the app to function properly.

**storage/ folder:** YES - You can delete it to reset to factory defaults. It will be recreated on next startup.
