const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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

const root = __dirname.replace(/\\ParrotOrganizer\\scripts$/i, '');

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');

    // Launch endpoint
    if (u.pathname === '/__launch') {
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Install endpoint - copy GameProfile to UserProfile
    if (u.pathname === '/__install') {
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
      }
    }

    // Remove from library endpoint - delete UserProfile
    if (u.pathname === '/__remove') {
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (e) {
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
