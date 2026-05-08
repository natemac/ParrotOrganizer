// data.jsx — JSON loader and helpers (32-column database, 3-tier DB backed)

// Decade buckets
function decadeOf(year) {
  const n = parseInt(year, 10);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n / 10) * 10;
}

// Genre normalization
function normalizeGenre(g) {
  if (!g) return 'Other';
  const t = g.trim();
  if (!t) return 'Other';
  if (t === 'Shooting') return 'Shooter';
  if (t === 'Platformer') return 'Platform';
  if (t === 'Racer') return 'Racing';
  return t;
}

// Hash to deterministic placeholder color
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const GENRE_HUES = {
  'Fighting': 350, 'Racing': 200, 'Shooter': 18, 'Shoot \'Em Up': 280,
  'Action': 32, 'Puzzle': 260, 'Rhythm': 312, 'Sports': 140,
  'Flying': 220, 'Platform': 50, 'Strategy': 240, 'Card': 175,
  'Minigames': 90, 'Compilation': 165, 'Bowling': 110, 'Ball Shooter': 5,
  'Multiplayer': 200, 'Arcade': 28,
};

function placeholderStyle(game) {
  const hue = GENRE_HUES[game.GenreNorm] ?? (Math.abs(hashStr(game.Name)) % 360);
  const variance = (hashStr(game.Name) % 30);
  const h2 = (hue + variance) % 360;
  return {
    background: `radial-gradient(circle at 30% 25%, oklch(0.62 0.16 ${hue}), oklch(0.32 0.10 ${h2}) 75%)`
  };
}

