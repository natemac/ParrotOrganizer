/**
 * DataLoader - Loads and parses game data from TeknoParrot folders
 *
 * Handles loading GameProfiles, UserProfiles, Metadata, and GameSetup files
 */

export class DataLoader {
    constructor(pathManager) {
        this.pathManager = pathManager;
        this.platformAliasMap = null;
    }

    /**
     * Load all games from TeknoParrot folders
     */
    async loadAllGames() {
        console.log('dY"� Loading game data...');

        try {
            // Load platform aliases if available
            await this.loadPlatformAliases();

            // Load list of available games
            const gameProfilesList = await this.loadGameList();
            // Preflight: try fetching one known GameProfile to ensure server root is correct
            if (Array.isArray(gameProfilesList) && gameProfilesList.length > 0) {
                const probe = `../GameProfiles/${gameProfilesList[0]}.xml`;
                try {
                    const resp = await fetch(probe, { cache: 'no-store' });
                    if (resp.status === 404) {
                        throw new Error('Server root mismatch detected. Please start via start.bat or start-node.bat so /GameProfiles is accessible.');
                    }
                } catch (e) {
                    if (e && e.message && e.message.includes('Server root mismatch')) {
                        throw e;
                    }
                    // Network error here will be surfaced later; continue
                }
            }
            const userProfilesList = await this.loadUserProfileList();

            console.log(`Found ${gameProfilesList.length} game profiles, ${userProfilesList.length} user profiles`);

            // Load data for each game
            const games = [];
            let metadataCount = 0;
            let gameSetupCount = 0;
            let gameProfilesLoadedCount = 0;
            let userProfilesLoadedCount = 0;

            const loadPromises = gameProfilesList.map(async (gameName) => {
                try {
                    const gameData = await this.loadGameData(gameName, userProfilesList.includes(gameName));

                    // Track what was successfully loaded
                    if (gameData.profile) gameProfilesLoadedCount++;
                    if (gameData.userProfile) userProfilesLoadedCount++;
                    if (gameData.metadata) metadataCount++;
                    if (gameData.gameSetup) gameSetupCount++;

                    return gameData;
                } catch (error) {
                    console.warn(`�s��,? Failed to load ${gameName}:`, error.message);
                    return null;
                }
            });

            const results = await Promise.all(loadPromises);

            // Filter out failed loads
            results.forEach(game => {
                if (game) games.push(game);
            });

            console.log(`�o. Successfully loaded ${games.length} games`);
            console.log(`dY"S Stats: ${gameProfilesLoadedCount} GameProfiles, ${userProfilesLoadedCount} UserProfiles, ${metadataCount} Metadata files, ${gameSetupCount} GameSetup files`);

            return games;

        } catch (error) {
            console.error('�?O Error loading games:', error);
            throw error;
        }
    }

    /**
     * Load list of game profiles
     */
    async loadGameList() {
        try {
            const response = await fetch('data/gameProfiles.txt');
            if (!response.ok) {
                throw new Error('Could not load game list');
            }

            const text = await response.text();
            const games = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            return games;
        } catch (error) {
            console.error('Error loading game list:', error);
            throw error;
        }
    }

    /**
     * Load list of user profiles (installed games)
     */
    async loadUserProfileList() {
        try {
            // Try dynamic endpoint first (Node.js server) - always fresh data
            try {
                const dynamicResponse = await fetch('/__userProfiles');
                if (dynamicResponse.ok) {
                    const data = await dynamicResponse.json();
                    if (data.ok && Array.isArray(data.profiles)) {
                        return data.profiles;
                    }
                }
            } catch (e) {
                // Fallback to static file if endpoint not available
            }

            // Fallback to static file (Python server or old behavior)
            const response = await fetch('data/userProfiles.txt');
            if (!response.ok) {
                return []; // No user profiles yet
            }

            const text = await response.text();
            const games = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            return games;
        } catch (error) {
            console.warn('No user profiles found');
            return [];
        }
    }

