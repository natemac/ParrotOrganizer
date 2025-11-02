/**
 * Controls Edit Manager
 * Handles editing of game controls (JoystickButtons)
 */

export class ControlsEditManager {
    constructor() {
        this.currentGameId = null;
        this.currentXmlDoc = null;
        this.hasUnsavedChanges = false;
        this.listeningButtonIndex = null;
        this.gamepadPollInterval = null;
        this.keyboardListener = null;
    }

    /**
     * Standard Gamepad API button names
     */
    GAMEPAD_BUTTON_NAMES = {
        0: 'A',
        1: 'B',
        2: 'X',
        3: 'Y',
        4: 'LeftShoulder',
        5: 'RightShoulder',
        6: 'LeftTrigger',
        7: 'RightTrigger',
        8: 'Back',
        9: 'Start',
        10: 'L3',
        11: 'R3',
        12: 'DPadUp',
        13: 'DPadDown',
        14: 'DPadLeft',
        15: 'DPadRight'
    };

    /**
     * XInput button codes
     */
    XINPUT_BUTTON_CODES = {
        1: 'DPadUp',
        2: 'DPadDown',
        4: 'DPadLeft',
        8: 'DPadRight',
        16: 'Start',
        32: 'Back',
        64: 'LeftThumb',
        128: 'RightThumb',
        256: 'LeftShoulder',
        512: 'RightShoulder',
        4096: 'A',
        8192: 'B',
        16384: 'X',
        32768: 'Y'
    };

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
     * Get JoystickButtons from XML document
     */
    getJoystickButtons(xmlDoc) {
        const buttons = [];
        const joystickButtonsContainer = xmlDoc.getElementsByTagName('JoystickButtons')[0];

        if (!joystickButtonsContainer) return buttons;

        const buttonElements = joystickButtonsContainer.getElementsByTagName('JoystickButtons');

        for (let i = 0; i < buttonElements.length; i++) {
            const btn = buttonElements[i];
            const buttonName = btn.getElementsByTagName('ButtonName')[0]?.textContent || '';
            const inputMapping = btn.getElementsByTagName('InputMapping')[0]?.textContent || '';
            const bindName = btn.getElementsByTagName('BindName')[0]?.textContent || '';
            const bindNameXi = btn.getElementsByTagName('BindNameXi')[0]?.textContent || '';

            buttons.push({
                index: i,
                buttonName,
                inputMapping,
                bindName,
                bindNameXi,
                element: btn
            });
        }

        return buttons;
    }

