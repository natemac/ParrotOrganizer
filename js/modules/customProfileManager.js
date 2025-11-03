/**
 * CustomProfileManager - Manages user-created custom metadata overrides
 *
 * THREE-TIER DATA HIERARCHY:
 * 1. TeknoParrot Data (lowest priority) - Base game profiles and metadata
 * 2. data/CustomProfiles (medium priority) - Creator-recommended profiles (persistent)
 * 3. storage/CustomProfiles (highest priority) - User's personal edits (can be reset)
 *
 * User edits always take precedence over creator recommendations.
 * Creator profiles in data/ are NOT deleted during reset operations.
 */

export class CustomProfileManager {
    constructor() {
        this.userProfiles = {};      // storage/CustomProfiles (user edits)
        this.creatorProfiles = {};   // data/CustomProfiles (creator recommendations)
        this.loaded = false;
    }

    /**
     * Load a single custom profile from both storage locations
     * Returns merged profile with user edits taking precedence
     */
    async loadProfile(gameId) {
        try {
            // Load creator profile from data/CustomProfiles
            let creatorProfile = null;
            try {
                const creatorResponse = await fetch(`/__creatorProfile/read?id=${gameId}`);
                const creatorResult = await creatorResponse.json();
                if (creatorResult.ok && creatorResult.exists) {
                    creatorProfile = this.parseXML(creatorResult.data);
                    this.creatorProfiles[gameId] = creatorProfile;
                }
            } catch (err) {
                // Creator profile doesn't exist, that's fine
            }

            // Load user profile from storage/CustomProfiles
            let userProfile = null;
            try {
                const userResponse = await fetch(`/__customProfile/read?id=${gameId}`);
                const userResult = await userResponse.json();
                console.log('DEBUG getProfile userResult:', gameId, userResult);
                if (userResult.ok && userResult.exists) {
                    console.log('DEBUG raw XML data:', userResult.data);
                    userProfile = this.parseXML(userResult.data);
                    console.log('DEBUG parsed userProfile:', userProfile);
                    this.userProfiles[gameId] = userProfile;
                }
            } catch (err) {
                console.error('DEBUG getProfile error:', err);
                // User profile doesn't exist, that's fine
            }

            // Merge: user profile overrides creator profile
            if (userProfile || creatorProfile) {
                const merged = {
                    ...creatorProfile,
                    ...userProfile
                };
                console.log('DEBUG getProfile merged result:', merged);
                return merged;
            }
        } catch (error) {
            console.error(`Error loading custom profile for ${gameId}:`, error);
        }
        return null;
    }

    /**
     * Load all custom profiles from XML files
     * Note: We load profiles on-demand to improve performance
     */
    async loadProfiles() {
        // Clear cache to force reload from disk
        this.userProfiles = {};
        this.creatorProfiles = {};
        this.loaded = true;
        return {};
    }

    /**
     * Clear all cached profiles (forces reload from disk on next access)
     */
    clearCache() {
        this.userProfiles = {};
        this.creatorProfiles = {};
        this.loaded = false;
    }

