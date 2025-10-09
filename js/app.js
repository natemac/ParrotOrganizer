/**
 * ParrotOrganizer - Main Application Entry Point
 *
 * This is the main module that initializes the application and coordinates
 * between different modules.
 */

import { PathManager } from './modules/pathManager.js';
import { DataLoader } from './modules/dataLoader.js';
import { GameManager } from './modules/gameManager.js';
import { UIManager } from './modules/uiManager.js';
import { FilterManager } from './modules/filterManager.js';
import { LaunchManager } from './modules/launchManager.js';
import { HiddenGamesManager } from './modules/hiddenGamesManager.js';
import { FavoritesManager } from './modules/favoritesManager.js';
import { SelectionManager } from './modules/selectionManager.js';

class ParrotOrganizerApp {
    constructor() {
        this.pathManager = new PathManager();
        this.dataLoader = new DataLoader(this.pathManager);
        this.gameManager = new GameManager();
        this.launchManager = new LaunchManager(this.pathManager);
        this.hiddenGamesManager = new HiddenGamesManager();
        this.favoritesManager = new FavoritesManager();
        this.selectionManager = new SelectionManager();
        this.filterManager = new FilterManager(this.gameManager, this.hiddenGamesManager, this.favoritesManager);
        this.uiManager = new UIManager(this.gameManager, this.filterManager, this.launchManager, this.hiddenGamesManager, this.favoritesManager, this.selectionManager);

        this.isInitialized = false;
        this.launchStatusInterval = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🦜 Initializing ParrotOrganizer...');

        try {
            // Show loading state
            this.showLoading();

            // Verify TeknoParrot installation
            const isValid = await this.pathManager.verifyInstallation();
            if (!isValid) {
                this.showError('TeknoParrot installation not found! Please ensure ParrotOrganizer is inside the TeknoParrot folder.');
                return;
            }

            console.log('✅ TeknoParrot installation verified');

            // Load all game data
            console.log('📂 Loading game data...');
            const gameData = await this.dataLoader.loadAllGames();

            // Initialize game manager with loaded data
            this.gameManager.initialize(gameData);

            console.log(`✅ Loaded ${this.gameManager.getAllGames().length} games`);

            // Initialize UI
            this.uiManager.initialize();

            // Make uiManager globally accessible for modal buttons
            window.uiManager = this.uiManager;

            // Setup event listeners
            this.setupEventListeners();

            // Initial render
            this.uiManager.render();

            // Start launch status monitoring
            this.startLaunchStatusMonitoring();

            this.isInitialized = true;
            console.log('✨ ParrotOrganizer initialized successfully!');

        } catch (error) {
            console.error('❌ Error initializing ParrotOrganizer:', error);
            this.showError(`Failed to initialize: ${error.message}`);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Refresh button
        document.getElementById('btn-refresh')?.addEventListener('click', () => {
            this.refresh();
        });

        // Settings button
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.uiManager.showSettings();
        });

        // Exit button
        document.getElementById('btn-exit')?.addEventListener('click', () => {
            this.exitApp();
        });

        // Select Multiple button
        document.getElementById('btn-select-multiple')?.addEventListener('click', () => {
            this.uiManager.toggleSelectionMode();
        });

        // Batch operation buttons
        document.getElementById('btn-batch-add')?.addEventListener('click', () => {
            this.handleBatchAdd();
        });

        document.getElementById('btn-batch-remove')?.addEventListener('click', () => {
            this.handleBatchRemove();
        });

        document.getElementById('btn-batch-favorite')?.addEventListener('click', () => {
            this.handleBatchFavorite();
        });

        document.getElementById('btn-batch-clear')?.addEventListener('click', () => {
            this.uiManager.toggleSelectionMode(); // Turn off selection mode
        });

