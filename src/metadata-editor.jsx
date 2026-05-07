// metadata-editor.jsx — User overrides for DB3 content fields

// ac: key into autocomplete prop; multi: comma-separated token mode
const FIELDS = [
  { key: 'Name',            label: 'Custom Name',    type: 'text',     ac: null,          multi: false, placeholder: 'Override display name…',               hint: 'Leave blank to use the default name' },
  { key: 'Developer',       label: 'Developer',      type: 'text',     ac: null,          multi: false, placeholder: 'e.g. Sega AM1…',                       hint: '' },
  { key: 'Publisher',       label: 'Publisher',      type: 'text',     ac: null,          multi: false, placeholder: 'e.g. Sega…',                           hint: '' },
  { key: 'Players',         label: 'Players',        type: 'text',     ac: null,          multi: false, placeholder: 'e.g. 1-2…',                            hint: '' },
  { key: 'Genre',           label: 'Genre(s)',       type: 'text',     ac: 'genres',      multi: true,  placeholder: 'e.g. Racing, Fighting…',               hint: 'Comma-separated — first entry shown on card' },
  { key: 'Arcade Platform', label: 'Platform',       type: 'text',     ac: 'platforms',   multi: false, placeholder: 'e.g. Namco System 246…',               hint: '' },
  { key: 'Interface',       label: 'Controls',       type: 'text',     ac: 'interfaces',  multi: true,  placeholder: 'Joystick, Steering Wheel, Light Gun…', hint: 'Comma-separated controller types' },
  { key: 'Tags',            label: 'Tags',           type: 'text',     ac: 'tags',        multi: true,  placeholder: 'multiplayer, lightgun, 2-player…',     hint: 'Comma-separated, used in search' },
  { key: 'YouTube Link',    label: 'YouTube Link',   type: 'url',      ac: null,          multi: false, placeholder: 'https://www.youtube.com/watch?v=…',    hint: '' },
  { key: 'Description',     label: 'Description',    type: 'textarea', ac: null,          multi: false, placeholder: 'Notes, tips, or any information…',     hint: '' },
  { key: 'Metadata From',   label: 'Metadata Source',type: 'text',     ac: null,          multi: false, placeholder: 'e.g. Screenscraper.fr, TeknoParrot…', hint: 'Credit for this metadata' },
];

// ── Autocomplete input (single value or comma-separated tokens) ────────────
function AutocompleteInput({ value, onChange, suggestions, multi, className, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const wrapRef = React.useRef(null);

  const currentToken = (val) => {
    if (!multi) return val.trim();
    const parts = val.split(',');
    return parts[parts.length - 1].trimStart();
  };

  const computeItems = (val) => {
    const token = currentToken(val);
    if (!token) return [];
    const already = multi ? val.split(',').map(s => s.trim().toLowerCase()) : [];
    return suggestions
      .filter(s =>
        s.toLowerCase().startsWith(token.toLowerCase()) &&
        !already.includes(s.toLowerCase()) &&
        s.toLowerCase() !== token.toLowerCase()
      )
      .slice(0, 10);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const next = computeItems(val);
    setItems(next);
    setOpen(next.length > 0);
  };

  const handleFocus = (e) => {
    const next = computeItems(e.target.value);
    setItems(next);
    setOpen(next.length > 0);
  };

  const select = (suggestion) => {
    let next;
    if (multi) {
      const parts = value.split(',');
      parts[parts.length - 1] = parts.length > 1 ? ' ' + suggestion : suggestion;
      next = parts.join(',');
    } else {
      next = suggestion;
    }
    onChange(next);
    setOpen(false);
  };

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{position:'relative', flex:1, minWidth:0}}>
      <input
        className={className}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        autoComplete="off"
      />
      {open && (
        <div className="me-ac-list">
          {items.map(s => (
            <div key={s} className="me-ac-item" onMouseDown={() => select(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────
function MetadataEditor({ game, onClose, onSaved, autocomplete = {} }) {
  const [values, setValues] = React.useState(() => ({
    'Name':           game.Name !== game.Profile ? game.Name : '',
    'Developer':      game.Developer    || '',
    'Publisher':      game.Publisher    || '',
    'Players':        game.Players      || '',
    'Genre':          game.Genre        || '',
    'Arcade Platform':game.Platform     || '',
    'Interface':      game.Interfaces.join(', ') || '',
    'Tags':           game.Tags.join(', ')       || '',
    'YouTube Link':   game.YouTube      || '',
    'Description':    game.Description  || '',
    'Metadata From':  game.MetadataFrom || '',
  }));
  const [saving, setSaving] = React.useState(false);
  const [error, setError]   = React.useState(null);

  const set = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const postSave = async (fields) => {
    const res = await fetch('/__saveUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: game.Profile, fields }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error(`Non-JSON response: ${text.slice(0, 120)}`); }
    if (!data.ok) throw new Error(data.error || 'Save failed');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await postSave(values);
      onClose();
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    const empty = Object.fromEntries(FIELDS.map(f => [f.key, '']));
    setSaving(true);
    setError(null);
    try {
      await postSave(empty);
      onClose();
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-modal" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <div>
            <div className="editor-title">Edit Game Info</div>
            <div className="editor-subtitle">{game.Profile} — changes saved to your personal DB</div>
          </div>
          <button className="editor-close" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>

        <div className="editor-body" style={{gap:0}}>
          {error && <div className="editor-error">{error}</div>}
          <div className="se-group">
            {FIELDS.map(f => (
              <div key={f.key} className={'se-row' + (f.type === 'textarea' ? ' se-row-textarea' : '')}>
                <label className="se-label" style={{flexShrink:0}}>
                  {f.label}
                  {f.hint && <span className="se-hint">{f.hint}</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    className="se-input me-textarea"
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    rows={4}
                  />
                ) : f.ac ? (
                  <AutocompleteInput
                    className="se-input"
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={v => set(f.key, v)}
                    suggestions={autocomplete[f.ac] || []}
                    multi={f.multi}
                  />
                ) : (
                  <input
                    className="se-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-editor btn-danger" style={{flex:'0 0 auto'}} onClick={resetDefaults} disabled={saving}>
            Reset to defaults
          </button>
          <div style={{flex:1}}/>
          <button className="btn-editor" style={{flex:'0 0 auto'}} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-editor"
            style={{flex:'0 0 auto', background:'var(--accent)', color:'#001014', fontWeight:700, border:'none'}}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MetadataEditor });
