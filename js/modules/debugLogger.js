/**
 * Debug Logger Module
 * Centralized logging system for debugging startup, game loading, and other operations
 */

class DebugLogger {
    constructor() {
        this.logs = [];
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        this.logToConsole = true; // Also log to browser console
        this.logToFile = true; // Also write to file on server
        this.maxLogs = 1000; // Keep last 1000 log entries in memory
        this.writeQueue = []; // Queue for batching writes
        this.writeTimer = null;

        // Write session header to file
        this.writeToFile(`\n${'='.repeat(80)}\nCLIENT SESSION STARTED: ${new Date().toISOString()}\nSession ID: ${this.sessionId}\nUser Agent: ${navigator.userAgent}\n${'='.repeat(80)}\n`);

        this.log('INFO', 'DebugLogger', 'Debug logging initialized', { sessionId: this.sessionId });
    }

    /**
     * Generate a unique session ID for this logging session
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${timestamp}-${random}`;
    }

    /**
     * Get relative timestamp since logger initialization
     */
    getRelativeTime() {
        return Date.now() - this.startTime;
    }

    /**
     * Core logging method
     */
    log(level, category, message, data = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            relativeTime: this.getRelativeTime(),
            level: level.toUpperCase(),
            category,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : null // Deep copy to avoid reference issues
        };

        // Add to in-memory logs
        this.logs.push(entry);

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Also output to console
        if (this.logToConsole) {
            this.outputToConsole(entry);
        }

        // Write to file
        if (this.logToFile) {
            const emoji = this.getLevelEmoji(entry.level);
            const timeStr = `[+${(entry.relativeTime / 1000).toFixed(2)}s]`;
            const logText = `${entry.timestamp} ${timeStr} ${emoji} [CLIENT] [${entry.category}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}`;
            this.writeToFile(logText);
        }

