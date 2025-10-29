/**
 * PreferencesManager - Manages all user-specific preferences in a single file
 *
 * Stores:
 * - Favorites list
 * - Hidden games list
 * - UI preferences (grid columns, view mode, theme)
 * - Filter preferences (last search, sort settings)
 * - Session state (last viewed game)
 */

export class PreferencesManager {
    constructor() {
        this.storageFile = 'preferences.json';
        this.preferences = this.getDefaultPreferences();
        this.loaded = false;
    }

    /**
     * Get default preferences structure
     */
    getDefaultPreferences() {
        return {
            ui: {
                gridColumns: 5,
                currentView: 'grid',
                theme: 'dark',
                defaultView: 'grid',  // v1.3.0
                showGridInfo: {
                    genre: true,
                    platform: true,
                    year: true,
                    gpu: true
                }
            },
            filters: {
                lastSearch: '',
                lastSortBy: 'name',
                lastSortDirection: 'asc'
            },
            favorites: [],
            hiddenGames: [],
            session: {
                lastViewedGameId: null
            },
            // v1.3.0 - Gamepad settings
            gamepad: {
                enabled: true,
                vibration: true,
                navigationSpeed: 150,
                deadzone: 0.3
            },
            // v1.3.0 - Advanced settings
            advanced: {
                autoScan: true,
                debugMode: false
            }
        };
    }

