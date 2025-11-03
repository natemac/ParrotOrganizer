// gamepadManager.js - Gamepad Navigation & Input Handler
// Part of ParrotOrganizer v1.3.0

// Get debugLogger - will be available after app.js loads
function getDebugLogger() {
    return window.debugLogger || {
        info: (cat, msg, data) => console.log(`[${cat}]`, msg, data || ''),
        success: (cat, msg, data) => console.log(`[${cat}] ✅`, msg, data || ''),
        warn: (cat, msg, data) => console.warn(`[${cat}] ⚠️`, msg, data || ''),
        debug: (cat, msg, data) => console.log(`[${cat}] 🔍`, msg, data || ''),
        error: (cat, msg, data) => console.error(`[${cat}] ❌`, msg, data || '')
    };
}

class GamepadManager {
    constructor() {
        this.enabled = true;
        this.connected = false;
        this.gamepad = null;
        this.selectedIndex = 0;
        this.lastButtonStates = {};
        this.deadzone = 0.3;
        this.vibrationEnabled = true;
        this.navigationSpeed = 150; // ms between navigation inputs
        this.lastNavigationTime = 0;
        this.windowHasFocus = true; // Track window focus state
        this.pollingActive = true; // Track if polling should be active

        // Button mapping (Xbox/standard layout)
        this.buttons = {
            A: 0,           // Select/Launch
            B: 1,           // Back/Cancel
            X: 2,           // Toggle Favorite
            Y: 3,           // Show Details
            LB: 4,          // Previous Filter
            RB: 5,          // Next Filter
            LT: 6,          // Scroll Up (page)
            RT: 7,          // Scroll Down (page)
            SELECT: 8,      // Toggle View Mode
            START: 9,       // Open Settings
            L3: 10,         // Home (scroll to top)
            R3: 11,         // Search
            DPAD_UP: 12,
            DPAD_DOWN: 13,
            DPAD_LEFT: 14,
            DPAD_RIGHT: 15
        };

        this.init();
    }

