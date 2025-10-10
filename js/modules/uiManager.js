/**
 * UIManager - Handles all UI rendering and interactions
 */

export class UIManager {
    constructor(gameManager, filterManager, launchManager, hiddenGamesManager, favoritesManager, selectionManager) {
        this.gameManager = gameManager;
        this.filterManager = filterManager;
        this.launchManager = launchManager;
        this.hiddenGamesManager = hiddenGamesManager;
        this.favoritesManager = favoritesManager;
        this.selectionManager = selectionManager;
        this.currentView = 'grid'; // grid or list
    }

    /**
     * Initialize UI and event listeners
     */
    initialize() {
        this.setupFilterListeners();
        this.setupViewToggle();
        this.setupGridControls();
        this.setupModalListeners();
        this.populateFilterOptions();
        this.rearrangeFilters();
    }

    /**
     * Render the game list
     */
    render() {
        const games = this.filterManager.applyFilters();
        this.gameManager.setFilteredGames(games);

        // Update stats
        this.updateStats();

        // Update clear filters button visibility
        this.updateClearFiltersButton();

        // Render games
        this.renderGameGrid(games);
    }

    /**
     * Update header statistics
     */
    updateStats() {
        const stats = this.gameManager.getStats();

        document.getElementById('stats-total').textContent = `Total: ${stats.total}`;
        document.getElementById('stats-installed').textContent = `Installed: ${stats.installed}`;
        document.getElementById('stats-filtered').textContent = `Showing: ${stats.filtered}`;
    }

