const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Simple server-side logger for debugging
const serverLogger = {
  logs: [],
  startTime: Date.now(),
  logFilePath: null,

  // initLogFile is no longer needed - moved inline below

  log(level, endpoint, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      relativeTime: Date.now() - this.startTime,
      level,
      endpoint,
      message,
      data
    };
    this.logs.push(entry);

    // Keep only last 500 entries in memory
    if (this.logs.length > 500) {
      this.logs.shift();
    }

    // Format log text
    const emoji = { ERROR: '❌', WARN: '⚠️', INFO: '🖥️', SUCCESS: '✅' }[level] || 'ℹ️';
    const timeStr = `[+${(entry.relativeTime / 1000).toFixed(2)}s]`;
    const logText = `${entry.timestamp} ${timeStr} ${emoji} [SERVER] [${endpoint}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;

    // Log to console
    if (data) {
      console.log(`${emoji} ${timeStr} [${endpoint}] ${message}`, data);
    } else {
      console.log(`${emoji} ${timeStr} [${endpoint}] ${message}`);
    }

    // Write to file if initialized
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logText + '\n', 'utf8');
      } catch (e) {
        console.error('Failed to write to log file:', e.message);
      }
    }
  },

  info(endpoint, message, data) { this.log('INFO', endpoint, message, data); },
  success(endpoint, message, data) { this.log('SUCCESS', endpoint, message, data); },
  warn(endpoint, message, data) { this.log('WARN', endpoint, message, data); },
  error(endpoint, message, data) { this.log('ERROR', endpoint, message, data); }
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

// Auto-detect folder name (supports ParrotOrganizer, ParrotOrganizer-1.2, ParrotOrganizer-main, etc.)
// __dirname is the ParrotOrganizer folder: D:\TeknoParrot\ParrotOrganizer-1.2
const appFolder = __dirname;  // D:\TeknoParrot\ParrotOrganizer-1.2
const appFolderName = path.basename(appFolder);   // ParrotOrganizer-1.2
const root = path.resolve(appFolder, '..');        // D:\TeknoParrot

// Initialize log file (now uses detected folder name)
const storageDir = path.resolve(appFolder, 'storage');
serverLogger.logFilePath = path.resolve(storageDir, 'debug.log');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
const sessionHeader = `\n${'='.repeat(80)}\nSERVER SESSION STARTED: ${new Date().toISOString()}\n${'='.repeat(80)}\n`;
fs.appendFileSync(serverLogger.logFilePath, sessionHeader, 'utf8');

// Log comprehensive system information
serverLogger.info('Server', 'System Information', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  osRelease: require('os').release(),
  osType: require('os').type(),
  cpuCount: require('os').cpus().length,
  totalMemoryGB: (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2)
});

serverLogger.info('Server', 'Server script initialized', {
  root,
  appFolder: appFolderName,
  workingDirectory: process.cwd()
});

// Verify ParrotOrganizer is in correct location and has all operational files
serverLogger.info('Server', 'Verifying ParrotOrganizer installation');

const requiredFiles = [
  { path: path.resolve(appFolder, 'index.html'), name: 'index.html' },
  { path: path.resolve(appFolder, 'js', 'app.js'), name: 'js/app.js' },
  { path: path.resolve(appFolder, 'css', 'styles.css'), name: 'css/styles.css' },
  { path: path.resolve(appFolder, 'server.js'), name: 'server.js' }
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(file.path)) {
    missingFiles.push(file.name);
    serverLogger.error('Server', `CRITICAL: Required file missing: ${file.name}`, { path: file.path });
  }
});

if (missingFiles.length === 0) {
  serverLogger.success('Server', 'All ParrotOrganizer operational files found', {
    filesChecked: requiredFiles.length
  });
} else {
  serverLogger.error('Server', 'CRITICAL: ParrotOrganizer is missing required files!', {
    missingFiles,
    message: 'ParrotOrganizer installation may be corrupt or incomplete'
  });
}

// Verify ParrotOrganizer is inside TeknoParrot folder (not standalone)
const teknoParrotExe = path.resolve(root, 'TeknoParrotUi.exe');
if (fs.existsSync(teknoParrotExe)) {
  serverLogger.success('Server', 'ParrotOrganizer location verified - inside TeknoParrot folder', {
    teknoParrotExe
  });
} else {
  serverLogger.error('Server', 'CRITICAL: TeknoParrotUi.exe not found in parent folder!', {
    expectedPath: teknoParrotExe,
    message: 'ParrotOrganizer must be placed INSIDE the TeknoParrot folder (not standalone)'
  });
}

// Verify storage folder exists (user-specific data)
if (!fs.existsSync(storageDir)) {
  serverLogger.warn('Server', 'Storage folder does not exist - creating it (first-time user)', {
    path: storageDir
  });
  fs.mkdirSync(storageDir, { recursive: true });
  serverLogger.success('Server', 'Storage folder created', { path: storageDir });
} else {
  // Check what's in storage folder
  const storageFiles = fs.readdirSync(storageDir);
  serverLogger.info('Server', 'Storage folder exists', {
    path: storageDir,
    files: storageFiles,
    message: 'This folder contains user-specific data (preferences, custom profiles, debug logs)'
  });
}

// Verify folder structure and count available games
const gameProfilesFolder = path.resolve(root, 'GameProfiles');
const userProfilesFolder = path.resolve(root, 'UserProfiles');
const metadataFolder = path.resolve(root, 'Metadata');
const iconsFolder = path.resolve(appFolder, 'Icons');

let gameProfilesXmlCount = 0;
let userProfilesXmlCount = 0;
let metadataJsonCount = 0;
let iconCount = 0;

serverLogger.info('Server', 'Scanning TeknoParrot folder structure');

// Count XML files in GameProfiles
if (fs.existsSync(gameProfilesFolder)) {
  try {
    const files = fs.readdirSync(gameProfilesFolder);
    gameProfilesXmlCount = files.filter(f => f.toLowerCase().endsWith('.xml')).length;
    serverLogger.success('Server', 'GameProfiles folder scanned', {
      folder: gameProfilesFolder,
      xmlFileCount: gameProfilesXmlCount
    });
  } catch (e) {
    serverLogger.error('Server', 'Failed to scan GameProfiles folder', { error: e.message });
  }
} else {
  serverLogger.error('Server', 'CRITICAL: GameProfiles folder does NOT exist!', {
    expectedPath: gameProfilesFolder,
    message: 'This is the main game data folder. TeknoParrot installation may be corrupt or incomplete.'
  });
}

// Count XML files in UserProfiles
if (fs.existsSync(userProfilesFolder)) {
  try {
    const files = fs.readdirSync(userProfilesFolder);
    userProfilesXmlCount = files.filter(f => f.toLowerCase().endsWith('.xml')).length;
    if (userProfilesXmlCount > 0) {
      serverLogger.success('Server', 'UserProfiles folder scanned', {
        folder: userProfilesFolder,
        xmlFileCount: userProfilesXmlCount
      });
    } else {
      serverLogger.info('Server', 'UserProfiles folder is empty - no games installed yet', {
        folder: userProfilesFolder
      });
    }
  } catch (e) {
    serverLogger.error('Server', 'Failed to scan UserProfiles folder', { error: e.message });
  }
} else {
  serverLogger.warn('Server', 'UserProfiles folder does not exist', {
    expectedPath: userProfilesFolder,
    message: 'Folder will be created when user installs first game'
  });
}

// Count JSON files in Metadata
if (fs.existsSync(metadataFolder)) {
  try {
    const files = fs.readdirSync(metadataFolder);
    metadataJsonCount = files.filter(f => f.toLowerCase().endsWith('.json')).length;
    serverLogger.info('Server', 'Metadata folder scanned', {
      folder: metadataFolder,
      jsonFileCount: metadataJsonCount
    });
  } catch (e) {
    serverLogger.warn('Server', 'Failed to scan Metadata folder', { error: e.message });
  }
} else {
  serverLogger.warn('Server', 'Metadata folder does not exist', {
    expectedPath: metadataFolder
  });
}

// Count icon files
if (fs.existsSync(iconsFolder)) {
  try {
    const files = fs.readdirSync(iconsFolder);
    iconCount = files.filter(f => {
      const ext = f.toLowerCase();
      return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.gif');
    }).length;
    serverLogger.info('Server', 'Icons folder scanned', {
      folder: iconsFolder,
      imageFileCount: iconCount
    });
  } catch (e) {
    serverLogger.warn('Server', 'Failed to scan Icons folder', { error: e.message });
  }
} else {
  serverLogger.warn('Server', 'Icons folder does not exist', {
    expectedPath: iconsFolder
  });
}

// Summary of scan
serverLogger.success('Server', 'Folder structure scan complete', {
  gameProfilesAvailable: gameProfilesXmlCount,
  userProfilesInstalled: userProfilesXmlCount,
  metadataFiles: metadataJsonCount,
  iconFiles: iconCount
});

// Verify game list generation succeeded (files are now in storage/ folder)
const gameProfilesFile = path.resolve(storageDir, 'gameProfiles.txt');
const userProfilesFile = path.resolve(storageDir, 'userProfiles.txt');

serverLogger.info('Server', 'Verifying game list generation from startup scan');

if (!fs.existsSync(storageDir)) {
  serverLogger.error('Server', 'CRITICAL: storage/ folder does not exist - game scanning failed!', {
    expectedPath: storageDir,
    message: 'start.bat failed to create storage folder or scan failed'
  });
} else {
  serverLogger.success('Server', 'storage/ folder exists', { storageDir });

  // Check gameProfiles.txt
  if (fs.existsSync(gameProfilesFile)) {
    try {
      const content = fs.readFileSync(gameProfilesFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim().length > 0);

      if (lines.length === 0) {
        serverLogger.warn('Server', 'gameProfiles.txt exists but is EMPTY', {
          file: gameProfilesFile,
          message: 'No games found - GameProfiles folder may be empty or scan failed'
        });
      } else {
        serverLogger.success('Server', 'gameProfiles.txt loaded successfully', {
          file: gameProfilesFile,
          gameCount: lines.length,
          sampleGames: lines.slice(0, 5)
        });
      }
    } catch (e) {
      serverLogger.error('Server', 'Failed to read gameProfiles.txt', {
        file: gameProfilesFile,
        error: e.message
      });
    }
  } else {
    serverLogger.error('Server', 'CRITICAL: gameProfiles.txt does NOT exist!', {
      expectedPath: gameProfilesFile,
      message: 'Game list generation failed during startup. Users will see "No games found". Check if GameProfiles folder exists and contains XML files.'
    });
  }

  // Check userProfiles.txt
  if (fs.existsSync(userProfilesFile)) {
    try {
      const content = fs.readFileSync(userProfilesFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim().length > 0);

      if (lines.length === 0) {
        serverLogger.info('Server', 'userProfiles.txt exists but is empty - no installed games', {
          file: userProfilesFile
        });
      } else {
        serverLogger.success('Server', 'userProfiles.txt loaded successfully', {
          file: userProfilesFile,
          installedCount: lines.length,
          installedGames: lines.slice(0, 5)
        });
      }
    } catch (e) {
      serverLogger.error('Server', 'Failed to read userProfiles.txt', {
        file: userProfilesFile,
        error: e.message
      });
    }
  } else {
    serverLogger.warn('Server', 'userProfiles.txt does NOT exist', {
      expectedPath: userProfilesFile,
      message: 'No installed games or UserProfiles scan failed'
    });
  }
}

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');

    // Debug logs endpoint - get server logs
    if (u.pathname === '/__serverLogs') {
      try {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, logs: serverLogger.logs }));
      } catch (e) {
        serverLogger.error('/__serverLogs', 'Failed to retrieve server logs', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Write debug log to file endpoint
    if (u.pathname === '/__writeDebugLog' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { logText } = JSON.parse(body);

          const storageDir = path.resolve(appFolder, 'storage');
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          const logFile = path.resolve(storageDir, 'debug.log');

          // Append to log file
          fs.appendFileSync(logFile, logText + '\n', 'utf8');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          serverLogger.error('/__writeDebugLog', 'Failed to write debug log', { error: e.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
      });
      return;
    }

    // Open log folder in Windows Explorer
    if (u.pathname === '/__openLogFolder' && req.method === 'POST') {
      try {
        const storageDir = path.resolve(root, 'ParrotOrganizer', 'storage');

        // Ensure storage directory exists
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }

        // Open folder in Windows Explorer
        const child = spawn('explorer', [storageDir], { detached: true, stdio: 'ignore' });
        child.unref();

        serverLogger.info('/__openLogFolder', 'Opened log folder', { storageDir });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__openLogFolder', 'Failed to open log folder', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Clear debug log file
    if (u.pathname === '/__clearDebugLog' && req.method === 'POST') {
      try {
        const logFile = path.resolve(appFolder, 'storage', 'debug.log');

        if (fs.existsSync(logFile)) {
          fs.unlinkSync(logFile);
        }

        serverLogger.info('/__clearDebugLog', 'Debug log file cleared');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__clearDebugLog', 'Failed to clear debug log', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Check if TeknoParrotUi.exe exists
    if (u.pathname === '/__checkTeknoParrotExe') {
      try {
        const exePath = path.resolve(root, 'TeknoParrotUi.exe');
        const exists = fs.existsSync(exePath);

        serverLogger.info('/__checkTeknoParrotExe', 'Checked for TeknoParrotUi.exe', { exists, path: exePath });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, exists, path: exePath }));
      } catch (e) {
        serverLogger.error('/__checkTeknoParrotExe', 'Failed to check for exe', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Get server information (Node.js version, platform, etc.)
    if (u.pathname === '/__serverInfo') {
      try {
        const serverInfo = {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cwd: process.cwd(),
          root: root,
          uptime: process.uptime()
        };

        serverLogger.info('/__serverInfo', 'Server info requested', serverInfo);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, ...serverInfo }));
      } catch (e) {
        serverLogger.error('/__serverInfo', 'Failed to get server info', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Launch endpoint
    if (u.pathname === '/__launch') {
      serverLogger.info('/__launch', 'Game launch requested', { profile: u.searchParams.get('profile') });
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Missing profile parameter' }));
      }

      const exe = path.resolve(root, 'TeknoParrotUi.exe');
      let profilePath = profileParam;
      if (!path.isAbsolute(profilePath)) {
        const cleaned = profileParam.replace(/^\/+/, '').replace(/\\/g, '/');
        if (cleaned.indexOf('/') === -1) {
          // Just a filename like abc.xml -> assume UserProfiles
          profilePath = path.resolve(root, 'UserProfiles', cleaned);
        } else {
          // Relative path inside root
          profilePath = path.resolve(root, cleaned);
        }
      }
      try {
        const child = spawn(exe, [`--profile=${profilePath}`], { detached: true, stdio: 'ignore' });
        child.unref();
        serverLogger.success('/__launch', 'Game launched successfully', { profilePath, exe });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__launch', 'Failed to launch game', { error: e.message, profilePath, exe });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Install endpoint - copy GameProfile to UserProfile
    if (u.pathname === '/__install') {
      serverLogger.info('/__install', 'Install game requested', { profile: u.searchParams.get('profile') });
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Missing profile parameter' }));
      }

      const gameName = profileParam.replace(/\.xml$/i, '');
      const sourceFile = path.resolve(root, 'GameProfiles', `${gameName}.xml`);
      const destFile = path.resolve(root, 'UserProfiles', `${gameName}.xml`);

      try {
        // Check if source exists
        if (!fs.existsSync(sourceFile)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Game profile not found' }));
        }

        // Check if already installed
        if (fs.existsSync(destFile)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Game already installed' }));
        }

        // Copy file
        fs.copyFileSync(sourceFile, destFile);
        serverLogger.success('/__install', 'Game installed successfully', { gameName, sourceFile, destFile });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__install', 'Failed to install game', { error: e.message, gameName });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Remove from library endpoint - delete UserProfile
    if (u.pathname === '/__remove') {
      serverLogger.info('/__remove', 'Remove game requested', { profile: u.searchParams.get('profile') });
      const profileParam = u.searchParams.get('profile');
      if (!profileParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Missing profile parameter' }));
      }

      const gameName = profileParam.replace(/\.xml$/i, '');
      const userProfileFile = path.resolve(root, 'UserProfiles', `${gameName}.xml`);

      try {
        // Check if user profile exists
        if (!fs.existsSync(userProfileFile)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Game not in library' }));
        }

        // Delete file
        fs.unlinkSync(userProfileFile);
        serverLogger.success('/__remove', 'Game removed successfully', { gameName, userProfileFile });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        serverLogger.error('/__remove', 'Failed to remove game', { error: e.message, gameName });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Shutdown endpoint
    if (u.pathname === '/__shutdown') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Server shutting down...' }));
      setTimeout(() => {
        console.log('Server shutting down via user request...');
        process.exit(0);
      }, 100);
      return;
    }

    // Open TeknoParrot endpoint
    if (u.pathname === '/__openTeknoParrot') {
      const exe = path.resolve(root, 'TeknoParrotUi.exe');
      try {
        const child = spawn(exe, [], { detached: true, stdio: 'ignore' });
        child.unref();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Check launch status endpoint
    if (u.pathname === '/__launchStatus') {
      try {
        // Check if TeknoParrotUi.exe is running
        const { execSync } = require('child_process');
        let isRunning = false;

        try {
          // Windows: check if TeknoParrotUi.exe is in task list
          const output = execSync('tasklist', { encoding: 'utf8' });
          isRunning = output.toLowerCase().includes('teknoparrotui.exe');
        } catch (e) {
          // If tasklist fails, assume not running
          isRunning = false;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          nodejs: true,
          teknoParrotRunning: isRunning
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Dynamic user profiles list endpoint (scans UserProfiles folder)
    if (u.pathname === '/__userProfiles') {
      try {
        const userProfilesDir = path.resolve(root, 'UserProfiles');

        if (!fs.existsSync(userProfilesDir)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, profiles: [] }));
        }

        const files = fs.readdirSync(userProfilesDir);
        const profiles = files
          .filter(f => f.toLowerCase().endsWith('.xml'))
          .map(f => f.replace(/\.xml$/i, ''));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, profiles }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Storage API - Read storage file
    if (u.pathname === '/__storage/read') {
      const file = u.searchParams.get('file');
      if (!file || !/^[a-zA-Z0-9_-]+\.json$/.test(file)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid file parameter' }));
      }

      try {
        const storagePath = path.resolve(appFolder, 'storage', file);

        // Ensure file is within storage directory (security)
        const storageDir = path.resolve(root, 'ParrotOrganizer', 'storage');
        if (!storagePath.startsWith(storageDir)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Access denied' }));
        }

        // Read file or return default empty data
        let data = file === 'customProfiles.json' || file === 'preferences.json' ? '{}' : '[]';
        if (fs.existsSync(storagePath)) {
          data = fs.readFileSync(storagePath, 'utf8');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, data: JSON.parse(data) }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Storage API - Write storage file
    if (u.pathname === '/__storage/write' && req.method === 'POST') {
      const file = u.searchParams.get('file');
      if (!file || !/^[a-zA-Z0-9_-]+\.json$/.test(file)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid file parameter' }));
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const storagePath = path.resolve(appFolder, 'storage', file);

          // Ensure file is within storage directory (security)
          const storageDir = path.resolve(appFolder, 'storage');
          if (!storagePath.startsWith(storageDir)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: 'Access denied' }));
          }

          // Ensure storage directory exists
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          // Validate JSON
          const data = JSON.parse(body);

          // Write file
          fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
      });
      return;
    }

    // Custom Profile API - Read XML file
    if (u.pathname === '/__customProfile/read') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      try {
        const profilePath = path.resolve(appFolder, 'storage', 'CustomProfiles', `${gameId}.xml`);

        if (!fs.existsSync(profilePath)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, exists: false, data: null }));
        }

        const xmlContent = fs.readFileSync(profilePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, exists: true, data: xmlContent }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Custom Profile API - Write XML file
    if (u.pathname === '/__customProfile/write' && req.method === 'POST') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const customProfilesDir = path.resolve(appFolder, 'storage', 'CustomProfiles');

          // Ensure directory exists
          if (!fs.existsSync(customProfilesDir)) {
            fs.mkdirSync(customProfilesDir, { recursive: true });
          }

          const profilePath = path.resolve(customProfilesDir, `${gameId}.xml`);

          // Write XML file
          fs.writeFileSync(profilePath, body, 'utf8');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
      });
      return;
    }

    // Custom Profile API - Delete XML file (user edits only)
    if (u.pathname === '/__customProfile/delete' && req.method === 'POST') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      try {
        const profilePath = path.resolve(appFolder, 'storage', 'CustomProfiles', `${gameId}.xml`);

        if (fs.existsSync(profilePath)) {
          fs.unlinkSync(profilePath);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Creator Profile API - Read XML file from data/CustomProfiles
    if (u.pathname === '/__creatorProfile/read') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      try {
        const profilePath = path.resolve(appFolder, 'data', 'CustomProfiles', `${gameId}.xml`);

        if (!fs.existsSync(profilePath)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, exists: false, data: null }));
        }

        const xmlContent = fs.readFileSync(profilePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, exists: true, data: xmlContent }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // ADMIN: Push custom profiles from storage to data (for preparing new builds)
    if (u.pathname === '/__pushCustomProfilesToData' && req.method === 'POST') {
      try {
        const storageProfilesDir = path.resolve(appFolder, 'storage', 'CustomProfiles');
        const dataProfilesDir = path.resolve(appFolder, 'data', 'CustomProfiles');

        // Ensure data/CustomProfiles exists
        if (!fs.existsSync(dataProfilesDir)) {
          fs.mkdirSync(dataProfilesDir, { recursive: true });
        }

        let mergedCount = 0;
        let deletedCount = 0;

        // Check if storage/CustomProfiles exists
        if (fs.existsSync(storageProfilesDir)) {
          const files = fs.readdirSync(storageProfilesDir);

          // Copy each XML file from storage to data
          files.forEach(file => {
            if (file.toLowerCase().endsWith('.xml')) {
              const sourcePath = path.resolve(storageProfilesDir, file);
              const destPath = path.resolve(dataProfilesDir, file);

              // Copy file (overwrite if exists)
              fs.copyFileSync(sourcePath, destPath);
              mergedCount++;

              // Delete from storage
              fs.unlinkSync(sourcePath);
              deletedCount++;
            }
          });

          serverLogger.success('/__pushCustomProfilesToData', 'Admin operation: Profiles pushed to data', {
            merged: mergedCount,
            deleted: deletedCount
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, merged: mergedCount, deleted: deletedCount }));
      } catch (e) {
        serverLogger.error('/__pushCustomProfilesToData', 'Failed to push profiles to data', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Delete all custom profiles (reset function) - only clears storage/CustomProfiles
    if (u.pathname === '/__deleteCustomProfiles' && req.method === 'POST') {
      try {
        const customProfilesDir = path.resolve(appFolder, 'storage', 'CustomProfiles');

        if (fs.existsSync(customProfilesDir)) {
          const files = fs.readdirSync(customProfilesDir);
          let deletedCount = 0;

          files.forEach(file => {
            if (file.toLowerCase().endsWith('.xml')) {
              fs.unlinkSync(path.resolve(customProfilesDir, file));
              deletedCount++;
            }
          });

          serverLogger.success('/__deleteCustomProfiles', 'User custom profiles deleted', { deletedCount });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, deletedCount }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, deletedCount: 0 }));
      } catch (e) {
        serverLogger.error('/__deleteCustomProfiles', 'Failed to delete custom profiles', { error: e.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Get GameProfile endpoint - reads from UserProfiles first, falls back to GameProfiles
    if (u.pathname === '/__getGameProfile') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      try {
        // Try UserProfiles first (user's configured settings)
        const userProfilePath = path.resolve(root, 'UserProfiles', `${gameId}.xml`);
        const gameProfilePath = path.resolve(root, 'GameProfiles', `${gameId}.xml`);

        let xmlContent;
        let source;

        if (fs.existsSync(userProfilePath)) {
          // User has configured this game - use their settings
          xmlContent = fs.readFileSync(userProfilePath, 'utf8');
          source = 'UserProfile';
        } else if (fs.existsSync(gameProfilePath)) {
          // Fall back to defaults
          xmlContent = fs.readFileSync(gameProfilePath, 'utf8');
          source = 'GameProfile';
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Game profile not found' }));
        }

        serverLogger.success('/__getGameProfile', `${source} loaded`, { gameId, source });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, xml: xmlContent }));
      } catch (e) {
        serverLogger.error('/__getGameProfile', 'Failed to read profile', { error: e.message, gameId });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Update game settings endpoint - writes to UserProfiles folder
    if (u.pathname === '/__updateGameSettings' && req.method === 'POST') {
      const gameId = u.searchParams.get('id');
      if (!gameId || !/^[a-zA-Z0-9_-]+$/.test(gameId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid game ID' }));
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const userProfilePath = path.resolve(root, 'UserProfiles', `${gameId}.xml`);

          // Check if user profile exists
          if (!fs.existsSync(userProfilePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: 'Game not installed' }));
          }

          // Parse request body
          const { xmlContent } = JSON.parse(body);
          if (!xmlContent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: 'Missing xmlContent in request body' }));
          }

          // Write updated XML to UserProfile
          fs.writeFileSync(userProfilePath, xmlContent, 'utf8');

          serverLogger.success('/__updateGameSettings', 'Game settings updated', { gameId });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          serverLogger.error('/__updateGameSettings', 'Failed to update game settings', { error: e.message, gameId });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
      });
      return;
    }

    // Browse folder endpoint - opens Windows folder picker dialog
    if (u.pathname === '/__browseFolder' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const { initialPath } = JSON.parse(body);

          // Use PowerShell to show folder picker dialog
          const { execSync } = require('child_process');
          const psScript = `
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.Application]::EnableVisualStyles()
            $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
            $dialog.Description = "Select game folder"
            ${initialPath ? `$dialog.SelectedPath = "${initialPath.replace(/\\/g, '\\\\')}"` : ''}
            $dialog.ShowNewFolderButton = $false
            $topmost = New-Object System.Windows.Forms.Form
            $topmost.TopMost = $true
            $topmost.MinimizeBox = $false
            $topmost.MaximizeBox = $false
            $topmost.WindowState = 'Minimized'
            $topmost.ShowInTaskbar = $false
            $result = $dialog.ShowDialog($topmost)
            $topmost.Dispose()
            if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
              Write-Output $dialog.SelectedPath
            }
          `;

          const result = execSync(`powershell -WindowStyle Hidden -Command "${psScript.replace(/"/g, '\\"')}"`, {
            encoding: 'utf8',
            timeout: 60000
          }).trim();

          if (result) {
            serverLogger.success('/__browseFolder', 'Folder selected', { path: result });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: true, path: result }));
          } else {
            serverLogger.info('/__browseFolder', 'Folder selection cancelled');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: true, cancelled: true }));
          }
        } catch (e) {
          serverLogger.error('/__browseFolder', 'Failed to open folder browser', { error: e.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
      });
      return;
    }

    // Static file
    let urlPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url);
    // If requesting a directory (e.g., /ParrotOrganizer/), serve its index.html
    if (urlPath.endsWith('/')) {
      urlPath += 'index.html';
    }
    // Handle directory without trailing slash (e.g., /ParrotOrganizer)
    if (!path.extname(urlPath)) {
      urlPath = urlPath.replace(/\/?$/, '/index.html');
    }
    const safePath = path.normalize(urlPath).replace(/^\\+/,'/');
    const absPath = path.resolve(root, '.' + safePath);

    if (!absPath.startsWith(root)) {
      res.writeHead(403);
      return res.end('403 Forbidden');
    }

    fs.readFile(absPath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      const ext = path.extname(absPath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

const port = Number(process.env.PORT || 8000);
const bind = process.env.BIND_ADDR || '0.0.0.0';
server.listen(port, bind, () => console.log(`Server running at http://${bind}:${port}`));

// No additional helpers
