// settingsManager.js - Settings Panel Manager
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

class SettingsManager {
    constructor() {
        this.currentTheme = 'dark'; // default theme
        this.init();
    }

    init() {
        // Wait for PreferencesManager to be available
        if (!window.preferencesManager) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Load theme preference
        this.loadTheme();

        // Load grid info visibility
        this.applyGridInfoVisibility();

        getDebugLogger().success('Settings', 'Settings Manager initialized', {
            currentTheme: this.currentTheme
        });
    }

    loadTheme() {
        if (!window.preferencesManager) return;

        this.currentTheme = window.preferencesManager.getTheme();
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        getDebugLogger().info('Settings', `Loaded theme from file: ${this.currentTheme}`);
    }

    async applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        // Save to file via PreferencesManager
        if (window.preferencesManager) {
            await window.preferencesManager.setTheme(theme);
            getDebugLogger().info('Settings', `Theme saved to file: ${theme}`);
        }
    }

    applyGridInfoVisibility() {
        if (!window.preferencesManager) return;

        const visibility = window.preferencesManager.getGridInfoVisibility();

        // Apply CSS classes to control visibility
        const root = document.documentElement;
        root.classList.toggle('hide-grid-genre', !visibility.genre);
        root.classList.toggle('hide-grid-platform', !visibility.platform);
        root.classList.toggle('hide-grid-year', !visibility.year);
        root.classList.toggle('hide-grid-gpu', !visibility.gpu);

        getDebugLogger().info('Settings', 'Grid info visibility applied', visibility);
    }

    showSettings() {
        getDebugLogger().info('Settings', 'Opening settings panel');

        const modal = document.getElementById('game-modal');
        const modalBody = document.getElementById('modal-body');

        if (!modal || !modalBody) {
            console.error('[Settings] Modal elements not found!', { modal: !!modal, modalBody: !!modalBody });
            alert('Error: Settings modal not found. Please refresh the page.');
            return;
        }

        console.log('[Settings] Modal elements found, building settings UI...');

        // Get current preferences from PreferencesManager
        const prefs = window.preferencesManager.preferences;
        const gamepadStatus = window.gamepadManager?.getStatus() || {};

        getDebugLogger().debug('Settings', 'Current preferences from file', {
            theme: prefs.ui.theme,
            gridColumns: prefs.ui.gridColumns,
            defaultView: prefs.ui.defaultView,
            gamepadEnabled: prefs.gamepad.enabled,
            autoScan: prefs.advanced.autoScan
        });

        modalBody.innerHTML = `
            <div class="settings-panel">
                <h2 style="margin-bottom: 1.5rem;">⚙️ Settings</h2>

                <!-- Tabs -->
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="appearance">Appearance</button>
                    <button class="settings-tab" data-tab="data">Data Management</button>
                    <button class="settings-tab" data-tab="gamepad">Gamepad</button>
                    <button class="settings-tab" data-tab="advanced">Advanced</button>
                    <button class="settings-tab" data-tab="about">About</button>
                </div>

                <!-- Tab Content -->
                <div class="settings-content">
                    <!-- Appearance Tab -->
                    <div class="settings-tab-content active" data-tab-content="appearance">
                        <div class="settings-section">
                            <h3>Theme</h3>
                            <div class="setting-item">
                                <div>
                                    <label>
                                        <input type="radio" name="theme" value="light" ${prefs.ui.theme === 'light' ? 'checked' : ''}>
                                        Light Mode
                                    </label>
                                    <label>
                                        <input type="radio" name="theme" value="dark" ${prefs.ui.theme === 'dark' ? 'checked' : ''}>
                                        Dark Mode
                                    </label>
                                </div>
                                <small style="color: var(--text-secondary);">Switch between light and dark color schemes</small>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Grid View Information</h3>
                            <p style="color: var(--text-secondary);">
                                Choose which information to display on game cards in grid view
                            </p>
                            <div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="show-genre" ${prefs.ui.showGridInfo?.genre !== false ? 'checked' : ''}>
                                        Show Genre
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="show-platform" ${prefs.ui.showGridInfo?.platform !== false ? 'checked' : ''}>
                                        Show Platform
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="show-year" ${prefs.ui.showGridInfo?.year !== false ? 'checked' : ''}>
                                        Show Release Year
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="show-gpu" ${prefs.ui.showGridInfo?.gpu !== false ? 'checked' : ''}>
                                        Show GPU Compatibility
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Grid Layout</h3>
                            <div class="setting-item">
                                <label for="columns-slider">Columns per Row</label>
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <input type="range" id="columns-slider" min="2" max="8" step="1" value="${prefs.ui.gridColumns || 5}" style="flex: 1;">
                                    <span id="columns-value" style="min-width: 2ch; text-align: center;">${prefs.ui.gridColumns || 5}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Data Management Tab -->
                    <div class="settings-tab-content" data-tab-content="data">
                        <div class="settings-section">
                            <h3>Reset Options</h3>
                            <p style="color: var(--text-secondary);">
                                These actions will clear user data. This cannot be undone.
                            </p>
                            <div>
                                <div class="setting-item">
                                    <button class="btn btn-warning" onclick="window.settingsManager.resetFavorites()">
                                        ⭐ Reset Favorites
                                    </button>
                                </div>
                                <div class="setting-item">
                                    <button class="btn btn-warning" onclick="window.settingsManager.resetHiddenGames()">
                                        👁️ Reset Hidden Games
                                    </button>
                                </div>
                                <div class="setting-item">
                                    <button class="btn btn-warning" onclick="window.settingsManager.resetCustomProfiles()">
                                        📝 Reset Custom Profiles
                                    </button>
                                </div>
                                <div class="setting-item">
                                    <button class="btn btn-warning" onclick="window.settingsManager.resetUIPreferences()">
                                        🎨 Reset UI Preferences
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section" style="border-top: 2px solid var(--border-color);">
                            <h3 style="color: var(--danger-color);">Danger Zone</h3>
                            <div class="setting-item">
                                <button class="btn btn-danger" onclick="window.settingsManager.resetEverything()">
                                    🗑️ Reset Everything
                                </button>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Backup & Restore</h3>
                            <div>
                                <div class="setting-item">
                                    <button class="btn btn-primary" onclick="window.settingsManager.exportSettings()">
                                        📤 Export Settings
                                    </button>
                                </div>
                                <div class="setting-item">
                                    <button class="btn btn-primary" onclick="document.getElementById('import-settings-file').click()">
                                        📥 Import Settings
                                    </button>
                                    <input type="file" id="import-settings-file" accept=".json" style="display: none;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gamepad Tab -->
                    <div class="settings-tab-content" data-tab-content="gamepad">
                        <div class="settings-section">
                            <h3>Gamepad Status</h3>
                            <div class="setting-item">
                                <div class="gamepad-status-display" style="padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                    <p style="margin-bottom: 0.5rem;">
                                        <strong>Status:</strong>
                                        <span style="color: ${gamepadStatus.connected ? 'var(--secondary-color)' : 'var(--text-secondary)'};">
                                            ${gamepadStatus.connected ? '✅ Connected' : '⚠️ Not Connected'}
                                        </span>
                                    </p>
                                    ${gamepadStatus.gamepadId ? `
                                        <p style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                                            <strong>Device:</strong> ${gamepadStatus.gamepadId}
                                        </p>
                                    ` : ''}
                                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem;">
                                        ${gamepadStatus.connected ? 'Your gamepad is ready to use!' : 'Connect a gamepad to enable navigation.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Gamepad Settings</h3>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="gamepad-enabled" ${gamepadStatus.enabled !== false ? 'checked' : ''}>
                                    Enable Gamepad Navigation
                                </label>
                                <small style="color: var(--text-secondary);">Use gamepad to navigate and control the UI</small>
                            </div>

                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="gamepad-vibration" ${gamepadStatus.vibrationEnabled !== false ? 'checked' : ''}>
                                    Enable Vibration Feedback
                                </label>
                                <small style="color: var(--text-secondary);">Haptic feedback on button presses (if supported)</small>
                            </div>

                            <div class="setting-item">
                                <label for="gamepad-speed">Navigation Speed</label>
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <input type="range" id="gamepad-speed" min="50" max="300" step="10" value="${gamepadStatus.navigationSpeed || 150}" style="flex: 1;">
                                    <span id="gamepad-speed-value" style="min-width: 4ch;">${gamepadStatus.navigationSpeed || 150}ms</span>
                                </div>
                                <small style="color: var(--text-secondary);">Time between navigation inputs (lower = faster)</small>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Button Layout</h3>
                            <div class="gamepad-controls" style="font-family: monospace; font-size: 0.9rem; line-height: 1.8;">
                                <p><strong>A Button:</strong> Launch / Select</p>
                                <p><strong>B Button:</strong> Back / Cancel</p>
                                <p><strong>X Button:</strong> Toggle Favorite</p>
                                <p><strong>Y Button:</strong> Show Game Details</p>
                                <p><strong>START:</strong> Open Settings</p>
                                <p><strong>SELECT:</strong> Toggle Grid/List View</p>
                                <p><strong>L3 (Click Stick):</strong> Scroll to Top</p>
                                <p><strong>LB / RB:</strong> Cycle Status Filters</p>
                                <p><strong>D-Pad / Left Stick:</strong> Navigate Grid</p>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Tab -->
                    <div class="settings-tab-content" data-tab-content="advanced">
                        <div class="settings-section">
                            <h3>Game Library</h3>
                            <div class="setting-item">
                                <button id="btn-refresh-games" class="btn btn-primary" onclick="window.settingsManager.refreshGameList()">
                                    🔄 Refresh Game List
                                </button>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Startup Options</h3>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="auto-scan" ${prefs.advanced.autoScan ? 'checked' : ''}>
                                    Auto-scan games on startup
                                </label>
                                <small style="color: var(--text-secondary);">Automatically refresh game list when app starts</small>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>Debug Options</h3>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="debug-mode" ${prefs.advanced.debugMode ? 'checked' : ''}>
                                    Show Debug Tools
                                </label>
                                <small style="color: var(--text-secondary);">Display debug tools in sidebar (requires refresh)</small>
                            </div>
                        </div>
                    </div>

                    <!-- About Tab -->
                    <div class="settings-tab-content" data-tab-content="about">
                        <div class="settings-section" style="text-align: center;">
                            <img src="assets/logo.png" alt="ParrotOrganizer" style="width: 120px; height: 120px; margin-bottom: 1rem;" onerror="this.style.display='none'">
                            <h2 style="color: var(--primary-color); margin-bottom: 0.5rem;">ParrotOrganizer</h2>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 2rem;">Version 1.3.0</p>

                            <a href="https://github.com/natemac/ParrotOrganizer" target="_blank" class="btn btn-primary" style="text-decoration: none; font-size: 1.1rem; padding: 1rem 2rem;">
                                💾 View on GitHub
                            </a>
                        </div>

                        <div class="settings-section">
                            <h3>Credits</h3>
                            <p style="color: var(--text-secondary); line-height: 1.8;">
                                <strong>Created by:</strong> Nate Mac<br>
                                <strong>Built for:</strong> TeknoParrot Community<br>
                                <strong>Powered by:</strong> TeknoParrot by Reaver & Team
                            </p>
                        </div>

                        <div class="settings-section">
                            <h3>Links</h3>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <a href="https://teknoparrot.com/" target="_blank" class="btn btn-secondary" style="text-decoration: none;">
                                    🦜 TeknoParrot Official
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup tab switching
        this.setupTabSwitching();

        // Setup auto-save for theme changes
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', async (e) => {
                await this.applyTheme(e.target.value);
                getDebugLogger().info('Settings', 'Theme auto-saved');
            });
        });

        // Setup auto-save for grid info visibility
        const showGenre = document.getElementById('show-genre');
        if (showGenre) {
            showGenre.addEventListener('change', async (e) => {
                await window.preferencesManager.setGridInfoVisibility('genre', e.target.checked);
                this.applyGridInfoVisibility();
                getDebugLogger().info('Settings', 'Grid info visibility (genre) auto-saved');
            });
        }

        const showPlatform = document.getElementById('show-platform');
        if (showPlatform) {
            showPlatform.addEventListener('change', async (e) => {
                await window.preferencesManager.setGridInfoVisibility('platform', e.target.checked);
                this.applyGridInfoVisibility();
                getDebugLogger().info('Settings', 'Grid info visibility (platform) auto-saved');
            });
        }

        const showYear = document.getElementById('show-year');
        if (showYear) {
            showYear.addEventListener('change', async (e) => {
                await window.preferencesManager.setGridInfoVisibility('year', e.target.checked);
                this.applyGridInfoVisibility();
                getDebugLogger().info('Settings', 'Grid info visibility (year) auto-saved');
            });
        }

        const showGPU = document.getElementById('show-gpu');
        if (showGPU) {
            showGPU.addEventListener('change', async (e) => {
                await window.preferencesManager.setGridInfoVisibility('gpu', e.target.checked);
                this.applyGridInfoVisibility();
                getDebugLogger().info('Settings', 'Grid info visibility (gpu) auto-saved');
            });
        }

        // Setup columns slider with auto-save
        const columnsSlider = document.getElementById('columns-slider');
        const columnsValue = document.getElementById('columns-value');
        if (columnsSlider && columnsValue) {
            columnsSlider.addEventListener('input', (e) => {
                columnsValue.textContent = e.target.value;
            });
            columnsSlider.addEventListener('change', async (e) => {
                const columns = parseInt(e.target.value);
                await window.preferencesManager.setGridColumns(columns);
                // Apply the columns change immediately
                if (window.uiManager) {
                    window.uiManager.updateGridColumns(columns);
                }
                getDebugLogger().info('Settings', 'Grid columns auto-saved', { columns });
            });
        }

        // Setup auto-save for advanced settings
        const autoScanCheckbox = document.getElementById('auto-scan');
        if (autoScanCheckbox) {
            autoScanCheckbox.addEventListener('change', async (e) => {
                await window.preferencesManager.setAutoScan(e.target.checked);
                getDebugLogger().info('Settings', 'Auto-scan auto-saved');
            });
        }

        const debugModeCheckbox = document.getElementById('debug-mode');
        if (debugModeCheckbox) {
            debugModeCheckbox.addEventListener('change', async (e) => {
                await window.preferencesManager.setDebugMode(e.target.checked);
                getDebugLogger().info('Settings', 'Debug mode auto-saved');
            });
        }

        // Setup gamepad settings with auto-save
        const gamepadEnabledCheckbox = document.getElementById('gamepad-enabled');
        if (gamepadEnabledCheckbox) {
            gamepadEnabledCheckbox.addEventListener('change', (e) => {
                if (window.gamepadManager) {
                    window.gamepadManager.setEnabled(e.target.checked);
                    getDebugLogger().info('Settings', 'Gamepad enabled auto-saved');
                }
            });
        }

        const gamepadVibrationCheckbox = document.getElementById('gamepad-vibration');
        if (gamepadVibrationCheckbox) {
            gamepadVibrationCheckbox.addEventListener('change', (e) => {
                if (window.gamepadManager) {
                    window.gamepadManager.setVibrationEnabled(e.target.checked);
                    getDebugLogger().info('Settings', 'Gamepad vibration auto-saved');
                }
            });
        }

        // Setup gamepad speed slider with auto-save
        const speedSlider = document.getElementById('gamepad-speed');
        const speedValue = document.getElementById('gamepad-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                speedValue.textContent = `${e.target.value}ms`;
            });
            speedSlider.addEventListener('change', (e) => {
                if (window.gamepadManager) {
                    window.gamepadManager.setNavigationSpeed(parseInt(e.target.value));
                    getDebugLogger().info('Settings', 'Gamepad speed auto-saved');
                }
            });
        }

        // Setup import file handler
        const importInput = document.getElementById('import-settings-file');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                this.importSettings(e.target.files[0]);
            });
        }

        console.log('[Settings] Setting modal display to flex');
        modal.style.display = 'flex';

        console.log('[Settings] Modal display set. Current display:', modal.style.display);
        getDebugLogger().success('Settings', 'Settings panel displayed successfully');
    }

    setupTabSwitching() {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.settings-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                // Remove active from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active to clicked tab and corresponding content
                tab.classList.add('active');
                document.querySelector(`[data-tab-content="${targetTab}"]`).classList.add('active');
            });
        });
    }

    closeSettings() {
        if (window.uiManager) {
            window.uiManager.closeModal();
        }
    }

    // Data reset functions
    async resetFavorites() {
        if (!confirm('Clear all favorite games? This cannot be undone.')) return;

        getDebugLogger().warn('Settings', 'Resetting favorites');

        const favCount = window.preferencesManager.preferences.favorites.length;
        await window.preferencesManager.clearAllFavorites();

        getDebugLogger().success('Settings', `Cleared ${favCount} favorites from file`);
        this.refreshApp();
    }

    async resetHiddenGames() {
        if (!confirm('Unhide all hidden games? This cannot be undone.')) return;

        getDebugLogger().warn('Settings', 'Resetting hidden games');

        const hiddenCount = window.preferencesManager.preferences.hiddenGames.length;
        await window.preferencesManager.clearAllHiddenGames();

        getDebugLogger().success('Settings', `Unhid ${hiddenCount} games from file`);
        this.refreshApp();
    }

    async resetCustomProfiles() {
        if (!confirm('Delete all custom profiles (descriptions, tags, YouTube links)? This cannot be undone.')) return;

        getDebugLogger().warn('Settings', 'Resetting custom profiles');

        // Try to delete from server
        try {
            await fetch('/__deleteCustomProfiles', { method: 'POST' });
            getDebugLogger().success('Settings', 'Custom profiles deleted from server');
        } catch (err) {
            getDebugLogger().warn('Settings', 'Could not delete custom profiles from server');
        }

        this.refreshApp();
    }

    async resetUIPreferences() {
        if (!confirm('Reset all UI preferences (theme, grid columns, view mode)? This cannot be undone.')) return;

        getDebugLogger().warn('Settings', 'Resetting UI preferences');

        await window.preferencesManager.resetUIPreferences();
        await this.applyTheme('dark');

        getDebugLogger().success('Settings', 'UI preferences reset to defaults in file');
        this.refreshApp();
    }

    async resetEverything() {
        if (!confirm('⚠️ WARNING: This will delete ALL user data including favorites, hidden games, custom profiles, and UI preferences.\n\nThis cannot be undone. Continue?')) return;

        // Double confirmation
        if (!confirm('Are you absolutely sure? This is your last chance to cancel.')) return;

        getDebugLogger().warn('Settings', '⚠️ RESETTING EVERYTHING - All user data will be cleared');

        // Reset all preferences to defaults
        await window.preferencesManager.resetAll();
        await this.applyTheme('dark');

        // Try to delete custom profiles from server
        try {
            await fetch('/__deleteCustomProfiles', { method: 'POST' });
        } catch (err) {
            getDebugLogger().warn('Settings', 'Could not delete custom profiles from server');
        }

        getDebugLogger().success('Settings', 'All user data cleared from file');
        this.refreshApp();
    }

    // Export/Import functions
    exportSettings() {
        getDebugLogger().info('Settings', 'Exporting settings from file to JSON');

        // Use PreferencesManager's export function
        window.preferencesManager.exportPreferences();

        getDebugLogger().success('Settings', 'Settings exported successfully from file');
    }

    async importSettings(file) {
        if (!file) return;

        getDebugLogger().info('Settings', 'Importing settings from JSON file to file storage', {
            fileName: file.name,
            fileSize: file.size
        });

        try {
            // Use PreferencesManager's import function
            await window.preferencesManager.importPreferences(file);

            // Reload theme
            this.loadTheme();

            getDebugLogger().success('Settings', 'Settings imported successfully to file');
            this.refreshApp();
        } catch (err) {
            getDebugLogger().error('Settings', 'Failed to import settings', {
                error: err.message,
                fileName: file.name
            });
            alert(`Failed to import settings: ${err.message}`);
        }
    }

    refreshApp() {
        const app = document.querySelector('#app').__parrotApp;
        if (app && app.refresh) {
            app.refresh();
        }
    }

    refreshGameList() {
        getDebugLogger().info('Settings', 'User requested game list refresh');
        this.refreshApp();
        // Close settings after refresh
        this.closeSettings();
    }
}

// Initialize settings manager and make it globally accessible
const settingsManager = new SettingsManager();
window.settingsManager = settingsManager;