        // Retry button (error state)
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.init();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refresh();
            }

            // Escape: Close modal
            if (e.key === 'Escape') {
                this.uiManager.closeModal();
            }
        });
    }

    /**
     * Refresh game data
     */
    async refresh() {
        console.log('🔄 Refreshing game data...');

        try {
            this.showLoading();

            const gameData = await this.dataLoader.loadAllGames();
            this.gameManager.initialize(gameData);

            this.uiManager.render();

            console.log('✅ Refresh complete');

        } catch (error) {
            console.error('❌ Error refreshing:', error);
            this.showError(`Failed to refresh: ${error.message}`);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('game-grid').style.display = 'none';
        document.getElementById('error').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
    }

    /**
     * Show error state
     */
    showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('game-grid').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('error-text').textContent = message;
    }

    /**
     * Exit application - shutdown server and close window
     */
    async exitApp() {
        if (confirm('Are you sure you want to exit ParrotOrganizer?')) {
            // Stop status monitoring
            if (this.launchStatusInterval) {
                clearInterval(this.launchStatusInterval);
            }

            try {
                // Try to shutdown server
                await fetch('/__shutdown', { method: 'POST' });
                // Close the window
                setTimeout(() => {
                    window.close();
                    // If window.close() doesn't work (e.g., not opened by script), show message
                    setTimeout(() => {
                        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;"><h1>Server stopped. You can now close this tab.</h1></div>';
                    }, 100);
                }, 100);
            } catch (error) {
                // Server might already be down, just close
                window.close();
                setTimeout(() => {
                    document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;"><h1>You can now close this tab.</h1></div>';
                }, 100);
            }
        }
    }

    /**
     * Start monitoring launch status
     */
    startLaunchStatusMonitoring() {
        // Check immediately
        this.updateLaunchStatus();

        // Then check every 5 seconds
        this.launchStatusInterval = setInterval(() => {
            this.updateLaunchStatus();
        }, 5000);
    }

    /**
     * Update launch status indicator
     */
    async updateLaunchStatus() {
        const statusElement = document.getElementById('launch-status');
        const indicatorElement = statusElement?.querySelector('.status-indicator');
        const textElement = statusElement?.querySelector('.status-text');

        if (!statusElement || !indicatorElement || !textElement) return;

        try {
            const response = await fetch('/__launchStatus');
            const data = await response.json();

            if (data.ok && data.nodejs) {
                // Node.js version
                if (data.teknoParrotRunning) {
                    // TeknoParrotUI is running - WARNING
                    statusElement.className = 'launch-status status-warning';
                    textElement.textContent = 'Close TeknoParrotUI';
                    statusElement.title = 'TeknoParrotUI is running. Close it before launching games from ParrotOrganizer.';
                } else {
                    // Ready to launch - SUCCESS
                    statusElement.className = 'launch-status status-ready';
                    textElement.textContent = 'READY';
                    statusElement.title = 'Ready to launch games';
                }
            }
        } catch (error) {
            // Python version or server error
            statusElement.className = 'launch-status status-unavailable';
            textElement.textContent = 'N/A - Use Node.js';
            statusElement.title = 'Launch feature unavailable. Use start.bat (Node.js version) for one-click launch.';
        }
    }

    /**
     * Handle batch Add to Library
     */
    async handleBatchAdd() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) {
            alert('No games selected');
            return;
        }

        const confirmMsg = `Add ${selectedIds.length} game(s) to your library?`;
        if (!confirm(confirmMsg)) return;

        let successCount = 0;
        let failCount = 0;

        for (const gameId of selectedIds) {
            try {
                const profileFile = `${gameId}.xml`;
                const resp = await fetch(`/__install?profile=${encodeURIComponent(profileFile)}`, { method: 'POST' });
                const data = await resp.json();

                if (data.ok) {
                    successCount++;
                } else {
                    failCount++;
                    console.warn(`Failed to add ${gameId}:`, data.error);
                }
            } catch (error) {
                failCount++;
                console.error(`Error adding ${gameId}:`, error);
            }
        }

        // Only show alert if there were failures
        if (failCount > 0) {
            alert(`Added ${successCount} game(s) to library. Failed: ${failCount}`);
        }

        // Refresh to show updated installation status
        await this.refresh();

        // Exit selection mode
        this.uiManager.toggleSelectionMode();
    }

    /**
     * Handle batch Remove from Library
     */
    async handleBatchRemove() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) {
            alert('No games selected');
            return;
        }

        const confirmMsg = `Remove ${selectedIds.length} game(s) from your library?\n\nThis will delete the UserProfile but keep your game files.`;
        if (!confirm(confirmMsg)) return;

        let successCount = 0;
        let failCount = 0;

        for (const gameId of selectedIds) {
            try {
                const profileFile = `${gameId}.xml`;
                const resp = await fetch(`/__remove?profile=${encodeURIComponent(profileFile)}`, { method: 'POST' });
                const data = await resp.json();

                if (data.ok) {
                    successCount++;
                } else {
                    failCount++;
                    console.warn(`Failed to remove ${gameId}:`, data.error);
                }
            } catch (error) {
                failCount++;
                console.error(`Error removing ${gameId}:`, error);
            }
        }

        // Only show alert if there were failures
        if (failCount > 0) {
            alert(`Removed ${successCount} game(s) from library. Failed: ${failCount}`);
        }

        // Refresh to show updated installation status
        await this.refresh();

        // Exit selection mode
        this.uiManager.toggleSelectionMode();
    }

    /**
     * Handle batch Add to Favorites
     */
    handleBatchFavorite() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) {
            alert('No games selected');
            return;
        }

        selectedIds.forEach(gameId => {
            this.favoritesManager.addFavorite(gameId);
        });

        // No alert needed for favorites - visual feedback via star badges

        // Re-render to show star badges
        this.uiManager.render();

        // Exit selection mode
        this.uiManager.toggleSelectionMode();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new ParrotOrganizerApp();
        document.querySelector('#app').__parrotApp = app;
        app.init();
    });
} else {
    const app = new ParrotOrganizerApp();
    document.querySelector('#app').__parrotApp = app;
    app.init();
}

// Make app available globally for debugging
window.ParrotOrganizer = ParrotOrganizerApp;
