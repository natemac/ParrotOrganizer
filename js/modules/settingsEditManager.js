/**
 * Settings Edit Manager
 * Handles editing of game settings (ConfigValues and GamePath)
 */

export class SettingsEditManager {
    constructor() {
        this.currentGameId = null;
        this.currentXmlDoc = null;
        this.defaultXmlDoc = null;
        this.hasUnsavedChanges = false;
        this.originalXmlString = null;
    }

    /**
     * Parse XML string to Document
     */
    parseXml(xmlString) {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'text/xml');
    }

    /**
     * Serialize XML Document to string
     */
    serializeXml(xmlDoc) {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
    }

    /**
     * Get text content of XML element
     */
    getElementText(xmlDoc, tagName) {
        const element = xmlDoc.getElementsByTagName(tagName)[0];
        return element ? element.textContent : '';
    }

    /**
     * Set text content of XML element
     */
    setElementText(xmlDoc, tagName, value) {
        const element = xmlDoc.getElementsByTagName(tagName)[0];
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Get ConfigValues from XML document
     */
    getConfigValues(xmlDoc) {
        const configValues = [];
        const fieldInfoElements = xmlDoc.getElementsByTagName('FieldInformation');

        for (let i = 0; i < fieldInfoElements.length; i++) {
            const field = fieldInfoElements[i];
            const categoryName = field.getElementsByTagName('CategoryName')[0]?.textContent || 'General';
            const fieldName = field.getElementsByTagName('FieldName')[0]?.textContent || '';
            const fieldValue = field.getElementsByTagName('FieldValue')[0]?.textContent || '';
            const fieldType = field.getElementsByTagName('FieldType')[0]?.textContent || 'Text';
            const fieldMin = field.getElementsByTagName('FieldMin')[0]?.textContent || '0';
            const fieldMax = field.getElementsByTagName('FieldMax')[0]?.textContent || '0';
            const fieldStep = field.getElementsByTagName('FieldStep')[0]?.textContent || '0';

            // Get field options for dropdowns
            const options = [];
            const fieldOptionsElement = field.getElementsByTagName('FieldOptions')[0];
            if (fieldOptionsElement) {
                const stringElements = fieldOptionsElement.getElementsByTagName('string');
                for (let j = 0; j < stringElements.length; j++) {
                    options.push(stringElements[j].textContent);
                }
            }

            configValues.push({
                index: i,
                category: categoryName,
                name: fieldName,
                value: fieldValue,
                type: fieldType,
                min: parseFloat(fieldMin),
                max: parseFloat(fieldMax),
                step: parseFloat(fieldStep),
                options: options
            });
        }

        return configValues;
    }

    /**
     * Update ConfigValue in XML document
     */
    updateConfigValue(xmlDoc, index, newValue) {
        const fieldInfoElements = xmlDoc.getElementsByTagName('FieldInformation');
        if (index >= 0 && index < fieldInfoElements.length) {
            const field = fieldInfoElements[index];
            const fieldValueElement = field.getElementsByTagName('FieldValue')[0];
            if (fieldValueElement) {
                fieldValueElement.textContent = newValue;
            }
        }
    }

    /**
     * Render form field HTML based on field type
     */
    renderField(field) {
        const fieldId = `field-${field.index}`;
        let inputHtml = '';

        switch (field.type) {
            case 'Bool':
                inputHtml = `
                    <label class="toggle-switch">
                        <input type="checkbox" id="${fieldId}" data-index="${field.index}" ${field.value === '1' ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                `;
                break;

            case 'Dropdown':
                inputHtml = `
                    <select id="${fieldId}" data-index="${field.index}" class="setting-dropdown">
                        ${field.options.map(opt => `
                            <option value="${this.escapeHtml(opt)}" ${field.value === opt ? 'selected' : ''}>
                                ${this.escapeHtml(opt)}
                            </option>
                        `).join('')}
                    </select>
                `;
                break;

            case 'Slider':
                inputHtml = `
                    <div class="slider-container">
                        <input type="range" id="${fieldId}" data-index="${field.index}"
                               min="${field.min}" max="${field.max}" step="${field.step || 1}"
                               value="${field.value}" class="setting-slider">
                        <span class="slider-value" id="${fieldId}-value">${field.value}</span>
                    </div>
                    <div class="slider-labels">
                        <span>${field.min}</span>
                        <span>${field.max}</span>
                    </div>
                `;
                break;

            case 'Text':
            default:
                inputHtml = `
                    <input type="text" id="${fieldId}" data-index="${field.index}"
                           value="${this.escapeHtml(field.value)}" class="setting-text">
                `;
                break;
        }

        return `
            <div class="setting-field">
                <label class="setting-label">${this.escapeHtml(field.name)}</label>
                <div class="setting-input">
                    ${inputHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render all settings grouped by category
     */
    renderSettingsForm(xmlDoc) {
        const configValues = this.getConfigValues(xmlDoc);
        const gamePath = this.getElementText(xmlDoc, 'GamePath');
        const executableName = this.getElementText(xmlDoc, 'ExecutableName');
        const formattedExecutableName = executableName.replace(/;/g, ' OR ');

        // Group by category (exclude Input API which is in Controls section)
        const categories = {};
        configValues.forEach(field => {
            // Skip Input API - it's shown in Controls section
            if (field.name === 'Input API') return;

            if (!categories[field.category]) {
                categories[field.category] = [];
            }
            categories[field.category].push(field);
        });

        let html = '';

        // Game Path section (always first)
        html += `
            <div class="setting-section">
                <h3 class="setting-section-title">
                    Game Path
                    <span style="float: right; color: var(--secondary-color); font-weight: bold; font-size: 0.95rem;">
                        Game Executable: ${this.escapeHtml(formattedExecutableName)}
                    </span>
                </h3>
                <div class="setting-field gamepath-field">
                    <input type="text" id="gamepath-input" value="${this.escapeHtml(gamePath)}"
                           class="setting-text" placeholder="Paste game path (right-click executable → Copy as path)">
                </div>
            </div>
        `;

        // Config value sections grouped by category
        Object.keys(categories).sort().forEach(category => {
            html += `
                <div class="setting-section">
                    <h3 class="setting-section-title">${this.escapeHtml(category)}</h3>
                    ${categories[category].map(field => this.renderField(field)).join('')}
                </div>
            `;
        });

        return html;
    }

    /**
     * Show settings edit modal
     */
    async showSettingsEditModal(gameId, game) {
        this.currentGameId = gameId;
        this.hasUnsavedChanges = false;

        try {
            // Load current UserProfile XML
            const userXmlResp = await fetch(`/../UserProfiles/${gameId}.xml`);
            if (!userXmlResp.ok) {
                throw new Error('Failed to load user profile');
            }
            const userXmlText = await userXmlResp.text();
            this.currentXmlDoc = this.parseXml(userXmlText);
            this.originalXmlString = userXmlText; // Store original for comparison

            // Load default GameProfile XML
            const defaultXmlResp = await fetch(`/__getGameProfile?id=${encodeURIComponent(gameId)}`);
            if (!defaultXmlResp.ok) {
                throw new Error('Failed to load game profile defaults');
            }
            const defaultResult = await defaultXmlResp.json();
            this.defaultXmlDoc = this.parseXml(defaultResult.xml);

            // Build modal HTML
            const modal = document.getElementById('game-modal');
            const modalBody = document.getElementById('modal-body');

            // Hide the X button when in edit mode
            const closeButton = document.getElementById('modal-close');
            if (closeButton) closeButton.style.display = 'none';

            const formHtml = this.renderSettingsForm(this.currentXmlDoc);

            modalBody.innerHTML = `
                <div class="settings-edit-modal">
                    <div class="settings-edit-header">
                        <h2>⚙️ Edit Game Settings</h2>
                        <p class="settings-edit-subtitle">
                            Configure settings for "${this.escapeHtml(game.name)}"
                        </p>
                    </div>

                    <form id="settings-edit-form">
                        <div class="settings-edit-body">
                            ${formHtml}
                        </div>

                        <div class="settings-edit-footer">
                            <button type="button" class="btn btn-warning" onclick="window.settingsEditManager.restoreDefaults()">
                                🔄 Restore to Defaults
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="window.settingsEditManager.cancelEdit()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-success">
                                💾 Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            `;

            // Add slider event listeners
            this.addSliderListeners();

            // Add paste handler for game path (strips quotes)
            this.addGamePathPasteHandler();

            // Add change tracking listeners
            this.addChangeTrackingListeners();

            // Add form submit handler
            document.getElementById('settings-edit-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });

            // Disable gamepad and keyboard managers when modal is open
            if (window.gamepadManager) {
                window.gamepadManager.pollingActive = false;
            }
            if (window.keyboardManager) {
                window.keyboardManager.enabled = false;
            }
            if (window.gamepadIntegration) {
                window.gamepadIntegration.isModalOpen = true;
            }

            modal.style.display = 'flex';

        } catch (error) {
            alert(`Failed to open settings editor: ${error.message}`);
        }
    }

    /**
     * Add event listeners for sliders to update value display
     */
    addSliderListeners() {
        const sliders = document.querySelectorAll('.setting-slider');
        sliders.forEach(slider => {
            const valueDisplay = document.getElementById(`${slider.id}-value`);
            slider.addEventListener('input', (e) => {
                if (valueDisplay) {
                    valueDisplay.textContent = e.target.value;
                }
            });
        });
    }

    /**
     * Add paste handler to automatically strip quotes from Windows "Copy as path"
     */
    addGamePathPasteHandler() {
        const gamepathInput = document.getElementById('gamepath-input');

        if (gamepathInput) {
            gamepathInput.addEventListener('paste', (e) => {
                // Prevent default paste behavior
                e.preventDefault();

                // Get pasted text
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');

                // Strip leading/trailing quotes and whitespace
                // Handles both double quotes (") and single quotes (')
                let cleanedPath = pastedText.trim();
                if ((cleanedPath.startsWith('"') && cleanedPath.endsWith('"')) ||
                    (cleanedPath.startsWith("'") && cleanedPath.endsWith("'"))) {
                    cleanedPath = cleanedPath.slice(1, -1);
                }

                // Set the cleaned value
                gamepathInput.value = cleanedPath;

                // Mark as changed
                this.hasUnsavedChanges = true;
            });
        }
    }

    /**
     * Restore settings to defaults
     */
    async restoreDefaults() {
        if (!confirm('Are you sure you want to restore all settings to their default values? This cannot be undone.')) {
            return;
        }

        try {
            // Copy default ConfigValues and GamePath to current XML
            const defaultConfigValues = this.getConfigValues(this.defaultXmlDoc);
            const defaultGamePath = this.getElementText(this.defaultXmlDoc, 'GamePath');

            // Update GamePath in current XML
            this.setElementText(this.currentXmlDoc, 'GamePath', defaultGamePath);

            // Update all ConfigValues
            defaultConfigValues.forEach((field, index) => {
                this.updateConfigValue(this.currentXmlDoc, index, field.value);
            });

            // Re-render form
            const formHtml = this.renderSettingsForm(this.currentXmlDoc);
            document.querySelector('.settings-edit-body').innerHTML = formHtml;
            this.addSliderListeners();

        } catch (error) {
            alert(`Failed to restore defaults: ${error.message}`);
        }
    }

    /**
     * Save settings to UserProfile XML
     */
    async saveSettings() {
        try {
            // Update GamePath
            const gamePath = document.getElementById('gamepath-input').value;
            this.setElementText(this.currentXmlDoc, 'GamePath', gamePath);

            // Update all config values
            const allInputs = document.querySelectorAll('[data-index]');
            allInputs.forEach(input => {
                const index = parseInt(input.dataset.index);
                let value;

                if (input.type === 'checkbox') {
                    value = input.checked ? '1' : '0';
                } else if (input.tagName === 'SELECT' || input.type === 'range' || input.type === 'text') {
                    value = input.value;
                }

                this.updateConfigValue(this.currentXmlDoc, index, value);
            });

            // Serialize XML
            const xmlContent = this.serializeXml(this.currentXmlDoc);

            // Send to server
            const resp = await fetch(`/__updateGameSettings?id=${encodeURIComponent(this.currentGameId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmlContent })
            });

            const result = await resp.json();
            if (!result.ok) {
                throw new Error(result.error || 'Failed to save settings');
            }

            // Mark as saved
            this.hasUnsavedChanges = false;

            // Store game ID before closing
            const savedGameId = this.currentGameId;

            // Close modal immediately so user can see loading screen
            this.closeModal();

            // Refresh the game data
            const app = document.querySelector('#app').__parrotApp;
            if (app && app.refresh) {
                await app.refresh();

                // Reopen game details after refresh
                setTimeout(() => {
                    const game = app.gameManager.getGameById(savedGameId);
                    if (game && window.uiManager) {
                        window.uiManager.showGameDetails(game);
                    }
                }, 100);
            }

        } catch (error) {
            alert(`Failed to save settings: ${error.message}`);
        }
    }

    /**
     * Add change tracking listeners to all form inputs
     */
    addChangeTrackingListeners() {
        const form = document.getElementById('settings-edit-form');
        if (!form) return;

        // Track changes on all inputs
        form.addEventListener('input', () => {
            this.hasUnsavedChanges = true;
        });

        form.addEventListener('change', () => {
            this.hasUnsavedChanges = true;
        });
    }

    /**
     * Cancel editing and close modal
     */
    cancelEdit() {
        this.closeModal();
    }

    /**
     * Close modal
     */
    closeModal() {
        // Re-enable gamepad and keyboard managers
        if (window.gamepadManager) {
            window.gamepadManager.pollingActive = true;
        }
        if (window.keyboardManager) {
            window.keyboardManager.enabled = true;
        }
        if (window.gamepadIntegration) {
            window.gamepadIntegration.isModalOpen = false;
        }

        document.getElementById('game-modal').style.display = 'none';
        this.currentGameId = null;
        this.currentXmlDoc = null;
        this.defaultXmlDoc = null;
        this.hasUnsavedChanges = false;
        this.originalXmlString = null;
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

// Make globally accessible
window.settingsEditManager = null;
