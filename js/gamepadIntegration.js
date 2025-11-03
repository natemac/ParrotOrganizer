// gamepadIntegration.js - Integrates gamepad navigation with the UI
// Part of ParrotOrganizer v1.3.0

// Get debugLogger - will be available after app.js loads
function getDebugLogger() {
    return window.debugLogger || {
        info: (cat, msg, data) => console.log(`[${cat}]`, msg, data || ''),
        success: (cat, msg, data) => console.log(`[${cat}] ✅`, msg, data || ''),
        debug: (cat, msg, data) => console.log(`[${cat}] 🔍`, msg, data || '')
    };
}

class GamepadIntegration {
    constructor() {
        this.selectedIndex = -1;
        this.gameCards = [];
        this.isModalOpen = false;
        this.isCapturingInput = false; // NEW: Track if we're capturing input (controls editor)
        this.isFilterMenuOpen = false;
        this.filterMenuSelectedIndex = 0;
        this.usingKeyboardGamepad = false; // Track if user is using keyboard/gamepad vs mouse
        this.init();
    }

    init() {
        // Listen for gamepad navigation events
        window.addEventListener('gamepadNavigate', (e) => this.handleNavigation(e));
        window.addEventListener('gamepadAction', (e) => this.handleAction(e));
        window.addEventListener('gamepadStatusChange', (e) => this.updateConnectionIndicator(e));

        // Monitor for UI changes (when game grid is re-rendered)
        this.observeGameGrid();

        getDebugLogger().success('Gamepad', 'Gamepad UI integration initialized');
    }

