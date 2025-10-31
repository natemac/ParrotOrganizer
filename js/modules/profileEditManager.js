/**
 * ProfileEditManager - Unified editing framework for single and batch game profile editing
 *
 * This module provides a centralized system for editing custom game profiles.
 * Both single-game and batch editing use the same field definitions and logic.
 */

import debugLogger from './debugLogger.js';

export class ProfileEditManager {
    /**
     * Field definitions - single source of truth for all editable fields
     * Each field defines its type, how to collect data, and how to save it
     */
    static FIELD_DEFINITIONS = {
        customName: {
            type: 'text',
            label: 'Custom Name',
            placeholder: 'Override display name',
            inputId: 'custom-name',
            batchInputId: 'edit-name',
            hint: 'Override the display name',
            single: true,  // Only available in single edit
            batch: false,
            getValue: (inputId) => document.getElementById(inputId)?.value.trim() || null,
            saveValue: (value, profile) => { if (value) profile.customName = value; }
        },

        description: {
            type: 'textarea',
            label: 'Description',
            placeholder: 'Add description, gameplay notes, or any information...',
            inputId: 'custom-description',
            batchInputId: null,
            hint: 'Add notes about this game',
            single: true,
            batch: false,
            getValue: (inputId) => document.getElementById(inputId)?.value.trim() || null,
            saveValue: (value, profile) => { if (value) profile.description = value; }
        },

        youtubeLink: {
            type: 'url',
            label: 'YouTube Link',
            placeholder: 'https://www.youtube.com/watch?v=...',
            inputId: 'custom-youtube',
            batchInputId: null,
            hint: 'Link to gameplay video or tutorial',
            single: true,
            batch: false,
            getValue: (inputId) => document.getElementById(inputId)?.value.trim() || null,
            saveValue: (value, profile) => { if (value) profile.youtubeLink = value; }
        },

        tags: {
            type: 'text',
            label: 'Tags',
            placeholder: 'multiplayer, racing, arcade, etc.',
            inputId: 'custom-tags',
            batchInputId: 'edit-tags',
            hint: 'Comma-separated tags',
            single: true,
            batch: true,
            getValue: (inputId) => {
                const value = document.getElementById(inputId)?.value.trim();
                if (!value) return null;
                return value.split(',').map(t => t.trim()).filter(t => t);
            },
            saveValue: (value, profile) => { if (value && value.length > 0) profile.tags = value; }
        },

        genre: {
            type: 'text',
            label: 'Genre',
            placeholder: 'e.g., Racing, Fighting, Shooter, etc.',
            inputId: 'custom-genre',
            batchInputId: 'edit-genre',
            hint: 'Override game genre',
            single: true,
            batch: true,
            getValue: (inputId) => document.getElementById(inputId)?.value.trim() || null,
            saveValue: (value, profile) => { if (value) profile.genre = value; }
        },

        gunGame: {
            type: 'checkbox',
            label: 'Lightgun Game',
            inputId: 'custom-gun-game',
            batchInputId: null,  // Batch uses tri-state radio
            hint: 'Mark this as a lightgun game (overrides TeknoParrot profile)',
            single: true,
            batch: true,  // Batch has custom tri-state logic
            getValue: (inputId) => document.getElementById(inputId)?.checked || false,
            // Save to metadata instead of customProfile
            saveValue: (value, profile) => {
                // Saves as: lightgun: true or lightgun: false
                // This will override the GameProfile GunGame value
                profile.lightgun = value;
            },
            // Special batch handling
            getBatchValue: () => {
                const selected = document.querySelector('input[name="gun-game-option"]:checked')?.value;
                return selected;  // Returns 'keep', 'true', or 'false'
            },
            saveBatchValue: (value, profile) => {
                if (value === 'true') {
                    profile.lightgun = true;  // Override: IS a lightgun game
                } else if (value === 'false') {
                    profile.lightgun = false;  // Override: NOT a lightgun game
                }
                // 'keep' doesn't set lightgun, so it uses GameProfile default
            }
        },

        year: {
            type: 'number',
            label: 'Release Year',
            placeholder: 'e.g., 2010',
            inputId: 'custom-year',
            batchInputId: 'edit-year',
            hint: 'Override release year',
            min: 1990,
            max: 2030,
            single: true,
            batch: true,
            getValue: (inputId) => {
                const value = document.getElementById(inputId)?.value;
                return value ? parseInt(value) : null;
            },
            saveValue: (value, profile) => { if (value) profile.year = value; }
        },

        platform: {
            type: 'select',
            label: 'Platform',
            inputId: 'custom-platform',
            batchInputId: 'edit-platform',
            hint: 'Override arcade platform',
            options: [
                { value: '', label: '-- Keep Original --' },
                { value: 'Lindbergh', label: 'Lindbergh' },
                { value: 'RingEdge', label: 'RingEdge' },
                { value: 'RingEdge 2', label: 'RingEdge 2' },
                { value: 'RingWide', label: 'RingWide' },
                { value: 'Taito Type X', label: 'Taito Type X' },
                { value: 'Taito Type X2', label: 'Taito Type X2' },
                { value: 'Namco System 246', label: 'Namco System 246' },
                { value: 'Namco System 256', label: 'Namco System 256' },
                { value: 'Namco System 357', label: 'Namco System 357' }
            ],
            single: true,
            batch: true,
            getValue: (inputId) => document.getElementById(inputId)?.value || null,
            saveValue: (value, profile) => { if (value) profile.platform = value; }
        },

        emulator: {
            type: 'select',
            label: 'Emulator',
            inputId: 'custom-emulator',
            batchInputId: 'edit-emulator',
            hint: 'Override emulator type',
            options: [
                { value: '', label: '-- Keep Original --' },
                { value: 'TeknoParrot', label: 'TeknoParrot' },
                { value: 'OpenParrot', label: 'OpenParrot' },
                { value: 'Lindbergh', label: 'Lindbergh' }
            ],
            single: true,
            batch: true,
            getValue: (inputId) => document.getElementById(inputId)?.value || null,
            saveValue: (value, profile) => { if (value) profile.emulator = value; }
        },

        gpu: {
            type: 'checkbox-group',
            label: 'GPU Compatibility',
            inputIds: {
                nvidia: 'custom-gpu-nvidia',
                amd: 'custom-gpu-amd',
                intel: 'custom-gpu-intel'
            },
            batchInputIds: {
                nvidia: 'edit-gpu-nvidia',
                amd: 'edit-gpu-amd',
                intel: 'edit-gpu-intel'
            },
            hint: 'Set GPU compatibility',
            single: true,
            batch: true,
            getValue: (inputIds) => {
                const nvidia = document.getElementById(inputIds.nvidia)?.checked;
                const amd = document.getElementById(inputIds.amd)?.checked;
                const intel = document.getElementById(inputIds.intel)?.checked;

                if (!nvidia && !amd && !intel) return null;

                const gpuArray = [];
                if (nvidia) gpuArray.push('Nvidia');
                if (amd) gpuArray.push('AMD');
                if (intel) gpuArray.push('Intel');
                return gpuArray.join(', ');
            },
            saveValue: (value, profile) => { if (value) profile.gpu = value; }
        }
    };

