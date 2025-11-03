/**
 * LaunchManager - Handles game launching
 */

export class LaunchManager {
    constructor(pathManager) {
        this.pathManager = pathManager;
    }

    /**
     * Launch a game
     * Note: Due to browser security restrictions, we cannot directly execute
     * external programs. This will need to be handled by a custom protocol handler
     * or electron/tauri wrapper in the future.
     */
    async launchGame(game) {
        if (!game.isInstalled) {
            throw new Error('Game is not installed. Please configure game path first.');
        }

        const exePath = this.pathManager.getTeknoParrotExePath();
        const profilePath = this.pathManager.getProfilePath(game.id);
        const profileFile = `${game.id}.xml`;

        // Try local server endpoint first (start-node.bat provides /__launch)
        try {
            // Prefer sending just the profile filename; server accepts both filename and path
            const resp = await fetch(`/__launch?profile=${encodeURIComponent(profileFile)}`, { method: 'POST' });
            if (resp.ok) {
                return { success: true };
            }
        } catch (_) {
            // fall through to manual command
        }

        // Fallback: show the command using UserProfiles as working dir style
        // Example: ..\TeknoParrotUi.exe --profile="abc.xml"
        const command = `..\\TeknoParrotUi.exe --profile="${profileFile}"`;

        console.log('🚀 Launch command:', command);

        // Try to create a custom URL scheme link
        // This would require setting up a custom protocol handler on the OS
        const launchUrl = `teknoparrot://launch?profile=${encodeURIComponent(profileFile)}`;

        // Show launch dialog with command
        return {
            success: false,
            command: command,
            message: 'Copy this command and run it in Command Prompt, or start with start-node.bat to enable one-click launch.',
            launchUrl: launchUrl
        };
    }

    /**
     * Verify game can be launched
     */
    canLaunch(game) {
        return game.isInstalled && game.userProfile?.GamePath;
    }

    /**
     * Get launch command for a game
     */
    getLaunchCommand(game) {
        if (!this.canLaunch(game)) {
            return null;
        }

        const profileFile = `${game.id}.xml`;
        return `..\\TeknoParrotUi.exe --profile="${profileFile}"`;
    }
}