    /**
     * Update button binding in XML
     */
    updateButtonBinding(xmlDoc, buttonIndex, bindingData) {
        const joystickButtonsContainer = xmlDoc.getElementsByTagName('JoystickButtons')[0];
        if (!joystickButtonsContainer) return;

        const buttonElements = joystickButtonsContainer.getElementsByTagName('JoystickButtons');
        if (buttonIndex >= buttonElements.length) return;

        const buttonElement = buttonElements[buttonIndex];

        // Update or create BindName
        let bindNameElement = buttonElement.getElementsByTagName('BindName')[0];
        if (bindNameElement) {
            bindNameElement.textContent = bindingData.bindName;
        } else {
            // Create BindName element if it doesn't exist
            bindNameElement = xmlDoc.createElement('BindName');
            bindNameElement.textContent = bindingData.bindName;
            buttonElement.appendChild(bindNameElement);
        }

        // Update or create BindNameXi
        let bindNameXiElement = buttonElement.getElementsByTagName('BindNameXi')[0];
        if (bindNameXiElement) {
            bindNameXiElement.textContent = bindingData.bindName; // Use same for now
        } else {
            // Create BindNameXi element if it doesn't exist
            bindNameXiElement = xmlDoc.createElement('BindNameXi');
            bindNameXiElement.textContent = bindingData.bindName;
            buttonElement.appendChild(bindNameXiElement);
        }

        // Handle XInputButton - create or update
        if (bindingData.xInputButton) {
            let xInputButtonElement = buttonElement.getElementsByTagName('XInputButton')[0];

            if (!xInputButtonElement) {
                // Create complete XInputButton structure
                xInputButtonElement = this.createXInputButtonElement(xmlDoc, bindingData.xInputButton);
                // Insert XInputButton before InputMapping (to maintain proper order)
                const inputMapping = buttonElement.getElementsByTagName('InputMapping')[0];
                if (inputMapping) {
                    buttonElement.insertBefore(xInputButtonElement, inputMapping);
                } else {
                    // If no InputMapping, insert after ButtonName
                    const buttonName = buttonElement.getElementsByTagName('ButtonName')[0];
                    if (buttonName && buttonName.nextSibling) {
                        buttonElement.insertBefore(xInputButtonElement, buttonName.nextSibling);
                    } else {
                        buttonElement.appendChild(xInputButtonElement);
                    }
                }
            } else {
                // Update existing XInputButton
                this.updateXInputButtonElement(xInputButtonElement, bindingData.xInputButton);
            }
        }

        // Ensure AnalogType exists (should be "None" for standard buttons)
        // BUT: Don't overwrite existing AnalogType values (they may be special like "AnalogJoystick", "SWThrottle", etc.)
        let analogTypeElement = buttonElement.getElementsByTagName('AnalogType')[0];
        if (!analogTypeElement) {
            analogTypeElement = xmlDoc.createElement('AnalogType');
            analogTypeElement.textContent = 'None';
            // Insert after InputMapping
            const inputMapping = buttonElement.getElementsByTagName('InputMapping')[0];
            if (inputMapping && inputMapping.nextSibling) {
                buttonElement.insertBefore(analogTypeElement, inputMapping.nextSibling);
            } else {
                buttonElement.appendChild(analogTypeElement);
            }
        }
    }

    /**
     * Create a complete XInputButton element
     */
    createXInputButtonElement(xmlDoc, xInputData) {
        const xInputButton = xmlDoc.createElement('XInputButton');

        // Determine if this is a trigger, analog axis, or regular button
        const isTrigger = xInputData.isLeftTrigger || xInputData.isRightTrigger;
        const isAnalogAxis = xInputData.isLeftThumbX || xInputData.isLeftThumbY ||
                             xInputData.isRightThumbX || xInputData.isRightThumbY;

        // Create all required child elements
        const elements = {
            'IsLeftThumbX': xInputData.isLeftThumbX ? 'true' : 'false',
            'IsRightThumbX': xInputData.isRightThumbX ? 'true' : 'false',
            'IsLeftThumbY': xInputData.isLeftThumbY ? 'true' : 'false',
            'IsRightThumbY': xInputData.isRightThumbY ? 'true' : 'false',
            'IsAxisMinus': xInputData.isAxisMinus ? 'true' : 'false',
            'IsLeftTrigger': xInputData.isLeftTrigger ? 'true' : 'false',
            'IsRightTrigger': xInputData.isRightTrigger ? 'true' : 'false',
            'ButtonCode': xInputData.buttonCode.toString(),
            'IsButton': (isTrigger || isAnalogAxis) ? 'false' : 'true',
            'ButtonIndex': '0',
            'XInputIndex': '0'
        };

        for (const [name, value] of Object.entries(elements)) {
            const elem = xmlDoc.createElement(name);
            elem.textContent = value;
            xInputButton.appendChild(elem);
        }

        return xInputButton;
    }

