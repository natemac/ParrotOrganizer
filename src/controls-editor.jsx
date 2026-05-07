// controls-editor.jsx — Game controls remapper (JoystickButtons + Input API)

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ── XInput / Gamepad API constants (ported from v1.5.2 controlsEditManager.js) ──
const GAMEPAD_BUTTON_NAMES = {
  0:'A', 1:'B', 2:'X', 3:'Y',
  4:'LeftShoulder', 5:'RightShoulder',
  6:'LeftTrigger',  7:'RightTrigger',
  8:'Back', 9:'Start', 10:'L3', 11:'R3',
  12:'DPadUp', 13:'DPadDown', 14:'DPadLeft', 15:'DPadRight',
};

const XINPUT_CODE_MAP = {
  0:4096, 1:8192, 2:16384, 3:-32768,
  4:256,  5:512,  6:0,     7:0,
  8:32,   9:16,  10:64,   11:128,
  12:1,  13:2,   14:4,   15:8,
};

// Build the XInputButton data object from a gamepad button press
function xinputFromButton(btnIdx) {
  return {
    buttonCode:     XINPUT_CODE_MAP[btnIdx] ?? 0,
    isLeftTrigger:  btnIdx === 6,
    isRightTrigger: btnIdx === 7,
    isLeftThumbX: false, isLeftThumbY: false,
    isRightThumbX: false, isRightThumbY: false,
    isAxisMinus: false,
  };
}

// Build XInputButton data from an analog axis movement
function xinputFromAxis(axisIdx, axisValue) {
  return {
    buttonCode: 0,
    isLeftTrigger: false, isRightTrigger: false,
    isLeftThumbX:  axisIdx === 0,
    isLeftThumbY:  axisIdx === 1,
    isRightThumbX: axisIdx === 2,
    isRightThumbY: axisIdx === 3,
    isAxisMinus: axisValue < 0,
  };
}

// Build the BindName string for an analog axis
function axisBindName(deviceIdx, axisIdx, axisValue) {
  const dir    = axisValue > 0 ? '+' : '-';
  const axName = (axisIdx % 2 === 0) ? 'X' : 'Y';
  const thumb  = axisIdx < 2 ? 'LeftThumb' : 'RightThumb';
  return `Input Device ${deviceIdx} ${thumb}Input Device ${deviceIdx} ${axName}${dir}`;
}

// Human-readable label for a BindName
function formatBind(bindName) {
  if (!bindName || !bindName.trim()) return 'Not configured';
  return bindName.replace(/^Input Device \d+ /, '');
}

// ── XML helpers ───────────────────────────────────────────────────────────────
function parseButtons(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const container = doc.getElementsByTagName('JoystickButtons')[0];
  if (!container) return { buttons: [], inputApi: null, inputApiOptions: [] };

  const buttonEls = container.getElementsByTagName('JoystickButtons');
  const buttons = [];
  for (let i = 0; i < buttonEls.length; i++) {
    const el = buttonEls[i];
    buttons.push({
      index:      i,
      buttonName: el.querySelector('ButtonName')?.textContent?.trim()  || '',
      bindName:   el.querySelector('BindName')?.textContent?.trim()    || '',
    });
  }

  // Find Input API config field
  let inputApi = null, inputApiOptions = [];
  const fieldInfos = doc.querySelectorAll('ConfigValues > FieldInformation');
  for (const fi of fieldInfos) {
    if (fi.querySelector('FieldName')?.textContent?.trim() === 'Input API') {
      inputApi = fi.querySelector('FieldValue')?.textContent?.trim() || 'XInput';
      inputApiOptions = [...(fi.querySelector('FieldOptions')?.querySelectorAll('string') || [])].map(o => o.textContent.trim());
      break;
    }
  }

  return { buttons, inputApi, inputApiOptions };
}

