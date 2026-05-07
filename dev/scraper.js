// scraper.js — Parrot Scraper dev tool frontend
// All API calls go to the same ParrotOrganizer server (port 8000 by default)

const BASE = window.location.origin; // http://localhost:8000

// ── State ─────────────────────────────────────────────────────────────────────
let allGames      = [];    // full game list from /__scraper/games
let filteredGames = [];    // after search + filter
let activeFilter  = 'all'; // all | missing | partial | done
let selectedGame  = null;  // current game row object
let searchResults = [];    // screenscraper search results
let selectedMatch = null;  // chosen screenscraper result
let scrapedData   = null;  // full game details from /__scraper/game
let fieldChecks   = {};    // { fieldKey: bool } which fields to save
let mediaChecks   = {};    // { slot: bool } which images to download

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await checkConfig();
  await loadGameList();
  setFilter('all');
}

async function checkConfig() {
  const el = document.getElementById('credStatus');
  try {
    const r = await fetch(`${BASE}/__scraper/config`);
    const d = await r.json();
    if (!d.configured) {
      el.textContent = '⚠ Credentials not set';
      el.className = 'hdr-status err';
      return;
    }
    // Configured — verify and show quota
    const vr = await fetch(`${BASE}/__scraper/verify`);
    const vd = await vr.json();
    if (vd.ok) {
      el.textContent = `✓ ${vd.username} — ${vd.requestsToday}/${vd.maxRequests} req today`;
      el.className = 'hdr-status ok';
    } else {
      el.textContent = '✗ Credentials invalid — click to fix';
      el.className = 'hdr-status err';
    }
  } catch (e) {
    el.textContent = '⚠ Server not reachable';
    el.className = 'hdr-status err';
  }
}

async function loadGameList() {
  try {
    const r = await fetch(`${BASE}/__scraper/games`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    allGames = d.games;
    document.getElementById('gameCount').textContent = `(${allGames.length})`;
    renderGameList();
  } catch (e) {
    console.error('Failed to load games:', e);
  }
}

// ── Game list rendering ───────────────────────────────────────────────────────
function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('on'));
  document.getElementById(`f-${f}`).classList.add('on');
  renderGameList();
}

function filterGameList() {
  renderGameList();
}

function getStatus(g) {
  const hasMedia = g.hasBox || g.hasWheel || g.hasShot;
  if (g.ssid && g.hasDescription && hasMedia) return 'done';
  if (g.ssid || g.hasDescription || hasMedia) return 'partial';
  return 'missing';
}

