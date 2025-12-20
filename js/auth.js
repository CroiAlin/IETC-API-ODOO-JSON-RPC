/**
 * Authentication Module for Odoo API
 * Handles user authentication and session management
 */

class OdooAuth {
    constructor() {
        this.sessionId = null;
        this.userId = null;
        this.serverUrl = null;
        this.database = null;
    }

    /**
     * Authenticate with Odoo server
     * @param {string} url - Odoo server URL
     * @param {string} database - Database name
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Authentication result with session info
     */
    async authenticate(url, database, username, password) {
        try {
            this.serverUrl = url;
            this.database = database;

            const requestBody = {
                jsonrpc: "2.0",
                method: "call",
                params: {
                    db: database,
                    login: username,
                    password: password
                },
                id: Math.floor(Math.random() * 1000000)
            };

            const response = await fetch(`${url}/web/session/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.result && data.result.uid) {
                this.sessionId = data.result.session_id;
                this.userId = data.result.uid;

                // Store session in sessionStorage for persistence across page refreshes
                this.saveSession();

                console.log('✅ Authentication successful!', {
                    sessionId: this.sessionId,
                    userId: this.userId
                });

                return {
                    success: true,
                    sessionId: this.sessionId,
                    userId: this.userId,
                    message: 'Authentication successful'
                };
            } else {
                throw new Error('Authentication failed: Invalid credentials');
            }

        } catch (error) {
            console.error('❌ Authentication error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Save session to sessionStorage
     */
    saveSession() {
        if (this.userId) {
            sessionStorage.setItem('odoo_session', JSON.stringify({
                userId: this.userId,
                serverUrl: this.serverUrl,
                database: this.database
            }));
        }
    }

    /**
     * Load session from sessionStorage
     * @returns {boolean} True if session was restored
     */
    loadSession() {
        const sessionData = sessionStorage.getItem('odoo_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            this.userId = session.userId;
            this.serverUrl = session.serverUrl;
            this.database = session.database;
            console.log('📦 Session restored from storage');
            return true;
        }
        return false;
    }

    /**
     * Clear session
     */
    logout() {
        this.sessionId = null;
        this.userId = null;
        this.serverUrl = null;
        this.database = null;
        sessionStorage.removeItem('odoo_session');
        console.log('🚪 Logged out');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        // Odoo 18 utilise des cookies, sessionId sera undefined
        // On vérifie seulement userId
        return this.userId !== null;
    }

    /**
     * Get current session info
     * @returns {Object|null}
     */
    getSessionInfo() {
        if (this.isAuthenticated()) {
            return {
                userId: this.userId,
                serverUrl: this.serverUrl,
                database: this.database
            };
        }
        return null;
    }
}

// Export as singleton
const odooAuth = new OdooAuth();
