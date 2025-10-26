/**
 * CustomProfileManager - Manages user-created custom metadata overrides
 *
 * Stores custom data in individual XML files per game (storage/CustomProfiles/[gameId].xml)
 * Supports: custom name, description, youtube links, tags, and metadata overrides
 */

export class CustomProfileManager {
    constructor() {
        this.profiles = {};
        this.loaded = false;
    }

    /**
     * Load a single custom profile from XML file
     */
    async loadProfile(gameId) {
        try {
            const response = await fetch(`/__customProfile/read?id=${gameId}`);
            const result = await response.json();

            if (result.ok && result.exists) {
                const profileData = this.parseXML(result.data);
                this.profiles[gameId] = profileData;
                return profileData;
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
        if (this.loaded) return this.profiles;

        // For now, just mark as loaded
        // Profiles will be loaded on-demand when accessed
        this.loaded = true;
        return this.profiles;
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
            profile.year = yearEl.textContent;
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

        xml += `  <LastModified>${escapeXML(customData.lastModified || new Date().toISOString())}</LastModified>\n`;
        xml += '</CustomProfile>';

        return xml;
    }

    /**
     * Get custom profile for a specific game
     * Loads on-demand if not already in memory
     */
    async getProfile(gameId) {
        // Return cached profile if exists
        if (this.profiles[gameId]) {
            return this.profiles[gameId];
        }

        // Load from file
        return await this.loadProfile(gameId);
    }

    /**
     * Set custom profile for a game
     */
    async setProfile(gameId, customData) {
        if (!gameId) return;

        // Get existing profile if any
        const existingProfile = await this.getProfile(gameId);

        // Merge with existing profile
        const mergedData = {
            ...existingProfile,
            ...customData,
            lastModified: new Date().toISOString()
        };

        // Update cache
        this.profiles[gameId] = mergedData;

        // Generate XML and save
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
     */
    async deleteProfile(gameId) {
        try {
            const response = await fetch(`/__customProfile/delete?id=${gameId}`, {
                method: 'POST'
            });

            const result = await response.json();
            if (result.ok) {
                // Remove from cache
                delete this.profiles[gameId];
            } else {
                console.error('Error deleting custom profile:', result.error);
            }
        } catch (error) {
            console.error('Error deleting custom profile:', error);
        }
    }

    /**
     * Check if a game has custom profile data
     */
    async hasCustomProfile(gameId) {
        // Check cache first
        if (this.profiles[gameId]) {
            return true;
        }

        // Check if file exists
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