    /**
     * Parse XML string to custom profile object
     */
    parseXML(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        const profile = {};

        // Parse custom name
        const customNameEl = xmlDoc.querySelector('CustomName');
        if (customNameEl && customNameEl.textContent) {
            profile.customName = customNameEl.textContent;
        }

        // Parse description
        const descriptionEl = xmlDoc.querySelector('Description');
        if (descriptionEl && descriptionEl.textContent) {
            profile.description = descriptionEl.textContent;
        }

        // Parse YouTube link
        const youtubeLinkEl = xmlDoc.querySelector('YouTubeLink');
        if (youtubeLinkEl && youtubeLinkEl.textContent) {
            profile.youtubeLink = youtubeLinkEl.textContent;
        }

        // Parse tags
        const tagsEl = xmlDoc.querySelector('Tags');
        if (tagsEl) {
            const tagElements = tagsEl.querySelectorAll('Tag');
            profile.tags = Array.from(tagElements).map(tag => tag.textContent).filter(t => t);
        }

        // Parse genre
        const genreEl = xmlDoc.querySelector('Genre');
        if (genreEl && genreEl.textContent) {
            profile.genre = genreEl.textContent;
        }

        // Parse year
        const yearEl = xmlDoc.querySelector('Year');
        if (yearEl && yearEl.textContent) {
            profile.year = parseInt(yearEl.textContent);
        }

        // Parse lightgun override (new field)
        const lightgunEl = xmlDoc.querySelector('Lightgun');
        if (lightgunEl) {
            const value = lightgunEl.textContent.trim().toLowerCase();
            if (value === 'true') {
                profile.lightgun = true;
            } else if (value === 'false') {
                profile.lightgun = false;
            }
        }

        // Legacy: Parse old GunGame field for backwards compatibility
        const gunGameEl = xmlDoc.querySelector('GunGame');
        if (gunGameEl && gunGameEl.textContent === 'true' && profile.lightgun === undefined) {
            // Only use if lightgun isn't already set
            profile.lightgun = true;
        }

        // Parse platform
        const platformEl = xmlDoc.querySelector('Platform');
        if (platformEl && platformEl.textContent) {
            profile.platform = platformEl.textContent;
        }

        // Parse emulator
        const emulatorEl = xmlDoc.querySelector('Emulator');
        if (emulatorEl && emulatorEl.textContent) {
            profile.emulator = emulatorEl.textContent;
        }

        // Parse GPU
        const gpuEl = xmlDoc.querySelector('GPU');
        if (gpuEl && gpuEl.textContent) {
            profile.gpu = gpuEl.textContent;
        }

        // Parse last modified
        const lastModifiedEl = xmlDoc.querySelector('LastModified');
        if (lastModifiedEl && lastModifiedEl.textContent) {
            profile.lastModified = lastModifiedEl.textContent;
        }

        return profile;
    }

    /**
     * Generate XML string from custom profile object
     */
    generateXML(customData) {
        const escapeXML = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        let xml = '<?xml version="1.0" encoding="utf-8"?>\n<CustomProfile>\n';

        if (customData.customName) {
            xml += `  <CustomName>${escapeXML(customData.customName)}</CustomName>\n`;
        }

        if (customData.description) {
            xml += `  <Description>${escapeXML(customData.description)}</Description>\n`;
        }

        if (customData.youtubeLink) {
            xml += `  <YouTubeLink>${escapeXML(customData.youtubeLink)}</YouTubeLink>\n`;
        }

        if (customData.tags && customData.tags.length > 0) {
            xml += '  <Tags>\n';
            customData.tags.forEach(tag => {
                xml += `    <Tag>${escapeXML(tag)}</Tag>\n`;
            });
            xml += '  </Tags>\n';
        }

        if (customData.genre) {
            xml += `  <Genre>${escapeXML(customData.genre)}</Genre>\n`;
        }

        if (customData.year) {
            xml += `  <Year>${escapeXML(customData.year)}</Year>\n`;
        }

        // Save lightgun override (can be true or false)
        if (customData.lightgun !== undefined) {
            xml += `  <Lightgun>${customData.lightgun}</Lightgun>\n`;
        }

        if (customData.platform) {
            xml += `  <Platform>${escapeXML(customData.platform)}</Platform>\n`;
        }

        if (customData.emulator) {
            xml += `  <Emulator>${escapeXML(customData.emulator)}</Emulator>\n`;
        }

        if (customData.gpu) {
            xml += `  <GPU>${escapeXML(customData.gpu)}</GPU>\n`;
        }

        xml += `  <LastModified>${escapeXML(customData.lastModified || new Date().toISOString())}</LastModified>\n`;
        xml += '</CustomProfile>';

        return xml;
    }

