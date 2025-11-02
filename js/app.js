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
import { SelectionManager } from './modules/selectionManager.js';
import { CustomProfileManager } from './modules/customProfileManager.js';
import { PreferencesManager } from './modules/preferencesManager.js';
import { ProfileEditManager } from './modules/profileEditManager.js';
import { SettingsEditManager } from './modules/settingsEditManager.js';
import { ControlsEditManager } from './modules/controlsEditManager.js';
import debugLogger from './modules/debugLogger.js';

class ParrotOrganizerApp {
    constructor() {
        this.pathManager = new PathManager();
        this.dataLoader = new DataLoader(this.pathManager);
        this.gameManager = new GameManager();
        this.launchManager = new LaunchManager(this.pathManager);
        this.selectionManager = new SelectionManager();
        this.customProfileManager = new CustomProfileManager();
        this.preferencesManager = new PreferencesManager();
        this.filterManager = new FilterManager(this.gameManager, this.preferencesManager);
        this.uiManager = new UIManager(this.gameManager, this.filterManager, this.launchManager, this.preferencesManager, this.selectionManager, this.customProfileManager);

        this.isInitialized = false;
        this.launchStatusInterval = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🦜 Initializing ParrotOrganizer...');
        const initTimer = performance.now();

        // Log comprehensive client environment information
        debugLogger.info('App', 'Client Environment Information', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            pixelRatio: window.devicePixelRatio,
            url: window.location.href,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port
        });

        debugLogger.info('App', 'Application initialization started');