// Patch XML: update one button's BindName + XInputButton, return new XML string
function patchButtonXml(xmlStr, buttonIndex, bindName, xInput, inputApi) {
  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const container = doc.getElementsByTagName('JoystickButtons')[0];

  if (container) {
    const buttonEls = container.getElementsByTagName('JoystickButtons');
    if (buttonIndex >= 0 && buttonIndex < buttonEls.length) {
      const btn = buttonEls[buttonIndex];
      const set = (tag, val) => {
        let el = btn.querySelector(tag);
        if (!el) { el = doc.createElement(tag); btn.appendChild(el); }
        el.textContent = val;
      };
      set('BindName',   bindName);
      set('BindNameXi', bindName);

      if (xInput) {
        let xi = btn.querySelector('XInputButton');
        if (!xi) { xi = doc.createElement('XInputButton'); btn.appendChild(xi); }
        const isTrigger = xInput.isLeftTrigger || xInput.isRightTrigger;
        const isAxis    = xInput.isLeftThumbX  || xInput.isLeftThumbY || xInput.isRightThumbX || xInput.isRightThumbY;
        const setXi = (tag, val) => {
          let el = xi.querySelector(tag);
          if (!el) { el = doc.createElement(tag); xi.appendChild(el); }
          el.textContent = val;
        };
        setXi('IsLeftThumbX',   xInput.isLeftThumbX   ? 'true' : 'false');
        setXi('IsRightThumbX',  xInput.isRightThumbX  ? 'true' : 'false');
        setXi('IsLeftThumbY',   xInput.isLeftThumbY   ? 'true' : 'false');
        setXi('IsRightThumbY',  xInput.isRightThumbY  ? 'true' : 'false');
        setXi('IsAxisMinus',    xInput.isAxisMinus     ? 'true' : 'false');
        setXi('IsLeftTrigger',  xInput.isLeftTrigger   ? 'true' : 'false');
        setXi('IsRightTrigger', xInput.isRightTrigger  ? 'true' : 'false');
        setXi('ButtonCode',     String(xInput.buttonCode));
        setXi('IsButton',       (isTrigger || isAxis)  ? 'false' : 'true');
        setXi('ButtonIndex',    '0');
        setXi('XInputIndex',    '0');
      }
    }
  }

  // Update Input API field if provided
  if (inputApi !== null) {
    const fieldInfos = doc.querySelectorAll('ConfigValues > FieldInformation');
    for (const fi of fieldInfos) {
      if (fi.querySelector('FieldName')?.textContent?.trim() === 'Input API') {
        const fv = fi.querySelector('FieldValue');
        if (fv) fv.textContent = inputApi;
        break;
      }
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

// ── ControlsEditor modal ──────────────────────────────────────────────────────
function ControlsEditor({ game, onClose }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [buttons,  setButtons]  = useState([]);      // { index, buttonName, bindName }
  const [inputApi, setInputApi] = useState(null);
  const [inputApiOptions, setInputApiOptions] = useState([]);
  const [listening, setListening] = useState(null); // button index being remapped, or null

  // xmlStr is mutable — keep in ref so gamepad poll closure always has current value
  const xmlRef       = useRef('');
  const rafRef       = useRef(null);
  const kbListenRef  = useRef(null);

  // Load profile on mount
  useEffect(() => {
    fetch(`/__getGameProfile?id=${encodeURIComponent(game.Profile)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error || 'Failed to load profile');
        xmlRef.current = data.xml;
        const parsed = parseButtons(data.xml);
        setButtons(parsed.buttons);
        setInputApi(parsed.inputApi);
        setInputApiOptions(parsed.inputApiOptions);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [game.Profile]);

  // Stop listening (cancel remap)
  const stopListening = useCallback(() => {
    if (rafRef.current)      { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (kbListenRef.current) {
      document.removeEventListener('keydown', kbListenRef.current, true);
      kbListenRef.current = null;
    }
    setListening(null);
  }, []);

  // Apply a binding to a button
  const applyBinding = useCallback((btnIndex, bindName, xInputData) => {
    // Patch XML
    xmlRef.current = patchButtonXml(xmlRef.current, btnIndex, bindName, xInputData, null);
    // Update displayed binding
    setButtons(prev => prev.map(b => b.index === btnIndex ? { ...b, bindName } : b));
    stopListening();
  }, [stopListening]);

  // Start gamepad polling
  const startGamepadPoll = useCallback((btnIndex) => {
    const AXIS_THRESHOLD = 0.5;
    const poll = () => {
      if (rafRef.current === null) return;
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let gi = 0; gi < gamepads.length; gi++) {
        const gp = gamepads[gi];
        if (!gp) continue;
        // Buttons
        for (let bi = 0; bi < gp.buttons.length; bi++) {
          if (gp.buttons[bi].pressed) {
            const name  = GAMEPAD_BUTTON_NAMES[bi] || `Button${bi}`;
            applyBinding(btnIndex, `Input Device ${gi} ${name}`, xinputFromButton(bi));
            return;
          }
        }
        // Axes
        for (let ai = 0; ai < gp.axes.length; ai++) {
          if (Math.abs(gp.axes[ai]) > AXIS_THRESHOLD) {
            applyBinding(btnIndex, axisBindName(gi, ai, gp.axes[ai]), xinputFromAxis(ai, gp.axes[ai]));
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
  }, [applyBinding]);

  // Start keyboard listening
  const startKeyboardListen = useCallback((btnIndex) => {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      let keyName = e.key;
      if (keyName === ' ')       keyName = 'Space';
      if (keyName.length === 1)  keyName = keyName.toUpperCase();
      applyBinding(btnIndex, `Keyboard ${keyName}`, null);
    };
    kbListenRef.current = handler;
    document.addEventListener('keydown', handler, true);
  }, [applyBinding]);

  // Start remapping a button
  const startListening = useCallback((btnIndex) => {
    if (listening === btnIndex) { stopListening(); return; }
    stopListening();
    setListening(btnIndex);
    startGamepadPoll(btnIndex);
    startKeyboardListen(btnIndex);
  }, [listening, stopListening, startGamepadPoll, startKeyboardListen]);

  // Clear a binding
  const clearBinding = useCallback((btnIndex) => {
    xmlRef.current = patchButtonXml(xmlRef.current, btnIndex, '', null, null);
    setButtons(prev => prev.map(b => b.index === btnIndex ? { ...b, bindName: '' } : b));
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  // Save
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Bake in current inputApi selection
      const finalXml = inputApi
        ? patchButtonXml(xmlRef.current, -1, '', null, inputApi) // index -1 = only update inputApi
        : xmlRef.current;
      const res = await fetch(`/__updateGameSettings?id=${encodeURIComponent(game.Profile)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlContent: finalXml }),
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

  // Group buttons into sections
  const groups = useMemo(() => {
    const system = [], p1 = [], p2 = [];
    for (const b of buttons) {
      const n = b.buttonName.toLowerCase();
      if (n.includes('test') || n.includes('service') || n.includes('coin')) system.push(b);
      else if (n.includes('player 2') || n.includes('p2')) p2.push(b);
      else p1.push(b);
    }
    return { system, p1, p2 };
  }, [buttons]);

  return (
    <div className="editor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="editor-modal editor-modal-wide">

        <div className="editor-header">
          <div className="editor-header-info">
            <div className="editor-title">Controls</div>
            <div className="editor-subtitle">{game.Name}</div>
          </div>
          <button className="editor-close" onClick={onClose}><Icon name="close" size={14}/></button>
        </div>

        <div className="editor-body">
          {loading && <div className="editor-loading">Loading controls…</div>}
          {error   && <div className="editor-error">{error}</div>}

          {!loading && !error && (
            <>
              {listening !== null && (
                <div className="ce-listening-banner">
                  <span className="ce-pulse"></span>
                  Press a gamepad button, move a stick, or press a keyboard key… <button onClick={stopListening}>Cancel</button>
                </div>
              )}

              {/* Input API — this is a ConfigValue that lives in Settings XML
                  but belongs here since it directly controls input handling */}
              {inputApi !== null && (
                <div className="ce-api-card">
                  <div className="ce-api-label">
                    <span className="ce-api-title">Input API</span>
                    <span className="ce-api-hint">Controls how the emulator reads your gamepad</span>
                  </div>
                  <select
                    className="se-select ce-api-select"
                    value={inputApi}
                    onChange={e => setInputApi(e.target.value)}
                  >
                    {inputApiOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}

              {/* System controls */}
              {groups.system.length > 0 && (
                <div className="ce-section">
                  <h4 className="ce-section-title">System Controls</h4>
                  {groups.system.map(b => (
                    <ControlRow key={b.index} btn={b} listening={listening} onRemap={startListening} onClear={clearBinding} />
                  ))}
                </div>
              )}

              {/* Player controls side-by-side */}
              <div className="ce-players-grid">
                {groups.p1.length > 0 && (
                  <div className="ce-section">
                    <h4 className="ce-section-title">Player 1</h4>
                    {groups.p1.map(b => (
                      <ControlRow key={b.index} btn={b} listening={listening} onRemap={startListening} onClear={clearBinding} />
                    ))}
                  </div>
                )}
                {groups.p2.length > 0 && (
                  <div className="ce-section">
                    <h4 className="ce-section-title">Player 2</h4>
                    {groups.p2.map(b => (
                      <ControlRow key={b.index} btn={b} listening={listening} onRemap={startListening} onClear={clearBinding} />
                    ))}
                  </div>
                )}
              </div>

              {buttons.length === 0 && (
                <div className="se-empty">No remappable controls found for this game.</div>
              )}
            </>
          )}
        </div>

        <div className="editor-footer">
          <div style={{flex:1}}/>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-launch" onClick={save} disabled={loading || saving}>
            {saving ? 'Saving…' : 'Save Controls'}
          </button>
        </div>

      </div>
    </div>
  );
}

function ControlRow({ btn, listening, onRemap, onClear }) {
  const isListening = listening === btn.index;
  const bound = btn.bindName && btn.bindName.trim();

  return (
    <div className={'ce-row' + (isListening ? ' ce-row-listening' : '')}>
      <span className="ce-label">{btn.buttonName}</span>
      <span className="ce-binding">
        {isListening
          ? <span className="ce-listening-hint">⏺ Waiting…</span>
          : <span className={'ce-bind-val' + (bound ? '' : ' unset')}>{formatBind(btn.bindName)}</span>
        }
      </span>
      <button
        className={'btn-secondary ce-remap' + (isListening ? ' active' : '')}
        onClick={() => onRemap(btn.index)}
      >
        {isListening ? 'Cancel' : 'Remap'}
      </button>
      {bound && !isListening && (
        <button className="btn-secondary ce-clear" title="Clear binding" onClick={() => onClear(btn.index)}>
          <Icon name="close" size={12}/>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { ControlsEditor });