    observeGameGrid() {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;

        // Use MutationObserver to detect when grid is re-rendered
        const observer = new MutationObserver(() => {
            this.refreshGameCards();
        });

        observer.observe(gameGrid, { childList: true });

        // Listen for mouse movement over game cards to sync selection index
        gameGrid.addEventListener('mouseover', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                // Update the selection index to match the hovered card
                const cards = Array.from(gameGrid.querySelectorAll('.game-card'));
                const cardIndex = cards.indexOf(gameCard);
                if (cardIndex >= 0) {
                    this.selectedIndex = cardIndex;
                    // Switch to mouse mode - hide keyboard/gamepad selection ring
                    this.usingKeyboardGamepad = false;
                    // Remove the visual selection ring from all cards
                    this.gameCards.forEach(card => card.classList.remove('gamepad-selected'));
                }
            }
        });
    }

    refreshGameCards() {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;

        this.gameCards = Array.from(gameGrid.querySelectorAll('.game-card'));

        // Only restore/update selection if a gamepad OR keyboard is active AND user is actively using them
        const hasGamepad = window.gamepadManager && window.gamepadManager.connected;
        const hasKeyboard = window.keyboardManager && window.keyboardManager.enabled;

        if (!hasGamepad && !hasKeyboard) {
            // Clear any existing selection when neither is active
            this.clearSelection();
            this.usingKeyboardGamepad = false;
            return;
        }

        // Only restore visual selection if user is actively using keyboard/gamepad
        if (this.usingKeyboardGamepad) {
            // Restore selection if index is valid
            if (this.selectedIndex >= 0 && this.selectedIndex < this.gameCards.length) {
                this.updateSelection();
            } else if (this.gameCards.length > 0) {
                // Default to first card if list changed
                this.selectedIndex = 0;
                this.updateSelection();
            }
        } else {
            // Just keep the index, but don't show the ring (user is using mouse)
            if (this.selectedIndex >= this.gameCards.length) {
                this.selectedIndex = Math.max(0, this.gameCards.length - 1);
            }
        }
    }

    handleNavigation(event) {
        const { direction } = event.detail;

        // Clear selection if disabled
        if (direction === 'clear') {
            this.clearSelection();
            return;
        }

        // Switch to keyboard/gamepad mode
        this.usingKeyboardGamepad = true;

        // If we're capturing input (controls editor), ignore ALL navigation
        if (this.isCapturingInput) {
            return;
        }

        // Handle filter menu navigation
        if (this.isFilterMenuOpen) {
            this.handleFilterMenuNavigation(direction);
            return;
        }

        // Ignore if modal is open (modal navigation handled separately)
        if (this.isModalOpen) {
            this.handleModalNavigation(direction);
            return;
        }

        // Get current grid
        this.refreshGameCards();
        if (this.gameCards.length === 0) return;

        // Initialize selection to first card if none selected
        if (this.selectedIndex < 0) {
            this.selectedIndex = 0;
            this.updateSelection();
            return;
        }

        // Get grid columns count
        const gridColumns = this.getGridColumns();

        // Calculate new index based on direction
        let newIndex = this.selectedIndex;

        switch (direction) {
            case 'up':
                newIndex = Math.max(0, this.selectedIndex - gridColumns);
                break;
            case 'down':
                newIndex = Math.min(this.gameCards.length - 1, this.selectedIndex + gridColumns);
                break;
            case 'left':
                newIndex = Math.max(0, this.selectedIndex - 1);
                break;
            case 'right':
                newIndex = Math.min(this.gameCards.length - 1, this.selectedIndex + 1);
                break;
        }

        // Update selection if changed
        if (newIndex !== this.selectedIndex) {
            this.selectedIndex = newIndex;
            this.updateSelection();
            this.scrollToSelected();
        }
    }

    handleModalNavigation(direction) {
        // Navigate within modal (buttons, checkboxes, etc.)
        const modal = document.getElementById('game-modal');
        if (!modal || modal.style.display === 'none') {
            this.isModalOpen = false;
            return;
        }

        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), input, select, textarea, a[href]'
        );

        if (focusableElements.length === 0) return;

        const currentFocus = document.activeElement;
        const currentIndex = Array.from(focusableElements).indexOf(currentFocus);

        let newIndex = currentIndex;

        switch (direction) {
            case 'up':
            case 'left':
                newIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                break;
            case 'down':
            case 'right':
                newIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                break;
        }

        focusableElements[newIndex]?.focus();
    }

    handleFilterMenuNavigation(direction) {
        // Navigate within quick filter menu
        const menu = document.getElementById('select-filter-menu');
        if (!menu || menu.style.display === 'none') {
            this.isFilterMenuOpen = false;
            return;
        }

        const options = Array.from(menu.querySelectorAll('.select-menu-option'));
        if (options.length === 0) return;

        // Update selected index based on direction
        switch (direction) {
            case 'up':
                this.filterMenuSelectedIndex = Math.max(0, this.filterMenuSelectedIndex - 1);
                break;
            case 'down':
                this.filterMenuSelectedIndex = Math.min(options.length - 1, this.filterMenuSelectedIndex + 1);
                break;
        }

        // Update visual highlight
        options.forEach((option, index) => {
            if (index === this.filterMenuSelectedIndex) {
                option.classList.add('gamepad-selected');
                option.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                option.classList.remove('gamepad-selected');
            }
        });

        getDebugLogger().debug('Gamepad', `Filter menu navigation: ${direction}, index: ${this.filterMenuSelectedIndex}`);
    }

    handleAction(event) {
        const { action } = event.detail;

        // Check if modal is open
        this.isModalOpen = document.getElementById('game-modal')?.style.display === 'flex';

        // DEBUG: Log action events
        if (action === 'back') {
            console.log('[DEBUG] GamepadIntegration.handleAction: Received back action - isCapturingInput:', this.isCapturingInput, 'isModalOpen:', this.isModalOpen);
        }

        // If we're capturing input (controls editor), ignore ALL actions
        if (this.isCapturingInput) {
            console.log('[DEBUG] GamepadIntegration.handleAction: Blocking', action, 'action - isCapturingInput is true');
            return;
        }

        switch (action) {
            case 'select':
                this.actionSelect();
                break;
            case 'back':
                this.actionBack();
                break;
            case 'favorite':
                this.actionFavorite();
                break;
            case 'details':
                this.actionDetails();
                break;
            case 'settings':
                this.actionSettings();
                break;
            case 'showFilterMenu':
                this.actionShowFilterMenu();
                break;
            case 'toggleView':
                this.actionToggleView();
                break;
            case 'home':
                this.actionHome();
                break;
            case 'nextFilter':
                this.actionNextFilter();
                break;
            case 'previousFilter':
                this.actionPreviousFilter();
                break;
            case 'pageUp':
                this.actionPageUp();
                break;
            case 'pageDown':
                this.actionPageDown();
                break;
        }
    }

    actionSelect() {
        // Handle filter menu selection
        if (this.isFilterMenuOpen) {
            const menu = document.getElementById('select-filter-menu');
            const options = menu?.querySelectorAll('.select-menu-option');
            if (options && options[this.filterMenuSelectedIndex]) {
                const selectedOption = options[this.filterMenuSelectedIndex];
                const filter = selectedOption.dataset.filter;
                const isToggle = selectedOption.dataset.toggle === 'true';
                this.selectFilter(filter, isToggle);

                if (!isToggle) {
                    // Close menu for status filters
                    this.closeFilterMenu();
                } else {
                    // Keep menu open for toggles, just update states
                    this.updateFilterMenuStates();
                }
                getDebugLogger().info('Gamepad', `Filter selected via gamepad: ${filter}`);
            }
            return;
        }

        if (this.isModalOpen) {
            // Activate focused button in modal
            const focused = document.activeElement;
            if (focused && (focused.tagName === 'BUTTON' || focused.tagName === 'INPUT')) {
                focused.click();
            }
            return;
        }

        // Launch/Install game
        const selectedCard = this.getSelectedCard();
        if (!selectedCard) return;

        const launchBtn = selectedCard.querySelector('[data-action="launch"]');
        const installBtn = selectedCard.querySelector('[data-action="install"]');

        if (launchBtn) {
            launchBtn.click();
        } else if (installBtn) {
            installBtn.click();
        }
    }

    actionBack() {
        console.log('[DEBUG] GamepadIntegration.actionBack: Called - isCapturingInput:', this.isCapturingInput, 'isModalOpen:', this.isModalOpen, 'isFilterMenuOpen:', this.isFilterMenuOpen);

        // Don't allow back action when capturing input (controls editor)
        if (this.isCapturingInput) {
            console.log('[DEBUG] GamepadIntegration.actionBack: Blocked - isCapturingInput is true');
            return;
        }

        // Close filter menu first
        if (this.isFilterMenuOpen) {
            this.closeFilterMenu();
            return;
        }

        if (this.isModalOpen) {
            // Close modal
            console.log('[DEBUG] GamepadIntegration.actionBack: Closing modal');
            window.uiManager?.closeModal();
            this.isModalOpen = false;
        }
    }

    actionFavorite() {
        if (this.isModalOpen) return;

        const selectedCard = this.getSelectedCard();
        if (!selectedCard) return;

        const gameId = selectedCard.dataset.gameId;
        if (gameId && window.uiManager) {
            window.uiManager.toggleFavorite(gameId);
        }
    }

    actionDetails() {
        if (this.isModalOpen) return;

        const selectedCard = this.getSelectedCard();
        if (!selectedCard) return;

        const gameId = selectedCard.dataset.gameId;
        if (gameId && window.uiManager) {
            const game = window.uiManager.gameManager.getGameById(gameId);
            if (game) {
                window.uiManager.showGameDetails(game);
                this.isModalOpen = true;
            }
        }
    }

    actionSettings() {
        if (this.isModalOpen) return;

        if (window.settingsManager) {
            window.settingsManager.showSettings();
        } else {
            window.uiManager?.showSettings();
        }
    }

    actionShowFilterMenu() {
        if (this.isModalOpen) return;

        const menu = document.getElementById('select-filter-menu');
        if (!menu) return;

        // Toggle menu visibility
        const isVisible = menu.style.display === 'block';

        if (isVisible) {
            this.closeFilterMenu();
        } else {
            // Open menu
            menu.style.display = 'block';
            this.isFilterMenuOpen = true;
            this.filterMenuSelectedIndex = 0;

            // Update active states for current filters
            this.updateFilterMenuStates();

            // Highlight first option
            const options = menu.querySelectorAll('.select-menu-option');
            options.forEach((option, index) => {
                if (index === 0) {
                    option.classList.add('gamepad-selected');
                } else {
                    option.classList.remove('gamepad-selected');
                }

                // Add click handlers
                option.onclick = () => {
                    const filter = option.dataset.filter;
                    const isToggle = option.dataset.toggle === 'true';
                    this.selectFilter(filter, isToggle);
                    if (!isToggle) {
                        this.closeFilterMenu();
                    } else {
                        // Update states after toggle
                        this.updateFilterMenuStates();
                    }
                };
            });

            getDebugLogger().info('Gamepad', 'Quick filter menu opened with gamepad support');

            // Close menu when clicking outside
            setTimeout(() => {
                const closeHandler = (e) => {
                    if (!menu.contains(e.target)) {
                        this.closeFilterMenu();
                        document.removeEventListener('click', closeHandler);
                    }
                };
                document.addEventListener('click', closeHandler);
            }, 100);
        }
    }

    updateFilterMenuStates() {
        // Get current filter states
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const checkedStatus = Array.from(statusRadios).find(r => r.checked)?.value || 'all';
        const favoritesCheckbox = document.getElementById('adv-favorites');
        const favoritesActive = favoritesCheckbox?.checked || false;

        // Update visual indicators
        const menu = document.getElementById('select-filter-menu');
        if (!menu) return;

        const options = menu.querySelectorAll('.select-menu-option');
        options.forEach(option => {
            const filter = option.dataset.filter;
            const isToggle = option.dataset.toggle === 'true';

            if (isToggle) {
                // Favorites - show active if checked
                if (filter === 'favorites') {
                    if (favoritesActive) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                }
            } else {
                // Status filters - show active if selected
                if (filter === checkedStatus) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            }
        });
    }

    closeFilterMenu() {
        const menu = document.getElementById('select-filter-menu');
        if (menu) {
            menu.style.display = 'none';
            this.isFilterMenuOpen = false;
            this.filterMenuSelectedIndex = 0;

            // Remove all gamepad selections
            const options = menu.querySelectorAll('.select-menu-option');
            options.forEach(option => {
                option.classList.remove('gamepad-selected');
                option.classList.remove('active');
            });

            getDebugLogger().info('Gamepad', 'Quick filter menu closed');
        }
    }

    selectFilter(filter, isToggle = false) {
        if (isToggle && filter === 'favorites') {
            // Handle favorites as a toggle
            const favoritesCheckbox = document.getElementById('adv-favorites');
            if (favoritesCheckbox) {
                favoritesCheckbox.click();
                getDebugLogger().info('Gamepad', `Favorites filter toggled: ${favoritesCheckbox.checked}`);
            }
        } else {
            // Handle status radio buttons (all, installed, not-installed)
            const statusRadios = document.querySelectorAll('input[name="status"]');
            const targetRadio = Array.from(statusRadios).find(r => r.value === filter);

            if (targetRadio) {
                targetRadio.click();
                getDebugLogger().info('Gamepad', `Filter changed to: ${filter}`);
            }
        }
    }

    actionToggleView() {
        if (this.isModalOpen) return;

        const gridBtn = document.getElementById('view-grid');
        const listBtn = document.getElementById('view-list');

        if (gridBtn?.classList.contains('active')) {
            listBtn?.click();
        } else {
            gridBtn?.click();
        }
    }

    actionHome() {
        if (this.isModalOpen) return;

        // Scroll to top and select first game
        this.selectedIndex = 0;
        this.updateSelection();
        this.scrollToSelected();
    }

    actionNextFilter() {
        if (this.isModalOpen) return;

        // Cycle through status filters: all -> installed -> not-installed
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const checked = Array.from(statusRadios).find(r => r.checked);

        if (checked) {
            const values = ['all', 'installed', 'not-installed'];
            const currentIndex = values.indexOf(checked.value);
            const nextIndex = (currentIndex + 1) % values.length;
            const nextRadio = Array.from(statusRadios).find(r => r.value === values[nextIndex]);
            if (nextRadio) {
                nextRadio.click();
            }
        }
    }

    actionPreviousFilter() {
        if (this.isModalOpen) return;

        // Cycle backwards through status filters
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const checked = Array.from(statusRadios).find(r => r.checked);

        if (checked) {
            const values = ['all', 'installed', 'not-installed'];
            const currentIndex = values.indexOf(checked.value);
            const prevIndex = (currentIndex - 1 + values.length) % values.length;
            const prevRadio = Array.from(statusRadios).find(r => r.value === values[prevIndex]);
            if (prevRadio) {
                prevRadio.click();
            }
        }
    }

    actionPageUp() {
        if (this.isModalOpen || this.isFilterMenuOpen) return;

        this.refreshGameCards();
        if (this.gameCards.length === 0) return;

        // Get grid columns to calculate page size (number of rows visible)
        const gridColumns = this.getGridColumns();
        const pageSize = gridColumns * 3; // Jump 3 rows at a time

        // Move selection up by page size
        const newIndex = Math.max(0, this.selectedIndex - pageSize);
        this.selectedIndex = newIndex;
        this.updateSelection();
        this.scrollToSelected();

        getDebugLogger().debug('Gamepad', `Page up - jumped to index ${newIndex}`);
    }

    actionPageDown() {
        if (this.isModalOpen || this.isFilterMenuOpen) return;

        this.refreshGameCards();
        if (this.gameCards.length === 0) return;

        // Get grid columns to calculate page size (number of rows visible)
        const gridColumns = this.getGridColumns();
        const pageSize = gridColumns * 3; // Jump 3 rows at a time

        // Move selection down by page size
        const newIndex = Math.min(this.gameCards.length - 1, this.selectedIndex + pageSize);
        this.selectedIndex = newIndex;
        this.updateSelection();
        this.scrollToSelected();

        getDebugLogger().debug('Gamepad', `Page down - jumped to index ${newIndex}`);
    }

    updateSelection() {
        // Remove previous selection highlight
        this.gameCards.forEach(card => card.classList.remove('gamepad-selected'));

        // Only show visual selection ring if using keyboard/gamepad
        if (this.usingKeyboardGamepad) {
            const selectedCard = this.getSelectedCard();
            if (selectedCard) {
                selectedCard.classList.add('gamepad-selected');
            }
        }
    }

    clearSelection() {
        this.selectedIndex = -1;
        this.gameCards.forEach(card => card.classList.remove('gamepad-selected'));
    }

    scrollToSelected() {
        const selectedCard = this.getSelectedCard();
        if (selectedCard) {
            selectedCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }

    getSelectedCard() {
        if (this.selectedIndex < 0 || this.selectedIndex >= this.gameCards.length) {
            return null;
        }
        return this.gameCards[this.selectedIndex];
    }

    getGridColumns() {
        // Get current grid columns from UI
        const slider = document.getElementById('columns-slider');
        if (slider) {
            return parseInt(slider.value) || 5;
        }

        // Fallback: calculate from grid
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid || this.gameCards.length === 0) return 5;

        const gridStyle = window.getComputedStyle(gameGrid);
        const columns = gridStyle.gridTemplateColumns.split(' ').length;
        return columns || 5;
    }

    updateConnectionIndicator(event) {
        const { connected, gamepadId } = event.detail;

        // Check if indicator exists, if not create it
        let indicator = document.getElementById('gamepad-indicator');

        if (!indicator) {
            // Create indicator in header
            const headerStats = document.querySelector('.header-stats');
            if (headerStats) {
                indicator = document.createElement('span');
                indicator.id = 'gamepad-indicator';
                indicator.className = 'gamepad-indicator';
                headerStats.insertBefore(indicator, headerStats.firstChild);
            }
        }

        if (indicator) {
            if (connected) {
                indicator.classList.add('connected');
                indicator.innerHTML = '🎮 <span class="gamepad-status">Connected</span>';
                indicator.title = `Gamepad connected: ${gamepadId}`;
            } else {
                indicator.classList.remove('connected');
                indicator.innerHTML = '🎮 <span class="gamepad-status">Disconnected</span>';
                indicator.title = 'No gamepad connected';
            }
        }
    }
}

// Initialize gamepad integration
const gamepadIntegration = new GamepadIntegration();
window.gamepadIntegration = gamepadIntegration;
