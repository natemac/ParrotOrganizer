/**
 * FilterManager - Handles game filtering and search
 */

export class FilterManager {
    constructor(gameManager, preferencesManager) {
        this.gameManager = gameManager;
        this.preferencesManager = preferencesManager;
        this.filters = {
            search: '',
            status: 'all', // all, installed, not-installed
            genres: [],
            platforms: [],
            emulators: [],
            yearMin: null,
            yearMax: null,
            // GPU Confirmed filters (default all off = neutral)
            gpuNvidia: false,
            gpuAmd: false,
            gpuIntel: false,
            // Subscription-only (Patreon) filter
            subscriptionOnly: false,
            favoritesOnly: false,
            hasTestMode: false,
            gunGame: false,
            is64Bit: false,
            requiresAdmin: false,
            // Show hidden games filter
            showHiddenGames: false,
            // Hide subscription games filter
            hideSubscription: false
        };
        this.sortBy = 'name';
        this.sortAscending = true;
    }

    /**
     * Apply all filters to games
     */
    applyFilters() {
        let games = this.gameManager.getAllGames();

        // Apply hidden games filter (hide by default unless showHiddenGames is enabled)
        if (!this.filters.showHiddenGames && this.preferencesManager) {
            games = games.filter(g => !this.preferencesManager.isHidden(g.id));
        }

        // Apply search filter
        if (this.filters.search && this.filters.search.trim() !== '') {
            games = this.gameManager.searchGames(this.filters.search);
        }

        // Apply status filter
        if (this.filters.status === 'installed') {
            games = games.filter(g => g.isInstalled);
        } else if (this.filters.status === 'not-installed') {
            games = games.filter(g => !g.isInstalled);
        }

        // Apply genre filter
        if (this.filters.genres.length > 0) {
            games = games.filter(g => {
                const genre = g.metadata?.game_genre || g.userProfile?.GameGenreInternal;
                return this.filters.genres.includes(genre);
            });
        }

        // Apply platform filter
        if (this.filters.platforms.length > 0) {
            games = games.filter(g => {
                const platform = g.metadata?.platform;
                return this.filters.platforms.includes(platform);
            });
        }

        // Apply emulator filter
        if (this.filters.emulators.length > 0) {
            games = games.filter(g => {
                const emulator = g.profile?.EmulatorType;
                return this.filters.emulators.includes(emulator);
            });
        }

        // Apply year filter
        if (this.filters.yearMin || this.filters.yearMax) {
            games = games.filter(g => {
                const year = parseInt(g.metadata?.release_year);
                if (isNaN(year)) return false;

                const min = this.filters.yearMin || 0;
                const max = this.filters.yearMax || 9999;

                return year >= min && year <= max;
            });
        }

        // GPU Confirmed filter: only apply when any checkbox is ON.
        const gpuAnyOn = this.filters.gpuNvidia || this.filters.gpuAmd || this.filters.gpuIntel;
        if (gpuAnyOn) {
            games = games.filter(g => {
                if (!g.metadata) return false; // require metadata to confirm
                const nvidia = g.metadata.nvidia;
                const amd = g.metadata.amd;
                const intel = g.metadata.intel;
                let matches = false;
                if (this.filters.gpuNvidia && nvidia === 'OK') matches = true;
                if (this.filters.gpuAmd && amd === 'OK') matches = true;
                if (this.filters.gpuIntel && intel === 'OK') matches = true;
                return matches;
            });
        }

        // No 'Added On' filter (sorting only)

        // Subscription-only (Patreon) filter
        if (this.filters.subscriptionOnly) {
            games = games.filter(g => g.profile?.Patreon === true);
        }

        // Hide subscription games filter
        if (this.filters.hideSubscription) {
            games = games.filter(g => g.profile?.Patreon !== true);
        }

        // Favorites filter
        if (this.filters.favoritesOnly && this.preferencesManager) {
            games = games.filter(g => this.preferencesManager.isFavorite(g.id));
        }

        // Apply advanced filters
        if (this.filters.hasTestMode) {
            games = games.filter(g => g.profile?.HasSeparateTestMode === true);
        }

        if (this.filters.gunGame) {
            games = games.filter(g => g.profile?.GunGame === true);
        }

        if (this.filters.is64Bit) {
            games = games.filter(g => g.profile?.Is64Bit === true);
        }

        if (this.filters.requiresAdmin) {
            games = games.filter(g => g.profile?.RequiresAdmin === true);
        }

        // Apply sorting
        games = this.gameManager.sortGames(games, this.sortBy, this.sortAscending);

        return games;
    }

    /**
     * Update filter and return filtered games
     */
    setFilter(filterName, value) {
        if (filterName in this.filters) {
            this.filters[filterName] = value;
        }
        return this.applyFilters();
    }

    /**
     * Set sorting
     */
    setSort(sortBy, ascending = true) {
        this.sortBy = sortBy;
        this.sortAscending = ascending;
        return this.applyFilters();
    }

    /**
     * Toggle sort direction
     */
    toggleSortDirection() {
        this.sortAscending = !this.sortAscending;
        return this.applyFilters();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.filters = {
            search: '',
            status: 'all',
            genres: [],
            platforms: [],
            emulators: [],
            yearMin: null,
            yearMax: null,
            gpuNvidia: false,
            gpuAmd: false,
            gpuIntel: false,
            subscriptionOnly: false,
            favoritesOnly: false,
            hasTestMode: false,
            gunGame: false,
            is64Bit: false,
            requiresAdmin: false,
            showHiddenGames: false,
            hideSubscription: false
        };
        return this.applyFilters();
    }

    /**
     * Get current filter state
     */
    getFilters() {
        return { ...this.filters };
    }
}
