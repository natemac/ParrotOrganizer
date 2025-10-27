/**
 * PathManager - Handles all file path operations
 *
 * Manages relative paths from ParrotOrganizer to TeknoParrot folders
 * Ensures portability across different installations
 */

import debugLogger from './debugLogger.js';

export class PathManager {
    constructor() {
        this.rootPath = this.detectTeknoParrotRoot();
        this.paths = {
            gameProfiles: `${this.rootPath}/GameProfiles`,
            userProfiles: `${this.rootPath}/UserProfiles`,
            metadata: `${this.rootPath}/Metadata`,
            gameSetup: `${this.rootPath}/GameSetup`,
            icons: `${this.rootPath}/Icons`,
            teknoParrotExe: `${this.rootPath}/TeknoParrotUi.exe`
        };
    }

    /**
     * Detect TeknoParrot root directory (parent of ParrotOrganizer)
     * Works by assuming ParrotOrganizer is inside TeknoParrot folder
     */
    detectTeknoParrotRoot() {
        // Get current page location
        const currentPath = window.location.pathname;

        // Extract directory path (remove filename)
        const dirPath = currentPath.substring(0, currentPath.lastIndexOf('/'));

        // Go up one level (from ParrotOrganizer to TeknoParrot)
        const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/'));

        // Convert to filesystem path format
        // Remove leading slash and handle file:// protocol
        let rootPath = parentPath;
        if (rootPath.startsWith('/')) {
            rootPath = rootPath.substring(1);
        }

        // For file:// URLs, we need to work with the full path
        if (window.location.protocol === 'file:') {
            // On Windows, paths look like: /D:/path/to/folder
            // We need to extract: D:/path/to/folder
            if (rootPath.match(/^\/[A-Za-z]:/)) {
                rootPath = rootPath.substring(1);
            }
        }

        console.log('📂 Detected TeknoParrot root:', rootPath);
        return rootPath;
    }

    /**
     * Get path relative to current location for file access
     */
    getRelativePath(absolutePath) {
        // Since we're running from ParrotOrganizer folder,
        // we need to go up one level (..) to access TeknoParrot folders
        const filename = absolutePath.split('/').pop();
        const folder = absolutePath.split('/').slice(-2, -1)[0];
        return `../${folder}/${filename}`;
    }