    /**
     * Get custom profile for a specific game
     * Loads on-demand if not already in memory
     * Returns merged profile (creator + user edits)
     */
    async getProfile(gameId) {
        // Check if we have either in cache
        const hasUserProfile = !!this.userProfiles[gameId];
        const hasCreatorProfile = !!this.creatorProfiles[gameId];

        if (!hasUserProfile && !hasCreatorProfile) {
            // Not in cache, load from files
            return await this.loadProfile(gameId);
        }

        // Return merged from cache (user overrides creator)
        const merged = {
            ...this.creatorProfiles[gameId],
            ...this.userProfiles[gameId]
        };
        return Object.keys(merged).length > 0 ? merged : null;
    }

    /**
     * Extract editable fields from TeknoParrot game data
     * This pulls data from GameProfile, UserProfile, and Metadata
     * @param {Object} game - Game object with profile, userProfile, metadata
     * @returns {Object} Object with editable field values
     */
    extractEditableFieldsFromGame(game) {
        const fields = {};

        // Lightgun Game - check metadata override first, then GameProfile
        // metadata.lightgun can be true, false, or undefined
        // If undefined, fall back to GameProfile.GunGame
        if (game.metadata?.lightgun !== undefined) {
            // Explicit override from metadata
            fields.gunGame = game.metadata.lightgun;
        } else if (game.profile?.GunGame === true) {
            // Fallback to GameProfile
            fields.gunGame = true;
        }

        // Release Year (from Metadata)
        if (game.metadata?.release_year) {
            fields.year = parseInt(game.metadata.release_year);
        }

        // Platform (from Metadata)
        if (game.metadata?.platform) {
            fields.platform = game.metadata.platform;
        }

        // Emulator Type (from GameProfile)
        if (game.profile?.EmulatorType) {
            fields.emulator = game.profile.EmulatorType;
        }

        // GPU Compatibility (from Metadata)
        const gpuArray = [];
        if (game.metadata?.nvidia === 'OK') gpuArray.push('Nvidia');
        if (game.metadata?.amd === 'OK') gpuArray.push('AMD');
        if (game.metadata?.intel === 'OK') gpuArray.push('Intel');

        if (gpuArray.length > 0) {
            fields.gpu = gpuArray.join(', ');
        }

        // Genre (from Metadata)
        if (game.metadata?.game_genre) {
            fields.genre = game.metadata.game_genre;
        }

        return fields;
    }

    /**
     * Get profile for editing - merges TeknoParrot data with CustomProfile
     * If no CustomProfile exists, returns TeknoParrot data as starting point
     * If CustomProfile exists, it takes precedence over TeknoParrot data
     * @param {string} gameId - Game ID
     * @param {Object} game - Game object with TeknoParrot data
     * @returns {Object} Merged profile data for editing
     */
    async getProfileForEditing(gameId, game) {
        // Start with TeknoParrot data as base
        const teknoParrotData = this.extractEditableFieldsFromGame(game);

        // Get existing CustomProfile if it exists
        const customProfile = await this.getProfile(gameId);

        console.log('DEBUG getProfileForEditing:', {
            gameId,
            teknoParrotData,
            customProfile,
            teknoParrotPlatform: teknoParrotData?.platform,
            customProfilePlatform: customProfile?.platform
        });

        // Merge: CustomProfile overrides TeknoParrot data
        const merged = {
            ...teknoParrotData,
            ...customProfile
        };

        console.log('DEBUG merged profile for editing:', merged);

        return merged;
    }