    /**
     * Render game grid/list
     */
    renderGameGrid(games) {
        const gameGrid = document.getElementById('game-grid');
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('empty-state');

        // Hide loading
        loading.style.display = 'none';

        if (games.length === 0) {
            gameGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        gameGrid.style.display = 'grid';

        // Apply view class while preserving selection-mode class
        const isSelectionMode = gameGrid.classList.contains('selection-mode');
        gameGrid.className = `game-grid ${this.currentView === 'list' ? 'list-view' : ''}`;
        if (isSelectionMode) {
            gameGrid.classList.add('selection-mode');
        }
        // Apply column setting when in grid view
        this.applyGridColumns();

        // Clear existing content
        gameGrid.innerHTML = '';

        // Render each game
        games.forEach(game => {
            const gameCard = this.createGameCard(game);
            gameGrid.appendChild(gameCard);
        });
    }

    /**
     * Create a game card element
     */
    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = game.id;

        // Get icon URL resolved by DataLoader (with fallbacks)
        const iconUrl = game.iconUrl
            || (game.userProfile?.IconName ? `../Icons/${game.userProfile.IconName}` : null)
            || (game.metadata?.icon_name ? `../Icons/${game.metadata.icon_name}` : null);

        // Get game info
        const gameName = game.name || game.id;
        const genre = game.metadata?.game_genre || game.userProfile?.GameGenreInternal || 'Unknown';
        const platform = game.metadata?.platform || 'Unknown';
        const year = game.metadata?.release_year || '?';
        const added = game.addedDate || null;

        // GPU compatibility
        const gpuCompat = this.renderGPUCompatibility(game.metadata);

        card.innerHTML = `
            <input type="checkbox" class="game-card-checkbox" data-game-id="${game.id}">
            <div class="game-card-image">
                ${iconUrl ? `<img src="${iconUrl}" alt="${gameName}" onerror="this.parentElement.innerHTML='<div class=\\'game-card-image-placeholder\\'>🎮</div>'">` : '<div class="game-card-image-placeholder">🎮</div>'}
                <span class="status-badge status-${game.isInstalled ? 'installed' : 'not-installed'}">
                    ${game.isInstalled ? 'Installed' : 'Not Installed'}
                </span>
                ${game.profile?.Patreon === true ? `<span class=\"sub-badge\" title=\"Requires subscription\">Subscription</span>` : ''}
                ${this.favoritesManager.isFavorite(game.id) ? `<span class=\"favorite-badge\" title=\"Favorite\">⭐</span>` : ''}
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title">${this.escapeHtml(gameName)}</h3>
                <div class="game-card-meta">
                    <div class="game-card-meta-item">
                        <span>🎮</span> ${this.escapeHtml(genre)}
                    </div>
                    <div class="game-card-meta-item">
                        <span>🖥️</span> ${this.escapeHtml(platform)}
                    </div>
                    <div class="game-card-meta-item">
                        <span>📅</span> ${year}
                    </div>
                    ${gpuCompat ? `<div class="gpu-compat">${gpuCompat}</div>` : ''}
                </div>
            </div>
            <div class="game-card-actions">
                ${game.isInstalled ? `
                    <button class="btn btn-launch" data-action="launch">Launch</button>
                    <button class="btn btn-configure" data-action="configure">Details</button>
                ` : `
                    <button class="btn btn-install" data-action="install">Add to Library</button>
                `}
            </div>
        `;

        // Add click handler for entire card (open details) - image, title, metadata
        const imageArea = card.querySelector('.game-card-image');
        const contentArea = card.querySelector('.game-card-content');

        if (imageArea) {
            imageArea.addEventListener('click', () => {
                this.showGameDetails(game);
            });
            imageArea.style.cursor = 'pointer';
        }

        if (contentArea) {
            contentArea.addEventListener('click', () => {
                this.showGameDetails(game);
            });
            contentArea.style.cursor = 'pointer';
        }

        // Add action button handlers
        const launchBtn = card.querySelector('[data-action="launch"]');
        if (launchBtn) {
            launchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleLaunch(game);
            });
        }

        const configureBtn = card.querySelector('[data-action="configure"]');
        if (configureBtn) {
            configureBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showGameDetails(game);
            });
        }

        const installBtn = card.querySelector('[data-action="install"]');
        if (installBtn) {
            installBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleInstall(game);
            });
        }

        // Add checkbox handler for selection mode
        const checkbox = card.querySelector('.game-card-checkbox');
        if (checkbox) {
            // Set initial checked state based on selection manager
            checkbox.checked = this.selectionManager.isSelected(game.id);

            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.selectionManager.toggle(game.id);
                this.updateBatchToolbar();
            });
        }

        return card;
    }

    /**
     * Render GPU compatibility icons
     */
    renderGPUCompatibility(metadata) {
        if (!metadata) return '';

        let html = '';

        if (metadata.nvidia) {
            const hasIssues = metadata.nvidia === 'HAS_ISSUES';
            html += `<div class="gpu-icon gpu-nvidia ${hasIssues ? 'gpu-issue' : ''}" title="Nvidia: ${metadata.nvidia}${hasIssues ? ' - ' + metadata.nvidia_issues : ''}">N</div>`;
        }

        if (metadata.amd) {
            const hasIssues = metadata.amd === 'HAS_ISSUES';
            html += `<div class="gpu-icon gpu-amd ${hasIssues ? 'gpu-issue' : ''}" title="AMD: ${metadata.amd}${hasIssues ? ' - ' + metadata.amd_issues : ''}">A</div>`;
        }

        if (metadata.intel) {
            const hasIssues = metadata.intel === 'HAS_ISSUES';
            html += `<div class="gpu-icon gpu-intel ${hasIssues ? 'gpu-issue' : ''}" title="Intel: ${metadata.intel}${hasIssues ? ' - ' + metadata.intel_issues : ''}">I</div>`;
        }

        return html;
    }

    /**
     * Show game details modal
     */
    showGameDetails(game) {
        const modal = document.getElementById('game-modal');
        const modalBody = document.getElementById('modal-body');

        const gameName = game.name || game.id;
        const genre = game.metadata?.game_genre || 'Unknown';
        const platform = game.metadata?.platform || 'Unknown';
        const year = game.metadata?.release_year || 'Unknown';
        const emulator = game.profile?.EmulatorType || 'Unknown';
        const added = game.addedDate || null;

        const iconUrl = game.iconUrl
            || (game.userProfile?.IconName ? `../Icons/${game.userProfile.IconName}` : null)
            || (game.metadata?.icon_name ? `../Icons/${game.metadata.icon_name}` : null);

        modalBody.innerHTML = `
            <div class="game-detail">
                <div class="game-detail-header">
                    ${iconUrl ? `
                        <div class="game-detail-image">
                            <img src="${iconUrl}" alt="${gameName}">
                        </div>
                    ` : ''}
                    <div class="game-detail-info">
                        <h2 class="game-detail-title">${this.escapeHtml(gameName)}</h2>
                        <p class="game-detail-subtitle">${game.isInstalled ? '✅ Installed' : '⚠️ Not Installed'}</p>
                        <div class="game-detail-meta">
                            ${added ? `
                            <div class="meta-item">
                                <div class="meta-label">Added</div>
                                <div class="meta-value">${this.escapeHtml(added)}</div>
                            </div>
                            ` : ''}
                            <div class="meta-item">
                                <div class="meta-label">Genre</div>
                                <div class="meta-value">${this.escapeHtml(genre)}</div>
                            </div>
                            <div class="meta-item">
                                <div class="meta-label">Platform</div>
                                <div class="meta-value">${this.escapeHtml(platform)}</div>
                            </div>
                            <div class="meta-item">
                                <div class="meta-label">Year</div>
                                <div class="meta-value">${year}</div>
                            </div>
                            <div class="meta-item">
                                <div class="meta-label">Emulator</div>
                                <div class="meta-value">${this.escapeHtml(emulator)}</div>
                            </div>
                            
                        </div>
                        <div class="game-detail-actions">
                            ${game.isInstalled ? `
                                <button class="btn btn-success" onclick="window.uiManager.handleLaunch({id: '${game.id}'})">🚀 Launch Game</button>
                                <button class="btn btn-danger" onclick="window.uiManager.handleRemove({id: '${game.id}'})">🗑️ Remove from Library</button>
                            ` : `
                                <button class="btn btn-warning" onclick="window.uiManager.handleInstall({id: '${game.id}'})">📥 Add to Library</button>
                            `}
                        </div>
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input
                                    type="checkbox"
                                    id="favorite-game-checkbox"
                                    ${this.favoritesManager.isFavorite(game.id) ? 'checked' : ''}
                                    onchange="window.uiManager.toggleFavorite('${game.id}')"
                                    style="cursor: pointer;"
                                >
                                <span>⭐ Add to favorites</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input
                                    type="checkbox"
                                    id="hide-game-checkbox"
                                    ${this.hiddenGamesManager.isHidden(game.id) ? 'checked' : ''}
                                    onchange="window.uiManager.toggleHideGame('${game.id}')"
                                    style="cursor: pointer;"
                                >
                                <span>👁️ Hide this game from library</span>
                            </label>
                        </div>
                    </div>
                </div>

                ${game.metadata?.general_issues ? `
                    <div class="config-section">
                        <h3>⚠️ Known Issues</h3>
                        <p>${this.escapeHtml(game.metadata.general_issues)}</p>
                    </div>
                ` : ''}

                ${game.userProfile?.GamePath ? `
                    <div class="config-section">
                        <h3>📁 Installation</h3>
                        <div class="config-item">
                            <label>Game Path:</label>
                            <div class="config-item-value">${this.escapeHtml(game.userProfile.GamePath)}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'flex';
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('game-modal').style.display = 'none';
    }

    /**
     * Handle game launch
     */
    async handleLaunch(game) {
        if (typeof game.id === 'string') {
            game = this.gameManager.getGameById(game.id);
        }

        try {
            const result = await this.launchManager.launchGame(game);

            if (!result.success) {
                // Show launch command dialog
                const command = result.command;
                alert(`To launch this game, run this command:\n\n${command}\n\nCopy and paste it into Command Prompt or PowerShell.`);

                // Copy to clipboard if possible
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(command);
                    console.log('✅ Command copied to clipboard');
                }
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Handle game install
     */
    async handleInstall(game) {
        if (typeof game.id === 'string') {
            game = this.gameManager.getGameById(game.id);
        }

        try {
            // Try to install via server endpoint
            const profileFile = `${game.id}.xml`;
            const resp = await fetch(`/__install?profile=${encodeURIComponent(profileFile)}`, { method: 'POST' });
            const result = await resp.json();

            if (result.ok) {
                // Show success modal
                this.showInstallSuccessModal(game);
            } else {
                alert(`Failed to add to library: ${result.error}`);
            }
        } catch (error) {
            alert(`Error adding game to library: ${error.message}\n\nPlease ensure you're running via start.bat (Node.js version).`);
        }
    }

