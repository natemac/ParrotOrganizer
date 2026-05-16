const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');
const { spawn, exec } = require('child_process');

// ─── Paths ───────────────────────────────────────────────────────────────────
const appFolder = __dirname;
const root      = path.resolve(appFolder, '..');
const dataDir   = path.resolve(appFolder, 'data');
const storageDir = path.resolve(appFolder, 'storage');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
if (!fs.existsSync(dataDir))    fs.mkdirSync(dataDir,    { recursive: true });

const DB2_MANIFEST_URL = 'https://raw.githubusercontent.com/natemac/ParrotOrganizer/main/data/parrotOrganizerDB.manifest.json';
const APP_VERSION = '2.1.0';
const APP_USER_AGENT = `ParrotOrganizer/${APP_VERSION}`;

// ─── Logger ──────────────────────────────────────────────────────────────────
const serverLogger = {
  logs: [], startTime: Date.now(),
  logFilePath: path.resolve(storageDir, 'debug.log'),
  log(level, endpoint, message, data = null) {
    const entry = { timestamp: new Date().toISOString(), relativeTime: Date.now() - this.startTime, level, endpoint, message, data };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    const emoji = { ERROR:'❌', WARN:'⚠️', INFO:'🖥️', SUCCESS:'✅' }[level] || 'ℹ️';
    const t = `[+${(entry.relativeTime/1000).toFixed(2)}s]`;
    const line = `${entry.timestamp} ${t} ${emoji} [${endpoint}] ${message}${data ? ' '+JSON.stringify(data) : ''}`;
    console.log(`${emoji} ${t} [${endpoint}] ${message}${data ? ' '+JSON.stringify(data) : ''}`);
    try { fs.appendFileSync(this.logFilePath, line+'\n', 'utf8'); } catch {}
  },
  info(ep,msg,d)    { this.log('INFO',   ep,msg,d); },
  success(ep,msg,d) { this.log('SUCCESS',ep,msg,d); },
  warn(ep,msg,d)    { this.log('WARN',   ep,msg,d); },
  error(ep,msg,d)   { this.log('ERROR',  ep,msg,d); },
};

fs.appendFileSync(serverLogger.logFilePath,
  `\n${'='.repeat(80)}\nSERVER SESSION STARTED: ${new Date().toISOString()}\n${'='.repeat(80)}\n`, 'utf8');

// ─── MIME types ───────────────────────────────────────────────────────────────
const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.jsx':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp',
  '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8',
  '.xml':'application/xml; charset=utf-8', '.ico':'image/x-icon',
  '.mp4':'video/mp4',
};

// ─── XML helper ──────────────────────────────────────────────────────────────
function escapeXml(t) {
  if (!t) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function xmlField(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1].trim() : '';
}

// ─── Database schema ─────────────────────────────────────────────────────────
function openExplorerFocused(folder) {
  const script = `
$target = $env:PARROT_OPEN_FOLDER
Start-Process explorer.exe -ArgumentList @($target)
Start-Sleep -Milliseconds 650
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32Focus {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
"@
try {
  $resolved = (Resolve-Path -LiteralPath $target -ErrorAction Stop).ProviderPath.TrimEnd('\\')
  $shell = New-Object -ComObject Shell.Application
  foreach ($window in $shell.Windows()) {
    $url = $window.LocationURL
    if (-not $url.StartsWith('file:///')) { continue }
    $path = [System.Uri]::UnescapeDataString($url.Substring(8)).Replace('/', '\\').TrimEnd('\\')
    if ($path -ieq $resolved) {
      [Win32Focus]::ShowWindowAsync([IntPtr]$window.HWND, 9) | Out-Null
      [Win32Focus]::SetForegroundWindow([IntPtr]$window.HWND) | Out-Null
      break
    }
  }
} catch {}
`;
  const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, PARROT_OPEN_FOLDER: folder },
  });
  child.unref();
}

const ALL_COLUMNS = [
  'GameProfile Name','Name','Release Date','Genre','Arcade Platform','Emulator',
  'Subscription','Interface','GPU','Description','YouTube Link','Tags','Icon Name',
  'Nvidia','Nvidia Issues','AMD','AMD Issues','Intel','Intel Issues',
  'General Issues','Supported Versions','Wheel Rotation','Notes','Status','Favorite','Hidden',
  // Scraped metadata (DB2 curated)
  'Developer','Publisher','Players','ESRB','ScreenScraperID','PrimaryProfile','Metadata From',
];

// ─── Interface inference (ported from build_database.py) ─────────────────────
const INTERFACE_RULES = [
  ['Light Gun',       [/\bgungame\b/,      /\btrigger\b.*\breload\b/, /\breload\b.*\btrigger\b/]],
  ['Steering Wheel',  [/\bsteer/,          /\bwheel axis\b/, /\bgas\s*pedal\b/, /\bbrake\s*pedal\b/, /\bgear\s*chang/, /gearchange/, /\baccel\w*\b.*\bbrake\b/]],
  ['Flight Stick',    [/\bflight\s*stick\b/,/\bthrottle\b/, /\brudder\b/, /\bbarrel\s*roll\b/]],
  ['Touchscreen',     [/\btouch\s*screen\b/,/\btouchpad\b/, /\btouch\s*panel\b/]],
  ['Trackball',       [/\btrackball\b/]],
  ['Dance Pad',       [/\bdance\b/,        /\barrow\s*pad\b/, /\bpump\s*it\b/]],
  ['DJ Controller',   [/\bturntable\b/,    /\bdj\b\s+\w/,    /\bcrossfader\b/]],
  ['Drums',           [/\bdrum\b/,         /\bsnare\b/,      /\bcymbal\b/]],
  ['Guitar',          [/\bguitar\b/,       /\bfret\b/,       /\bstrum\b/]],
  ['Maracas',         [/\bmaraca\b/]],
  ['Motion Board',    [/\bboard\s*swing\b/,/\bski\b/,        /\bsnowboard\b/]],
  ['Bike Handlebars', [/\bhandle\s*bar\b/, /\bbike\b.*\blean\b/]],
  ['Mahjong Panel',   [/\bmahjong\b/]],
  ['Card Reader',     [/\bcard\s*reader\b/,/\bbanapass\b/,   /\baime\b/]],
];

function inferInterfaces(xmlText, isGunGame) {
  const lower = xmlText.toLowerCase();
  const matches = [];
  if (isGunGame) matches.push('Light Gun');
  for (const [label, patterns] of INTERFACE_RULES) {
    if (matches.includes(label)) continue;
    if (patterns.some(p => p.test(lower))) matches.push(label);
  }
  if (!matches.length) {
    const btnCount = (lower.match(/<inputmapping>p1button\d/g) || []).length;
    matches.push(btnCount >= 6 ? 'Fightstick' : 'Joystick');
  }
  return matches.join(', ');
}