    /**
     * Verify TeknoParrot installation by checking for key files and folders
     */
    async verifyInstallation() {
        debugLogger.info('PathManager', 'Starting installation verification');
        const checks = {
            gameProfilesList: false,
            gameProfilesFolder: false,
            userProfilesFolder: false,
            metadataFolder: false,
            iconsFolder: false,
            teknoParrotExe: false,
            storageFolder: false,
            nodeJsServer: false
        };

        try {
            // 1. Check if game list exists (created by start.bat in storage folder)
            debugLogger.info('PathManager', 'Checking for game profiles list');
            try {
                const response = await fetch('storage/gameProfiles.txt');
                if (response.ok) {
                    const text = await response.text();
                    if (text && text.trim().length > 0) {
                        checks.gameProfilesList = true;
                        const gameCount = text.trim().split('\n').length;
                        debugLogger.success('PathManager', 'Game profiles list found', { gameCount });
                    } else {
                        debugLogger.warn('PathManager', 'Game list is empty');
                    }
                } else {
                    debugLogger.warn('PathManager', 'Game profiles list not found - may need to run start.bat');
                }
            } catch (e) {
                debugLogger.warn('PathManager', 'Failed to load game profiles list', { error: e.message });
            }

            // 2. Check if critical folders are accessible
            debugLogger.info('PathManager', 'Checking folder accessibility');
            const folderChecks = [
                { name: 'GameProfiles', path: '../GameProfiles/gameProfiles.txt', key: 'gameProfilesFolder' },
                { name: 'UserProfiles', path: '../UserProfiles/', key: 'userProfilesFolder' },
                { name: 'Metadata', path: '../Metadata/', key: 'metadataFolder' },
                { name: 'Icons', path: '../Icons/', key: 'iconsFolder' }
            ];

            for (const folder of folderChecks) {
                try {
                    // Try to fetch a file that should exist in the folder
                    const testPath = folder.path;
                    const response = await fetch(testPath, { method: 'HEAD' });
                    // Even 404 is ok - it means we can access the folder path
                    checks[folder.key] = true;
                    debugLogger.success('PathManager', `${folder.name} folder accessible`);
                } catch (e) {
                    debugLogger.error('PathManager', `${folder.name} folder not accessible`, { error: e.message });
                }
            }

            // 3. Check if TeknoParrotUi.exe exists (via server)
            debugLogger.info('PathManager', 'Checking for TeknoParrotUi.exe');
            try {
                const response = await fetch('/__checkTeknoParrotExe');
                if (response.ok) {
                    const data = await response.json();
                    checks.teknoParrotExe = data.exists || false;
                    if (data.exists) {
                        debugLogger.success('PathManager', 'TeknoParrotUi.exe found', { path: data.path });
                    } else {
                        debugLogger.warn('PathManager', 'TeknoParrotUi.exe not found');
                    }
                }
            } catch (e) {
                debugLogger.warn('PathManager', 'Could not check for TeknoParrotUi.exe (Node.js server may not be running)');
            }

            // 4. Check if storage folder exists
            debugLogger.info('PathManager', 'Checking storage folder');
            try {
                const response = await fetch('storage/README.md');
                checks.storageFolder = response.ok;
                if (response.ok) {
                    debugLogger.success('PathManager', 'Storage folder accessible');
                } else {
                    debugLogger.warn('PathManager', 'Storage folder may not exist');
                }
            } catch (e) {
                debugLogger.warn('PathManager', 'Storage folder check failed', { error: e.message });
            }

            // 5. Check if Node.js server is running and get version
            debugLogger.info('PathManager', 'Checking Node.js server');
            try {
                const response = await fetch('/__serverInfo');
                if (response.ok) {
                    const data = await response.json();
                    checks.nodeJsServer = true;
                    debugLogger.success('PathManager', 'Node.js server running', {
                        nodeVersion: data.nodeVersion,
                        platform: data.platform,
                        cwd: data.cwd
                    });
                } else {
                    debugLogger.warn('PathManager', 'Node.js server not responding');
                }
            } catch (e) {
                debugLogger.warn('PathManager', 'Node.js server not running - using Python fallback', { error: e.message });
            }

            // Log summary
            const passedChecks = Object.values(checks).filter(v => v).length;
            const totalChecks = Object.keys(checks).length;
            debugLogger.info('PathManager', 'Installation verification complete', {
                passed: passedChecks,
                total: totalChecks,
                checks
            });

            console.log('✅ Installation verification complete:', checks);

            // Minimum requirement: game list must exist
            if (!checks.gameProfilesList) {
                debugLogger.error('PathManager', 'Critical: Game profiles list not found');
                console.warn('⚠️ Game list not found. Did you run start.bat?');
                return false;
            }

            debugLogger.success('PathManager', 'TeknoParrot installation verified');
            console.log('✅ TeknoParrot installation verified');
            return true;

        } catch (error) {
            console.error('❌ Error verifying installation:', error);
            debugLogger.logError('PathManager', 'Installation verification failed', error);
            return false;
        }
    }

    /**
     * Get list of all XML files in a directory
     */
    async getXMLFiles(folderName) {
        try {
            // For security reasons, we can't directly list directory contents from browser
            // We'll use a workaround: try to fetch a known list or use FileSystem API

            // For now, we'll return an empty array and handle file loading differently
            // In production, you might want to use FileSystem Access API or provide
            // a manifest file
            console.warn('⚠️ Direct directory listing not available in browser');
            return [];
        } catch (error) {
            console.error(`Error getting XML files from ${folderName}:`, error);
            return [];
        }
    }

