/**
 * GameManager - Manages game data and provides query methods
 *
 * Central store for all game data with filtering and sorting capabilities
 */

export class GameManager {
    constructor() {
        this.games = [];
        this.filteredGames = [];
    }

    /**
     * Initialize with loaded game data
     */
    initialize(gameData) {
        this.games = gameData;
        this.filteredGames = [...this.games];
        console.log(`🎮 GameManager initialized with ${this.games.length} games`);
    }

    /**
     * Get all games
     */
    getAllGames() {
        return this.games;
    }

    /**
     * Get filtered games
     */
    getFilteredGames() {
        return this.filteredGames;
    }

    /**
     * Set filtered games
     */
    setFilteredGames(games) {
        this.filteredGames = games;
    }

    /**
     * Get game by ID
     */
    getGameById(id) {
        return this.games.find(game => game.id === id);
    }

    /**
     * Get installed games only
     */
    getInstalledGames() {
        return this.games.filter(game => game.isInstalled);
    }

    /**
     * Get not installed games
     */
    getNotInstalledGames() {
        return this.games.filter(game => !game.isInstalled);
    }

    /**
     * Get unique genres
     */
    getGenres() {
        const genres = new Set();

        this.games.forEach(game => {
            // Try to get genre from multiple sources
            const genre = game.metadata?.game_genre ||
                         game.userProfile?.GameGenreInternal ||
                         'Unknown';

            if (genre && genre !== 'Unknown') {
                genres.add(genre);
            }
        });

        return Array.from(genres).sort();
    }

    /**
     * Get unique platforms
     */
    getPlatforms() {
        const platforms = new Set();

        this.games.forEach(game => {
            const platform = game.metadata?.platform || 'Unknown';

            if (platform && platform !== 'Unknown') {
                platforms.add(platform);
            }
        });

        return Array.from(platforms).sort();
    }

    /**
     * Get unique emulator types
     */
    getEmulatorTypes() {
        const emulators = new Set();

        this.games.forEach(game => {
            const emulator = game.profile?.EmulatorType || 'Unknown';

            if (emulator && emulator !== 'Unknown') {
                emulators.add(emulator);
            }
        });

        return Array.from(emulators).sort();
    }

    /**
     * Get year range
     */
    getYearRange() {
        const years = this.games
            .map(game => game.metadata?.release_year)
            .filter(year => year && year !== 'Unknown')
            .map(year => parseInt(year))
            .filter(year => !isNaN(year));

        if (years.length === 0) {
            return { min: 2000, max: new Date().getFullYear() };
        }

        return {
            min: Math.min(...years),
            max: Math.max(...years)
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            total: this.games.length,
            installed: this.getInstalledGames().length,
            notInstalled: this.getNotInstalledGames().length,
            filtered: this.filteredGames.length
        };
    }

    /**
     * Search games by text (includes name, internal name, emulation profile, tags, genre, platform, emulator, description)
     */
    searchGames(query) {
        if (!query || query.trim() === '') {
            return this.games;
        }

        const searchTerm = query.toLowerCase();

        return this.games.filter(game => {
            const name = (game.name || '').toLowerCase();
            const internalName = (game.userProfile?.GameNameInternal || '').toLowerCase();
            const emulationProfile = (game.profile?.EmulationProfile || '').toLowerCase();

            // Search in custom tags array
            const tags = game.customTags || [];
            const tagsMatch = tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Search in genre (from metadata or custom)
            const genre = (game.metadata?.game_genre || '').toLowerCase();
            const customGenre = (game.customGenre || '').toLowerCase();

            // Search in platform (from metadata)
            const platform = (game.metadata?.platform || '').toLowerCase();

            // Search in emulator type
            const emulator = (game.profile?.EmulatorType || '').toLowerCase();

            // Search in custom description
            const description = (game.customDescription || '').toLowerCase();

            return name.includes(searchTerm) ||
                   internalName.includes(searchTerm) ||
                   emulationProfile.includes(searchTerm) ||
                   tagsMatch ||
                   genre.includes(searchTerm) ||
                   customGenre.includes(searchTerm) ||
                   platform.includes(searchTerm) ||
                   emulator.includes(searchTerm) ||
                   description.includes(searchTerm);
        });
    }

    /**
     * Sort games by field
     */
    sortGames(games, sortBy, ascending = true) {
        const sorted = [...games];

        sorted.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = (a.name || '').toLowerCase();
                    valueB = (b.name || '').toLowerCase();
                    break;

                case 'year':
                    valueA = parseInt(a.metadata?.release_year) || 9999;
                    valueB = parseInt(b.metadata?.release_year) || 9999;
                    break;

                case 'platform':
                    valueA = (a.metadata?.platform || '').toLowerCase();
                    valueB = (b.metadata?.platform || '').toLowerCase();
                    break;

                case 'genre':
                    valueA = (a.metadata?.game_genre || '').toLowerCase();
                    valueB = (b.metadata?.game_genre || '').toLowerCase();
                    break;

                case 'status':
                    valueA = a.isInstalled ? 1 : 0;
                    valueB = b.isInstalled ? 1 : 0;
                    break;

                

                default:
                    valueA = (a.name || '').toLowerCase();
                    valueB = (b.name || '').toLowerCase();
            }

            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });

        return sorted;
    }
}