    /**
     * Show install success modal
     */
    showInstallSuccessModal(game) {
        const modal = document.getElementById('game-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div class="install-success">
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                    <h2>Game added to your library!</h2>
                    <p style="margin: 1.5rem 0; color: var(--text-secondary);">
                        Head into TeknoParrotUI to configure game settings, controls, and game path.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="window.uiManager.openTeknoParrot()">
                            Go To TeknoParrot
                        </button>
                        <button class="btn btn-secondary" onclick="window.uiManager.closeModalAndRefresh()">
                            Continue Browsing
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    /**
     * Open TeknoParrot UI
     */
    async openTeknoParrot() {
        try {
            const resp = await fetch('/__openTeknoParrot', { method: 'POST' });
            const result = await resp.json();

            if (result.ok) {
                this.closeModal();
            } else {
                alert(`Could not open TeknoParrot: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    /**
     * Close modal and refresh game list
     */
    async closeModalAndRefresh() {
        this.closeModal();
        // Trigger a refresh to update the installed status
        const app = document.querySelector('#app').__parrotApp;
        if (app && app.refresh) {
            await app.refresh();
        }
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(gameId) {
        this.favoritesManager.toggleFavorite(gameId);
        // Re-render to update the game list
        this.render();
    }

    /**
     * Toggle hide game status
     */
    toggleHideGame(gameId) {
        this.hiddenGamesManager.toggleHidden(gameId);
        // Re-render to update the game list
        this.render();
    }

    /**
     * Handle game removal from library
     */
    async handleRemove(game) {
        if (typeof game.id === 'string') {
            game = this.gameManager.getGameById(game.id);
        }

        if (!confirm(`Remove "${game.name}" from your library?\n\nThis will delete the UserProfile but keep your game files.`)) {
            return;
        }

        try {
            const profileFile = `${game.id}.xml`;
            const resp = await fetch(`/__remove?profile=${encodeURIComponent(profileFile)}`, { method: 'POST' });
            const result = await resp.json();

            if (result.ok) {
                // Removed successfully - no alert needed
                this.closeModal();
                // Trigger a refresh to update the installed status
                const app = document.querySelector('#app').__parrotApp;
                if (app && app.refresh) {
                    await app.refresh();
                }
            } else {
                alert(`Failed to remove from library: ${result.error}`);
            }
        } catch (error) {
            alert(`Error removing game from library: ${error.message}\n\nPlease ensure you're running via start.bat (Node.js version).`);
        }
    }

    /**
     * Setup filter listeners
     */
    setupFilterListeners() {
        // Search input
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', (e) => {
            this.filterManager.setFilter('search', e.target.value);
            this.render();
        });

        // Status radio buttons
        document.querySelectorAll('input[name="status"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.filterManager.setFilter('status', e.target.value);
                this.render();
            });
        });

