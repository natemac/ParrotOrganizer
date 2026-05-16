// app-settings.jsx — App Settings modal (gear icon)
// Sections: Game Library, Data Management, Backup & Restore, Developer

function AppSettingsPanel({ onClose, onRefreshGames, setConfirmDialog, dbUpdate, onCheckDbUpdate, onApplyDbUpdate }) {
  const [busy, setBusy] = useState({});
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  // Wraps an async handler: manages busy flag and error message
  const withBusy = (key, fn) => async (...args) => {
    setBusy(p => ({ ...p, [key]: true }));
    setMsg(null);
    try { await fn(...args); }
    catch (e) { setMsg({ ok: false, text: e.message || 'Something went wrong' }); }
    finally { setBusy(p => ({ ...p, [key]: false })); }
  };

  const doRefresh = withBusy('refresh', async () => {
    const r = await fetch('/__rebuildDB', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Rebuild failed');
    await onRefreshGames();
    setMsg({ ok: true, text: `Game list refreshed — ${d.count} games found` });
  });

  const doCheckCuratedDb = withBusy('dbCheck', async () => {
    const d = await onCheckDbUpdate({ notify: false });
    if (!d.ok) throw new Error(d.error || 'Could not check curated database updates');
    setMsg({
      ok: true,
      text: d.available
        ? `Curated database update available${d.manifest?.dbVersion ? ` (${d.manifest.dbVersion})` : ''}`
        : 'Curated database is current',
    });
  });

  const doApplyCuratedDb = withBusy('dbApply', async () => {
    const d = await onApplyDbUpdate();
    if (!d.ok) throw new Error(d.error || 'Curated database update failed');
    setMsg({ ok: true, text: `Curated database updated - ${d.count} games rebuilt` });
  });

  const doReset = withBusy('reset', async (fields) => {
    const body = fields ? { fields } : { all: true };
    const r = await fetch('/__resetUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Reset failed');
    await onRefreshGames();
    setMsg({ ok: true, text: fields ? 'Selected user data reset' : 'All data reset' });
  });

  const exportStamp = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  const doExport = withBusy('export', async () => {
    // Read userDB.json directly from the data folder via static file server
    const r = await fetch('data/userDB.json?t=' + Date.now());
    if (!r.ok) throw new Error('Could not read user data — has anything been saved yet?');
    const d = await r.json();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `parrot-organizer-userdata-${exportStamp()}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Settings exported — check your Downloads folder' });
  });

  const doImport = withBusy('import', async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('Invalid file — expected a JSON object');
    // Write directly to userDB.json in the data folder, then rebuild
    const r = await fetch('/__importUserDB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Import failed');
    await onRefreshGames();
    setMsg({ ok: true, text: 'Settings imported and database rebuilt' });
  });

  const doPromote = withBusy('promote', async () => {
    const r = await fetch('/__promoteToDb2', { method: 'POST' });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'Promote failed');
    await onRefreshGames();
    setMsg({ ok: true, text: `Promoted ${d.promoted} game(s) to Parrot Organizer Database` });
  });

  const confirmReset = (label, fields, message) => {
    setConfirmDialog({
      title: label,
      message,
      confirmLabel: label,
      onConfirm: () => { setConfirmDialog(null); doReset(fields); },
    });
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-modal as-panel" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <div>
            <div className="editor-title">App Settings</div>
            <div className="editor-subtitle">Game library, data management, and backup</div>
          </div>
          <button className="editor-close" onClick={onClose}><Icon name="close" size={14}/></button>
        </div>

        <div className="editor-body" style={{gap: 16}}>
          {msg && (
            <div className={msg.ok ? 'as-msg-ok' : 'editor-error'}>
              {msg.text}
            </div>
          )}

          {/* ── Game Library ─────────────────────────────────────────────── */}
          <div className="as-version-row">
            <span>App v2.1.0</span>
            <span>Database {dbUpdate?.localManifest?.dbVersion || 'unknown'}</span>
          </div>

          <div className="as-section">
            <div className="as-section-title">Game Library</div>
            <div className="as-section-body">
              <button className="as-btn" onClick={doRefresh} disabled={busy.refresh}>
                <Icon name="refresh" size={13}/>
                {busy.refresh ? 'Refreshing…' : 'Refresh Game List'}
              </button>
              <div className="as-btn-grid">
                <button className="as-btn" onClick={doCheckCuratedDb} disabled={busy.dbCheck || dbUpdate?.checking}>
                  <Icon name="refresh" size={13}/>
                  {(busy.dbCheck || dbUpdate?.checking) ? 'Checking...' : 'Check Curated Database Updates'}
                </button>
                <button className="as-btn" onClick={doApplyCuratedDb} disabled={busy.dbApply || dbUpdate?.applying || !dbUpdate?.available}>
                  <Icon name="download" size={13}/>
                  {(busy.dbApply || dbUpdate?.applying) ? 'Updating...' : 'Update Curated Database'}
                </button>
              </div>
              <p className="as-hint">Re-scans GameProfiles and Metadata folders and rebuilds the full game database.</p>
              <p className="as-hint">Curated database updates replace developer-provided metadata only. Your favorites, notes, hidden games, and custom edits stay in your user database.</p>
            </div>
          </div>

          {/* ── Data Management ──────────────────────────────────────────── */}
          <div className="as-section">
            <div className="as-section-title">Data Management</div>
            <div className="as-section-body">
              <p className="as-hint" style={{marginBottom: 4}}>These actions clear personal data and cannot be undone.</p>
              <div className="as-btn-grid">
                <button className="as-btn" disabled={busy.reset} onClick={() => confirmReset(
                  'Reset Favorites', ['Favorite'],
                  'Remove all favorited games? This cannot be undone.')}>
                  Reset Favorites
                </button>
                <button className="as-btn" disabled={busy.reset} onClick={() => confirmReset(
                  'Reset Hidden Games', ['Hidden'],
                  'Unhide all hidden games? This cannot be undone.')}>
                  Reset Hidden Games
                </button>
                <button className="as-btn" disabled={busy.reset} onClick={() => confirmReset(
                  'Reset Users Database',
                  ['Name','Description','YouTube Link','Tags','Genre','Arcade Platform','Interface','Developer','Publisher','Players','ESRB','ScreenScraperID','PrimaryProfile','Metadata From'],
                  'Remove all custom user database game info edits? This cannot be undone.')}>
                  Reset Users Database
                </button>
              </div>
              <button className="as-btn as-btn-danger" disabled={busy.reset} onClick={() => confirmReset(
                'Reset Everything', null,
                'Wipe ALL personal data (favorites, notes, hidden, custom info)? This cannot be undone.')}>
                Reset Everything
              </button>
            </div>
          </div>

          {/* ── Backup & Restore ─────────────────────────────────────────── */}
          <div className="as-section">
            <div className="as-section-title">Backup &amp; Restore</div>
            <div className="as-section-body">
              <div className="as-btn-grid">
                <button className="as-btn" onClick={doExport} disabled={busy.export}>
                  <Icon name="download" size={13}/>
                  {busy.export ? 'Exporting…' : 'Export Settings'}
                </button>
                <button className="as-btn" onClick={() => fileRef.current?.click()} disabled={busy.import}>
                  <Icon name="upload" size={13}/>
                  {busy.import ? 'Importing…' : 'Import Settings'}
                </button>
              </div>
              <p className="as-hint">Export saves your favorites, hidden games, notes, and custom edits as a JSON file you can restore later or copy to another machine.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{display: 'none'}}
                onChange={e => { if (e.target.files[0]) doImport(e.target.files[0]); e.target.value = ''; }}
              />
            </div>
          </div>

          {/* ── Developer ────────────────────────────────────────────────── */}
          <div className="as-section as-section-dev">
            <div className="as-section-title">Developer</div>
            <div className="as-section-body">
              <button
                className="as-btn"
                disabled={busy.promote}
                onClick={() => setConfirmDialog({
                  title: 'Push User Database to Parrot Organizer Database',
                  message: 'Who Are You? This promotes game metadata edits from the User Database into the Parrot Organizer Database. Run before shipping an update. Promoted fields are removed from the User Database.',
                  confirmLabel: 'Who Are You?',
                  danger: false,
                  challenge: 'Nate',
                  challengeLabel: 'Who Are You?',
                  challengeError: "Sorry you are not the developer, you don't need to do this.",
                  onConfirm: () => { setConfirmDialog(null); doPromote(); },
                })}
              >
                <Icon name="upload" size={13}/>
                {busy.promote ? 'Pushing...' : 'Push User Database to Parrot Organizer Database'}
              </button>
              <p className="as-hint">Writes curated fields (descriptions, tags, YouTube links, genre, platform) from the User Database into the Parrot Organizer Database for distribution with app updates. Personal data (favorites, notes, hidden) is never promoted.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AppSettingsPanel });