    /**
     * Update an existing XInputButton element
     */
    updateXInputButtonElement(xInputButtonElement, xInputData) {
        const xmlDoc = xInputButtonElement.ownerDocument;
        const isTrigger = xInputData.isLeftTrigger || xInputData.isRightTrigger;
        const isAnalogAxis = xInputData.isLeftThumbX || xInputData.isLeftThumbY ||
                             xInputData.isRightThumbX || xInputData.isRightThumbY;

        // Helper to set or create element
        const setElement = (parent, tagName, value) => {
            let elem = parent.getElementsByTagName(tagName)[0];
            if (elem) {
                elem.textContent = value;
            } else {
                elem = xmlDoc.createElement(tagName);
                elem.textContent = value;
                parent.appendChild(elem);
            }
        };

        // Update all fields
        setElement(xInputButtonElement, 'IsLeftThumbX', xInputData.isLeftThumbX ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsRightThumbX', xInputData.isRightThumbX ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsLeftThumbY', xInputData.isLeftThumbY ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsRightThumbY', xInputData.isRightThumbY ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsAxisMinus', xInputData.isAxisMinus ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsLeftTrigger', xInputData.isLeftTrigger ? 'true' : 'false');
        setElement(xInputButtonElement, 'IsRightTrigger', xInputData.isRightTrigger ? 'true' : 'false');
        setElement(xInputButtonElement, 'ButtonCode', xInputData.buttonCode.toString());
        setElement(xInputButtonElement, 'IsButton', (isTrigger || isAnalogAxis) ? 'false' : 'true');
        setElement(xInputButtonElement, 'ButtonIndex', '0');
        setElement(xInputButtonElement, 'XInputIndex', '0');
    }

    /**
     * Format bind name for display (remove "Input Device X" prefix)
     */
    formatBindName(bindName) {
        if (!bindName) return 'Not configured';
        // Remove "Input Device X " prefix
        return bindName.replace(/^Input Device \d+ /, '');
    }

    /**
     * Show controls edit modal
     */
    async showControlsEditModal(gameId, game) {
        this.currentGameId = gameId;
        this.hasUnsavedChanges = false;

        try {
            // Fetch current UserProfile XML
            const resp = await fetch(`/__getGameProfile?id=${encodeURIComponent(gameId)}`);
            if (!resp.ok) {
                throw new Error(`Failed to fetch game profile: ${resp.statusText}`);
            }

            const result = await resp.json();
            this.currentXmlDoc = this.parseXml(result.xml);

            // Build modal HTML
            const modal = document.getElementById('game-modal');
            const modalBody = document.getElementById('modal-body');

            // Hide the X button when in edit mode
            const closeButton = document.getElementById('modal-close');
            if (closeButton) closeButton.style.display = 'none';

            // Disable gamepad and keyboard managers to prevent interference
            console.log('[DEBUG] ControlsEditManager: window.gamepadManager exists?', !!window.gamepadManager);
            console.log('[DEBUG] ControlsEditManager: window.gamepadIntegration exists?', !!window.gamepadIntegration);

            if (window.gamepadManager) {
                console.log('[DEBUG] ControlsEditManager: Setting gamepadManager.pollingActive = false');
                window.gamepadManager.pollingActive = false;
                console.log('[DEBUG] ControlsEditManager: Verified gamepadManager.pollingActive =', window.gamepadManager.pollingActive);
            } else {
                console.log('[DEBUG] ControlsEditManager: window.gamepadManager is null/undefined!');
            }

            if (window.keyboardManager) {
                console.log('[DEBUG] ControlsEditManager: Setting keyboardManager.enabled = false');
                window.keyboardManager.enabled = false;
            }

            if (window.gamepadIntegration) {
                console.log('[DEBUG] ControlsEditManager: Setting gamepadIntegration.isCapturingInput = true');
                window.gamepadIntegration.isModalOpen = true;
                window.gamepadIntegration.isCapturingInput = true;
                console.log('[DEBUG] ControlsEditManager: Verified gamepadIntegration.isCapturingInput =', window.gamepadIntegration.isCapturingInput);
            } else {
                console.log('[DEBUG] ControlsEditManager: window.gamepadIntegration is null/undefined!');
            }

            const formHtml = this.renderControlsForm();

            modalBody.innerHTML = `
                <div class="controls-edit-modal">
                    <div class="controls-edit-header">
                        <h2>⚙️ Edit Controls</h2>
                        <p class="controls-edit-subtitle">Configure controls for "${this.escapeHtml(game.name)}"</p>
                    </div>
                    <div class="controls-edit-body">
                        <form id="controls-edit-form">
                            ${formHtml}
                        </form>
                    </div>
                    <div class="controls-edit-footer">
                        <button type="button" class="btn btn-secondary" onclick="window.controlsEditManager.cancelEdit()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="window.controlsEditManager.saveControls()">
                            💾 Save Controls
                        </button>
                    </div>
                </div>
            `;

            // Add change tracking listeners
            this.addChangeTrackingListeners();

            modal.style.display = 'flex';

        } catch (error) {
            alert(`Failed to open controls editor: ${error.message}`);
        }
    }

    /**
     * Render controls form
     */
    renderControlsForm() {
        const buttons = this.getJoystickButtons(this.currentXmlDoc);

        // Get Input API config
        const configValues = this.currentXmlDoc.getElementsByTagName('ConfigValues')[0];
        let inputApiConfig = null;
        if (configValues) {
            const fieldInfos = configValues.getElementsByTagName('FieldInformation');
            for (let i = 0; i < fieldInfos.length; i++) {
                const fieldName = fieldInfos[i].getElementsByTagName('FieldName')[0]?.textContent;
                if (fieldName === 'Input API') {
                    inputApiConfig = {
                        value: fieldInfos[i].getElementsByTagName('FieldValue')[0]?.textContent || 'XInput',
                        options: Array.from(fieldInfos[i].getElementsByTagName('FieldOptions')[0]?.getElementsByTagName('string') || [])
                            .map(opt => opt.textContent)
                    };
                    break;
                }
            }
        }

        // Group buttons by category
        const groups = {
            system: [],
            player1: [],
            player2: []
        };

        buttons.forEach(btn => {
            const nameLower = btn.buttonName.toLowerCase();
            if (nameLower.includes('test') || nameLower.includes('service') || nameLower.includes('coin')) {
                groups.system.push(btn);
            } else if (nameLower.includes('player 2') || nameLower.includes('p2')) {
                groups.player2.push(btn);
            } else {
                // Default all other buttons to player1 (including explicit "player 1" buttons and general controls)
                groups.player1.push(btn);
            }
        });

        let html = '';

        // Input API dropdown (if available)
        if (inputApiConfig) {
            html += `
                <div class="controls-section">
                    <h3 class="controls-section-title">Input Configuration</h3>
                    <div class="control-item">
                        <label class="control-label">Input API</label>
                        <div class="control-binding">
                            <select id="input-api-select" class="input-api-select">
                                ${inputApiConfig.options.map(opt =>
                                    `<option value="${this.escapeHtml(opt)}" ${opt === inputApiConfig.value ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }

        // System Controls
        if (groups.system.length > 0) {
            html += `
                <div class="controls-section">
                    <h3 class="controls-section-title">System Controls</h3>
                    ${groups.system.map(btn => this.renderControlButton(btn)).join('')}
                </div>
            `;
        }

        // Player Controls (side by side)
        if (groups.player1.length > 0 || groups.player2.length > 0) {
            html += '<div class="controls-players-grid">';

            if (groups.player1.length > 0) {
                html += `
                    <div class="controls-section">
                        <h3 class="controls-section-title">Player 1 Controls</h3>
                        ${groups.player1.map(btn => this.renderControlButton(btn)).join('')}
                    </div>
                `;
            }

            if (groups.player2.length > 0) {
                html += `
                    <div class="controls-section">
                        <h3 class="controls-section-title">Player 2 Controls</h3>
                        ${groups.player2.map(btn => this.renderControlButton(btn)).join('')}
                    </div>
                `;
            }

            html += '</div>';
        }

        return html;
    }

    /**
     * Render individual control button
     */
    renderControlButton(button) {
        const displayValue = this.formatBindName(button.bindName);
        // Check if button is configured (has a non-empty, non-whitespace bindName)
        const isConfigured = button.bindName && button.bindName.trim() !== '';

        return `
            <div class="control-item">
                <label class="control-label">${this.escapeHtml(button.buttonName)}</label>
                <div class="control-binding">
                    <span id="control-value-${button.index}" class="control-value">${this.escapeHtml(displayValue)}</span>
                    <button type="button" class="btn btn-sm btn-primary control-remap-btn"
                            data-button-index="${button.index}"
                            onclick="window.controlsEditManager.startListening(${button.index})">
                        Remap
                    </button>
                    ${isConfigured ? `
                        <button type="button" class="btn btn-sm btn-danger control-clear-btn"
                                title="Clear binding"
                                onclick="window.controlsEditManager.clearBinding(${button.index})">
                            ✕
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Start listening for gamepad/keyboard input
     */
    startListening(buttonIndex) {
        // If already listening, cancel instead
        if (this.listeningButtonIndex === buttonIndex) {
            this.stopListening();
            return;
        }

        if (this.listeningButtonIndex !== null) {
            // Already listening to different button, cancel previous
            this.stopListening();
        }

        this.listeningButtonIndex = buttonIndex;

        // Update UI to show listening state
        const valueSpan = document.getElementById(`control-value-${buttonIndex}`);
        const remapBtn = document.querySelector(`[data-button-index="${buttonIndex}"]`);

        if (valueSpan) {
            valueSpan.textContent = '⏺ Press any button or move analog stick...';
            valueSpan.style.color = 'var(--secondary-color)';
            valueSpan.style.fontWeight = 'bold';
        }

        if (remapBtn) {
            remapBtn.textContent = 'Cancel';
            remapBtn.classList.add('listening');
        }

        // Start polling gamepad
        this.startGamepadPolling();

        // Listen for keyboard
        this.startKeyboardListening();
    }

    /**
     * Stop listening for input
     */
    stopListening() {
        if (this.listeningButtonIndex === null) return;

        // Stop gamepad polling
        if (this.gamepadPollInterval) {
            cancelAnimationFrame(this.gamepadPollInterval);
            this.gamepadPollInterval = null;
        }

        // Stop keyboard listening
        if (this.keyboardListener) {
            document.removeEventListener('keydown', this.keyboardListener);
            this.keyboardListener = null;
        }

        // Reset UI
        const valueSpan = document.getElementById(`control-value-${this.listeningButtonIndex}`);
        const remapBtn = document.querySelector(`[data-button-index="${this.listeningButtonIndex}"]`);

        if (valueSpan) {
            valueSpan.style.color = '';
            valueSpan.style.fontWeight = '';
        }

        if (remapBtn) {
            remapBtn.textContent = 'Remap';
            remapBtn.classList.remove('listening');
        }

        this.listeningButtonIndex = null;
    }

    /**
     * Start gamepad polling
     */
    startGamepadPolling() {
        const AXIS_THRESHOLD = 0.5; // Threshold for detecting significant axis movement

        const poll = () => {
            if (this.listeningButtonIndex === null) return;

            const gamepads = navigator.getGamepads();
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (!gamepad) continue;

                // Check buttons
                for (let btnIdx = 0; btnIdx < gamepad.buttons.length; btnIdx++) {
                    if (gamepad.buttons[btnIdx].pressed) {
                        this.handleGamepadInput(i, btnIdx);
                        return;
                    }
                }

                // Check analog stick axes
                for (let axisIdx = 0; axisIdx < gamepad.axes.length; axisIdx++) {
                    const axisValue = gamepad.axes[axisIdx];

                    if (Math.abs(axisValue) > AXIS_THRESHOLD) {
                        this.handleGamepadAxisInput(i, axisIdx, axisValue);
                        return;
                    }
                }
            }

            this.gamepadPollInterval = requestAnimationFrame(poll);
        };

        poll();
    }

    /**
     * Handle gamepad button press
     */
    handleGamepadInput(deviceIndex, buttonIndex) {
        const buttonName = this.GAMEPAD_BUTTON_NAMES[buttonIndex] || `Button ${buttonIndex}`;
        const bindName = `Input Device ${deviceIndex} ${buttonName}`;

        // Get XInput button code
        const xInputCode = this.getXInputCode(buttonIndex);

        // Determine if this is a trigger
        const isLeftTrigger = (buttonIndex === 6);  // Button 6 = LT
        const isRightTrigger = (buttonIndex === 7); // Button 7 = RT

        const bindingData = {
            bindName: bindName,
            xInputButton: {
                buttonCode: xInputCode,
                buttonIndex: 0,
                isLeftTrigger: isLeftTrigger,
                isRightTrigger: isRightTrigger
            }
        };

        this.applyBinding(bindingData);
        this.stopListening();
    }

    /**
     * Handle gamepad axis movement (analog sticks)
     */
    handleGamepadAxisInput(deviceIndex, axisIndex, axisValue) {
        // Map axis index to name
        const axisNames = {
            0: 'X',      // Left stick X
            1: 'Y',      // Left stick Y
            2: 'X',      // Right stick X
            3: 'Y'       // Right stick Y
        };

        const axisName = axisNames[axisIndex] || `Axis${axisIndex}`;
        const direction = axisValue > 0 ? '+' : '-';
        const isAxisMinus = axisValue < 0;

        // Determine which thumb axis this is
        let isLeftThumbX = false;
        let isLeftThumbY = false;
        let isRightThumbX = false;
        let isRightThumbY = false;

        if (axisIndex === 0) {
            isLeftThumbX = true;
        } else if (axisIndex === 1) {
            isLeftThumbY = true;
        } else if (axisIndex === 2) {
            isRightThumbX = true;
        } else if (axisIndex === 3) {
            isRightThumbY = true;
        }

        // For TeknoParrot, the binding format is like:
        // "Input Device 0 LeftThumbInput Device 0 X-"
        let bindName;
        if (axisIndex === 0 || axisIndex === 1) {
            // Left stick
            bindName = `Input Device ${deviceIndex} LeftThumbInput Device ${deviceIndex} ${axisName}${direction}`;
        } else if (axisIndex === 2 || axisIndex === 3) {
            // Right stick
            bindName = `Input Device ${deviceIndex} RightThumbInput Device ${deviceIndex} ${axisName}${direction}`;
        } else {
            // Other axes
            bindName = `Input Device ${deviceIndex} Axis${axisIndex}${direction}`;
        }

        const bindingData = {
            bindName: bindName,
            xInputButton: {
                buttonCode: 0,
                buttonIndex: 0,
                isLeftTrigger: false,
                isRightTrigger: false,
                isLeftThumbX: isLeftThumbX,
                isLeftThumbY: isLeftThumbY,
                isRightThumbX: isRightThumbX,
                isRightThumbY: isRightThumbY,
                isAxisMinus: isAxisMinus
            }
        };

        this.applyBinding(bindingData);
        this.stopListening();
    }

    /**
     * Start keyboard listening
     */
    startKeyboardListening() {
        this.keyboardListener = (e) => {
            // Stop the event from reaching keyboard manager
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Format key name
            let keyName = e.key;
            if (keyName === ' ') keyName = 'Space';
            if (keyName.length === 1) keyName = keyName.toUpperCase();

            const bindName = `Keyboard ${keyName}`;

            const bindingData = {
                bindName: bindName,
                xInputButton: null // Keyboard doesn't use XInput
            };

            this.applyBinding(bindingData);
            this.stopListening();
        };

        // Use capture phase (true) to intercept BEFORE keyboardManager
        document.addEventListener('keydown', this.keyboardListener, true);
    }

    /**
     * Get XInput button code from standard gamepad button index
     */
    getXInputCode(buttonIndex) {
        const codeMap = {
            0: 4096,     // A
            1: 8192,     // B
            2: 16384,    // X
            3: -32768,   // Y (negative value)
            4: 256,      // LB (LeftShoulder)
            5: 512,      // RB (RightShoulder)
            6: 0,        // LT (LeftTrigger - uses IsLeftTrigger flag instead)
            7: 0,        // RT (RightTrigger - uses IsRightTrigger flag instead)
            8: 32,       // Back
            9: 16,       // Start
            10: 64,      // L3 (LeftThumb)
            11: 128,     // R3 (RightThumb)
            12: 1,       // DPad Up
            13: 2,       // DPad Down
            14: 4,       // DPad Left
            15: 8        // DPad Right
        };

        return codeMap[buttonIndex] || 0;
    }

    /**
     * Apply binding to current button
     */
    applyBinding(bindingData) {
        if (this.listeningButtonIndex === null) return;

        // Update XML
        this.updateButtonBinding(this.currentXmlDoc, this.listeningButtonIndex, bindingData);

        // Update UI
        const valueSpan = document.getElementById(`control-value-${this.listeningButtonIndex}`);
        if (valueSpan) {
            valueSpan.textContent = this.formatBindName(bindingData.bindName);
        }

        this.hasUnsavedChanges = true;
    }

    /**
     * Clear binding for a button
     */
    clearBinding(buttonIndex) {
        // Clear the binding in XML
        this.updateButtonBinding(this.currentXmlDoc, buttonIndex, {
            bindName: '',
            xInputButton: null
        });

        // Update UI
        const valueSpan = document.getElementById(`control-value-${buttonIndex}`);
        if (valueSpan) {
            valueSpan.textContent = 'Not configured';
        }

        // Remove the clear button by re-rendering (we'll refresh the whole form)
        const formHtml = this.renderControlsForm();
        const form = document.getElementById('controls-edit-form');
        if (form) {
            form.innerHTML = formHtml;
        }

        this.hasUnsavedChanges = true;
    }

    /**
     * Save controls to UserProfile XML
     */
    async saveControls() {
        try {
            // Update Input API if present
            const inputApiSelect = document.getElementById('input-api-select');
            if (inputApiSelect) {
                const newValue = inputApiSelect.value;
                const configValues = this.currentXmlDoc.getElementsByTagName('ConfigValues')[0];
                if (configValues) {
                    const fieldInfos = configValues.getElementsByTagName('FieldInformation');
                    for (let i = 0; i < fieldInfos.length; i++) {
                        const fieldName = fieldInfos[i].getElementsByTagName('FieldName')[0]?.textContent;
                        if (fieldName === 'Input API') {
                            const fieldValue = fieldInfos[i].getElementsByTagName('FieldValue')[0];
                            if (fieldValue) {
                                fieldValue.textContent = newValue;
                            }
                            break;
                        }
                    }
                }
            }

            // Serialize XML
            const xmlContent = this.serializeXml(this.currentXmlDoc);

            // Send to server
            const resp = await fetch(`/__updateGameSettings?id=${encodeURIComponent(this.currentGameId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmlContent })
            });

            if (!resp.ok) {
                throw new Error(`Failed to save controls: ${resp.statusText}`);
            }

            const result = await resp.json();
            if (!result.ok) {
                throw new Error(result.error || 'Unknown error');
            }

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
            alert(`Failed to save controls: ${error.message}`);
        }
    }

    /**
     * Add change tracking listeners
     */
    addChangeTrackingListeners() {
        // Track when user remaps buttons
        // Changes are tracked in applyBinding()
    }

    /**
     * Cancel editing and close modal
     */
    cancelEdit() {
        this.stopListening();

        // Reopen game details
        const gameId = this.currentGameId;
        this.closeModal();

        if (gameId) {
            const app = document.querySelector('#app').__parrotApp;
            const game = app?.gameManager.getGameById(gameId);
            if (game && window.uiManager) {
                setTimeout(() => {
                    window.uiManager.showGameDetails(game);
                }, 50);
            }
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        this.stopListening();

        // Re-enable gamepad and keyboard managers
        if (window.gamepadManager) {
            window.gamepadManager.pollingActive = true;
        }
        if (window.keyboardManager) {
            window.keyboardManager.enabled = true;
        }
        if (window.gamepadIntegration) {
            window.gamepadIntegration.isModalOpen = false;
            window.gamepadIntegration.isCapturingInput = false;
        }

        document.getElementById('game-modal').style.display = 'none';
        this.currentGameId = null;
        this.currentXmlDoc = null;
        this.hasUnsavedChanges = false;
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