        // Genre select
        const genreSelect = document.getElementById('filter-genre');
        genreSelect.addEventListener('change', (e) => {
            const selected = Array.from(e.target.selectedOptions).map(o => o.value).filter(v => v);
            this.filterManager.setFilter('genres', selected);
            this.render();
        });

        // Platform select
        const platformSelect = document.getElementById('filter-platform');
        platformSelect.addEventListener('change', (e) => {
            const selected = Array.from(e.target.selectedOptions).map(o => o.value).filter(v => v);
            this.filterManager.setFilter('platforms', selected);
            this.render();
        });

        // Emulator select
        const emulatorSelect = document.getElementById('filter-emulator');
        if (emulatorSelect) {
            emulatorSelect.addEventListener('change', (e) => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value).filter(v => v);
                this.filterManager.setFilter('emulators', selected);
                this.render();
            });
        }

        // Year range
        document.getElementById('filter-year-min').addEventListener('change', (e) => {
            const year = parseInt(e.target.value);
            this.filterManager.setFilter('yearMin', isNaN(year) ? null : year);
            this.render();
        });

        document.getElementById('filter-year-max').addEventListener('change', (e) => {
            const year = parseInt(e.target.value);
            this.filterManager.setFilter('yearMax', isNaN(year) ? null : year);
            this.render();
        });

        // No 'Added On' date range UI (sorting only)

        // GPU section defaults: all OFF (neutral), hide legacy 'Show Issues', rename label
        try {
            const gpuGroup = document.getElementById('gpu-nvidia')?.closest('.filter-group');
            const headerLabel = gpuGroup?.querySelector('label');
            if (headerLabel) headerLabel.textContent = 'GPU Confirmed';
            const gpuIssues = document.getElementById('gpu-issues');
            if (gpuIssues && gpuIssues.parentElement) gpuIssues.parentElement.style.display = 'none';
            const n = document.getElementById('gpu-nvidia'); if (n) n.checked = false;
            const a = document.getElementById('gpu-amd'); if (a) a.checked = false;
            const i = document.getElementById('gpu-intel'); if (i) i.checked = false;
        } catch (_) {}

        // GPU checkboxes (confirmed)
        document.getElementById('gpu-nvidia').addEventListener('change', (e) => {
            this.filterManager.setFilter('gpuNvidia', e.target.checked);
            this.render();
        });

        document.getElementById('gpu-amd').addEventListener('change', (e) => {
            this.filterManager.setFilter('gpuAmd', e.target.checked);
            this.render();
        });

        document.getElementById('gpu-intel').addEventListener('change', (e) => {
            this.filterManager.setFilter('gpuIntel', e.target.checked);
            this.render();
        });


        // Advanced filters
        document.getElementById('adv-testmode').addEventListener('change', (e) => {
            this.filterManager.setFilter('hasTestMode', e.target.checked);
            this.render();
        });

        document.getElementById('adv-gungame').addEventListener('change', (e) => {
            this.filterManager.setFilter('gunGame', e.target.checked);
            this.render();
        });

        document.getElementById('adv-64bit').addEventListener('change', (e) => {
            this.filterManager.setFilter('is64Bit', e.target.checked);
            this.render();
        });

        document.getElementById('adv-admin').addEventListener('change', (e) => {
            this.filterManager.setFilter('requiresAdmin', e.target.checked);
            this.render();
        });

        // Subscription-only (Patreon) filter
        const advSub = document.getElementById('adv-subscription');
        if (advSub) {
            advSub.addEventListener('change', (e) => {
                this.filterManager.setFilter('subscriptionOnly', e.target.checked);
                this.render();
            });
        }

        // Favorites filter
        const advFavorites = document.getElementById('adv-favorites');
        if (advFavorites) {
            advFavorites.addEventListener('change', (e) => {
                this.filterManager.setFilter('favoritesOnly', e.target.checked);
                this.render();
            });
        }

        // Show hidden games filter
        const advShowHidden = document.getElementById('adv-showhidden');
        if (advShowHidden) {
            advShowHidden.addEventListener('change', (e) => {
                this.filterManager.setFilter('showHiddenGames', e.target.checked);
                this.render();
            });
        }

        // Hide subscription games filter
        const advHideSubscription = document.getElementById('adv-hidesubscription');
        if (advHideSubscription) {
            advHideSubscription.addEventListener('change', (e) => {
                this.filterManager.setFilter('hideSubscription', e.target.checked);
                this.render();
            });
        }

        // Sort controls
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.filterManager.setSort(e.target.value, this.filterManager.sortAscending);
            this.render();
        });

        document.getElementById('sort-direction').addEventListener('click', () => {
            this.filterManager.toggleSortDirection();
            this.updateSortButton();
            this.render();
        });

        // Clear filters button
        document.getElementById('btn-clear-filters').addEventListener('click', () => {
            this.clearFilters();
            this.filterManager.clearAllFilters();
            this.render();
        });
    }

    /**
     * Setup view toggle
     */
    setupViewToggle() {
        document.getElementById('view-grid').addEventListener('click', () => {
            this.currentView = 'grid';
            document.getElementById('view-grid').classList.add('active');
            document.getElementById('view-list').classList.remove('active');
            this.applyGridColumns();
            this.render();
        });

        document.getElementById('view-list').addEventListener('click', () => {
            this.currentView = 'list';
            document.getElementById('view-list').classList.add('active');
            document.getElementById('view-grid').classList.remove('active');
            this.applyGridColumns();
            this.render();
        });
    }

    /**
     * Setup grid columns slider
     */
    setupGridControls() {
        const slider = document.getElementById('columns-slider');
        const valueEl = document.getElementById('columns-value');
        if (!slider || !valueEl) return;

        // Load saved value
        const saved = parseInt(localStorage.getItem('gridColumns') || '5', 10);
        const clamped = isNaN(saved) ? 5 : Math.max(2, Math.min(8, saved));
        slider.value = String(clamped);
        valueEl.textContent = String(clamped);
        this.gridColumns = clamped;
        this.applyGridColumns();

        slider.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            this.gridColumns = v;
            valueEl.textContent = String(v);
            localStorage.setItem('gridColumns', String(v));
            this.applyGridColumns();
        });
    }

    /**
     * Apply the grid columns style based on current slider and view
     */
    applyGridColumns() {
        const grid = document.getElementById('game-grid');
        if (!grid) return;
        if (this.currentView === 'list') {
            grid.style.gridTemplateColumns = '';
            return;
        }
        const n = this.gridColumns || 5;
        grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    }

    /**
     * Move Sort controls under Search and Subscription under Installation Status
     * NOTE: Disabled - filters are now manually positioned in HTML
     */
    rearrangeFilters() {
        // This method is deprecated - filters are now properly positioned in index.html
        // Keeping method stub to avoid breaking references
    }

    /**
     * Setup modal listeners
     */
    setupModalListeners() {
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('game-modal').addEventListener('click', (e) => {
            if (e.target.id === 'game-modal') {
                this.closeModal();
            }
        });
    }

    /**
     * Populate filter options
     */
    populateFilterOptions() {
        // Get all games for counting
        const allGames = this.gameManager.getAllGames();

        // Populate genres with counts
        const genres = this.gameManager.getGenres();
        const genreSelect = document.getElementById('filter-genre');
        genres.forEach(genre => {
            const count = allGames.filter(g => {
                const gameGenre = g.metadata?.game_genre || g.userProfile?.GameGenreInternal;
                return gameGenre === genre;
            }).length;
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = `${genre} (${count})`;
            genreSelect.appendChild(option);
        });

        // Populate platforms with counts
        const platforms = this.gameManager.getPlatforms();
        const platformSelect = document.getElementById('filter-platform');
        platforms.forEach(platform => {
            const count = allGames.filter(g => g.metadata?.platform === platform).length;
            const option = document.createElement('option');
            option.value = platform;
            option.textContent = `${platform} (${count})`;
            platformSelect.appendChild(option);
        });

        // Populate emulator types with counts
        const emulators = this.gameManager.getEmulatorTypes();
        const emulatorSelect = document.getElementById('filter-emulator');
        if (emulatorSelect) {
            emulators.forEach(em => {
                const count = allGames.filter(g => g.profile?.EmulatorType === em).length;
                const option = document.createElement('option');
                option.value = em;
                option.textContent = `${em} (${count})`;
                emulatorSelect.appendChild(option);
            });
        }
        // Set year range placeholders
        const yearRange = this.gameManager.getYearRange();
        document.getElementById('filter-year-min').placeholder = yearRange.min.toString();
        document.getElementById('filter-year-max').placeholder = yearRange.max.toString();
    }

    /**
     * Update sort button
     */
    updateSortButton() {
        const btn = document.getElementById('sort-direction');
        btn.textContent = this.filterManager.sortAscending ? '↑' : '↓';
    }

    /**
     * Update clear filters button visibility based on active filters
     */
    updateClearFiltersButton() {
        const clearBtn = document.getElementById('btn-clear-filters');
        if (!clearBtn) return;

        const filters = this.filterManager.getFilters();

        // Check if any filter is active
        const hasActiveFilters =
            filters.search !== '' ||
            filters.status !== 'all' ||
            filters.genres.length > 0 ||
            filters.platforms.length > 0 ||
            filters.emulators.length > 0 ||
            filters.yearMin !== null ||
            filters.yearMax !== null ||
            filters.gpuNvidia === true ||
            filters.gpuAmd === true ||
            filters.gpuIntel === true ||
            filters.subscriptionOnly === true ||
            filters.favoritesOnly === true ||
            filters.hasTestMode === true ||
            filters.gunGame === true ||
            filters.is64Bit === true ||
            filters.requiresAdmin === true ||
            filters.showHiddenGames === true ||
            filters.hideSubscription === true;

        // Show/hide button based on active filters
        clearBtn.style.display = hasActiveFilters ? 'flex' : 'none';
    }

    /**
     * Clear all filter inputs
     */
    clearFilters() {
        document.getElementById('search').value = '';
        document.querySelector('input[name="status"][value="all"]').checked = true;
        document.getElementById('filter-genre').selectedIndex = 0;
        document.getElementById('filter-platform').selectedIndex = 0;
        const emulatorSelect = document.getElementById('filter-emulator');
        if (emulatorSelect) emulatorSelect.selectedIndex = 0;
        document.getElementById('filter-year-min').value = '';
        document.getElementById('filter-year-max').value = '';

        document.getElementById('gpu-nvidia').checked = false;
        document.getElementById('gpu-amd').checked = false;
        document.getElementById('gpu-intel').checked = false;

        const advSub = document.getElementById('adv-subscription');
        if (advSub) advSub.checked = false;

        const advFav = document.getElementById('adv-favorites');
        if (advFav) advFav.checked = false;

        document.getElementById('adv-testmode').checked = false;
        document.getElementById('adv-gungame').checked = false;
        document.getElementById('adv-64bit').checked = false;
        document.getElementById('adv-admin').checked = false;

        const advHideSubscription = document.getElementById('adv-hidesubscription');
        if (advHideSubscription) advHideSubscription.checked = false;

        const advShowHidden = document.getElementById('adv-showhidden');
        if (advShowHidden) advShowHidden.checked = false;
    }

    /**
     * Show settings (placeholder)
     */
    showSettings() {
        alert('Settings feature coming soon!');
    }

    /**
     * Toggle selection mode for batch operations
     */
    toggleSelectionMode() {
        const grid = document.getElementById('game-grid');
        const batchToolbar = document.getElementById('batch-toolbar');
        const selectBtn = document.getElementById('btn-select-multiple');

        if (!grid || !batchToolbar || !selectBtn) return;

        // Toggle selection mode
        this.selectionManager.toggleSelectionMode();

        if (this.selectionManager.isSelectionMode()) {
            // Enable selection mode
            grid.classList.add('selection-mode');
            batchToolbar.style.display = 'flex';
            selectBtn.classList.add('active');
        } else {
            // Disable selection mode
            grid.classList.remove('selection-mode');
            batchToolbar.style.display = 'none';
            selectBtn.classList.remove('active');

            // Clear all selections and uncheck boxes
            this.selectionManager.clearSelection();
            document.querySelectorAll('.game-card-checkbox').forEach(cb => {
                cb.checked = false;
            });
        }

        this.updateBatchToolbar();
    }

    /**
     * Update batch toolbar with current selection count
     */
    updateBatchToolbar() {
        const countEl = document.getElementById('batch-count');
        if (!countEl) return;

        const count = this.selectionManager.getSelectedCount();
        countEl.textContent = `${count} selected`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make uiManager globally accessible for modal buttons
window.uiManager = null;