function renderGameList() {
  const q = document.getElementById('listSearch').value.toLowerCase().trim();
  filteredGames = allGames.filter(g => {
    const status = getStatus(g);
    if (activeFilter === 'missing' && status !== 'missing') return false;
    if (activeFilter === 'partial' && status !== 'partial') return false;
    if (activeFilter === 'done'    && status !== 'done')    return false;
    if (q && !g.profile.toLowerCase().includes(q) && !g.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const el = document.getElementById('gameList');
  el.innerHTML = '';
  for (const g of filteredGames) {
    const row = document.createElement('div');
    row.className = 'game-row' + (selectedGame?.profile === g.profile ? ' active' : '');
    row.dataset.profile = g.profile;

    const isAlias = !!g.primaryProfile;
    const dots = [
      { on: g.ssid,           title: 'Has ScreenScraper ID' },
      { on: g.hasDescription, title: 'Has description' },
      { on: g.hasBox,         title: 'Has box art' },
      { on: g.hasWheel || g.hasShot, title: 'Has wheel/screenshot' },
    ];

    row.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div class="game-row-name">${esc(g.name !== g.profile ? g.name : g.profile)}</div>
        <div class="game-row-profile">${esc(g.profile)}${isAlias ? ` → ${esc(g.primaryProfile)}` : ''}</div>
      </div>
      <div class="dots">
        ${dots.map(d => `<span class="dot ${d.on ? (isAlias ? 'alias' : 'on') : ''}" title="${d.title}"></span>`).join('')}
      </div>
    `;
    row.addEventListener('click', () => selectGame(g));
    el.appendChild(row);
  }
}

// ── Select a game from the list ───────────────────────────────────────────────
function selectGame(g) {
  selectedGame  = g;
  searchResults = [];
  selectedMatch = null;
  scrapedData   = null;
  fieldChecks   = {};
  mediaChecks   = {};
  renderGameList();
  renderScrapeArea();
  // Auto-lookup: if game already has a SS ID use that; otherwise try direct ROM lookup
  if (g.ssid) {
    fetchGameDetails(g.ssid);
  } else {
    // Small delay so the DOM is ready
    setTimeout(doLookup, 50);
  }
}

// ── Main scrape area rendering ────────────────────────────────────────────────
function renderScrapeArea() {
  document.getElementById('emptyState').style.display  = 'none';
  const area = document.getElementById('scrapeArea');
  area.style.display = 'flex';

  if (!selectedGame) {
    document.getElementById('emptyState').style.display = 'grid';
    area.style.display = 'none';
    return;
  }

  const g = selectedGame;
  const hasMedia = g.hasBox || g.hasWheel || g.hasShot;

  area.innerHTML = `
    <!-- Game header -->
    <div class="game-hdr">
      <div class="game-hdr-name">${esc(g.name)}</div>
      <div class="game-hdr-profile">${esc(g.profile)}</div>
      ${g.ssid ? `<div class="game-hdr-ssid">ScreenScraper ID: ${g.ssid}</div>` : ''}
      ${g.primaryProfile ? `<div class="game-hdr-alias">Alias of: ${esc(g.primaryProfile)}</div>` : ''}
    </div>

    <!-- Lookup / Search -->
    <div>
      <div class="section-title">Find on Screenscraper.fr</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div class="search-row">
          <code style="flex:1;padding:7px 10px;background:var(--bg2);border:1px solid var(--line2);border-radius:var(--radius-sm);font-size:12px;color:var(--text1);font-family:'JetBrains Mono',monospace;">${esc(g.profile)}.xml</code>
          <select id="ssSystem">
            <option value="269">TeknoParrot (269)</option>
            <option value="75">Arcade (75)</option>
            <option value="1">MAME (1)</option>
            <option value="0">All systems (0)</option>
          </select>
          <button class="btn primary" id="lookupBtn" onclick="doLookup()" title="Look up by XML filename — primary method">Direct Lookup</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:1px;background:var(--line);"></div>
          <span style="font-size:11px;color:var(--text3);">or search by title if not found</span>
          <div style="flex:1;height:1px;background:var(--line);"></div>
        </div>
        <div class="search-row">
          <input id="ssQuery" value="${esc(g.name)}" placeholder="Game title…"/>
          <button class="btn" id="searchBtn" onclick="doSearch()">Title Search</button>
        </div>
      </div>
      <div id="lookupStatus" style="margin-top:8px;font-size:12px;font-family:'JetBrains Mono',monospace;"></div>
    </div>

    <!-- Results -->
    <div id="resultsSection" style="display:none;">
      <div class="section-title" id="resultsTitle">Results</div>
      <div class="results-grid" id="resultsGrid"></div>
    </div>

    <!-- Metadata preview -->
    <div id="metaSection" style="display:none;">
      <div class="section-title">Metadata — check fields to save to DB2</div>
      <div class="meta-preview" id="metaPreview"></div>
    </div>

    <!-- Media -->
    <div id="mediaSection" style="display:none;">
      <div class="section-title">Media — check images to download</div>
      <div class="media-grid" id="mediaGrid"></div>
    </div>

    <!-- Alias -->
    <div>
      <div class="section-title">Alias (PrimaryProfile)</div>
      <div class="alias-row">
        <input id="aliasInput" placeholder="Profile name this is an alias of (leave blank if primary)" value="${esc(g.primaryProfile || '')}"/>
        <button class="btn" onclick="saveAlias()">Set Alias</button>
        ${g.primaryProfile ? `<button class="btn danger" onclick="clearAlias()">Clear</button>` : ''}
      </div>
    </div>

    <!-- Save -->
    <div class="save-row" id="saveRow" style="display:none;">
      <button class="btn primary" id="saveBtn" onclick="doSave()">💾 Save to DB2</button>
      <span id="saveMsg" class="save-msg"></span>
    </div>
  `;

}

// ── Direct ROM lookup by XML filename (primary method) ────────────────────────
async function doLookup() {
  if (!selectedGame) return;
  const systemid = document.getElementById('ssSystem')?.value || '269';
  const btn = document.getElementById('lookupBtn');
  const status = document.getElementById('lookupStatus');
  if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.disabled = true; }
  if (status) status.textContent = '';

  try {
    const r = await fetch(`${BASE}/__scraper/lookup?profile=${encodeURIComponent(selectedGame.profile)}&systemid=${systemid}`);
    const d = await r.json();
    if (!d.ok) {
      if (status) {
        status.style.color = d.notFound ? 'var(--warn)' : 'var(--err)';
        status.textContent = d.notFound
          ? `⚠ "${selectedGame.profile}.xml" not found in TeknoParrot (${systemid}) — try title search below`
          : '✗ ' + d.error;
      }
      return;
    }
    if (status) {
      status.style.color = 'var(--ok)';
      status.textContent = `✓ Found: ${d.game.name} (ID ${d.game.id})`;
    }
    scrapedData = d.game;
    renderMeta();
    renderMedia();
    document.getElementById('saveRow').style.display = 'flex';
    document.getElementById('metaSection').style.display = 'block';
  } catch (e) {
    if (status) { status.style.color = 'var(--err)'; status.textContent = '✗ ' + e.message; }
  } finally {
    if (btn) { btn.textContent = 'Direct Lookup'; btn.disabled = false; }
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
async function doSearch() {
  const q   = document.getElementById('ssQuery').value.trim();
  const sys = document.getElementById('ssSystem').value;
  if (!q) return;

  const btn = document.getElementById('searchBtn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    const r = await fetch(`${BASE}/__scraper/search?q=${encodeURIComponent(q)}&systemid=${sys}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    searchResults = d.results;
    renderResults();
  } catch (e) {
    showSaveMsg(e.message, 'err');
  } finally {
    btn.textContent = 'Search';
    btn.disabled = false;
  }
}

function renderResults() {
  const sec   = document.getElementById('resultsSection');
  const grid  = document.getElementById('resultsGrid');
  const title = document.getElementById('resultsTitle');
  sec.style.display = searchResults.length ? 'block' : 'none';
  title.textContent = `Results (${searchResults.length})`;
  grid.innerHTML = '';

  if (!searchResults.length) {
    grid.innerHTML = '<div style="color:var(--text2);font-size:12px;">No results found. Try a shorter or different title.</div>';
    sec.style.display = 'block';
    return;
  }

  for (const r of searchResults) {
    const card = document.createElement('div');
    card.className = 'result-card' + (selectedMatch?.id === r.id ? ' selected' : '');
    card.innerHTML = `
      <div class="result-card-name">${esc(r.name)}</div>
      <div class="result-card-meta">${r.year || '—'} · ID ${r.id}</div>
    `;
    card.addEventListener('click', () => {
      selectedMatch = r;
      fetchGameDetails(r.id, r.systemid || '75');
      renderResults();
    });
    grid.appendChild(card);
  }
}

// ── Fetch full game details ───────────────────────────────────────────────────
async function fetchGameDetails(ssid, systemid = '75') {
  const metaSec = document.getElementById('metaSection');
  if (!metaSec) return;
  metaSec.style.display = 'block';
  document.getElementById('metaPreview').innerHTML = '<span class="spinner"></span> Loading…';
  document.getElementById('mediaSection').style.display = 'none';
  document.getElementById('saveRow').style.display = 'none';

  try {
    const r = await fetch(`${BASE}/__scraper/game?id=${ssid}&systemid=${systemid}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    scrapedData = d.game;
    renderMeta();
    renderMedia();
    document.getElementById('saveRow').style.display = 'flex';
  } catch (e) {
    document.getElementById('metaPreview').innerHTML = `<span style="color:var(--err);">${esc(e.message)}</span>`;
  }
}

// ── Render metadata checkboxes ────────────────────────────────────────────────
function renderMeta() {
  if (!scrapedData) return;
  const j = scrapedData;

  const fields = [
    { key: 'ScreenScraperID', label: 'ScreenScraper ID', value: String(j.id) },
    { key: 'Name',            label: 'Name',              value: j.name },
    { key: 'Description',     label: 'Synopsis',          value: j.synopsis, cls: 'synopsis' },
    { key: 'Genre',           label: 'Genre',             value: j.genre },
    { key: 'Developer',       label: 'Developer',         value: j.developer },
    { key: 'Publisher',       label: 'Publisher',         value: j.publisher },
    { key: 'Players',         label: 'Players',           value: j.players },
    { key: 'ESRB',            label: 'ESRB Rating',       value: j.esrb },
    { key: 'Release Date',    label: 'Release Year',      value: j.year },
  ].filter(f => f.value);

  // Default: check all except Name (usually already curated) and ScreenScraperID (always check)
  for (const f of fields) {
    if (fieldChecks[f.key] === undefined) {
      fieldChecks[f.key] = f.key !== 'Name';
    }
  }

  const preview = document.getElementById('metaPreview');
  preview.innerHTML = '';

  for (const f of fields) {
    const row = document.createElement('div');
    row.className = 'meta-row';
    row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';

    const cb = document.createElement('div');
    cb.className = 'checkbox' + (fieldChecks[f.key] ? ' checked' : '');
    cb.style.marginTop = '2px';
    cb.addEventListener('click', () => {
      fieldChecks[f.key] = !fieldChecks[f.key];
      cb.className = 'checkbox' + (fieldChecks[f.key] ? ' checked' : '');
    });

    const content = document.createElement('div');
    content.style.flex = '1';
    content.innerHTML = `
      <div class="meta-label">${esc(f.label)}</div>
      <div class="meta-value ${f.cls || ''}">${esc(f.value)}</div>
    `;

    row.appendChild(cb);
    row.appendChild(content);
    preview.appendChild(row);
  }
}

// ── Render media checkboxes ───────────────────────────────────────────────────
function renderMedia() {
  if (!scrapedData?.media) return;
  const media = scrapedData.media;
  const available = Object.entries(media).filter(([,url]) => url);
  if (!available.length) return;

  const SLOTS = {
    box:        'Box Art',
    wheel:      'Wheel / Logo',
    screenshot: 'Screenshot',
    marquee:    'Marquee',
  };

  // Default: check box, wheel, screenshot; skip marquee
  for (const [slot] of available) {
    if (mediaChecks[slot] === undefined) {
      mediaChecks[slot] = slot !== 'marquee';
    }
  }

  const sec  = document.getElementById('mediaSection');
  const grid = document.getElementById('mediaGrid');
  sec.style.display = 'block';
  grid.innerHTML = '';

  for (const [slot, url] of available) {
    const card = document.createElement('div');
    card.className = 'media-card' + (mediaChecks[slot] ? ' selected' : '');
    card.innerHTML = `
      <img class="media-card-img" src="${esc(url)}" alt="${slot}" loading="lazy"
           onerror="this.style.display='none'"/>
      <div class="media-card-label">${esc(SLOTS[slot] || slot)}</div>
      <div class="media-card-check">
        <div class="checkbox ${mediaChecks[slot] ? 'checked' : ''}" id="mc-${slot}"></div>
        <span>Download</span>
      </div>
    `;
    const cb = card.querySelector('.checkbox');
    const toggle = () => {
      mediaChecks[slot] = !mediaChecks[slot];
      cb.className = 'checkbox' + (mediaChecks[slot] ? ' checked' : '');
      card.className = 'media-card' + (mediaChecks[slot] ? ' selected' : '');
    };
    cb.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    card.addEventListener('click', toggle);
    grid.appendChild(card);
  }
}

// ── Save to DB2 ───────────────────────────────────────────────────────────────
async function doSave() {
  if (!selectedGame || !scrapedData) return;

  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';
  showSaveMsg('', '');

  // Build fields to save
  const j = scrapedData;
  const allFields = {
    ScreenScraperID: String(j.id),
    Name:            j.name,
    Description:     j.synopsis,
    Genre:           j.genre,
    Developer:       j.developer,
    Publisher:       j.publisher,
    Players:         j.players,
    ESRB:            j.esrb,
    'Release Date':  j.year,
  };
  const fields = {};
  for (const [k, v] of Object.entries(allFields)) {
    if (v && fieldChecks[k]) fields[k] = v;
  }

  // Build media URLs to download
  const mediaUrls = {};
  for (const [slot, checked] of Object.entries(mediaChecks)) {
    if (checked && scrapedData.media?.[slot]) {
      mediaUrls[slot] = scrapedData.media[slot];
    }
  }

  try {
    const r = await fetch(`${BASE}/__scraper/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: selectedGame.profile, fields, mediaUrls }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);

    const dlOk  = d.downloads?.filter(x => x.ok).length  || 0;
    const dlErr = d.downloads?.filter(x => !x.ok).length || 0;
    let msg = `✓ Saved ${Object.keys(fields).length} field(s)`;
    if (dlOk)  msg += `, downloaded ${dlOk} image(s)`;
    if (dlErr) msg += ` (${dlErr} failed)`;
    showSaveMsg(msg, 'ok');

    // Refresh game list to update status dots
    await loadGameList();
    // Re-select the current game to update dots
    const updated = allGames.find(g => g.profile === selectedGame.profile);
    if (updated) selectedGame = updated;
    renderGameList();
  } catch (e) {
    showSaveMsg('Error: ' + e.message, 'err');
  } finally {
    btn.textContent = '💾 Save to DB2';
    btn.disabled = false;
  }
}

// ── Alias controls ────────────────────────────────────────────────────────────
async function saveAlias() {
  if (!selectedGame) return;
  const alias = document.getElementById('aliasInput').value.trim();
  await saveToDb2(selectedGame.profile, { PrimaryProfile: alias });
  showSaveMsg(alias ? `✓ Alias set to ${alias}` : '✓ Alias cleared', 'ok');
  await loadGameList();
  const updated = allGames.find(g => g.profile === selectedGame.profile);
  if (updated) { selectedGame = updated; renderGameList(); }
}

async function clearAlias() {
  if (!selectedGame) return;
  document.getElementById('aliasInput').value = '';
  await saveToDb2(selectedGame.profile, { PrimaryProfile: '' });
  showSaveMsg('✓ Alias cleared', 'ok');
  await loadGameList();
  const updated = allGames.find(g => g.profile === selectedGame.profile);
  if (updated) { selectedGame = updated; renderGameList(); }
}

async function saveToDb2(profile, fields) {
  const r = await fetch(`${BASE}/__scraper/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, fields, mediaUrls: {} }),
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.error);
}

// ── Import Screenscraper JSON → DB2 ──────────────────────────────────────────
async function importJson() {
  const btn = document.getElementById('importBtn');
  const msg = document.getElementById('importMsg');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  msg.textContent = '';
  msg.style.color = '';

  try {
    const r = await fetch(`${BASE}/__scraper/importJson`, { method: 'POST' });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    msg.textContent = `✓ Imported ${d.imported} games into DB2`;
    msg.style.color = 'var(--ok)';
    // Refresh game list to reflect new status dots
    await loadGameList();
    renderGameList();
  } catch (e) {
    msg.textContent = '✗ ' + e.message;
    msg.style.color = 'var(--err)';
  } finally {
    btn.textContent = '⬆ Import JSON';
    btn.disabled = false;
  }
}

// ── Config modal ──────────────────────────────────────────────────────────────
function openConfig() {
  document.getElementById('configModal').style.display = 'grid';
  const errEl = document.getElementById('cfgVerifyErr');
  if (errEl) errEl.remove();
  const btn = document.querySelector('#configModal .btn.primary');
  if (btn) { btn.textContent = 'Save & Verify'; btn.disabled = false; }
}
function closeConfig() {
  document.getElementById('configModal').style.display = 'none';
}
async function saveConfig() {
  const cfg = {
    devid:       document.getElementById('cfgDevid').value.trim(),
    devpassword: document.getElementById('cfgDevpassword').value,
    ssid:        document.getElementById('cfgSsid').value.trim(),
    sspassword:  document.getElementById('cfgSspassword').value,
    softname:    'ParrotOrganizer',
  };
  if (!cfg.devid || !cfg.devpassword) {
    let errEl = document.getElementById('cfgVerifyErr');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'cfgVerifyErr';
      errEl.style.cssText = 'color:var(--err);font-size:12px;font-family:monospace;padding:6px 10px;background:rgba(248,113,113,.1);border-radius:4px;border:1px solid rgba(248,113,113,.3);';
      document.querySelector('.modal-row').before(errEl);
    }
    errEl.textContent = '✗ Developer ID and Developer Password are required to use the API';
    return;
  }

  const saveBtn = document.querySelector('#configModal .btn.primary');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> Verifying…';

  try {
    // Save first
    const saveR = await fetch(`${BASE}/__scraper/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    const saveD = await saveR.json();
    if (!saveD.ok) throw new Error(saveD.error);

    // Then verify
    const verR = await fetch(`${BASE}/__scraper/verify`);
    const verD = await verR.json();
    if (!verD.ok) {
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
      // Show error inline in modal
      let errEl = document.getElementById('cfgVerifyErr');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'cfgVerifyErr';
        errEl.style.cssText = 'color:var(--err);font-size:12px;font-family:monospace;padding:6px 10px;background:rgba(248,113,113,.1);border-radius:4px;border:1px solid rgba(248,113,113,.3);';
        document.querySelector('.modal-row').before(errEl);
      }
      errEl.textContent = '✗ ' + (verD.error || 'Authentication failed — check your credentials');
      return;
    }

    closeConfig();
    // Update status with quota info
    const el = document.getElementById('credStatus');
    el.textContent = `✓ ${verD.username} — ${verD.requestsToday}/${verD.maxRequests} requests today`;
    el.className = 'hdr-status ok';
  } catch (e) {
    alert('Error: ' + e.message);
    saveBtn.textContent = 'Save';
    saveBtn.disabled = false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showSaveMsg(msg, type) {
  const el = document.getElementById('saveMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'save-msg' + (type ? ' ' + type : '');
}

// Close config modal on background click
document.getElementById('configModal').addEventListener('click', closeConfig);

// Start
init();