        return entry;
    }

    /**
     * Output log entry to browser console
     */
    outputToConsole(entry) {
        const emoji = this.getLevelEmoji(entry.level);
        const timeStr = `[+${(entry.relativeTime / 1000).toFixed(2)}s]`;
        const prefix = `${emoji} ${timeStr} [${entry.category}]`;

        const consoleMethod = this.getConsoleMethod(entry.level);

        if (entry.data) {
            console[consoleMethod](prefix, entry.message, entry.data);
        } else {
            console[consoleMethod](prefix, entry.message);
        }
    }

    /**
     * Get emoji for log level
     */
    getLevelEmoji(level) {
        const emojis = {
            'ERROR': '❌',
            'WARN': '⚠️',
            'INFO': '🦜',
            'SUCCESS': '✅',
            'DEBUG': '🔍',
            'PERF': '⏱️',
            'DATA': '📊',
            'FILE': '📂',
            'GAME': '🎮',
            'UI': '🖼️',
            'SERVER': '🖥️'
        };
        return emojis[level] || 'ℹ️';
    }

    /**
     * Get console method for log level
     */
    getConsoleMethod(level) {
        switch(level) {
            case 'ERROR': return 'error';
            case 'WARN': return 'warn';
            case 'DEBUG': return 'debug';
            default: return 'log';
        }
    }

    // Convenience methods for different log levels
    error(category, message, data = null) {
        return this.log('ERROR', category, message, data);
    }

    warn(category, message, data = null) {
        return this.log('WARN', category, message, data);
    }

    info(category, message, data = null) {
        return this.log('INFO', category, message, data);
    }

    success(category, message, data = null) {
        return this.log('SUCCESS', category, message, data);
    }

    debug(category, message, data = null) {
        return this.log('DEBUG', category, message, data);
    }

    // Specialized logging methods
    perf(category, message, duration, data = null) {
        const perfData = { duration_ms: duration, ...data };
        return this.log('PERF', category, message, perfData);
    }

    dataLog(category, message, data = null) {
        return this.log('DATA', category, message, data);
    }

    fileLog(category, message, data = null) {
        return this.log('FILE', category, message, data);
    }

    gameLog(category, message, data = null) {
        return this.log('GAME', category, message, data);
    }

    uiLog(category, message, data = null) {
        return this.log('UI', category, message, data);
    }

    serverLog(category, message, data = null) {
        return this.log('SERVER', category, message, data);
    }

    /**
     * Start a performance timer
     */
    startTimer(label) {
        return {
            label,
            startTime: Date.now(),
            end: () => {
                const duration = Date.now() - this.startTime;
                this.perf(label, `${label} completed`, duration);
                return duration;
            }
        };
    }

    /**
     * Get all logs or filtered logs
     */
    getLogs(filter = {}) {
        let filtered = [...this.logs];

        if (filter.level) {
            filtered = filtered.filter(log => log.level === filter.level.toUpperCase());
        }

        if (filter.category) {
            filtered = filtered.filter(log => log.category === filter.category);
        }

        if (filter.since) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since);
        }

        return filtered;
    }

    /**
     * Get logs as formatted text
     */
    getLogsAsText(filter = {}) {
        const logs = this.getLogs(filter);
        return logs.map(entry => {
            const timeStr = `[+${(entry.relativeTime / 1000).toFixed(2)}s]`;
            const dataStr = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : '';
            return `${entry.timestamp} ${timeStr} [${entry.level}] [${entry.category}] ${entry.message}${dataStr}`;
        }).join('\n');
    }

    /**
     * Export logs as downloadable file
     */
    exportLogs(filename = null) {
        if (!filename) {
            filename = `parrot-debug-${this.sessionId}.log`;
        }

        const content = this.getLogsAsText();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);

        this.success('DebugLogger', `Logs exported to ${filename}`, { logCount: this.logs.length });
    }

    /**
     * Export logs as JSON
     */
    exportLogsJSON(filename = null) {
        if (!filename) {
            filename = `parrot-debug-${this.sessionId}.json`;
        }

        const exportData = {
            sessionId: this.sessionId,
            exportTime: new Date().toISOString(),
            logCount: this.logs.length,
            logs: this.logs
        };

        const content = JSON.stringify(exportData, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);

        this.success('DebugLogger', `Logs exported to ${filename}`, { logCount: this.logs.length });
    }

    /**
     * Get summary statistics
     */
    getStats() {
        const stats = {
            totalLogs: this.logs.length,
            sessionId: this.sessionId,
            uptime: this.getRelativeTime(),
            byLevel: {},
            byCategory: {}
        };

        this.logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

            // Count by category
            stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear all logs
     */
    clear() {
        const count = this.logs.length;
        this.logs = [];
        this.info('DebugLogger', `Cleared ${count} log entries`);
    }

    /**
     * Log an error with stack trace
     */
    logError(category, message, error) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            name: error.name
        };
        return this.error(category, message, errorData);
    }

    /**
     * Write log text to file on server
     */
    writeToFile(logText) {
        // Add to write queue
        this.writeQueue.push(logText);

        // Clear existing timer
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
        }

        // Batch writes - flush after 500ms of no new logs, or immediately if queue is large
        if (this.writeQueue.length >= 10) {
            this.flushToFile();
        } else {
            this.writeTimer = setTimeout(() => this.flushToFile(), 500);
        }
    }

    /**
     * Flush queued logs to file
     */
    async flushToFile() {
        if (this.writeQueue.length === 0) return;

        const logsToWrite = [...this.writeQueue];
        this.writeQueue = [];

        try {
            await fetch('/__writeDebugLog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logText: logsToWrite.join('\n') })
            });
        } catch (e) {
            // Silently fail - don't want logging to break the app
            console.warn('Failed to write logs to file:', e.message);
        }
    }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
    window.debugLogger = debugLogger;

    // Flush logs when page unloads
    window.addEventListener('beforeunload', () => {
        // Use synchronous XHR for beforeunload to ensure logs are written
        if (debugLogger.writeQueue.length > 0) {
            const logsToWrite = debugLogger.writeQueue.join('\n');
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/__writeDebugLog', false); // Synchronous
            xhr.setRequestHeader('Content-Type', 'application/json');
            try {
                xhr.send(JSON.stringify({ logText: logsToWrite }));
            } catch (e) {
                // Ignore errors on page unload
            }
        }
    });
}

export default debugLogger;
