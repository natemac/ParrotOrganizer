/**
 * FavoritesManager - Manages favorite games using localStorage
 */

export class FavoritesManager {
    constructor() {
        this.storageKey = 'parrotOrganizer_favorites';
        this.favorites = this.loadFavorites();
    }

    /**
     * Load favorites from localStorage
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading favorites:', error);
            return new Set();
        }
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.favorites)));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    /**
     * Check if a game is favorited
     */
    isFavorite(gameId) {
        return this.favorites.has(gameId);
    }

    /**
     * Add a game to favorites
     */
    addFavorite(gameId) {
        this.favorites.add(gameId);
        this.saveFavorites();
    }

    /**
     * Remove a game from favorites
     */
    removeFavorite(gameId) {
        this.favorites.delete(gameId);
        this.saveFavorites();
    }

    /**
     * Toggle game favorite status
     */
    toggleFavorite(gameId) {
        if (this.isFavorite(gameId)) {
            this.removeFavorite(gameId);
        } else {
            this.addFavorite(gameId);
        }
        return this.isFavorite(gameId);
    }

    /**
     * Get all favorited game IDs
     */
    getFavorites() {
        return Array.from(this.favorites);
    }

    /**
     * Clear all favorites
     */
    clearAll() {
        this.favorites.clear();
        this.saveFavorites();
    }
}
