
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
    width: 280px; max-height: calc(100vh - 32px);
    display: flex; flex-direction: column;
    background: var(--bg-1); color: var(--text-0);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    box-shadow: 0 24px 64px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.04) inset;
    font: 12px/1.4 'Inter', ui-sans-serif, system-ui, sans-serif;
    overflow: hidden;
  }
  .twk-hd {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 10px 12px 16px;
    border-bottom: 1px solid var(--line);
    cursor: move; user-select: none;
  }
  .twk-hd b {
    font-size: 12px; font-weight: 700; letter-spacing: .01em;
    font-family: 'JetBrains Mono', monospace; color: var(--text-0);
  }
  .twk-x {
    appearance: none; border: 0; background: transparent;
    color: var(--text-3); width: 24px; height: 24px;
    border-radius: var(--radius-sm); cursor: pointer;
    font-size: 13px; line-height: 1;
    display: grid; place-items: center;
    transition: background .12s, color .12s;
  }
  .twk-x:hover { background: var(--bg-3); color: var(--text-0); }

  .twk-body {
    padding: 10px 14px 16px; display: flex; flex-direction: column; gap: 8px;
    overflow-y: auto; overflow-x: hidden; min-height: 0;
    scrollbar-width: thin; scrollbar-color: var(--bg-4) transparent;
  }
  .twk-body::-webkit-scrollbar { width: 6px; }
  .twk-body::-webkit-scrollbar-track { background: transparent; }
  .twk-body::-webkit-scrollbar-thumb { background: var(--bg-4); border-radius: 3px; }
  .twk-body::-webkit-scrollbar-thumb:hover { background: var(--line-strong); }

  .twk-row { display: flex; flex-direction: column; gap: 5px; }
  .twk-row-h { flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }

  .twk-lbl {
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .twk-lbl > span:first-child { font-size: 12px; font-weight: 500; color: var(--text-1); }
  .twk-val { font-size: 11px; color: var(--text-3); font-variant-numeric: tabular-nums;
    font-family: 'JetBrains Mono', monospace; }

  .twk-sect {
    font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    color: var(--text-3); padding: 8px 0 2px;
    font-family: 'JetBrains Mono', monospace;
    border-top: 1px solid var(--line); margin-top: 2px;
  }
  .twk-sect:first-child { padding-top: 0; border-top: none; margin-top: 0; }

  .twk-field {
    appearance: none; width: 100%; height: 28px; padding: 0 8px;
    border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
    background: var(--bg-3); color: var(--text-0); font: inherit; outline: none;
    font-size: 12px;
  }
  .twk-field:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
  select.twk-field {
    padding-right: 22px;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(200,206,214,.45)' d='M0 0h10L5 6z'/></svg>");
    background-repeat: no-repeat; background-position: right 8px center;
  }
  select.twk-field option { background: var(--bg-3); color: var(--text-0); }

  .twk-slider {
    appearance: none; -webkit-appearance: none;
    width: 100%; height: 3px; margin: 6px 0;
    border-radius: 999px; background: var(--bg-3); outline: none;
  }
  .twk-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--accent); cursor: pointer;
    box-shadow: 0 0 6px var(--accent-glow);
  }
  .twk-slider::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--accent); border: none; cursor: pointer;
    box-shadow: 0 0 6px var(--accent-glow);
  }

  .twk-seg {
    position: relative; display: flex; padding: 2px;
    border-radius: var(--radius-sm);
    background: var(--bg-3); border: 1px solid var(--line);
    user-select: none;
  }
  .twk-seg-thumb {
    position: absolute; top: 2px; bottom: 2px;
    border-radius: calc(var(--radius-sm) - 3px);
    background: var(--bg-4); border: 1px solid var(--line-strong);
    transition: left .15s cubic-bezier(.3,.7,.4,1), width .15s;
  }
  .twk-seg.dragging .twk-seg-thumb { transition: none; }
  .twk-seg button {
    appearance: none; position: relative; z-index: 1;
    flex: 1; border: 0; background: transparent;
    color: var(--text-3); font: inherit; font-size: 11px; font-weight: 500;
    min-height: 24px; border-radius: calc(var(--radius-sm) - 3px);
    cursor: pointer; padding: 4px 6px; line-height: 1.2;
    overflow-wrap: anywhere; transition: color .12s;
  }
  .twk-seg button[aria-checked="true"] { color: var(--text-0); }

  .twk-toggle {
    position: relative; width: 34px; height: 19px; flex-shrink: 0;
    border: 1px solid var(--line-strong); border-radius: 999px;
    background: var(--bg-3);
    transition: background .15s, border-color .15s; cursor: pointer; padding: 0;
  }
  .twk-toggle[data-on="1"] { background: var(--accent); border-color: var(--accent); }
  .twk-toggle i {
    position: absolute; top: 2px; left: 2px;
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--text-3);
    box-shadow: 0 1px 3px rgba(0,0,0,.4);
    transition: transform .15s, background .15s;
  }
  .twk-toggle[data-on="1"] i { transform: translateX(15px); background: #001014; }

  .twk-num {
    display: flex; align-items: center; height: 28px; padding: 0 0 0 10px;
    border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
    background: var(--bg-3);
  }
  .twk-num-lbl { font-size: 11px; font-weight: 500; color: var(--text-2);
    cursor: ew-resize; user-select: none; padding-right: 8px; }
  .twk-num input {
    flex: 1; min-width: 0; height: 100%; border: 0; background: transparent;
    font: inherit; font-variant-numeric: tabular-nums;
    text-align: right; padding: 0 8px 0 0; outline: none;
    color: var(--text-0); -moz-appearance: textfield;
  }
  .twk-num input::-webkit-inner-spin-button,
  .twk-num input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .twk-num-unit { padding-right: 8px; color: var(--text-3); font-size: 10px; }

  .twk-btn {
    appearance: none; height: 28px; padding: 0 14px; border: 0;
    border-radius: var(--radius-sm);
    background: var(--accent); color: #001014;
    font: inherit; font-size: 11px; font-weight: 700; cursor: pointer;
    transition: opacity .12s;
  }
  .twk-btn:hover { opacity: .85; }
  .twk-btn.secondary {
    background: var(--bg-3); color: var(--text-1);
    border: 1px solid var(--line-strong);
  }
  .twk-btn.secondary:hover { background: var(--bg-4); border-color: var(--accent); color: var(--accent); }

  .twk-swatch {
    appearance: none; -webkit-appearance: none;
    width: 56px; height: 26px;
    border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
    padding: 2px; cursor: pointer; background: var(--bg-3); flex-shrink: 0;
  }
  .twk-swatch::-webkit-color-swatch-wrapper { padding: 0; }
  .twk-swatch::-webkit-color-swatch { border: 0; border-radius: 4px; }
  .twk-swatch::-moz-color-swatch { border: 0; border-radius: 4px; }
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(true); // start open — parent controls mounting
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-noncommentable=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

function TweakColor({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input type="color" className="twk-swatch" value={value}
             onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});
