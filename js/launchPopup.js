/**
 * Launch Popup Manager - v1.3.0
 * Displays fancy loading popup when launching games
 */

class LaunchPopup {
    constructor() {
        this.popup = null;
        this.popupImage = null;
        this.popupTitle = null;
        this.isShowing = false;
        this.hideTimeout = null;
    }

    /**
     * Initialize the launch popup
     */
    init() {
        this.popup = document.getElementById('launch-popup');
        this.popupImage = document.getElementById('launch-popup-image');
        this.popupTitle = document.getElementById('launch-popup-title');

        if (!this.popup || !this.popupImage || !this.popupTitle) {
            console.error('[LaunchPopup] Required elements not found');
            return false;
        }

        this.getDebugLogger().success('LaunchPopup', 'Launch popup initialized');
        return true;
    }

    /**
     * Show the launch popup with game information
     * @param {Object} game - Game object with title and image
     * @param {number} duration - Optional duration in ms (0 = manual hide)
     */
    show(game, duration = 3000) {
        if (!this.popup) {
            console.error('[LaunchPopup] Popup not initialized');
            return;
        }

        // Set game information
        this.popupTitle.textContent = game.title || game.GameName || 'Unknown Game';

        // Set game image
        if (game.screenshot || game.GameCover) {
            this.popupImage.src = game.screenshot || game.GameCover;
            this.popupImage.style.display = 'block';
        } else {
            // Use placeholder or hide image if no screenshot
            this.popupImage.style.display = 'none';
        }

        // Remove hiding class if present
        this.popup.classList.remove('hiding');

        // Show the popup
        this.popup.style.display = 'flex';
        this.isShowing = true;

        this.getDebugLogger().info('LaunchPopup', 'Showing launch popup', {
            game: this.popupTitle.textContent,
            duration: duration
        });

        // Auto-hide after duration if specified
        if (duration > 0) {
            this.hideTimeout = setTimeout(() => this.hide(), duration);
        }
    }

    /**
     * Hide the launch popup
     */
    hide() {
        if (!this.popup || !this.isShowing) {
            return;
        }

        // Clear auto-hide timeout if exists
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Add hiding animation class
        this.popup.classList.add('hiding');

        // Hide after animation completes
        setTimeout(() => {
            this.popup.style.display = 'none';
            this.popup.classList.remove('hiding');
            this.isShowing = false;

            this.getDebugLogger().info('LaunchPopup', 'Launch popup hidden');
        }, 300); // Match fadeOut animation duration
    }

    /**
     * Check if popup is currently showing
     */
    isVisible() {
        return this.isShowing;
    }

    /**
     * Get debug logger with fallback
     */
    getDebugLogger() {
        return window.debugLogger || {
            info: (cat, msg, data) => console.log(`[${cat}]`, msg, data || ''),
            success: (cat, msg, data) => console.log(`[${cat}] ✅`, msg, data || ''),
            warn: (cat, msg, data) => console.warn(`[${cat}] ⚠️`, msg, data || ''),
            error: (cat, msg, data) => console.error(`[${cat}] ❌`, msg, data || '')
        };
    }
}

// Make globally accessible
window.LaunchPopup = LaunchPopup;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.launchPopup = new LaunchPopup();
        window.launchPopup.init();
    });
} else {
    window.launchPopup = new LaunchPopup();
    window.launchPopup.init();
}
