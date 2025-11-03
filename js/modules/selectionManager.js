/**
 * SelectionManager - Manages multi-select state for batch operations
 */

export class SelectionManager {
    constructor() {
        this.selected = new Set();
        this.selectionMode = false;
    }

    /**
     * Enable selection mode
     */
    enableSelectionMode() {
        this.selectionMode = true;
    }

    /**
     * Disable selection mode and clear selection
     */
    disableSelectionMode() {
        this.selectionMode = false;
        this.clearSelection();
    }

    /**
     * Toggle selection mode
     */
    toggleSelectionMode() {
        if (this.selectionMode) {
            this.disableSelectionMode();
        } else {
            this.enableSelectionMode();
        }
        return this.selectionMode;
    }

    /**
     * Check if selection mode is active
     */
    isSelectionMode() {
        return this.selectionMode;
    }

    /**
     * Select a game
     */
    select(gameId) {
        this.selected.add(gameId);
    }

    /**
     * Deselect a game
     */
    deselect(gameId) {
        this.selected.delete(gameId);
    }

    /**
     * Toggle game selection
     */
    toggle(gameId) {
        if (this.isSelected(gameId)) {
            this.deselect(gameId);
        } else {
            this.select(gameId);
        }
        return this.isSelected(gameId);
    }

    /**
     * Check if a game is selected
     */
    isSelected(gameId) {
        return this.selected.has(gameId);
    }

    /**
     * Get all selected game IDs
     */
    getSelected() {
        return Array.from(this.selected);
    }

    /**
     * Get count of selected games
     */
    getSelectedCount() {
        return this.selected.size;
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selected.clear();
    }

    /**
     * Select all games from a list
     */
    selectAll(gameIds) {
        gameIds.forEach(id => this.select(id));
    }
}
