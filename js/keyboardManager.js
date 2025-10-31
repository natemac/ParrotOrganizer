// keyboardManager.js - Keyboard navigation support
// Part of ParrotOrganizer v1.3.1
// Mirrors gamepad controls using keyboard keys

function getDebugLogger() {
    return window.debugLogger || {
        info: (cat, msg, data) => console.log(`[${cat}]`, msg, data || ''),
        success: (cat, msg, data) => console.log(`[${cat}] ✅`, msg, data || ''),
        debug: (cat, msg, data) => console.log(`[${cat}] 🔍`, msg, data || '')
    };
}

class KeyboardManager {
    constructor() {
        this.enabled = true;
        this.init();
    }

    init() {
        // Listen for keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        getDebugLogger().success('Keyboard', 'Keyboard navigation initialized');
    }

    handleKeyDown(event) {
        if (!this.enabled) return;

        // Don't intercept if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement.tagName === 'INPUT' ||
                        activeElement.tagName === 'TEXTAREA' ||
                        activeElement.tagName === 'SELECT' ||
                        activeElement.isContentEditable;

        if (isTyping) return;

        // Map keyboard keys to actions
        const key = event.key.toLowerCase();
        let handled = false;

        // Navigation keys (Arrow keys)
        if (key === 'arrowup') {
            this.dispatchNavigation('up');
            handled = true;
        } else if (key === 'arrowdown') {
            this.dispatchNavigation('down');
            handled = true;
        } else if (key === 'arrowleft') {
            this.dispatchNavigation('left');
            handled = true;
        } else if (key === 'arrowright') {
            this.dispatchNavigation('right');
            handled = true;
        }

        // Action keys
        else if (key === 'enter') {
            // Install/Launch game
            this.dispatchAction('select');
            handled = true;
        } else if (key === ' ' || key === 'd') {
            // Show details (Space or D)
            this.dispatchAction('details');
            handled = true;
        } else if (key === 'f') {
            // Toggle favorite
            this.dispatchAction('favorite');
            handled = true;
        } else if (key === 'g') {
            // Show quick menu
            this.dispatchAction('showFilterMenu');
            handled = true;
        } else if (key === 'escape') {
            // Back/Close
            this.dispatchAction('back');
            handled = true;
        } else if (key === 'h') {
            // Home (jump to first game)
            this.dispatchAction('home');
            handled = true;
        } else if (key === 'pageup') {
            // Page up
            this.dispatchAction('pageUp');
            handled = true;
        } else if (key === 'pagedown') {
            // Page down
            this.dispatchAction('pageDown');
            handled = true;
        } else if (key === 'v') {
            // Toggle view (grid/list)
            this.dispatchAction('toggleView');
            handled = true;
        } else if (key === 's') {
            // Settings
            this.dispatchAction('settings');
            handled = true;
        }

        // Prevent default browser behavior for handled keys
        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    dispatchNavigation(direction) {
        const event = new CustomEvent('gamepadNavigate', {
            detail: { direction }
        });
        window.dispatchEvent(event);
        getDebugLogger().debug('Keyboard', `Navigation: ${direction}`);
    }

    dispatchAction(action) {
        const event = new CustomEvent('gamepadAction', {
            detail: { action }
        });
        window.dispatchEvent(event);
        getDebugLogger().debug('Keyboard', `Action: ${action}`);
    }

    enable() {
        this.enabled = true;
        getDebugLogger().info('Keyboard', 'Keyboard navigation enabled');
    }

    disable() {
        this.enabled = false;
        getDebugLogger().info('Keyboard', 'Keyboard navigation disabled');
    }
}

// Initialize keyboard manager
const keyboardManager = new KeyboardManager();
window.keyboardManager = keyboardManager;