// ─── DB1: scan GameProfiles + Metadata ───────────────────────────────────────
function scanDB1() {
  const gameProfilesDir = path.resolve(root, 'GameProfiles');
  const metadataDir     = path.resolve(root, 'Metadata');
  if (!fs.existsSync(gameProfilesDir)) {
    serverLogger.error('DB1', 'GameProfiles folder not found', { gameProfilesDir });
    return {};
  }
  const xmlFiles = fs.readdirSync(gameProfilesDir).filter(f => f.endsWith('.xml')).sort();
  serverLogger.info('DB1', `Scanning ${xmlFiles.length} GameProfile XMLs`);

  const rows = {};
  for (const xmlFile of xmlFiles) {
    const profileName = path.basename(xmlFile, '.xml');
    let xmlContent;
    try { xmlContent = fs.readFileSync(path.resolve(gameProfilesDir, xmlFile), 'utf8'); }
    catch { continue; }

    const emulator  = xmlField(xmlContent, 'EmulatorType');
    const patreon   = xmlField(xmlContent, 'Patreon').toLowerCase() === 'true';
    const gunGame   = xmlField(xmlContent, 'GunGame').toLowerCase()  === 'true';
    const xmlName   = xmlField(xmlContent, 'GameName');
    const xmlGenre  = xmlField(xmlContent, 'GameGenre');

    let meta = {};
    const metaPath = path.resolve(metadataDir, `${profileName}.json`);
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
    }

    const versionsStr = Array.isArray(meta.supported_versions)
      ? meta.supported_versions.filter(Boolean).join(', ')
      : String(meta.supported_versions || '');

    rows[profileName] = {
      'GameProfile Name': profileName,
      'Name':              meta.game_name    || xmlName  || profileName,
      'Release Date':      String(meta.release_year || ''),
      'Genre':             meta.game_genre   || xmlGenre || '',
      'Arcade Platform':   meta.platform     || '',
      'Emulator':          emulator,
      'Subscription':      patreon ? 'Yes' : 'No',
      'Interface':         inferInterfaces(xmlContent, gunGame),
      'GPU':               '',
      'Description':       '',
      'YouTube Link':      '',
      'Tags':              '',
      'Icon Name':         meta.icon_name    || `${profileName}.png`,
      'Nvidia':            meta.nvidia       || 'NO_INFO',
      'Nvidia Issues':     meta.nvidia_issues || '',
      'AMD':               meta.amd          || 'NO_INFO',
      'AMD Issues':        meta.amd_issues   || '',
      'Intel':             meta.intel        || 'NO_INFO',
      'Intel Issues':      meta.intel_issues  || '',
      'General Issues':    meta.general_issues || '',
      'Supported Versions': versionsStr,
      'Wheel Rotation':    meta.wheel_rotation || '',
      'Notes':    '',
      'Status':   '',
      'Favorite': '',
      'Hidden':   '',
      'Developer':       '',
      'Publisher':       '',
      'Players':         '',
      'ESRB':            '',
      'ScreenScraperID': '',
      'PrimaryProfile':  '',
      'Metadata From':   'TeknoParrot',
    };
  }
  serverLogger.success('DB1', `Scanned ${Object.keys(rows).length} games`);
  return rows;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────
function loadJSON(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { serverLogger.warn('DB', `Failed to parse ${path.basename(filePath)}`, { error: e.message }); return fallback; }
}

function sendJSON(res, status, payload) {
  res.writeHead(status, {'Content-Type':'application/json'});
  res.end(JSON.stringify(payload));
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fetchText(targetUrl, redirects = 4) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(targetUrl); }
    catch { return reject(new Error('Invalid URL')); }

    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(parsed, { headers: { 'User-Agent': APP_USER_AGENT } }, (fetchRes) => {
      if ([301, 302, 303, 307, 308].includes(fetchRes.statusCode) && fetchRes.headers.location && redirects > 0) {
        fetchRes.resume();
        return resolve(fetchText(new URL(fetchRes.headers.location, parsed).toString(), redirects - 1));
      }
      if (fetchRes.statusCode < 200 || fetchRes.statusCode >= 300) {
        fetchRes.resume();
        return reject(new Error(`HTTP ${fetchRes.statusCode}`));
      }

      fetchRes.setEncoding('utf8');
      let data = '';
      fetchRes.on('data', chunk => {
        data += chunk;
        if (data.length > 15 * 1024 * 1024) {
          req.destroy(new Error('Remote file is too large'));
        }
      });
      fetchRes.on('end', () => resolve(data));
    });
    req.setTimeout(12000, () => req.destroy(new Error('Request timed out')));
    req.on('error', reject);
  });
}

function parseDb2Manifest(text) {
  const manifest = JSON.parse(text);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Manifest must be a JSON object');
  }
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported manifest schema');
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256 || '')) throw new Error('Manifest hash is invalid');
  if (!manifest.databaseUrl || !/^https?:\/\//i.test(manifest.databaseUrl)) throw new Error('Manifest database URL is invalid');
  return {
    schemaVersion: manifest.schemaVersion,
    dbVersion: String(manifest.dbVersion || ''),
    updatedAt: String(manifest.updatedAt || ''),
    sha256: manifest.sha256.toLowerCase(),
    databaseUrl: manifest.databaseUrl,
  };
}

async function checkDb2Update() {
  const manifestText = await fetchText(`${DB2_MANIFEST_URL}?t=${Date.now()}`);
  const manifest = parseDb2Manifest(manifestText);
  const localManifest = loadJSON(path.resolve(dataDir, 'parrotOrganizerDB.manifest.json'), {});
  const localHash = sha256File(path.resolve(dataDir, 'parrotOrganizerDB.json'));
  return {
    ok: true,
    available: localHash !== manifest.sha256,
    localHash,
    remoteHash: manifest.sha256,
    localManifest,
    manifest,
  };
}