    /**
     * Load preferences from file storage
     */
    async loadPreferences() {
        if (this.loaded) return this.preferences;

        try {
            const response = await fetch(`/__storage/read?file=${this.storageFile}`);
            const result = await response.json();

            if (result.ok && result.data) {
                // Merge loaded data with defaults to ensure all keys exist
                this.preferences = this.mergeWithDefaults(result.data);
                this.loaded = true;
            } else {
                console.log('No existing preferences found, using defaults');
                this.preferences = this.getDefaultPreferences();
                this.loaded = true;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            this.preferences = this.getDefaultPreferences();
        }

        return this.preferences;
    }

    /**
     * Merge loaded data with defaults to ensure all properties exist
     */
    mergeWithDefaults(loaded) {
        const defaults = this.getDefaultPreferences();

        return {
            ui: { ...defaults.ui, ...loaded.ui },
            filters: { ...defaults.filters, ...loaded.filters },
            favorites: Array.isArray(loaded.favorites) ? loaded.favorites : defaults.favorites,
            hiddenGames: Array.isArray(loaded.hiddenGames) ? loaded.hiddenGames : defaults.hiddenGames,
            session: { ...defaults.session, ...loaded.session },
            gamepad: { ...defaults.gamepad, ...(loaded.gamepad || {}) },  // v1.3.0
            advanced: { ...defaults.advanced, ...(loaded.advanced || {}) }  // v1.3.0
        };
    }

    /**
     * Save preferences to file storage
     */
    async savePreferences() {
        try {
            const response = await fetch(`/__storage/write?file=${this.storageFile}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.preferences)
            });

            const result = await response.json();
            if (!result.ok) {
                console.error('Error saving preferences:', result.error);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    // ========== FAVORITES ==========

    /**
     * Get all favorites
     */
    getFavorites() {
        return new Set(this.preferences.favorites);
    }

    /**
     * Check if a game is favorited
     */
    isFavorite(gameId) {
        return this.preferences.favorites.includes(gameId);
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(gameId) {
        const index = this.preferences.favorites.indexOf(gameId);

        if (index > -1) {
            this.preferences.favorites.splice(index, 1);
        } else {
            this.preferences.favorites.push(gameId);
        }

        await this.savePreferences();
    }

    /**
     * Add game to favorites
     */
    async addFavorite(gameId) {
        if (!this.preferences.favorites.includes(gameId)) {
            this.preferences.favorites.push(gameId);
            await this.savePreferences();
        }
    }

    /**
     * Remove game from favorites
     */
    async removeFavorite(gameId) {
        const index = this.preferences.favorites.indexOf(gameId);
        if (index > -1) {
            this.preferences.favorites.splice(index, 1);
            await this.savePreferences();
        }
    }

    // ========== HIDDEN GAMES ==========

    /**
     * Get all hidden games
     */
    getHiddenGames() {
        return new Set(this.preferences.hiddenGames);
    }

    /**
     * Check if a game is hidden
     */
    isHidden(gameId) {
        return this.preferences.hiddenGames.includes(gameId);
    }

    /**
     * Toggle hidden status
     */
    async toggleHidden(gameId) {
        const index = this.preferences.hiddenGames.indexOf(gameId);

        if (index > -1) {
            this.preferences.hiddenGames.splice(index, 1);
        } else {
            this.preferences.hiddenGames.push(gameId);
        }

        await this.savePreferences();
    }

    /**
     * Hide game
     */
    async hideGame(gameId) {
        if (!this.preferences.hiddenGames.includes(gameId)) {
            this.preferences.hiddenGames.push(gameId);
            await this.savePreferences();
        }
    }

    /**
     * Unhide game
     */
    async unhideGame(gameId) {
        const index = this.preferences.hiddenGames.indexOf(gameId);
        if (index > -1) {
            this.preferences.hiddenGames.splice(index, 1);
            await this.savePreferences();
        }
    }

    // ========== UI PREFERENCES ==========

    /**
     * Get grid columns preference
     */
    getGridColumns() {
        return this.preferences.ui.gridColumns;
    }

    /**
     * Set grid columns preference
     */
    async setGridColumns(columns) {
        this.preferences.ui.gridColumns = columns;
        await this.savePreferences();
    }

    /**
     * Get current view mode
     */
    getCurrentView() {
        return this.preferences.ui.currentView;
    }

    /**
     * Set current view mode
     */
    async setCurrentView(view) {
        this.preferences.ui.currentView = view;
        await this.savePreferences();
    }

    /**
     * Get theme preference
     */
    getTheme() {
        return this.preferences.ui.theme;
    }

    /**
     * Set theme preference
     */
    async setTheme(theme) {
        this.preferences.ui.theme = theme;
        await this.savePreferences();
    }

    /**
     * Get grid info visibility settings
     */
    getGridInfoVisibility() {
        return this.preferences.ui.showGridInfo || {
            genre: true,
            platform: true,
            year: true,
            gpu: true
        };
    }

    /**
     * Set grid info visibility for a specific field
     */
    async setGridInfoVisibility(field, visible) {
        if (!this.preferences.ui.showGridInfo) {
            this.preferences.ui.showGridInfo = {
                genre: true,
                platform: true,
                year: true,
                gpu: true
            };
        }
        this.preferences.ui.showGridInfo[field] = visible;
        await this.savePreferences();
    }

    /**
     * Set all grid info visibility settings at once
     */
    async setAllGridInfoVisibility(settings) {
        this.preferences.ui.showGridInfo = { ...settings };
        await this.savePreferences();
    }

    // ========== FILTER PREFERENCES ==========

    /**
     * Get last search query
     */
    getLastSearch() {
        return this.preferences.filters.lastSearch;
    }

    /**
     * Set last search query
     */
    async setLastSearch(query) {
        this.preferences.filters.lastSearch = query;
        await this.savePreferences();
    }

    /**
     * Get last sort settings
     */
    getLastSort() {
        return {
            sortBy: this.preferences.filters.lastSortBy,
            direction: this.preferences.filters.lastSortDirection
        };
    }

    /**
     * Set last sort settings
     */
    async setLastSort(sortBy, direction) {
        this.preferences.filters.lastSortBy = sortBy;
        this.preferences.filters.lastSortDirection = direction;
        await this.savePreferences();
    }

    // ========== SESSION STATE ==========

    /**
     * Get last viewed game ID
     */
    getLastViewedGame() {
        return this.preferences.session.lastViewedGameId;
    }

    /**
     * Set last viewed game ID
     */
    async setLastViewedGame(gameId) {
        this.preferences.session.lastViewedGameId = gameId;
        await this.savePreferences();
    }

    /**
     * Export preferences to JSON file
     */
    exportPreferences() {
        const dataStr = JSON.stringify(this.preferences, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `parrotorganizer_preferences_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import preferences from JSON file
     */
    async importPreferences(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const imported = JSON.parse(e.target.result);

                    // Merge with current preferences
                    this.preferences = this.mergeWithDefaults(imported);
                    await this.savePreferences();

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // ========== GAMEPAD PREFERENCES (v1.3.0) ==========

    /**
     * Get all gamepad preferences
     */
    getGamepadPreferences() {
        return this.preferences.gamepad;
    }

    /**
     * Set gamepad enabled status
     */
    async setGamepadEnabled(enabled) {
        this.preferences.gamepad.enabled = enabled;
        await this.savePreferences();
    }

    /**
     * Set gamepad vibration status
     */
    async setGamepadVibration(enabled) {
        this.preferences.gamepad.vibration = enabled;
        await this.savePreferences();
    }

    /**
     * Set gamepad navigation speed
     */
    async setGamepadNavigationSpeed(speed) {
        this.preferences.gamepad.navigationSpeed = speed;
        await this.savePreferences();
    }

    /**
     * Set gamepad deadzone
     */
    async setGamepadDeadzone(deadzone) {
        this.preferences.gamepad.deadzone = deadzone;
        await this.savePreferences();
    }

    // ========== ADVANCED PREFERENCES (v1.3.0) ==========

    /**
     * Get all advanced preferences
     */
    getAdvancedPreferences() {
        return this.preferences.advanced;
    }

    /**
     * Set auto-scan on startup
     */
    async setAutoScan(enabled) {
        this.preferences.advanced.autoScan = enabled;
        await this.savePreferences();
    }

    /**
     * Set debug mode
     */
    async setDebugMode(enabled) {
        this.preferences.advanced.debugMode = enabled;
        await this.savePreferences();
    }

    // ========== DATA RESET OPERATIONS (v1.3.0) ==========

    /**
     * Clear all favorites
     */
    async clearAllFavorites() {
        this.preferences.favorites = [];
        await this.savePreferences();
    }

    /**
     * Clear all hidden games
     */
    async clearAllHiddenGames() {
        this.preferences.hiddenGames = [];
        await this.savePreferences();
    }

    /**
     * Reset UI preferences to defaults
     */
    async resetUIPreferences() {
        const defaults = this.getDefaultPreferences();
        this.preferences.ui = { ...defaults.ui };
        await this.savePreferences();
    }

    /**
     * Reset gamepad preferences to defaults
     */
    async resetGamepadPreferences() {
        const defaults = this.getDefaultPreferences();
        this.preferences.gamepad = { ...defaults.gamepad };
        await this.savePreferences();
    }

    /**
     * Reset advanced preferences to defaults
     */
    async resetAdvancedPreferences() {
        const defaults = this.getDefaultPreferences();
        this.preferences.advanced = { ...defaults.advanced };
        await this.savePreferences();
    }

    /**
     * Reset everything to defaults (keeps structure, clears data)
     */
    async resetAll() {
        this.preferences = this.getDefaultPreferences();
        await this.savePreferences();
    }
}