        try {
            // Show loading state
            this.showLoading();
            debugLogger.debug('App', 'Loading state displayed');

            // Verify TeknoParrot installation
            debugLogger.info('App', 'Verifying TeknoParrot installation');
            const isValid = await this.pathManager.verifyInstallation();
            if (!isValid) {
                const errorMsg = 'TeknoParrot installation not found! Please ensure ParrotOrganizer is inside the TeknoParrot folder.';
                debugLogger.error('App', 'Installation verification failed', { errorMsg });
                this.showError(errorMsg);
                return;
            }

            console.log('✅ TeknoParrot installation verified');
            debugLogger.success('App', 'TeknoParrot installation verified');

            // Load all game data
            console.log('📂 Loading game data...');
            debugLogger.info('App', 'Starting game data load');
            const dataLoadStart = performance.now();
            const gameData = await this.dataLoader.loadAllGames();
            const dataLoadDuration = performance.now() - dataLoadStart;
            debugLogger.perf('App', 'Game data loaded', dataLoadDuration, { gameCount: gameData.length });

            // Load user preferences from file storage
            debugLogger.info('App', 'Loading user preferences');
            await this.preferencesManager.loadPreferences();
            debugLogger.success('App', 'User preferences loaded');

            // Load custom profiles from file storage
            debugLogger.info('App', 'Loading custom profiles');
            await this.customProfileManager.loadProfiles();
            debugLogger.success('App', 'Custom profiles loaded');

            // Apply custom profiles to game data (async map)
            debugLogger.info('App', 'Applying custom profiles to game data');
            const customProfileStart = performance.now();
            const gamesWithCustomData = await Promise.all(
                gameData.map(game => this.customProfileManager.applyCustomProfile(game))
            );
            const customProfileDuration = performance.now() - customProfileStart;
            debugLogger.perf('App', 'Custom profiles applied', customProfileDuration);

            // Initialize game manager with loaded data
            debugLogger.info('App', 'Initializing game manager');
            this.gameManager.initialize(gamesWithCustomData);
            const totalGames = this.gameManager.getAllGames().length;
            const stats = this.gameManager.getStats();

            console.log(`✅ Loaded ${totalGames} games`);
            debugLogger.success('App', 'Game manager initialized', {
                totalGames,
                installedGames: stats.installed,
                notInstalledGames: stats.notInstalled,
                favoriteGames: stats.favorites
            });

            // Initialize UI
            debugLogger.info('App', 'Initializing UI manager');
            this.uiManager.initialize();
            debugLogger.success('App', 'UI manager initialized');

            // Make managers globally accessible for modal buttons and settings
            window.uiManager = this.uiManager;
            window.preferencesManager = this.preferencesManager;
            window.settingsEditManager = new SettingsEditManager();
            window.controlsEditManager = new ControlsEditManager();

            // Setup event listeners
            debugLogger.info('App', 'Setting up event listeners');
            this.setupEventListeners();
            debugLogger.success('App', 'Event listeners configured');

            // Initial render
            debugLogger.info('App', 'Starting initial UI render');
            const renderStart = performance.now();
            this.uiManager.render();
            const renderDuration = performance.now() - renderStart;
            debugLogger.perf('App', 'Initial UI render completed', renderDuration);

            // Start launch status monitoring
            debugLogger.info('App', 'Starting launch status monitoring');
            this.startLaunchStatusMonitoring();

            this.isInitialized = true;
            const totalInitDuration = performance.now() - initTimer;
            console.log('✨ ParrotOrganizer initialized successfully!');
            debugLogger.success('App', 'Application initialization completed successfully', {
                totalDuration: totalInitDuration,
                gameCount: totalGames,
                installedCount: stats.installed
            });

        } catch (error) {
            console.error('❌ Error initializing ParrotOrganizer:', error);
            debugLogger.logError('App', 'Application initialization failed', error);
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

        // Launch TeknoParrot button
        document.getElementById('btn-launch-teknoparrot')?.addEventListener('click', () => {
            this.launchTeknoParrot();
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

        document.getElementById('btn-batch-edit')?.addEventListener('click', () => {
            this.showBatchEditModal();
        });

        // Batch edit modal handlers
        document.getElementById('batch-edit-close')?.addEventListener('click', () => {
            this.closeBatchEditModal();
        });

        document.getElementById('btn-batch-edit-cancel')?.addEventListener('click', () => {
            this.closeBatchEditModal();
        });

        document.getElementById('btn-batch-edit-save')?.addEventListener('click', () => {
            this.saveBatchEdit();
        });

        // Retry button (error state)
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            this.init();
        });

        // Debug tools buttons
        document.getElementById('btn-open-log-folder')?.addEventListener('click', () => {
            this.openLogFolder();
        });

        document.getElementById('btn-view-logs')?.addEventListener('click', () => {
            this.viewLogsInConsole();
        });

        document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
            this.clearLogFile();
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
        const refreshTimer = performance.now();
        debugLogger.info('App', 'Refresh triggered by user');

        try {
            this.showLoading();

            debugLogger.info('App', 'Reloading all game data');
            const gameData = await this.dataLoader.loadAllGames();

            // Reload custom profiles from storage
            debugLogger.info('App', 'Reloading custom profiles');
            await this.customProfileManager.loadProfiles();

            // Apply custom profiles (async map)
            const gamesWithCustomData = await Promise.all(
                gameData.map(game => this.customProfileManager.applyCustomProfile(game))
            );

            this.gameManager.initialize(gamesWithCustomData);

            debugLogger.info('App', 'Re-rendering UI after refresh');
            this.uiManager.render();

            const refreshDuration = performance.now() - refreshTimer;
            console.log('✅ Refresh complete');
            debugLogger.success('App', 'Refresh completed', {
                duration: refreshDuration,
                gameCount: gameData.length
            });

        } catch (error) {
            console.error('❌ Error refreshing:', error);
            debugLogger.logError('App', 'Refresh failed', error);
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
     * Launch TeknoParrotUI application
     */
    async launchTeknoParrot() {
        try {
            const response = await fetch('/__openTeknoParrot', { method: 'POST' });
            const data = await response.json();

            if (data.ok) {
                console.log('✅ TeknoParrotUI launched successfully');
                // Update status immediately after a short delay
                setTimeout(() => this.updateLaunchStatus(), 1000);
            } else {
                console.error('❌ Failed to launch TeknoParrotUI:', data.error);
                alert(`Failed to launch TeknoParrotUI: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error launching TeknoParrotUI:', error);
            alert('Failed to launch TeknoParrotUI. This feature requires the Node.js version (start.bat).');
        }
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
    async handleBatchFavorite() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) {
            alert('No games selected');
            return;
        }

        for (const gameId of selectedIds) {
            await this.preferencesManager.addFavorite(gameId);
        }

        // No alert needed for favorites - visual feedback via star badges

        // Re-render to show star badges
        this.uiManager.render();

        // Exit selection mode
        this.uiManager.toggleSelectionMode();
    }

    /**
     * Show batch edit modal using unified ProfileEditManager
     */
    showBatchEditModal() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) {
            alert('No games selected');
            return;
        }

        const modal = document.getElementById('batch-edit-modal');
        const countEl = document.getElementById('batch-edit-count');

        if (!modal || !countEl) return;

        // Update count
        countEl.textContent = selectedIds.length;

        // Reset form using unified framework
        ProfileEditManager.resetBatchForm();

        // Show modal
        modal.style.display = 'flex';

        debugLogger.info('App', 'Batch edit modal opened', { selectedCount: selectedIds.length });
    }

    /**
     * Close batch edit modal
     */
    closeBatchEditModal() {
        const modal = document.getElementById('batch-edit-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        debugLogger.info('App', 'Batch edit modal closed');
    }

    /**
     * Save batch edit changes using unified ProfileEditManager
     */
    async saveBatchEdit() {
        const selectedIds = this.selectionManager.getSelected();
        if (selectedIds.length === 0) return;

        // Collect batch edit data using unified framework
        const updates = ProfileEditManager.collectBatchEditData();

        debugLogger.info('App', 'Starting batch edit', {
            selectedCount: selectedIds.length,
            updates
        });

        // Apply changes to all selected games
        let successCount = 0;
        for (const gameId of selectedIds) {
            try {
                const game = this.gameManager.getGameById(gameId);
                if (!game) continue;

                // Save to custom profile
                await this.customProfileManager.setProfile(gameId, updates);
                successCount++;

            } catch (error) {
                console.error(`Error updating ${gameId}:`, error);
                debugLogger.logError('App', `Failed to update game ${gameId}`, error);
            }
        }

        debugLogger.success('App', 'Batch edit completed', {
            successCount,
            totalCount: selectedIds.length
        });

        // Close modal
        this.closeBatchEditModal();

        // Show success message
        alert(`Successfully updated ${successCount} of ${selectedIds.length} game(s)`);

        // Refresh to show changes
        await this.refresh();

        // Exit selection mode
        this.uiManager.toggleSelectionMode();
    }

    /**
     * Open log folder in Windows Explorer
     */
    async openLogFolder() {
        debugLogger.info('App', 'Opening log folder');
        try {
            const response = await fetch('/__openLogFolder', { method: 'POST' });
            const data = await response.json();

            if (!data.ok) {
                alert(`Failed to open log folder: ${data.error || 'Unknown error'}\n\nLog file location: ParrotOrganizer/storage/debug.log`);
            }
        } catch (error) {
            alert('Failed to open log folder. This feature requires the Node.js version (start.bat).\n\nLog file location: ParrotOrganizer/storage/debug.log');
        }
    }

    /**
     * View debug logs in console
     */
    viewLogsInConsole() {
        const stats = debugLogger.getStats();
        console.log('='.repeat(60));
        console.log('📊 DEBUG LOGGER STATISTICS');
        console.log('='.repeat(60));
        console.table(stats);
        console.log('');
        console.log('📋 ALL DEBUG LOGS:');
        console.log('='.repeat(60));
        debugLogger.getLogs().forEach((log, index) => {
            const emoji = debugLogger.getLevelEmoji(log.level);
            const timeStr = `[+${(log.relativeTime / 1000).toFixed(2)}s]`;
            console.log(`${index + 1}. ${emoji} ${timeStr} [${log.level}] [${log.category}] ${log.message}`);
            if (log.data) {
                console.log('   Data:', log.data);
            }
        });
        console.log('='.repeat(60));
        alert(`Debug logs displayed in browser console.\n\nTotal logs: ${stats.totalLogs}\nSession ID: ${stats.sessionId}\n\nOpen Developer Tools (F12) to view.`);
    }

    /**
     * Clear the debug.log file
     */
    async clearLogFile() {
        if (!confirm('Clear the debug.log file? This cannot be undone.\n\nThis will delete all logged events from the file.')) {
            return;
        }

        debugLogger.info('App', 'Clearing debug.log file');

        try {
            const response = await fetch('/__clearDebugLog', { method: 'POST' });
            const data = await response.json();

            if (data.ok) {
                // Also clear in-memory logs
                debugLogger.clear();
                alert('Debug log file cleared successfully.');
            } else {
                alert(`Failed to clear log file: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            alert('Failed to clear log file. This feature requires the Node.js version (start.bat).');
        }
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
