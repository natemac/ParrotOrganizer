/**
 * HiddenGamesManager - Manages hidden games using localStorage
 */

export class HiddenGamesManager {
    constructor() {
        this.storageKey = 'parrotOrganizer_hiddenGames';
        this.hiddenGames = this.loadHiddenGames();
    }

    /**
     * Load hidden games from localStorage
     */
    loadHiddenGames() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading hidden games:', error);
            return new Set();
        }
    }

    /**
     * Save hidden games to localStorage
     */
    saveHiddenGames() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.hiddenGames)));
        } catch (error) {
            console.error('Error saving hidden games:', error);
        }
    }

    /**
     * Check if a game is hidden
     */
    isHidden(gameId) {
        return this.hiddenGames.has(gameId);
    }

    /**
     * Hide a game
     */
    hideGame(gameId) {
        this.hiddenGames.add(gameId);
        this.saveHiddenGames();
    }

    /**
     * Unhide a game
     */
    unhideGame(gameId) {
        this.hiddenGames.delete(gameId);
        this.saveHiddenGames();
    }

    /**
     * Toggle game hidden status
     */
    toggleHidden(gameId) {
        if (this.isHidden(gameId)) {
            this.unhideGame(gameId);
        } else {
            this.hideGame(gameId);
        }
        return this.isHidden(gameId);
    }

    /**
     * Get all hidden game IDs
     */
    getHiddenGames() {
        return Array.from(this.hiddenGames);
    }

    /**
     * Clear all hidden games
     */
    clearAll() {
        this.hiddenGames.clear();
        this.saveHiddenGames();
    }
}