    /**
     * Collect form data for single game edit
     * @param {string} gameId - The game being edited
     * @returns {Object} Profile data object
     */
    static collectSingleEditData(gameId) {
        debugLogger.debug('ProfileEditManager', 'Collecting single edit data', { gameId });

        const profile = {};

        for (const [fieldName, fieldDef] of Object.entries(this.FIELD_DEFINITIONS)) {
            if (!fieldDef.single) continue;

            let value;
            if (fieldName === 'gunGame' && fieldDef.getValue) {
                // Simple checkbox for single edit
                value = fieldDef.getValue(fieldDef.inputId);
            } else if (fieldName === 'gpu') {
                // GPU uses multiple checkboxes
                value = fieldDef.getValue(fieldDef.inputIds);
            } else {
                // Standard field
                value = fieldDef.getValue(fieldDef.inputId);
            }

            if (value !== null && value !== false) {
                fieldDef.saveValue(value, profile);
            }
        }

        debugLogger.info('ProfileEditManager', 'Single edit data collected', { gameId, fieldCount: Object.keys(profile).length });
        return profile;
    }

    /**
     * Collect form data for batch edit
     * @returns {Object} Profile data object
     */
    static collectBatchEditData() {
        debugLogger.debug('ProfileEditManager', 'Collecting batch edit data');

        const profile = {};

        for (const [fieldName, fieldDef] of Object.entries(this.FIELD_DEFINITIONS)) {
            if (!fieldDef.batch) continue;

            let value;
            if (fieldName === 'gunGame') {
                // Special tri-state handling for batch gun game
                value = fieldDef.getBatchValue();
                if (value && value !== 'keep') {
                    fieldDef.saveBatchValue(value, profile);
                }
            } else if (fieldName === 'gpu') {
                // GPU uses multiple checkboxes
                value = fieldDef.getValue(fieldDef.batchInputIds);
                if (value !== null) {
                    fieldDef.saveValue(value, profile);
                }
            } else {
                // Standard field
                const inputId = fieldDef.batchInputId || fieldDef.inputId;
                value = fieldDef.getValue(inputId);
                if (value !== null) {
                    fieldDef.saveValue(value, profile);
                }
            }
        }

        debugLogger.info('ProfileEditManager', 'Batch edit data collected', { fieldCount: Object.keys(profile).length });
        return profile;
    }