    /**
     * Load complete data for a single game
     */
    async loadGameData(gameName, isInstalled) {
        const gameData = {
            id: gameName,
            name: gameName,
            isInstalled: isInstalled,
            profile: null,
            metadata: null,
            userProfile: null,
            gameSetup: null,
            iconUrl: null
        };

        // Load GameProfile (always required)
        try {
            gameData.profile = await this.loadGameProfile(gameName);
        } catch (error) {
            console.warn(`No game profile for ${gameName}`);
        }

        // Load Metadata (optional but recommended)
        try {
            gameData.metadata = await this.loadMetadata(gameName);
            if (gameData.metadata) {
                gameData.name = gameData.metadata.game_name || gameName;
                // Normalize platform names at load time (do not edit files)
                if (gameData.metadata.platform) {
                    const originalPlatform = gameData.metadata.platform;
                    gameData.metadata.platform = this.normalizePlatform(originalPlatform);
                    gameData.metadata.platform_original = originalPlatform;
                }
            }
        } catch (error) {
            // Metadata is optional
        }

        // Load UserProfile if installed
        if (isInstalled) {
            try {
                gameData.userProfile = await this.loadUserProfile(gameName);
                if (gameData.userProfile && gameData.userProfile.GameNameInternal) {
                    gameData.name = gameData.userProfile.GameNameInternal;
                }
            } catch (error) {
                console.warn(`Could not load user profile for ${gameName}`);
            }
        }

        // Load GameSetup (optional)
        try {
            gameData.gameSetup = await this.loadGameSetup(gameName);
        } catch (error) {
            // GameSetup is optional
        }

        // Resolve icon with fallbacks
        try {
            gameData.iconUrl = await this.pathManager.resolveIcon(gameName, gameData);
        } catch (_) {
            // leave null if resolution fails
        }

        return gameData;
    }

