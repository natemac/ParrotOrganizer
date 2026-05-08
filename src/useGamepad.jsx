// useGamepad.jsx - Gamepad navigation hook
// Polls navigator.getGamepads() via rAF and calls stable React callbacks.

const DEFAULT_DEADZONE = 0.30;
const DEFAULT_NAV_COOLDOWN = 160;
const BUTTON_HOLD_MS = 650;

const BTN_ACTIONS = {
  0: 'select',    // A
  1: 'back',      // B
  2: 'favorite',  // X
  3: 'details',   // Y
  4: 'lb',        // LB
  5: 'rb',        // RB
  6: 'pageUp',    // LT
  7: 'pageDown',  // RT
  8: 'view',      // Select / Back
  9: 'settings',  // Start
  10: 'home',     // L3
  11: 'end',      // R3
};

function useGamepad({ enabled, deadzone = DEFAULT_DEADZONE, navCooldown = DEFAULT_NAV_COOLDOWN, onNavigate, onAction, onRightStick }) {
  const [connected, setConnected] = useState(false);
  const [gamepadId, setGamepadId] = useState('');
  const [buttonCount, setButtonCount] = useState(0);
  const [axisCount, setAxisCount] = useState(0);

  const rafRef = useRef(null);
  const enabledRef = useRef(enabled);
  const deadzoneRef = useRef(deadzone);
  const cooldownRef = useRef(navCooldown);
  const navRef = useRef(onNavigate);
  const actRef = useRef(onAction);
  const rightStickRef = useRef(onRightStick);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { deadzoneRef.current = Number(deadzone) || DEFAULT_DEADZONE; }, [deadzone]);
  useEffect(() => { cooldownRef.current = Number(navCooldown) || DEFAULT_NAV_COOLDOWN; }, [navCooldown]);
  useEffect(() => { navRef.current = onNavigate; }, [onNavigate]);
  useEffect(() => { actRef.current = onAction; }, [onAction]);
  useEffect(() => { rightStickRef.current = onRightStick; }, [onRightStick]);

  useEffect(() => {
    let gpIndex = -1;
    const lastBtns = {};
    const btnDownAt = {};
    const btnHoldFired = {};
    let lastNavTime = 0;
    let windowActive = document.visibilityState !== 'hidden' && document.hasFocus();

    const clearInputState = () => {
      for (const k of Object.keys(lastBtns)) delete lastBtns[k];
      for (const k of Object.keys(btnDownAt)) delete btnDownAt[k];
      for (const k of Object.keys(btnHoldFired)) delete btnHoldFired[k];
      lastNavTime = 0;
    };
    const syncInputState = (gp) => {
      const now = Date.now();
      for (const idx of Object.keys(BTN_ACTIONS)) {
        const pressed = gp.buttons[idx]?.pressed || false;
        lastBtns[idx] = pressed;
        if (pressed) btnDownAt[idx] = now;
        else delete btnDownAt[idx];
        delete btnHoldFired[idx];
      }
      lastNavTime = Date.now();
    };

    const setPad = (gp) => {
      gpIndex = gp.index;
      setConnected(true);
      setGamepadId(gp.id);
      setButtonCount(gp.buttons?.length || 0);
      setAxisCount(gp.axes?.length || 0);
    };

    const clearPad = () => {
      gpIndex = -1;
      setConnected(false);
      setGamepadId('');
      setButtonCount(0);
      setAxisCount(0);
      clearInputState();
    };

    const onConnect = (e) => setPad(e.gamepad);
    const onDisconnect = (e) => { if (e.gamepad.index === gpIndex) clearPad(); };
    const onFocus = () => {
      windowActive = document.visibilityState !== 'hidden';
      lastNavTime = Date.now();
    };
    const onBlur = () => {
      windowActive = false;
      lastNavTime = Date.now();
    };
    const onVisibility = () => {
      windowActive = document.visibilityState !== 'hidden' && document.hasFocus();
      lastNavTime = Date.now();
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (gp) { setPad(gp); break; }
    }

    const poll = () => {
      if (gpIndex >= 0) {
        const polledPads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = polledPads[gpIndex];

        if (!gp) {
          clearPad();
        } else if (enabledRef.current && windowActive) {
          const now = Date.now();

          if (now - lastNavTime > cooldownRef.current) {
            let dir = null;
            if      (gp.buttons[12]?.pressed) dir = 'up';
            else if (gp.buttons[13]?.pressed) dir = 'down';
            else if (gp.buttons[14]?.pressed) dir = 'left';
            else if (gp.buttons[15]?.pressed) dir = 'right';

            if (!dir) {
              const ax = gp.axes[0] ?? 0;
              const ay = gp.axes[1] ?? 0;
              const dz = deadzoneRef.current;
              if      (ay < -dz) dir = 'up';
              else if (ay >  dz) dir = 'down';
              else if (ax < -dz) dir = 'left';
              else if (ax >  dz) dir = 'right';
            }

            if (dir) {
              navRef.current?.(dir);
              lastNavTime = now;
            }
          }

          for (const [idx, action] of Object.entries(BTN_ACTIONS)) {
            const pressed = gp.buttons[idx]?.pressed || false;
            const wasPressed = lastBtns[idx] || false;

            if (idx === '3') {
              if (pressed && !wasPressed) {
                btnDownAt[idx] = now;
                btnHoldFired[idx] = false;
              } else if (pressed && !btnHoldFired[idx] && now - (btnDownAt[idx] || now) >= BUTTON_HOLD_MS) {
                btnHoldFired[idx] = true;
                actRef.current?.('detailsHold');
              } else if (!pressed && wasPressed) {
                if (!btnHoldFired[idx]) actRef.current?.(action);
                delete btnDownAt[idx];
                delete btnHoldFired[idx];
              }
              lastBtns[idx] = pressed;
              continue;
            }

            if (pressed && !wasPressed) actRef.current?.(action);
            lastBtns[idx] = pressed;
          }

          const rightY = gp.axes[3] ?? 0;
          if (Math.abs(rightY) > deadzoneRef.current) rightStickRef.current?.(rightY);
        } else {
          syncInputState(gp);
        }
      }

      rafRef.current = requestAnimationFrame(poll);
    };

    rafRef.current = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { connected, gamepadId, buttonCount, axisCount };
}

Object.assign(window, { useGamepad });
