// useGamepad.jsx — Gamepad navigation hook
// Polls navigator.getGamepads() via rAF, fires callbacks for navigation
// directions and button actions. Callbacks are kept in refs so the rAF loop
// never holds stale closures, and the loop never needs to restart.

const DEADZONE     = 0.30;
const NAV_COOLDOWN = 160; // ms between repeated nav inputs

// Gamepad button index → action name
const BTN_ACTIONS = {
  0:  'select',    // A  — launch / confirm
  1:  'back',      // B  — close detail / back
  2:  'favorite',  // X  — toggle favorite
  3:  'details',   // Y  — open detail panel
  4:  'lb',        // LB — filter cycle back
  5:  'rb',        // RB — filter cycle forward
  6:  'pageUp',    // LT — page up
  7:  'pageDown',  // RT — page down
  8:  'view',      // SELECT — toggle grid/list
  9:  'settings',  // START  — tweaks panel
  10: 'home',      // L3 — jump to first game
};

function useGamepad({ enabled, onNavigate, onAction }) {
  const [connected, setConnected] = useState(false);
  const [gamepadId, setGamepadId] = useState('');

  const rafRef     = useRef(null);
  const enabledRef = useRef(enabled);
  const navRef     = useRef(onNavigate);
  const actRef     = useRef(onAction);

  // Keep refs current whenever props change — no rAF restart needed
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { navRef.current     = onNavigate; }, [onNavigate]);
  useEffect(() => { actRef.current     = onAction; }, [onAction]);

  useEffect(() => {
    let gpIndex = -1;
    const lastBtns  = {};
    let lastNavTime = 0;

    const onConnect = (e) => {
      gpIndex = e.gamepad.index;
      setConnected(true);
      setGamepadId(e.gamepad.id);
    };
    const onDisconnect = (e) => {
      if (e.gamepad.index === gpIndex) {
        gpIndex = -1;
        setConnected(false);
        setGamepadId('');
      }
    };

    window.addEventListener('gamepadconnected',    onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    // Pick up any already-connected pad
    for (const gp of navigator.getGamepads()) {
      if (gp) { gpIndex = gp.index; setConnected(true); setGamepadId(gp.id); break; }
    }

    const poll = () => {
      if (gpIndex >= 0) {
        const gp = navigator.getGamepads()[gpIndex];

        if (!gp) { gpIndex = -1; setConnected(false); }
        else if (enabledRef.current) {
          const now = Date.now();

          // ── Navigation (D-pad + left stick, with cooldown) ──────────────
          if (now - lastNavTime > NAV_COOLDOWN) {
            let dir = null;
            if      (gp.buttons[12]?.pressed) dir = 'up';
            else if (gp.buttons[13]?.pressed) dir = 'down';
            else if (gp.buttons[14]?.pressed) dir = 'left';
            else if (gp.buttons[15]?.pressed) dir = 'right';

            if (!dir) {
              const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0;
              if      (ay < -DEADZONE) dir = 'up';
              else if (ay >  DEADZONE) dir = 'down';
              else if (ax < -DEADZONE) dir = 'left';
              else if (ax >  DEADZONE) dir = 'right';
            }

            if (dir) { navRef.current?.(dir); lastNavTime = now; }
          }

          // ── Button actions (edge: fire on press, not hold) ───────────────
          for (const [idx, action] of Object.entries(BTN_ACTIONS)) {
            const pressed   = gp.buttons[idx]?.pressed || false;
            const wasPressed = lastBtns[idx] || false;
            if (pressed && !wasPressed) actRef.current?.(action);
            lastBtns[idx] = pressed;
          }
        } else {
          // Disabled — clear state so no phantom presses when re-enabled
          for (const k of Object.keys(lastBtns)) delete lastBtns[k];
        }
      }

      rafRef.current = requestAnimationFrame(poll);
    };

    rafRef.current = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener('gamepadconnected',    onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // intentionally empty — everything is via refs

  return { connected, gamepadId };
}

Object.assign(window, { useGamepad });