function initials(name) {
  if (!name) return '??';
  const words = name.replace(/[\(\):\-!]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// GPU status values from DB: OK | HAS_ISSUES | NO | NO_INFO | ''
const GPU_STATUS_LABELS = { OK: 'OK', HAS_ISSUES: 'Issues', NO: 'No', NO_INFO: '?' };
const GPU_STATUS_COLORS = {
  OK:         { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80',  border: 'rgba(34,197,94,0.3)'  },
  HAS_ISSUES: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24',  border: 'rgba(245,158,11,0.3)' },
  NO:         { bg: 'rgba(239,68,68,0.12)',  text: '#f87171',  border: 'rgba(239,68,68,0.25)' },
  NO_INFO:    { bg: 'rgba(100,116,139,0.12)',text: '#94a3b8',  border: 'rgba(100,116,139,0.2)'},
};

// Build icon URL from the "Icon Name" DB column.
// Icons live at /Icons/<filename> relative to the TeknoParrot root.
function iconUrlFor(iconName) {
  if (!iconName || !iconName.trim()) return null;
  return `/Icons/${iconName.trim()}`;
}

function mediaUrlFor(profile, slot) {
  if (!profile) return null;
  return `/ParrotOrganizer/Media/${encodeURIComponent(profile)}/${slot}`;
}

async function loadGames() {
  // Always bust cache so we get the freshly-merged DB after server startup rescan
  const res = await fetch('data/teknoparrot_database.json?t=' + Date.now());
  const raw = await res.json();
  return raw.map(g => {
    const profile = g['GameProfile Name'] || '';
    const name = g['Name'] || profile || '(Unknown)';
    const release = g['Release Date'] || '';
    const year = parseInt(release, 10);
    const genre = g['Genre'] || '';
    const interfaces = (g['Interface'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const tags = (g['Tags'] || '').split(',').map(s => s.trim()).filter(Boolean);
    // Multi-genre: split by comma, normalize each; first entry drives the card pill
    const Genres = genre.split(',').map(s => normalizeGenre(s.trim())).filter(Boolean);
    if (!Genres.length) Genres.push('Other');
    // Media: use PrimaryProfile's folder if this is an alias
    const mediaProfile = g['PrimaryProfile'] || profile;

    return {
      Profile:           profile,
      Name:              name,
      Release:           release,
      Year:              Number.isFinite(year) ? year : null,
      Decade:            Number.isFinite(year) ? decadeOf(year) : null,
      Genre:             genre,
      GenreNorm:         Genres[0],  // first genre — used for card pill and color
      Genres,                        // all genres — used for filter/search/detail
      Platform:          g['Arcade Platform'] || '',
      Emulator:          g['Emulator'] || '',
      Subscription:      (g['Subscription'] || '').toLowerCase() === 'yes',
      Interfaces:        interfaces,
      GPU:               g['GPU'] || '',
      Description:       g['Description'] || '',
      YouTube:           g['YouTube Link'] || '',
      Tags:              tags,
      IconName:          g['Icon Name'] || '',
      IconUrl:           iconUrlFor(g['Icon Name']),
      GpuNvidia:         g['Nvidia'] || 'NO_INFO',
      GpuNvidiaIssues:   g['Nvidia Issues'] || '',
      GpuAMD:            g['AMD']    || 'NO_INFO',
      GpuAMDIssues:      g['AMD Issues'] || '',
      GpuIntel:          g['Intel']  || 'NO_INFO',
      GpuIntelIssues:    g['Intel Issues'] || '',
      GeneralIssues:     g['General Issues'] || '',
      SupportedVersions: g['Supported Versions'] || '',
      WheelRotation:     g['Wheel Rotation'] || '',
      Notes:             g['Notes'] || '',
      Status:            g['Status'] || '',
      // DB3 user fields
      Favorite:          (g['Favorite'] || '').toLowerCase() === 'yes',
      Hidden:            (g['Hidden']   || '').toLowerCase() === 'yes',
      // Scraped metadata fields (DB2 curated)
      Developer:         g['Developer']      || '',
      Publisher:         g['Publisher']      || '',
      Players:           g['Players']        || '',
      ESRB:              g['ESRB']           || '',
      ScreenScraperID:   g['ScreenScraperID'] ? String(g['ScreenScraperID']) : '',
      PrimaryProfile:    g['PrimaryProfile'] || '',
      MetadataFrom:      g['Metadata From']  || '',
      // Media paths — img onError handles missing files gracefully
      MediaBox:        mediaUrlFor(mediaProfile, 'box.png'),
      MediaWheel:      mediaUrlFor(mediaProfile, 'wheel.png'),
      MediaScreenshot: mediaUrlFor(mediaProfile, 'screenshot.png'),
    };
  });
}

// Persist a user field change to DB3 via server.
// fields: e.g. { Favorite: 'yes' } or { Notes: 'my note' } or { Status: 'working' }
async function saveUserField(profile, fields) {
  try {
    const res = await fetch('/__saveUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, fields }),
    });
    if (!res.ok) console.warn('[saveUserField] Server returned', res.status, 'for', profile, fields);
  } catch (e) {
    console.warn('[saveUserField] Network error:', e.message);
  }
}

// Deterministic per-(category, label) hue
const CATEGORY_HUE_OFFSETS = {
  genres: 0,
  platforms: 137,
  emulators: 47,
  interfaces: 215,
};
function hueFor(category, label) {
  if (!label) return 200;
  if (category === 'genres') return GENRE_HUES[label] ?? (Math.abs(hashStr(label)) % 360);
  const base = CATEGORY_HUE_OFFSETS[category] ?? 0;
  const spread = Math.abs(hashStr(label)) % 200;
  return (base + spread) % 360;
}
function colorFor(category, label, opts = {}) {
  const { l = 0.72, c = 0.16, alpha } = opts;
  const h = hueFor(category, label);
  return alpha != null
    ? `oklch(${l} ${c} ${h} / ${alpha})`
    : `oklch(${l} ${c} ${h})`;
}

Object.assign(window, {
  loadGames, saveUserField, mediaUrlFor,
  placeholderStyle, initials, normalizeGenre, GENRE_HUES,
  hueFor, colorFor, GPU_STATUS_LABELS, GPU_STATUS_COLORS,
});