    /**
     * Generate HTML for a form field (single edit)
     * @param {string} fieldName - The field name from FIELD_DEFINITIONS
     * @param {Object} currentProfile - Current profile data for pre-filling
     * @returns {string} HTML string
     */
    static renderSingleField(fieldName, currentProfile = {}) {
        const fieldDef = this.FIELD_DEFINITIONS[fieldName];
        if (!fieldDef || !fieldDef.single) return '';

        let html = '<div class="form-group">';

        switch (fieldDef.type) {
            case 'text':
            case 'url':
            case 'number':
                html += `<label for="${fieldDef.inputId}">${fieldDef.label}</label>`;
                html += `<input type="${fieldDef.type}" id="${fieldDef.inputId}" class="form-input"`;
                html += ` value="${escapeHtml(currentProfile[fieldName] || '')}"`;
                html += ` placeholder="${fieldDef.placeholder || ''}"`;
                if (fieldDef.min) html += ` min="${fieldDef.min}"`;
                if (fieldDef.max) html += ` max="${fieldDef.max}"`;
                html += '>';
                break;

            case 'textarea':
                html += `<label for="${fieldDef.inputId}">${fieldDef.label}</label>`;
                html += `<textarea id="${fieldDef.inputId}" class="form-textarea" rows="4"`;
                html += ` placeholder="${fieldDef.placeholder || ''}">${escapeHtml(currentProfile[fieldName] || '')}</textarea>`;
                break;

            case 'checkbox':
                html += '<label>';
                html += `<input type="checkbox" id="${fieldDef.inputId}"`;
                if (currentProfile[fieldName]) html += ' checked';
                html += `> ${fieldDef.label}`;
                html += '</label>';
                break;

            case 'select':
                html += `<label for="${fieldDef.inputId}">${fieldDef.label}</label>`;
                html += `<select id="${fieldDef.inputId}" class="form-input">`;
                fieldDef.options.forEach(opt => {
                    const selected = currentProfile[fieldName] === opt.value ? 'selected' : '';
                    html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                });
                html += '</select>';
                break;

            case 'checkbox-group':
                html += `<label>${fieldDef.label}</label>`;
                html += '<div class="checkbox-group" style="display: flex; flex-direction: column; gap: 0.5rem;">';
                const gpuStr = currentProfile.gpu || '';
                html += `<label><input type="checkbox" id="${fieldDef.inputIds.nvidia}" ${gpuStr.includes('Nvidia') ? 'checked' : ''}> NVIDIA</label>`;
                html += `<label><input type="checkbox" id="${fieldDef.inputIds.amd}" ${gpuStr.includes('AMD') ? 'checked' : ''}> AMD</label>`;
                html += `<label><input type="checkbox" id="${fieldDef.inputIds.intel}" ${gpuStr.includes('Intel') ? 'checked' : ''}> Intel</label>`;
                html += '</div>';
                break;
        }

        // Removed hint rendering per user request

        html += '</div>';
        return html;
    }

    /**
     * Reset batch edit form to defaults
     */
    static resetBatchForm() {
        debugLogger.debug('ProfileEditManager', 'Resetting batch form');

        // Reset gun game tri-state to "keep"
        const keepRadio = document.querySelector('input[name="gun-game-option"][value="keep"]');
        if (keepRadio) keepRadio.checked = true;

        // Reset all batch fields
        for (const [fieldName, fieldDef] of Object.entries(this.FIELD_DEFINITIONS)) {
            if (!fieldDef.batch) continue;

            if (fieldName === 'gunGame') continue;  // Already handled above

            if (fieldName === 'gpu') {
                // Reset GPU checkboxes
                const nvidiaEl = document.getElementById(fieldDef.batchInputIds.nvidia);
                const amdEl = document.getElementById(fieldDef.batchInputIds.amd);
                const intelEl = document.getElementById(fieldDef.batchInputIds.intel);
                if (nvidiaEl) nvidiaEl.checked = false;
                if (amdEl) amdEl.checked = false;
                if (intelEl) intelEl.checked = false;
            } else {
                const inputId = fieldDef.batchInputId || fieldDef.inputId;
                const el = document.getElementById(inputId);
                if (el) {
                    if (fieldDef.type === 'select') {
                        el.selectedIndex = 0;
                    } else {
                        el.value = '';
                    }
                }
            }
        }

        debugLogger.info('ProfileEditManager', 'Batch form reset complete');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