    /**
     * Normalize platform strings to canonical values at runtime
     * without modifying source metadata files.
     */
    normalizePlatform(platform) {
        if (!platform || typeof platform !== 'string') return platform;
        const raw = platform.trim();
        const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Try alias map from data/platformAliases.json first
        if (this.platformAliasMap && this.platformAliasMap[key]) {
            return this.platformAliasMap[key];
        }

        // Common aliases mapped to a canonical label
        const rules = [
            { re: /adrenaline(amusements)?pcbased/, val: 'Adrenaline PC-Based' },
            { re: /unis(pcbased)?|unisp?cbased/, val: 'UNIS PC Based' },
            { re: /rawthrills(linux)?pcbased/, val: 'RAW Thrills Linux PC Based' },
            { re: /namcosystem246/, val: 'Namco System 246' },
            { re: /namcosystem256/, val: 'Namco System 256' },
            { re: /taitotypex3?/, val: 'Taito Type X' },
            { re: /taitotypes?x2/, val: 'Taito Type X2' },
            { re: /taitolindbergh(yellow|red)?/, val: 'SEGA Lindbergh Yellow' },
            { re: /lindbergh(yellow|red)?/, val: 'SEGA Lindbergh Yellow' },
            { re: /nesicax?live|taitonesicaxlive/, val: 'Taito NESiCAxLive' },
            { re: /ringedge2?/, val: 'SEGA RingEdge' },
            { re: /exboard/, val: 'EX-BOARD' },
            { re: /sega(nu|nu1)/, val: 'SEGA Nu' },
        ];

        for (const rule of rules) {
            if (rule.re.test(key)) return rule.val;
        }

        // Fallback: lightly standardize common tokens
        return raw
            .replace(/\s*pc[- ]?based\s*/i, ' PC Based')
            .replace(/\s*linux\s*pc\s*based/i, ' Linux PC Based')
            .replace(/\s*system\s*([0-9]+)/i, ' System $1')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Parse GameProfile XML
     */
    async loadGameProfile(gameName) {
        const xmlDoc = await this.pathManager.readXMLFile(`../GameProfiles/${gameName}.xml`);

        return {
            GamePath: this.getXMLValue(xmlDoc, 'GamePath'),
            EmulationProfile: this.getXMLValue(xmlDoc, 'EmulationProfile'),
            GameProfileRevision: this.getXMLValue(xmlDoc, 'GameProfileRevision'),
            EmulatorType: this.getXMLValue(xmlDoc, 'EmulatorType'),
            ExecutableName: this.getXMLValue(xmlDoc, 'ExecutableName'),
            GunGame: this.getXMLValue(xmlDoc, 'GunGame') === 'true',
            HasSeparateTestMode: this.getXMLValue(xmlDoc, 'HasSeparateTestMode') === 'true',
            Is64Bit: this.getXMLValue(xmlDoc, 'Is64Bit') === 'true',
            RequiresAdmin: this.getXMLValue(xmlDoc, 'RequiresAdmin') === 'true',
            Patreon: this.getXMLValue(xmlDoc, 'Patreon') === 'true',
            msysType: this.getXMLValue(xmlDoc, 'msysType'),
            ConfigValues: this.parseConfigValues(xmlDoc),
            JoystickButtons: this.parseJoystickButtons(xmlDoc)
        };
    }

    /**
     * Parse UserProfile XML
     */
    async loadUserProfile(gameName) {
        try {
            const xmlDoc = await this.pathManager.readXMLFile(`../UserProfiles/${gameName}.xml`);

            return {
                ProfileName: this.getXMLValue(xmlDoc, 'ProfileName'),
                GameNameInternal: this.getXMLValue(xmlDoc, 'GameNameInternal'),
                GameGenreInternal: this.getXMLValue(xmlDoc, 'GameGenreInternal'),
                GamePath: this.getXMLValue(xmlDoc, 'GamePath'),
                IconName: this.getXMLValue(xmlDoc, 'IconName'),
                ConfigValues: this.parseConfigValues(xmlDoc),
                JoystickButtons: this.parseJoystickButtons(xmlDoc)
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Load Metadata JSON
     */
    async loadMetadata(gameName) {
        try {
            return await this.pathManager.readJSONFile(`../Metadata/${gameName}.json`);
        } catch (error) {
            return null;
        }
    }

    /**
     * Parse GameSetup XML
     */
    async loadGameSetup(gameName) {
        try {
            const xmlDoc = await this.pathManager.readXMLFile(`../GameSetup/${gameName}.xml`);

            return {
                GameExecutableLocation: this.getXMLValue(xmlDoc, 'GameExecutableLocation'),
                GameTestExecutableLocation: this.getXMLValue(xmlDoc, 'GameTestExecutableLocation'),
                DevOnly: this.getXMLValue(xmlDoc, 'DevOnly') === 'true'
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get text value from XML element
     */
    getXMLValue(xmlDoc, tagName) {
        const element = xmlDoc.querySelector(tagName);
        return element ? element.textContent.trim() : null;
    }

    /**
     * Parse ConfigValues from XML
     */
    parseConfigValues(xmlDoc) {
        const configValues = [];
        const fieldElements = xmlDoc.querySelectorAll('FieldInformation');

        fieldElements.forEach(field => {
            const category = field.querySelector('CategoryName')?.textContent.trim();
            const name = field.querySelector('FieldName')?.textContent.trim();
            const value = field.querySelector('FieldValue')?.textContent.trim();
            const type = field.querySelector('FieldType')?.textContent.trim();

            if (name && value) {
                configValues.push({
                    category,
                    name,
                    value,
                    type
                });
            }
        });

        return configValues;
    }

    /**
     * Parse JoystickButtons from XML
     */
    parseJoystickButtons(xmlDoc) {
        const buttons = [];
        const buttonElements = xmlDoc.querySelectorAll('JoystickButtons > JoystickButtons');

        buttonElements.forEach(button => {
            const buttonName = button.querySelector('ButtonName')?.textContent.trim();
            const inputMapping = button.querySelector('InputMapping')?.textContent.trim();

            if (buttonName && inputMapping) {
                buttons.push({
                    buttonName,
                    inputMapping
                });
            }
        });

        return buttons;
    }

    /**
     * Load platform aliases JSON and build a lookup map
     */
    async loadPlatformAliases() {
        if (this.platformAliasMap !== null) return; // already attempted
        this.platformAliasMap = {};
        try {
            const data = await this.pathManager.readJSONFile('data/platformAliases.json');
            if (!data || !Array.isArray(data.aliases)) return;
            const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            data.aliases.forEach(item => {
                const canonical = (item.canonical || '').toString().trim();
                if (!canonical) return;
                const canonKey = norm(canonical);
                if (canonKey) this.platformAliasMap[canonKey] = canonical;
                const aliases = Array.isArray(item.aliases) ? item.aliases : [];
                aliases.forEach(a => {
                    const k = norm(a);
                    if (k) this.platformAliasMap[k] = canonical;
                });
            });
        } catch (e) {
            console.warn('Platform aliases not loaded (missing or invalid JSON).', e?.message || e);
        }
    }
}