// ─── Merge DB1 + DB2 + DB3 → teknoparrot_database.json ──────────────────────
function mergeAndWrite() {
  const db1 = loadJSON(path.resolve(dataDir, 'teknoparrotDB.json'));      // TeknoParrot auto-scan
  const db2 = loadJSON(path.resolve(dataDir, 'parrotOrganizerDB.json')); // curated overrides
  const db3 = loadJSON(path.resolve(dataDir, 'userDB.json'));             // user personal data

  const merged = {};

  for (const [gameId, baseRow] of Object.entries(db1)) {
    const out = { ...baseRow };
    const d2 = db2[gameId] || {};
    const d3 = db3[gameId] || {};
    for (const col of ALL_COLUMNS) {
      if (col === 'GameProfile Name') continue;
      const v3 = (d3[col] || '').trim();
      const v2 = (d2[col] || '').trim();
      if (v3)      out[col] = v3;
      else if (v2) out[col] = v2;
    }
    merged[gameId] = out;
  }

  // Forward-carry games in DB2/DB3 but not in DB1 (e.g. custom / not-yet-in-TP)
  for (const db of [db2, db3]) {
    for (const [gameId, row] of Object.entries(db)) {
      if (!merged[gameId]) {
        const out = Object.fromEntries(ALL_COLUMNS.map(col => [col, '']));
        Object.assign(out, row);
        out['GameProfile Name'] = gameId;
        merged[gameId] = out;
      }
    }
  }

  const payload = Object.values(merged).sort((a, b) =>
    (a['Name'] || a['GameProfile Name']).localeCompare(b['Name'] || b['GameProfile Name'])
  );

  fs.writeFileSync(
    path.resolve(dataDir, 'teknoparrot_database.json'),
    JSON.stringify(payload, null, 2), 'utf8'
  );
  return payload.length;
}

// ─── Startup: scan DB1 then merge ────────────────────────────────────────────
serverLogger.info('Server', `ParrotOrganizer v${APP_VERSION} starting`, { root });