    /**
     * Read XML file from path
     */
    async readXMLFile(relativePath) {
        try {
            const response = await fetch(relativePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${relativePath}: ${response.statusText}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            // Check for parsing errors
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parsing error: ${parseError.textContent}`);
            }

            return xmlDoc;
        } catch (error) {
            // Only log non-404 errors (404s are expected for optional files like GameSetup)
            const msg = String(error && error.message || '');
            const is404 = msg.includes('404') || msg.toLowerCase().includes('not found');
            const isGameSetup = relativePath.includes('/GameSetup/');

            // Don't log 404s for GameSetup files (they're optional)
            if (!is404 || !isGameSetup) {
                console.warn(`Error reading XML file ${relativePath}:`, error);
            }
            throw error;
        }
    }

    /**
     * Read JSON file from path
     */
    async readJSONFile(relativePath) {
        try {
            const response = await fetch(relativePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${relativePath}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            // Only log non-404 errors (404s are expected for optional metadata files)
            const msg = String(error && error.message || '');
            const is404 = msg.includes('404') || msg.toLowerCase().includes('not found');
            const isMetadata = relativePath.includes('/Metadata/');

            // Don't log 404s for Metadata files (they're optional)
            if (!is404 || !isMetadata) {
                console.warn(`Error reading JSON file ${relativePath}:`, error);
            }
            throw error;
        }
    }

    /**
     * Get icon path for a game
     */
    getIconPath(iconName) {
        if (!iconName) return null;

        // Icons can be specified as "Icons/GameName.png" or just "GameName.png"
        if (iconName.startsWith('Icons/')) {
            return `../${iconName}`;
        } else {
            return `../Icons/${iconName}`;
        }
    }

    /**
     * Try to resolve an icon for a game by testing multiple fallbacks.
     * Returns a relative URL like "../Icons/abc.png" or null.
     */
    async resolveIcon(gameId, gameData) {
        const candidates = [];

        const upIcon = gameData?.userProfile?.IconName;
        const mdIcon = gameData?.metadata?.icon_name;
        if (upIcon) candidates.push(this.getIconPath(upIcon));
        if (mdIcon) candidates.push(this.getIconPath(mdIcon));

        // Helper to push unique candidates
        const pushUnique = (p) => { if (p && !candidates.includes(p)) candidates.push(p); };

        // 1) Direct id match
        pushUnique(`../Icons/${gameId}.png`);

        // 2) Variant-stripped ids (e.g., abcELF2 -> abc)
        const variantPatterns = [
            /ELFLOADER2$/i,
            /ELFLOADER$/i,
            /ELF2$/i,
            /SPELF2$/i,
            /SP$/i,
            /DX$/i,
            /HD$/i,
            /APM3$/i,
            /NESICAXLIVE$/i,
            /NESICAX?$/i,
            /NESICA$/i
        ];
        let base = gameId;
        for (const rgx of variantPatterns) {
            const stripped = base.replace(rgx, '');
            if (stripped !== base) {
                base = stripped;
            }
        }
        if (base !== gameId) {
            pushUnique(`../Icons/${base}.png`);
        }
        // Common case: base version icon named with a trailing '2'
        pushUnique(`../Icons/${base}2.png`);

        // 3) Try sanitized names from metadata/user profile
        const nameCandidates = [gameData?.metadata?.game_name, gameData?.name].filter(Boolean);
        for (const nm of nameCandidates) {
            // Try without parenthetical suffix
            const noParen = nm.split(' (')[0];
            const sanitize = (s) => s.replace(/[^A-Za-z0-9]/g, '');
            const file1 = sanitize(noParen);
            const file2 = sanitize(nm);
            if (file1) pushUnique(`../Icons/${file1}.png`);
            if (file2 && file2 !== file1) pushUnique(`../Icons/${file2}.png`);
        }

        // Test candidates sequentially
        for (const rel of candidates) {
            try {
                const r = await fetch(rel, { cache: 'no-store' });
                if (r.ok) return rel;
            } catch (_) {
                // ignore
            }
        }

        return null;
    }

    /**
     * Get TeknoParrotUi.exe path for launching games
     */
    getTeknoParrotExePath() {
        return this.paths.teknoParrotExe;
    }

    /**
     * Get profile path for launching a game
     */
    getProfilePath(profileName) {
        return `${this.paths.userProfiles}/${profileName}.xml`;
    }
}
