// settings-editor.jsx — Game settings editor (ConfigValues + GamePath)

const { useState, useEffect, useMemo, useCallback } = React;

// ── Individual field renderer ─────────────────────────────────────────────────
function SettingsField({ field, value, onChange }) {
  switch (field.type) {
    case 'Bool':
      return (
        <div className="se-row">
          <label className="se-label">{field.name}</label>
          <label className="se-toggle">
            <input
              type="checkbox"
              checked={value === 'true' || value === '1'}
              onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            />
            <span className="se-toggle-track"></span>
          </label>
        </div>
      );

    case 'Dropdown':
      return (
        <div className="se-row">
          <label className="se-label">{field.name}</label>
          <select className="se-select" value={value} onChange={e => onChange(e.target.value)}>
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );

    case 'Slider': {
      const min  = isFinite(field.min)  ? field.min  : 0;
      const max  = isFinite(field.max)  ? field.max  : 100;
      const step = isFinite(field.step) && field.step > 0 ? field.step : 1;
      return (
        <div className="se-row se-row-slider">
          <label className="se-label">{field.name}</label>
          <div className="se-slider-wrap">
            <span className="se-slider-bound">{min}</span>
            <input
              type="range" min={min} max={max} step={step}
              value={value || min}
              onChange={e => onChange(e.target.value)}
            />
            <span className="se-slider-val">{value || min}</span>
            <span className="se-slider-bound">{max}</span>
          </div>
        </div>
      );
    }

    default: // Text
      return (
        <div className="se-row">
          <label className="se-label">{field.name}</label>
          <input
            className="se-input"
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );
  }
}

// ── Main SettingsEditor modal ─────────────────────────────────────────────────
function SettingsEditor({ game, onClose }) {
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState(null);
  const [rawXml,  setRawXml]    = useState('');
  const [gamePath, setGamePath] = useState('');
  const [execName, setExecName] = useState('');
  const [fields,  setFields]    = useState([]);
  const [changes, setChanges]   = useState({});

  // Parse XML into fields array
  const parseFields = useCallback((xmlStr) => {
    const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
    setGamePath(doc.querySelector('GamePath')?.textContent?.trim() || '');
    setExecName(doc.querySelector('ExecutableName')?.textContent?.trim() || '');
    const items = [...doc.querySelectorAll('FieldInformation')].map(f => ({
      category: f.querySelector('CategoryName')?.textContent?.trim() || 'General',
      name:     f.querySelector('FieldName')?.textContent?.trim()    || '',
      value:    f.querySelector('FieldValue')?.textContent?.trim()   || '',
      type:     f.querySelector('FieldType')?.textContent?.trim()    || 'Text',
      min:      parseFloat(f.querySelector('FieldMin')?.textContent  || '0'),
      max:      parseFloat(f.querySelector('FieldMax')?.textContent  || '100'),
      step:     parseFloat(f.querySelector('FieldStep')?.textContent || '1'),
      options:  [...(f.querySelector('FieldOptions')?.querySelectorAll('string') || [])].map(o => o.textContent.trim()),
    })).filter(f => f.name);
    setFields(items);
  }, []);

  // Load profile on mount
  useEffect(() => {
    fetch(`/__getGameProfile?id=${encodeURIComponent(game.Profile)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error || 'Failed to load profile');
        setRawXml(data.xml);
        parseFields(data.xml);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [game.Profile, parseFields]);

  // Group fields by category
  const grouped = useMemo(() => {
    const map = {};
    for (const f of fields) {
      (map[f.category] = map[f.category] || []).push(f);
    }
    return map;
  }, [fields]);

  const getValue = (name) => {
    if (changes[name] !== undefined) return changes[name];
    return fields.find(f => f.name === name)?.value ?? '';
  };
  const setValue = (name, val) => setChanges(p => ({ ...p, [name]: val }));

  // Restore defaults from original GameProfile XML
  const restoreDefaults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/__getGameProfile?id=${encodeURIComponent(game.Profile)}&default=1`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setRawXml(data.xml);
      parseFields(data.xml);
      setChanges({});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Save — patch XML then POST
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const doc = new DOMParser().parseFromString(rawXml, 'text/xml');
      // Update GamePath
      const gpEl = doc.querySelector('GamePath');
      if (gpEl) gpEl.textContent = gamePath;
      // Update each changed field
      for (const [name, val] of Object.entries(changes)) {
        const fieldEl = [...doc.querySelectorAll('FieldInformation')].find(
          f => f.querySelector('FieldName')?.textContent?.trim() === name
        );
        if (fieldEl) {
          const valEl = fieldEl.querySelector('FieldValue');
          if (valEl) valEl.textContent = val;
        }
      }
      const xmlContent = new XMLSerializer().serializeToString(doc);
      const res = await fetch(`/__updateGameSettings?id=${encodeURIComponent(game.Profile)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Save failed');
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = gamePath !== (fields.length ? (new DOMParser().parseFromString(rawXml, 'text/xml').querySelector('GamePath')?.textContent?.trim() || '') : '') || Object.keys(changes).length > 0;

  return (
    <div className="editor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="editor-modal">

        <div className="editor-header">
          <div className="editor-header-info">
            <div className="editor-title">Settings</div>
            <div className="editor-subtitle">{game.Name}</div>
          </div>
          <button className="editor-close" onClick={onClose}><Icon name="close" size={14}/></button>
        </div>

        <div className="editor-body">
          {loading && <div className="editor-loading">Loading profile…</div>}
          {error   && <div className="editor-error">{error}</div>}

          {!loading && !error && (
            <>
              {/* Game path */}
              <div className="se-group">
                <h4 className="se-group-title">Game Path</h4>
                {execName && <div className="se-exec-hint">Executable: <code>{execName}</code></div>}
                <div className="se-row">
                  <label className="se-label">Path</label>
                  <input
                    className="se-input se-path-input"
                    type="text"
                    value={gamePath}
                    onChange={e => setGamePath(e.target.value.replace(/^["']|["']$/g, ''))}
                    placeholder="Path to game executable or ROM folder"
                  />
                </div>
              </div>

              {/* Config fields grouped by category */}
              {Object.keys(grouped).length === 0 && (
                <div className="se-empty">No configurable settings for this game.</div>
              )}
              {Object.entries(grouped).map(([category, catFields]) => (
                <div key={category} className="se-group">
                  <h4 className="se-group-title">{category}</h4>
                  {catFields.map(field => (
                    <SettingsField
                      key={field.name}
                      field={field}
                      value={getValue(field.name)}
                      onChange={val => setValue(field.name, val)}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="editor-footer">
          <button className="btn-secondary" onClick={restoreDefaults} disabled={loading || saving}>
            Restore Defaults
          </button>
          <div style={{flex:1}}/>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-launch" onClick={save} disabled={loading || saving || !hasChanges}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { SettingsEditor });