try {
  const db1 = scanDB1();
  fs.writeFileSync(path.resolve(dataDir, 'teknoparrotDB.json'), JSON.stringify(db1, null, 2), 'utf8');
  const count = mergeAndWrite();
  serverLogger.success('Server', `Database ready — ${count} games`, {
    teknoparrotDB:      Object.keys(db1).length,
    parrotOrganizerDB:  Object.keys(loadJSON(path.resolve(dataDir, 'parrotOrganizerDB.json'))).length,
    userDB:             Object.keys(loadJSON(path.resolve(dataDir, 'userDB.json'))).length,
  });
} catch (e) {
  serverLogger.error('Server', 'Database build failed', { error: e.message });
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');

    // ── Server logs ────────────────────────────────────────────────────────
    if (u.pathname === '/__serverLogs') {
      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({ ok: true, logs: serverLogger.logs }));
    }

    // ── Installed profiles (scan UserProfiles folder) ──────────────────────
    if (u.pathname === '/__userProfiles') {
      try {
        const dir = path.resolve(root, 'UserProfiles');
        const profiles = fs.existsSync(dir)
          ? fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.xml')).map(f => f.replace(/\.xml$/i,''))
          : [];
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, profiles }));
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Save user data to DB3 (notes, status, favorite) ────────────────────
    if (u.pathname === '/__saveUserData' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { profile, fields } = JSON.parse(body);
          if (!profile || typeof fields !== 'object') throw new Error('Missing profile or fields');

          const db3Path = path.resolve(dataDir, 'userDB.json');
          const db3 = loadJSON(db3Path);

          if (!db3[profile]) db3[profile] = {};
          for (const [key, value] of Object.entries(fields)) {
            const v = (value || '').trim();
            if (v) db3[profile][key] = v;
            else   delete db3[profile][key]; // keep DB3 sparse
          }
          // Remove empty profile entries entirely
          if (Object.keys(db3[profile]).length === 0) delete db3[profile];

          fs.writeFileSync(db3Path, JSON.stringify(db3, null, 2), 'utf8');
          const count = mergeAndWrite();
          serverLogger.info('/__saveUserData', `DB3 updated, merged ${count} games`, { profile, fields });

          res.writeHead(200, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          serverLogger.error('/__saveUserData', 'Failed', { error: e.message });
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── Trigger DB1 rescan + merge (manual refresh) ────────────────────────
    if (u.pathname === '/__rebuildDB' && req.method === 'POST') {
      try {
        const db1 = scanDB1();
        fs.writeFileSync(path.resolve(dataDir, 'teknoparrotDB.json'), JSON.stringify(db1, null, 2), 'utf8');
        const count = mergeAndWrite();
        serverLogger.success('/__rebuildDB', `Rebuild complete — ${count} games`);
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, count }));
      } catch (e) {
        serverLogger.error('/__rebuildDB', 'Rebuild failed', { error: e.message });
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Check/apply curated DB2 updates from GitHub ────────────────────────
    if (u.pathname === '/__db2Update/check' && req.method === 'GET') {
      (async () => {
        try {
          const result = await checkDb2Update();
          serverLogger.info('/__db2Update/check', result.available ? 'Curated DB update available' : 'Curated DB is current', {
            localHash: result.localHash,
            remoteHash: result.remoteHash,
            dbVersion: result.manifest.dbVersion,
          });
          return sendJSON(res, 200, result);
        } catch (e) {
          serverLogger.warn('/__db2Update/check', 'Could not check for curated DB update', { error: e.message });
          return sendJSON(res, 200, {
            ok: false,
            available: false,
            error: e.message,
            localHash: sha256File(path.resolve(dataDir, 'parrotOrganizerDB.json')),
            localManifest: loadJSON(path.resolve(dataDir, 'parrotOrganizerDB.manifest.json'), {}),
          });
        }
      })();
      return;
    }

    if (u.pathname === '/__db2Update/apply' && req.method === 'POST') {
      (async () => {
        try {
          const check = await checkDb2Update();
          const dbText = await fetchText(`${check.manifest.databaseUrl}?t=${Date.now()}`);
          const downloadedHash = sha256Text(dbText);
          if (downloadedHash !== check.manifest.sha256) {
            throw new Error('Downloaded database hash did not match the manifest');
          }

          const parsed = JSON.parse(dbText);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Downloaded database must be a JSON object');
          }

          fs.writeFileSync(path.resolve(dataDir, 'parrotOrganizerDB.json'), dbText, 'utf8');
          const count = mergeAndWrite();
          serverLogger.success('/__db2Update/apply', `Curated DB updated, merged ${count} games`, {
            dbVersion: check.manifest.dbVersion,
            remoteHash: check.remoteHash,
          });
          return sendJSON(res, 200, { ok: true, count, manifest: check.manifest, localHash: downloadedHash, remoteHash: check.remoteHash });
        } catch (e) {
          serverLogger.error('/__db2Update/apply', 'Curated DB update failed', { error: e.message });
          return sendJSON(res, 500, { ok: false, error: e.message });
        }
      })();
      return;
    }

    // ── Open TeknoParrotUI (no game profile) ───────────────────────────────
    if (u.pathname === '/__openTeknoParrot' && req.method === 'POST') {
      const exe = path.resolve(root, 'TeknoParrotUi.exe');
      try {
        const child = spawn(exe, [], { detached: true, stdio: 'ignore' });
        child.unref();
        serverLogger.success('/__openTeknoParrot', 'TeknoParrotUI launched');
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__openTeknoParrot', 'Failed', { error: e.message });
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Launch game ────────────────────────────────────────────────────────
    if (u.pathname === '/__launch') {
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Missing profile'})); }
      const gameName = profileParam.replace(/\.xml$/i,'');
      try {
        const child = spawn(path.resolve(root,'TeknoParrotUi.exe'), [`--profile=${gameName}.xml`], {detached:true,stdio:'ignore'});
        child.unref();
        serverLogger.success('/__launch','Game launched',{gameName});
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
      } catch (e) {
        serverLogger.error('/__launch','Failed',{error:e.message,gameName});
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Install game (copy GameProfile → UserProfiles) ─────────────────────
    if (u.pathname === '/__install') {
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Missing profile'})); }
      const gameName   = profileParam.replace(/\.xml$/i,'');
      const sourceFile = path.resolve(root,'GameProfiles',`${gameName}.xml`);
      const destFile   = path.resolve(root,'UserProfiles',`${gameName}.xml`);
      try {
        if (!fs.existsSync(sourceFile)) { res.writeHead(404,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'GameProfile not found'})); }
        if (fs.existsSync(destFile))    { res.writeHead(409,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Already installed'})); }
        let xml = fs.readFileSync(sourceFile,'utf8');
        // Inject ProfileName after root element opening
        let inject = `\n\t<ProfileName>${escapeXml(gameName)}</ProfileName>`;
        const metaPath = path.resolve(root,'Metadata',`${gameName}.json`);
        if (fs.existsSync(metaPath)) {
          try {
            const m = JSON.parse(fs.readFileSync(metaPath,'utf8'));
            if (m.game_name)  inject += `\n\t<GameNameInternal>${escapeXml(m.game_name)}</GameNameInternal>`;
            if (m.game_genre) inject += `\n\t<GameGenreInternal>${escapeXml(m.game_genre)}</GameGenreInternal>`;
          } catch {}
        }
        xml = xml.replace(/(<GameProfile[^>]*>)(\s*)(<[^>]+>)/, `$1$2${inject}\n\t$3`);
        if (xml.includes('<ValidMd5>')) xml = xml.replace(/(<ValidMd5>[^<]*<\/ValidMd5>)/, `$1\n\t<IconName>Icons/${escapeXml(gameName)}.png</IconName>`);
        const upDir = path.resolve(root,'UserProfiles');
        if (!fs.existsSync(upDir)) fs.mkdirSync(upDir,{recursive:true});
        fs.writeFileSync(destFile, xml, 'utf8');
        serverLogger.success('/__install','Installed',{gameName});
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
      } catch (e) {
        serverLogger.error('/__install','Failed',{error:e.message,gameName});
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Remove game ────────────────────────────────────────────────────────
    if (u.pathname === '/__remove' && req.method === 'POST') {
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Missing profile'})); }
      const gameName = profileParam.replace(/\.xml$/i,'');
      const upFile   = path.resolve(root,'UserProfiles',`${gameName}.xml`);
      try {
        if (!fs.existsSync(upFile)) { res.writeHead(404,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Not installed'})); }
        fs.unlinkSync(upFile);
        serverLogger.success('/__remove','Removed',{gameName});
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
      } catch (e) {
        serverLogger.error('/__remove','Failed',{error:e.message,gameName});
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Get game profile XML ───────────────────────────────────────────────
    // ?default=1 forces reading from GameProfiles/ (used by "Restore Defaults")
    if (u.pathname === '/__getGameProfile') {
      const gameId  = u.searchParams.get('id');
      const useDefault = u.searchParams.get('default') === '1';
      if (!gameId || !/^[a-zA-Z0-9_\-]+$/.test(gameId)) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Invalid ID'})); }
      try {
        const upPath = path.resolve(root,'UserProfiles',`${gameId}.xml`);
        const gpPath = path.resolve(root,'GameProfiles',`${gameId}.xml`);
        let xml, source;
        if (!useDefault && fs.existsSync(upPath)) { xml = fs.readFileSync(upPath,'utf8'); source = 'UserProfile'; }
        else if (fs.existsSync(gpPath))           { xml = fs.readFileSync(gpPath,'utf8'); source = 'GameProfile'; }
        else { res.writeHead(404,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Not found'})); }
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true,xml,source}));
      } catch (e) {
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Update game settings (write UserProfile XML) ───────────────────────
    if (u.pathname === '/__updateGameSettings' && req.method === 'POST') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_\-]+$/.test(gameId)) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Invalid ID'})); }
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { xmlContent } = JSON.parse(body);
          if (!xmlContent) throw new Error('Missing xmlContent');
          const upPath = path.resolve(root,'UserProfiles',`${gameId}.xml`);
          if (!fs.existsSync(upPath)) { res.writeHead(404,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Not installed'})); }
          fs.writeFileSync(upPath, xmlContent, 'utf8');
          serverLogger.success('/__updateGameSettings','Saved',{gameId});
          res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
        } catch (e) {
          res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
        }
      });
      return;
    }

    // ── Open folder in Explorer ────────────────────────────────────────────
    if (u.pathname === '/__openFolder' && req.method === 'POST') {
      const profile = u.searchParams.get('profile');
      try {
        let folder = storageDir;
        if (profile) {
          const gameName = profile.replace(/\.xml$/i, '');
          if (!/^[a-zA-Z0-9_\-]+$/.test(gameName)) {
            res.writeHead(400,{'Content-Type':'application/json'});
            return res.end(JSON.stringify({ok:false,error:'Invalid profile'}));
          }
          const upFile = path.resolve(root, 'UserProfiles', `${gameName}.xml`);
          if (!fs.existsSync(upFile)) {
            res.writeHead(404,{'Content-Type':'application/json'});
            return res.end(JSON.stringify({ok:false,error:'Game is not installed'}));
          }
          const xml = fs.readFileSync(upFile, 'utf8');
          const gamePathRaw = xmlField(xml, 'GamePath').replace(/^["']|["']$/g, '');
          if (!gamePathRaw) {
            res.writeHead(400,{'Content-Type':'application/json'});
            return res.end(JSON.stringify({ok:false,error:'Installed profile has no GamePath'}));
          }
          const resolvedGamePath = path.isAbsolute(gamePathRaw)
            ? gamePathRaw
            : path.resolve(root, gamePathRaw);
          folder = fs.existsSync(resolvedGamePath) && fs.statSync(resolvedGamePath).isDirectory()
            ? resolvedGamePath
            : path.dirname(resolvedGamePath);
        }
        openExplorerFocused(folder);
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
      } catch (e) {
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Launch status ──────────────────────────────────────────────────────
    if (u.pathname === '/__launchStatus') {
      exec('tasklist', { encoding: 'utf8' }, (err, stdout) => {
        const running = !err && stdout.toLowerCase().includes('teknoparrotui.exe');
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok: true, teknoParrotRunning: running }));
      });
      return;
    }

    // ── Check TeknoParrotUi.exe ────────────────────────────────────────────
    if (u.pathname === '/__checkTeknoParrotExe') {
      const exePath = path.resolve(root,'TeknoParrotUi.exe');
      const exists = fs.existsSync(exePath);
      res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true,exists,expectedPath:exePath}));
    }

    // ── Promote DB3 curated fields → DB2 (developer workflow) ────────────
    if (u.pathname === '/__promoteToDb2' && req.method === 'POST') {
      try {
        const db3Path = path.resolve(dataDir, 'userDB.json');
        const db2Path = path.resolve(dataDir, 'parrotOrganizerDB.json');
        const db3 = loadJSON(db3Path);
        const db2 = loadJSON(db2Path);
        const PROMOTE = ['Name','Description','YouTube Link','Tags','Genre','Arcade Platform','Interface','Developer','Publisher','Players','ESRB','ScreenScraperID','PrimaryProfile','Metadata From'];
        let promoted = 0;
        for (const [gameId, data] of Object.entries(db3)) {
          const toPromote = {};
          for (const field of PROMOTE) {
            if (data[field]) { toPromote[field] = data[field]; delete db3[gameId][field]; }
          }
          if (Object.keys(toPromote).length > 0) {
            if (!db2[gameId]) db2[gameId] = {};
            Object.assign(db2[gameId], toPromote);
            promoted++;
          }
          if (Object.keys(db3[gameId]).length === 0) delete db3[gameId];
        }
        fs.writeFileSync(db2Path, JSON.stringify(db2, null, 2), 'utf8');
        fs.writeFileSync(db3Path, JSON.stringify(db3, null, 2), 'utf8');
        const count = mergeAndWrite();
        serverLogger.success('/__promoteToDb2', `Promoted ${promoted} games to DB2, merged ${count} total`);
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, promoted, count }));
      } catch (e) {
        serverLogger.error('/__promoteToDb2', 'Failed', { error: e.message });
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Reset user data in DB3 ─────────────────────────────────────────────
    if (u.pathname === '/__resetUserData' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { fields, all } = JSON.parse(body);
          const db3Path = path.resolve(dataDir, 'userDB.json');
          let db3 = loadJSON(db3Path);
          if (all) {
            db3 = {};
          } else if (Array.isArray(fields) && fields.length > 0) {
            for (const gameId of Object.keys(db3)) {
              for (const field of fields) delete db3[gameId][field];
              if (Object.keys(db3[gameId]).length === 0) delete db3[gameId];
            }
          }
          fs.writeFileSync(db3Path, JSON.stringify(db3, null, 2), 'utf8');
          const count = mergeAndWrite();
          serverLogger.info('/__resetUserData', `Reset complete, merged ${count} games`, { fields, all });
          res.writeHead(200,{'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: true, count }));
        } catch (e) {
          serverLogger.error('/__resetUserData', 'Failed', { error: e.message });
          res.writeHead(500,{'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── Storage read / write ───────────────────────────────────────────────
    if (u.pathname === '/__storage/read') {
      const file = u.searchParams.get('file');
      if (!file || !/^[a-zA-Z0-9_\-]+\.json$/.test(file)) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Invalid file'})); }
      try {
        const fp = path.resolve(storageDir, file);
        if (!fs.existsSync(fp)) { res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true,exists:false,data:null})); }
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true,exists:true,data:JSON.parse(fs.readFileSync(fp,'utf8'))}));
      } catch (e) {
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }
    if (u.pathname === '/__storage/write' && req.method === 'POST') {
      const file = u.searchParams.get('file');
      if (!file || !/^[a-zA-Z0-9_\-]+\.json$/.test(file)) { res.writeHead(400,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:'Invalid file'})); }
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          fs.writeFileSync(path.resolve(storageDir,file), body, 'utf8');
          res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
        } catch (e) {
          res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
        }
      });
      return;
    }

    // ── Debug log helpers ──────────────────────────────────────────────────
    if (u.pathname === '/__writeDebugLog' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { logText } = JSON.parse(body);
          fs.appendFileSync(path.resolve(storageDir,'debug.log'), logText+'\n', 'utf8');
          res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
        } catch (e) {
          res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
        }
      });
      return;
    }
    if (u.pathname === '/__clearDebugLog' && req.method === 'POST') {
      try {
        const lf = path.resolve(storageDir,'debug.log');
        if (fs.existsSync(lf)) fs.unlinkSync(lf);
        res.writeHead(200,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
      } catch (e) {
        res.writeHead(500,{'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:false,error:e.message}));
      }
    }

    // ── Import userDB.json (backup restore) ───────────────────────────────────
    if (u.pathname === '/__importUserDB' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid data — expected a JSON object');
          fs.writeFileSync(path.resolve(dataDir, 'userDB.json'), JSON.stringify(parsed, null, 2), 'utf8');
          const count = mergeAndWrite();
          serverLogger.success('/__importUserDB', `User data imported, merged ${count} games`);
          res.writeHead(200, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: true, count }));
        } catch (e) {
          serverLogger.error('/__importUserDB', 'Failed', { error: e.message });
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── Shutdown ───────────────────────────────────────────────────────────
    if (u.pathname === '/__shutdown' && req.method === 'POST') {
      serverLogger.info('/__shutdown', 'Shutdown requested from UI');
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true}));
      setTimeout(() => {
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 500);
      }, 120);
      return;
    }

    // ── Scraper: read / write config ───────────────────────────────────────
    if (u.pathname === '/__scraper/config') {
      const scraperCfgPath = path.resolve(appFolder, 'dev', 'scraper-config.json');
      if (req.method === 'GET') {
        const cfg = loadJSON(scraperCfgPath, {});
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, configured: !!(cfg.ssid && cfg.sspassword), softname: cfg.softname || 'ParrotOrganizer' }));
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const devDir = path.resolve(appFolder, 'dev');
            if (!fs.existsSync(devDir)) fs.mkdirSync(devDir, { recursive: true });
            fs.writeFileSync(scraperCfgPath, JSON.stringify(data, null, 2), 'utf8');
            res.writeHead(200, {'Content-Type':'application/json'});
            return res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(500, {'Content-Type':'application/json'});
            return res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
        return;
      }
    }

    // ── Scraper: game list with scrape status ──────────────────────────────
    if (u.pathname === '/__scraper/games') {
      try {
        const db2 = loadJSON(path.resolve(dataDir, 'parrotOrganizerDB.json'));
        const mediaDir = path.resolve(appFolder, 'Media');
        const gameProfilesDir = path.resolve(root, 'GameProfiles');
        const xmlFiles = fs.existsSync(gameProfilesDir)
          ? fs.readdirSync(gameProfilesDir).filter(f => f.endsWith('.xml')).sort()
          : [];
        const games = xmlFiles.map(f => {
          const profile = path.basename(f, '.xml');
          const d2 = db2[profile] || {};
          const gameDirMedia = path.resolve(mediaDir, profile);
          return {
            profile,
            name: d2['Name'] || profile,
            ssid: d2['ScreenScraperID'] || null,
            primaryProfile: d2['PrimaryProfile'] || null,
            hasDescription: !!(d2['Description']),
            hasBox:   fs.existsSync(path.join(gameDirMedia, 'box.png')) || fs.existsSync(path.join(gameDirMedia, 'box.jpg')),
            hasWheel: fs.existsSync(path.join(gameDirMedia, 'wheel.png')) || fs.existsSync(path.join(gameDirMedia, 'wheel.jpg')),
            hasShot:  fs.existsSync(path.join(gameDirMedia, 'screenshot.png')) || fs.existsSync(path.join(gameDirMedia, 'screenshot.jpg')),
          };
        });
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, games }));
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Scraper: verify credentials against screenscraper.fr ──────────────
    if (u.pathname === '/__scraper/verify') {
      try {
        const scraperCfgPath = path.resolve(appFolder, 'dev', 'scraper-config.json');
        const cfg = loadJSON(scraperCfgPath, {});
        if (!cfg.ssid || !cfg.sspassword) {
          res.writeHead(200, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: 'No credentials configured' }));
        }
        const params = new URLSearchParams({
          devid:       cfg.devid       || '',
          devpassword: cfg.devpassword || '',
          softname:    cfg.softname    || 'ParrotOrganizer',
          ssid:        cfg.ssid,
          sspassword:  cfg.sspassword,
          output:      'json',
        });
        const apiUrl = `https://www.screenscraper.fr/api2/ssuserInfos.php?${params}`;
        https.get(apiUrl, { headers: { 'User-Agent': APP_USER_AGENT } }, (apiRes) => {
          apiRes.setEncoding('utf8');
          apiRes.setEncoding('utf8');
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            // screenscraper returns plain text (not JSON) for auth failures — handle both
            let parsed = null;
            try { parsed = JSON.parse(data); } catch (_) {}

            if (parsed) {
              const apiErr = parsed?.response?.header?.['APIerror'] || parsed?.response?.header?.error || '';
              const user   = parsed?.response?.ssuser;
              if (!user) {
                res.writeHead(200, {'Content-Type':'application/json'});
                return res.end(JSON.stringify({ ok: false, error: apiErr || 'Authentication failed' }));
              }
              res.writeHead(200, {'Content-Type':'application/json'});
              return res.end(JSON.stringify({
                ok:            true,
                username:      user.id,
                requestsToday: user.requeststoday     || '0',
                maxRequests:   user.maxrequestsperday || '?',
                maxThreads:    user.maxthreads        || '1',
              }));
            }

            // Plain-text error — strip HTML tags if any and return as the error message
            const plain = data.replace(/<[^>]+>/g, '').trim().slice(0, 300);
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ ok: false, error: plain || 'Authentication failed' }));
          });
        }).on('error', (e) => {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok: false, error: e.message }));
        });
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }

    // ── Scraper: direct ROM lookup by XML filename (system 269) ───────────
    // Primary lookup method — screenscraper indexes TeknoParrot by .xml filename
    if (u.pathname === '/__scraper/lookup') {
      const profile  = u.searchParams.get('profile') || '';
      const systemid = u.searchParams.get('systemid') || '269';
      if (!profile) { res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ ok: false, error: 'Missing profile' })); }
      try {
        const scraperCfgPath = path.resolve(appFolder, 'dev', 'scraper-config.json');
        const cfg = loadJSON(scraperCfgPath, {});
        if (!cfg.ssid || !cfg.sspassword) throw new Error('Screenscraper credentials not configured.');
        const params = new URLSearchParams({
          devid:       cfg.devid       || '',
          devpassword: cfg.devpassword || '',
          softname:    cfg.softname    || 'ParrotOrganizer',
          ssid:        cfg.ssid,
          sspassword:  cfg.sspassword,
          romnom:      `${profile}.xml`,
          systemeid:   systemid,
          output:      'json',
        });
        const apiUrl = `https://www.screenscraper.fr/api2/jeuInfos.php?${params}`;
        https.get(apiUrl, { headers: { 'User-Agent': APP_USER_AGENT } }, (apiRes) => {
          apiRes.setEncoding('utf8');
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const apiErr = parsed?.response?.header?.['APIerror'] || '';
              const j = parsed?.response?.jeu;
              if (!j) {
                res.writeHead(200, {'Content-Type':'application/json'});
                return res.end(JSON.stringify({ ok: false, notFound: true, error: apiErr || 'Not found in TeknoParrot library' }));
              }
              const pickText = (arr, prefRegions = ['wor','us','eu','ss']) => {
                if (!Array.isArray(arr)) return arr || '';
                for (const r of prefRegions) { const m = arr.find(x => x.region === r); if (m?.text) return m.text; }
                return arr[0]?.text || '';
              };
              const synopsis  = pickText(j.synopsis);
              const genre     = Array.isArray(j.genres) ? j.genres.map(g => pickText(g.noms)).filter(Boolean).join(', ') : '';
              const esrb      = Array.isArray(j.classifications) ? (j.classifications.find(c => c.type === 'ESRB')?.text || '') : '';
              const developer = j.developpeur?.text || '';
              const publisher = j.editeur?.text     || '';
              const players   = j.joueurs?.text     || '';
              const year      = pickText(j.dates)?.slice(0, 4) || '';
              const name      = pickText(j.noms);
              const WANT_TYPES = ['box-2D','wheel-hd','wheel','screenshot-hd','screenshot','marquee'];
              const mediaMap   = {};
              for (const m of (j.medias || [])) {
                if (!WANT_TYPES.includes(m.type)) continue;
                if (!mediaMap[m.type] || m.region === 'wor') mediaMap[m.type] = m.url;
              }
              const media = {
                box:        mediaMap['box-2D']        || null,
                wheel:      mediaMap['wheel-hd']      || mediaMap['wheel'] || null,
                screenshot: mediaMap['screenshot-hd'] || mediaMap['screenshot'] || null,
                marquee:    mediaMap['marquee']        || null,
              };
              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: true, game: { id: j.id, name, year, synopsis, genre, esrb, developer, publisher, players, media } }));
            } catch (e) {
              const plain = data.replace(/<[^>]+>/g, '').trim().slice(0, 300);
              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: false, error: plain || e.message }));
            }
          });
        }).on('error', (e) => {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok: false, error: e.message }));
        });
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }

    // ── Scraper: search screenscraper.fr by name ───────────────────────────
    if (u.pathname === '/__scraper/search') {
      const q        = u.searchParams.get('q') || '';
      const systemid = u.searchParams.get('systemid') || '269';
      if (!q.trim()) { res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ ok: false, error: 'Missing query' })); }
      try {
        const scraperCfgPath = path.resolve(appFolder, 'dev', 'scraper-config.json');
        const cfg = loadJSON(scraperCfgPath, {});
        if (!cfg.ssid || !cfg.sspassword) throw new Error('Screenscraper credentials not configured. Use the Settings button in the dev tool.');
        const params = new URLSearchParams({
          devid:       cfg.devid       || '',
          devpassword: cfg.devpassword || '',
          softname:    cfg.softname    || 'ParrotOrganizer',
          ssid:        cfg.ssid,
          sspassword:  cfg.sspassword,
          recherche:   q,
          systemeid:   systemid,
          output:      'json',
        });
        const apiUrl = `https://www.screenscraper.fr/api2/jeuRecherche.php?${params}`;
        https.get(apiUrl, { headers: { 'User-Agent': APP_USER_AGENT } }, (apiRes) => {
          apiRes.setEncoding('utf8');
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const jeux = parsed?.response?.jeux || [];
              const results = jeux.map(j => ({
                id:       j.id,
                name:     j.noms?.find(n => n.region === 'ss')?.text || j.noms?.[0]?.text || j.nom || '',
                year:     j.dates?.find(d => d.region === 'wor')?.text?.slice(0,4) || '',
                systemid: j.systemeid,
              }));
              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: true, results }));
            } catch (e) {
              const plain = data.replace(/<[^>]+>/g, '').trim().slice(0, 300);
              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: false, error: plain || e.message }));
            }
          });
        }).on('error', (e) => {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok: false, error: e.message }));
        });
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }

    // ── Scraper: full game info from screenscraper.fr ──────────────────────
    if (u.pathname === '/__scraper/game') {
      const gameid   = u.searchParams.get('id') || '';
      const systemid = u.searchParams.get('systemid') || '269';
      if (!gameid) { res.writeHead(400, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ ok: false, error: 'Missing id' })); }
      try {
        const scraperCfgPath = path.resolve(appFolder, 'dev', 'scraper-config.json');
        const cfg = loadJSON(scraperCfgPath, {});
        if (!cfg.ssid || !cfg.sspassword) throw new Error('Screenscraper credentials not configured.');
        const params = new URLSearchParams({
          devid:       cfg.devid       || '',
          devpassword: cfg.devpassword || '',
          softname:    cfg.softname    || 'ParrotOrganizer',
          ssid:        cfg.ssid,
          sspassword:  cfg.sspassword,
          gameid,
          systemeid:   systemid,
          output:      'json',
        });
        const apiUrl = `https://www.screenscraper.fr/api2/jeuInfos.php?${params}`;
        https.get(apiUrl, { headers: { 'User-Agent': APP_USER_AGENT } }, (apiRes) => {
          apiRes.setEncoding('utf8');
          let data = '';
          apiRes.on('data', chunk => { data += chunk; });
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const j = parsed?.response?.jeu;
              if (!j) { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ ok: false, error: 'Game not found in API response' })); }

              const pickText = (arr, prefRegions = ['wor','us','eu','ss']) => {
                if (!Array.isArray(arr)) return arr || '';
                for (const r of prefRegions) { const m = arr.find(x => x.region === r); if (m?.text) return m.text; }
                return arr[0]?.text || '';
              };

              const synopsis  = pickText(j.synopsis);
              const genre     = Array.isArray(j.genres) ? j.genres.map(g => pickText(g.noms)).filter(Boolean).join(', ') : '';
              const esrb      = Array.isArray(j.classifications) ? (j.classifications.find(c => c.type === 'ESRB')?.text || '') : '';
              const developer = j.developpeur?.text || '';
              const publisher = j.editeur?.text     || '';
              const players   = j.joueurs?.text     || '';
              const year      = pickText(j.dates)?.slice(0, 4) || '';
              const name      = pickText(j.noms);

              const WANT_TYPES = ['box-2D','wheel-hd','wheel','screenshot-hd','screenshot','marquee'];
              const mediaMap   = {};
              for (const m of (j.medias || [])) {
                if (!WANT_TYPES.includes(m.type)) continue;
                if (!mediaMap[m.type] || m.region === 'wor') mediaMap[m.type] = m.url;
              }
              // Consolidate to simpler keys for the UI
              const media = {
                box:        mediaMap['box-2D']         || null,
                wheel:      mediaMap['wheel-hd']       || mediaMap['wheel'] || null,
                screenshot: mediaMap['screenshot-hd']  || mediaMap['screenshot'] || null,
                marquee:    mediaMap['marquee']         || null,
              };

              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: true, game: { id: j.id, name, year, synopsis, genre, esrb, developer, publisher, players, media } }));
            } catch (e) {
              const plain = data.replace(/<[^>]+>/g, '').trim().slice(0, 300);
              res.writeHead(200, {'Content-Type':'application/json'});
              res.end(JSON.stringify({ ok: false, error: plain || e.message }));
            }
          });
        }).on('error', (e) => {
          res.writeHead(500, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok: false, error: e.message }));
        });
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
      return;
    }

    // ── Scraper: save metadata to DB2 + download media ────────────────────
    if (u.pathname === '/__scraper/save' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { profile, fields, mediaUrls } = JSON.parse(body);
          if (!profile) throw new Error('Missing profile');

          if (fields && Object.keys(fields).length > 0) {
            const db2Path = path.resolve(dataDir, 'parrotOrganizerDB.json');
            const db2 = loadJSON(db2Path);
            if (!db2[profile]) db2[profile] = {};
            Object.assign(db2[profile], fields);
            for (const k of Object.keys(db2[profile])) {
              if (db2[profile][k] === '') delete db2[profile][k];
            }
            fs.writeFileSync(db2Path, JSON.stringify(db2, null, 2), 'utf8');
          }

          // Download requested media files
          const mediaDir = path.resolve(appFolder, 'Media', profile);
          const downloads = [];
          if (mediaUrls && typeof mediaUrls === 'object') {
            if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
            for (const [slot, url] of Object.entries(mediaUrls)) {
              if (!url) continue;
              const ext = (url.split('.').pop().split('?')[0] || 'png').toLowerCase();
              const outPath = path.join(mediaDir, `${slot}.${ext}`);
              downloads.push(new Promise((resolve) => {
                const doDownload = (targetUrl, outFile, cb) => {
                  const mod = targetUrl.startsWith('https') ? https : require('http');
                  const file = fs.createWriteStream(outFile);
                  mod.get(targetUrl, { headers: { 'User-Agent': APP_USER_AGENT } }, (dlRes) => {
                    if (dlRes.statusCode === 301 || dlRes.statusCode === 302) {
                      file.close();
                      fs.unlink(outFile, () => {});
                      return doDownload(dlRes.headers.location, outFile, cb);
                    }
                    dlRes.pipe(file);
                    file.on('finish', () => { file.close(); cb(null); });
                    file.on('error',  (e) => { file.close(); cb(e); });
                  }).on('error', (e) => { file.close(); cb(e); });
                };
                doDownload(url, outPath, (err) => {
                  resolve({ slot, ok: !err, error: err?.message });
                });
              }));
            }
          }

          const dlResults = await Promise.all(downloads);
          const count = mergeAndWrite();
          serverLogger.success('/__scraper/save', `Saved ${profile}, merged ${count} games`);
          res.writeHead(200, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: true, count, downloads: dlResults }));
        } catch (e) {
          serverLogger.error('/__scraper/save', 'Failed', { error: e.message });
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── Scraper: import metadata from JSON file into DB2 ──────────────────
    if (u.pathname === '/__scraper/importJson' && req.method === 'POST') {
      try {
        const jsonPath = path.resolve(appFolder, 'dev', 'teknoparrot_screenscaper_metadata.json');
        if (!fs.existsSync(jsonPath)) throw new Error('teknoparrot_screenscaper_metadata.json not found in dev/');
        const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (!Array.isArray(entries)) throw new Error('JSON file must be an array of game entries');

        const db2Path = path.resolve(dataDir, 'parrotOrganizerDB.json');
        const db2 = loadJSON(db2Path);
        let imported = 0;

        for (const entry of entries) {
          const profile = entry.game_id;
          if (!profile) continue;

          // Extract year from date strings like "25/04/2007" or "2007"
          let year = '';
          if (entry.release_date) {
            const m = String(entry.release_date).match(/\d{4}/);
            if (m) year = m[0];
          }

          // Genres: join array with ", " preserving order (first = primary)
          const genre = Array.isArray(entry.genres)
            ? entry.genres.filter(Boolean).join(', ')
            : (entry.genres || '');

          if (!db2[profile]) db2[profile] = {};
          const fields = {
            'Developer':     entry.developer              || '',
            'Publisher':     entry.publisher              || '',
            'Players':       entry.players                || '',
            'Genre':         genre,
            'Release Date':  year,
            'Description':   entry.synopsis               || '',
            'ScreenScraperID': String(entry.screenscraper_game_id || ''),
            'Metadata From': 'Screenscraper.fr',
          };
          for (const [k, v] of Object.entries(fields)) {
            if (v) db2[profile][k] = v;
            else   delete db2[profile][k]; // keep sparse
          }
          imported++;
        }

        fs.writeFileSync(db2Path, JSON.stringify(db2, null, 2), 'utf8');
        const count = mergeAndWrite();
        serverLogger.success('/__scraper/importJson', `Imported ${imported} entries, merged ${count} games`);
        res.writeHead(200, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: true, imported, count }));
      } catch (e) {
        serverLogger.error('/__scraper/importJson', 'Failed', { error: e.message });
        res.writeHead(500, {'Content-Type':'application/json'});
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    // ── Scraper: delete media files for a profile ─────────────────────────
    if (u.pathname === '/__scraper/deleteMedia' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { profile, slot } = JSON.parse(body);
          if (!profile) throw new Error('Missing profile');
          const mediaDir = path.resolve(appFolder, 'Media', profile);
          if (slot) {
            for (const ext of ['png','jpg','jpeg','webp']) {
              const fp = path.join(mediaDir, `${slot}.${ext}`);
              if (fs.existsSync(fp)) fs.unlinkSync(fp);
            }
          } else {
            if (fs.existsSync(mediaDir)) fs.rmSync(mediaDir, { recursive: true });
          }
          res.writeHead(200, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(500, {'Content-Type':'application/json'});
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ── Static file serving ────────────────────────────────────────────────
    // Paths resolve from TeknoParrot root so /Icons/... and /ParrotOrganizer/... both work.
    let urlPath = u.pathname === '/' ? '/ParrotOrganizer/index.html' : decodeURIComponent(u.pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    if (!path.extname(urlPath)) urlPath = urlPath.replace(/\/?$/, '/index.html');

    const safePath = path.normalize(urlPath).replace(/^[\\\/]+/, '');
    const absPath  = path.resolve(root, safePath);
    if (!absPath.startsWith(root)) { res.writeHead(403); return res.end('403 Forbidden'); }

    fs.readFile(absPath, (err, data) => {
      if (err) { res.writeHead(404,{'Content-Type':'text/plain'}); return res.end('404 Not Found: '+safePath); }
      res.writeHead(200, {'Content-Type': mime[path.extname(absPath).toLowerCase()] || 'application/octet-stream'});
      res.end(data);
    });

  } catch (e) {
    serverLogger.error('Server','Unhandled error',{error:e.message});
    res.writeHead(500,{'Content-Type':'text/plain'}); res.end('500 Internal Server Error');
  }
});

const port = Number(process.env.PORT || 8000);
const bind = process.env.BIND_ADDR || '127.0.0.1';
server.listen(port, bind, () => {
  serverLogger.success('Server', `Running at http://${bind}:${port}/ParrotOrganizer/`);
  console.log(`\n  Open: http://localhost:${port}/ParrotOrganizer/\n`);
});