    /**
     * Set custom profile for a game
     * Saves to storage/CustomProfiles (user edits)
     */
    async setProfile(gameId, customData) {
        if (!gameId) return;

        // Get existing user profile if any (don't include creator profile here)
        const existingUserProfile = this.userProfiles[gameId] || {};

        // Merge with existing user profile
        const mergedData = {
            ...existingUserProfile,
            ...customData,
            lastModified: new Date().toISOString()
        };

        // Update user cache
        this.userProfiles[gameId] = mergedData;

        // Generate XML and save to storage/CustomProfiles
        const xmlContent = this.generateXML(mergedData);

        try {
            const response = await fetch(`/__customProfile/write?id=${gameId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: xmlContent
            });

            const result = await response.json();
            if (!result.ok) {
                console.error('Error saving custom profile:', result.error);
            }
        } catch (error) {
            console.error('Error saving custom profile:', error);
        }
    }

    /**
     * Delete custom profile for a game
     * Only deletes from storage/CustomProfiles (user edits)
     * Creator profiles in data/CustomProfiles are preserved
     */
    async deleteProfile(gameId) {
        try {
            const response = await fetch(`/__customProfile/delete?id=${gameId}`, {
                method: 'POST'
            });

            const result = await response.json();
            if (result.ok) {
                // Remove from user cache only
                delete this.userProfiles[gameId];
            } else {
                console.error('Error deleting custom profile:', result.error);
            }
        } catch (error) {
            console.error('Error deleting custom profile:', error);
        }
    }

    /**
     * Check if a game has a USER custom profile (storage/CustomProfiles)
     * This is used to show the delete button in the edit modal
     */
    async hasCustomProfile(gameId) {
        // Check user cache first
        if (this.userProfiles[gameId]) {
            return true;
        }

        // Check if user file exists in storage/CustomProfiles
        try {
            const response = await fetch(`/__customProfile/read?id=${gameId}`);
            const result = await response.json();
            return result.ok && result.exists;
        } catch (error) {
            return false;
        }
    }

    /**
     * Apply custom profile data to game object
     * Custom data takes precedence over original data
     */
    async applyCustomProfile(game) {
        const customProfile = await this.getProfile(game.id);

        if (!customProfile) {
            return game;
        }

        // Create merged game object
        const mergedGame = { ...game };

        // Override name if custom name exists
        if (customProfile.customName) {
            mergedGame.customName = customProfile.customName;
            mergedGame.name = customProfile.customName;
        }

        // Add custom fields
        if (customProfile.description) {
            mergedGame.customDescription = customProfile.description;
        }

        if (customProfile.youtubeLink) {
            mergedGame.customYoutubeLink = customProfile.youtubeLink;
        }

        if (customProfile.tags && customProfile.tags.length > 0) {
            mergedGame.customTags = customProfile.tags;
        }

        // Override metadata fields if provided
        if (customProfile.genre) {
            mergedGame.customGenre = customProfile.genre;
            if (mergedGame.metadata) {
                mergedGame.metadata = { ...mergedGame.metadata, game_genre: customProfile.genre };
            }
        }

        if (customProfile.year) {
            mergedGame.customYear = customProfile.year;
            if (mergedGame.metadata) {
                mergedGame.metadata = { ...mergedGame.metadata, release_year: customProfile.year };
            }
        }

        // Override platform if provided
        if (customProfile.platform) {
            mergedGame.customPlatform = customProfile.platform;
            if (mergedGame.metadata) {
                mergedGame.metadata = { ...mergedGame.metadata, platform: customProfile.platform };
            }
        }

        // Override emulator if provided
        if (customProfile.emulator) {
            mergedGame.customEmulator = customProfile.emulator;
            if (mergedGame.profile) {
                mergedGame.profile = { ...mergedGame.profile, EmulatorType: customProfile.emulator };
            }
        }

        // Override lightgun status if explicitly set in custom profile
        // customProfile.lightgun can be true or false
        // This overrides the GameProfile.GunGame value
        if (customProfile.lightgun !== undefined && mergedGame.profile) {
            mergedGame.profile = { ...mergedGame.profile, GunGame: customProfile.lightgun };
        }

        // Mark that this game has custom data
        mergedGame.hasCustomProfile = true;

        return mergedGame;
    }

    /**
     * Export custom profiles to JSON file
     */
    exportProfiles() {
        const dataStr = JSON.stringify(this.profiles, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `parrotorganizer_custom_profiles_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Import custom profiles from JSON file
     */
    async importProfiles(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const imported = JSON.parse(e.target.result);

                    // Save each profile as individual XML file
                    let count = 0;
                    for (const [gameId, profileData] of Object.entries(imported)) {
                        await this.setProfile(gameId, profileData);
                        count++;
                    }

                    resolve(count);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

}