    init() {
        getDebugLogger().info('Gamepad', 'Initializing Gamepad Manager');

        // Wait for PreferencesManager to be available
        if (!window.preferencesManager) {
            getDebugLogger().warn('Gamepad', 'PreferencesManager not ready, will retry...');
            setTimeout(() => this.init(), 100);
            return;
        }

        // Load preferences
        this.loadPreferences();

        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));

        // Listen for window focus/blur to pause gamepad when game is launched
        window.addEventListener('focus', () => this.onWindowFocus());
        window.addEventListener('blur', () => this.onWindowBlur());
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());

        // Check if gamepad is already connected
        this.checkExistingGamepads();

        // Start polling loop if enabled
        if (this.enabled) {
            this.startPolling();
            getDebugLogger().success('Gamepad', 'Gamepad Manager initialized', {
                enabled: this.enabled,
                vibration: this.vibrationEnabled,
                navigationSpeed: this.navigationSpeed,
                deadzone: this.deadzone
            });
        } else {
            getDebugLogger().info('Gamepad', 'Gamepad Manager initialized (disabled by user)');
        }
    }

    loadPreferences() {
        const prefs = window.preferencesManager.getGamepadPreferences();
        this.enabled = prefs.enabled;
        this.vibrationEnabled = prefs.vibration;
        this.navigationSpeed = prefs.navigationSpeed;
        this.deadzone = prefs.deadzone;

        getDebugLogger().info('Gamepad', 'Loaded gamepad preferences from file', {
            enabled: this.enabled,
            vibration: this.vibrationEnabled,
            speed: this.navigationSpeed,
            deadzone: this.deadzone
        });
    }

    async savePreferences() {
        // Don't save if PreferencesManager isn't ready
        if (!window.preferencesManager) {
            getDebugLogger().warn('Gamepad', 'PreferencesManager not available, cannot save');
            return;
        }

        // Save using PreferencesManager methods
        await window.preferencesManager.setGamepadEnabled(this.enabled);
        await window.preferencesManager.setGamepadVibration(this.vibrationEnabled);
        await window.preferencesManager.setGamepadNavigationSpeed(this.navigationSpeed);
        await window.preferencesManager.setGamepadDeadzone(this.deadzone);

        getDebugLogger().info('Gamepad', 'Saved gamepad preferences to file', {
            enabled: this.enabled,
            vibration: this.vibrationEnabled,
            speed: this.navigationSpeed,
            deadzone: this.deadzone
        });
    }

    checkExistingGamepads() {
        const gamepads = navigator.getGamepads();
        for (let gamepad of gamepads) {
            if (gamepad) {
                this.gamepad = gamepad;
                this.connected = true;
                this.updateConnectionStatus();
                getDebugLogger().success('Gamepad', 'Found existing gamepad on startup', {
                    gamepadId: gamepad.id,
                    buttons: gamepad.buttons.length,
                    axes: gamepad.axes.length
                });
                break;
            }
        }
    }

    onGamepadConnected(event) {
        this.gamepad = event.gamepad;
        this.connected = true;
        this.updateConnectionStatus();
        this.vibrate(100); // Short vibration on connect
        getDebugLogger().success('Gamepad', 'Gamepad connected', {
            gamepadId: event.gamepad.id,
            buttons: event.gamepad.buttons.length,
            axes: event.gamepad.axes.length,
            vibrationSupport: !!event.gamepad.vibrationActuator
        });
    }

    onGamepadDisconnected(event) {
        this.connected = false;
        this.gamepad = null;
        this.updateConnectionStatus();
        getDebugLogger().info('Gamepad', 'Gamepad disconnected', {
            gamepadId: event.gamepad.id
        });
    }

    updateConnectionStatus() {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('gamepadStatusChange', {
            detail: { connected: this.connected, gamepadId: this.gamepad?.id }
        }));

        // Show/hide gamepad hints
        const hintsElement = document.getElementById('gamepad-hints');
        if (hintsElement) {
            hintsElement.style.display = this.connected ? 'flex' : 'none';
        }
    }

    onWindowFocus() {
        this.windowHasFocus = true;
        // Don't resume polling if we're capturing input (controls editor)
        if (window.gamepadIntegration && window.gamepadIntegration.isCapturingInput) {
            getDebugLogger().info('Gamepad', 'Window focused but input capture active - polling remains paused');
            return;
        }
        this.pollingActive = true;
        getDebugLogger().info('Gamepad', 'Window focused - gamepad polling resumed');
    }

    onWindowBlur() {
        this.windowHasFocus = false;
        this.pollingActive = false;
        getDebugLogger().info('Gamepad', 'Window lost focus - gamepad polling paused');
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.pollingActive = false;
            getDebugLogger().info('Gamepad', 'Page hidden - gamepad polling paused');
        } else {
            // Don't resume polling if we're capturing input (controls editor)
            if (window.gamepadIntegration && window.gamepadIntegration.isCapturingInput) {
                getDebugLogger().info('Gamepad', 'Page visible but input capture active - polling remains paused');
                return;
            }
            this.pollingActive = true;
            getDebugLogger().info('Gamepad', 'Page visible - gamepad polling resumed');
        }
    }

    startPolling() {
        this.pollGamepad();
    }

    pollGamepad() {
        // Always keep polling loop active, but only handle input when conditions are met
        if (!this.enabled || !this.pollingActive || !this.windowHasFocus) {
            requestAnimationFrame(() => this.pollGamepad());
            return;
        }

        if (this.connected) {
            // Get fresh gamepad state
            const gamepads = navigator.getGamepads();
            this.gamepad = gamepads[this.gamepad.index];

            if (this.gamepad) {
                // DEBUG: Log when B button is pressed
                if (this.gamepad.buttons[1] && this.gamepad.buttons[1].pressed) {
                    console.log('[DEBUG] GamepadManager.pollGamepad: B button pressed - enabled:', this.enabled, 'pollingActive:', this.pollingActive, 'windowHasFocus:', this.windowHasFocus);
                }
                this.handleInput();
            }
        }

        requestAnimationFrame(() => this.pollGamepad());
    }

    handleInput() {
        const now = Date.now();

        // Handle D-pad and analog stick navigation
        if (now - this.lastNavigationTime > this.navigationSpeed) {
            // D-pad
            if (this.isButtonPressed(this.buttons.DPAD_UP)) {
                this.navigate('up');
                this.lastNavigationTime = now;
            } else if (this.isButtonPressed(this.buttons.DPAD_DOWN)) {
                this.navigate('down');
                this.lastNavigationTime = now;
            } else if (this.isButtonPressed(this.buttons.DPAD_LEFT)) {
                this.navigate('left');
                this.lastNavigationTime = now;
            } else if (this.isButtonPressed(this.buttons.DPAD_RIGHT)) {
                this.navigate('right');
                this.lastNavigationTime = now;
            }

            // Left analog stick
            const leftStickX = this.gamepad.axes[0];
            const leftStickY = this.gamepad.axes[1];

            if (Math.abs(leftStickY) > this.deadzone) {
                if (leftStickY < -this.deadzone) {
                    this.navigate('up');
                    this.lastNavigationTime = now;
                } else if (leftStickY > this.deadzone) {
                    this.navigate('down');
                    this.lastNavigationTime = now;
                }
            }

            if (Math.abs(leftStickX) > this.deadzone) {
                if (leftStickX < -this.deadzone) {
                    this.navigate('left');
                    this.lastNavigationTime = now;
                } else if (leftStickX > this.deadzone) {
                    this.navigate('right');
                    this.lastNavigationTime = now;
                }
            }
        }

        // Handle button presses (with debouncing)
        this.handleButton(this.buttons.A, () => this.actionSelect());
        this.handleButton(this.buttons.B, () => this.actionBack());
        this.handleButton(this.buttons.X, () => this.actionFavorite());
        this.handleButton(this.buttons.Y, () => this.actionDetails());
        this.handleButton(this.buttons.START, () => this.actionSettings());
        this.handleButton(this.buttons.SELECT, () => this.actionToggleView());
        this.handleButton(this.buttons.L3, () => this.actionHome());
        this.handleButton(this.buttons.RB, () => this.actionNextFilter());
        this.handleButton(this.buttons.LB, () => this.actionPreviousFilter());
        this.handleButton(this.buttons.LT, () => this.actionPageUp());
        this.handleButton(this.buttons.RT, () => this.actionPageDown());
    }

    isButtonPressed(buttonIndex) {
        return this.gamepad.buttons[buttonIndex]?.pressed || false;
    }

    handleButton(buttonIndex, callback) {
        const buttonKey = `btn_${buttonIndex}`;
        const isPressed = this.isButtonPressed(buttonIndex);
        const wasPressed = this.lastButtonStates[buttonKey] || false;

        // Trigger on button down (not held)
        if (isPressed && !wasPressed) {
            callback();
            this.vibrate(50); // Short vibration on button press
        }

        this.lastButtonStates[buttonKey] = isPressed;
    }

    navigate(direction) {
        window.dispatchEvent(new CustomEvent('gamepadNavigate', {
            detail: { direction, selectedIndex: this.selectedIndex }
        }));
    }

    actionSelect() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'select' } }));
    }

    actionBack() {
        console.log('[DEBUG] GamepadManager.actionBack: Dispatching back action');
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'back' } }));
    }

    actionFavorite() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'favorite' } }));
    }

    actionDetails() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'details' } }));
    }

    actionSettings() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'settings' } }));
    }

    actionToggleView() {
        // Show quick filter menu instead of toggle view
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'showFilterMenu' } }));
    }

    actionHome() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'home' } }));
    }

    actionNextFilter() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'nextFilter' } }));
    }

    actionPreviousFilter() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'previousFilter' } }));
    }

    actionPageUp() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'pageUp' } }));
    }

    actionPageDown() {
        window.dispatchEvent(new CustomEvent('gamepadAction', { detail: { action: 'pageDown' } }));
    }

    vibrate(duration = 100, strongMagnitude = 0.5, weakMagnitude = 0.5) {
        if (!this.vibrationEnabled || !this.gamepad?.vibrationActuator) return;

        this.gamepad.vibrationActuator.playEffect('dual-rumble', {
            duration: duration,
            strongMagnitude: strongMagnitude,
            weakMagnitude: weakMagnitude
        }).catch(err => {
            // Some gamepads don't support vibration
            console.log('[GamepadManager] Vibration not supported');
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.savePreferences();

        getDebugLogger().info('Gamepad', `Gamepad navigation ${enabled ? 'enabled' : 'disabled'}`);

        if (!enabled) {
            this.selectedIndex = 0;
            window.dispatchEvent(new CustomEvent('gamepadNavigate', {
                detail: { direction: 'clear' }
            }));
        }
    }

    setVibrationEnabled(enabled) {
        this.vibrationEnabled = enabled;
        this.savePreferences();
        getDebugLogger().info('Gamepad', `Gamepad vibration ${enabled ? 'enabled' : 'disabled'}`);
    }

    setNavigationSpeed(speed) {
        this.navigationSpeed = speed;
        this.savePreferences();
        getDebugLogger().info('Gamepad', `Navigation speed changed to ${speed}ms`);
    }

    setDeadzone(deadzone) {
        this.deadzone = deadzone;
        this.savePreferences();
        getDebugLogger().info('Gamepad', `Deadzone changed to ${deadzone}`);
    }

    getStatus() {
        return {
            enabled: this.enabled,
            connected: this.connected,
            gamepadId: this.gamepad?.id || null,
            vibrationEnabled: this.vibrationEnabled,
            navigationSpeed: this.navigationSpeed,
            deadzone: this.deadzone
        };
    }
}

// Initialize gamepad manager
const gamepadManager = new GamepadManager();
window.gamepadManager = gamepadManager;
