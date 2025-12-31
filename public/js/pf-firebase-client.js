/**
 * Peanut Festival Firebase Client
 *
 * Handles real-time database listeners and push notifications.
 *
 * @package Peanut_Festival
 * @since 1.2.0
 */
(function(window) {
    'use strict';

    const PFFirebase = {
        // Firebase instances
        app: null,
        database: null,
        messaging: null,

        // Configuration
        config: null,
        initialized: false,

        // Active listeners
        listeners: new Map(),

        // Callbacks
        callbacks: {
            onVoteUpdate: [],
            onMatchUpdate: [],
            onShowUpdate: [],
            onLeaderboardUpdate: [],
            onNotification: [],
        },

        /**
         * Initialize Firebase
         * @param {Object} config Firebase configuration
         */
        async init(config) {
            if (this.initialized) {
                console.log('PFFirebase already initialized');
                return;
            }

            if (!config || !config.enabled) {
                console.log('Firebase is not enabled');
                return;
            }

            this.config = config;

            try {
                // Load Firebase SDK dynamically
                await this.loadFirebaseSDK();

                // Initialize Firebase app
                const firebaseConfig = {
                    apiKey: config.apiKey,
                    projectId: config.projectId,
                    databaseURL: config.databaseURL,
                };

                // Check if Firebase is already initialized
                if (!firebase.apps.length) {
                    this.app = firebase.initializeApp(firebaseConfig);
                } else {
                    this.app = firebase.apps[0];
                }

                // Initialize Realtime Database
                if (config.databaseURL) {
                    this.database = firebase.database();
                }

                // Initialize Cloud Messaging (if supported)
                if ('Notification' in window && config.vapidKey) {
                    try {
                        this.messaging = firebase.messaging();
                        await this.setupMessaging(config.vapidKey);
                    } catch (e) {
                        console.log('FCM not available:', e.message);
                    }
                }

                this.initialized = true;
                console.log('PFFirebase initialized successfully');

            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
            }
        },

        /**
         * Load Firebase SDK dynamically
         */
        async loadFirebaseSDK() {
            if (typeof firebase !== 'undefined') {
                return; // Already loaded
            }

            const version = '9.22.0';
            const cdnBase = 'https://www.gstatic.com/firebasejs/' + version;

            // Load Firebase compat SDK (easier to use)
            await this.loadScript(cdnBase + '/firebase-app-compat.js');
            await this.loadScript(cdnBase + '/firebase-database-compat.js');

            // Try to load messaging (may fail in some contexts)
            try {
                await this.loadScript(cdnBase + '/firebase-messaging-compat.js');
            } catch (e) {
                console.log('FCM SDK not loaded (may be unsupported)');
            }
        },

        /**
         * Load a script dynamically
         * @param {string} src Script URL
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },

        /**
         * Set up Firebase Cloud Messaging
         * @param {string} vapidKey VAPID public key
         */
        async setupMessaging(vapidKey) {
            if (!this.messaging) return;

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return;
            }

            // Get FCM token
            try {
                const token = await this.messaging.getToken({ vapidKey });
                if (token) {
                    console.log('FCM Token:', token);
                    // Store token for subscription
                    this.fcmToken = token;
                }
            } catch (e) {
                console.error('Failed to get FCM token:', e);
            }

            // Handle foreground messages
            this.messaging.onMessage((payload) => {
                console.log('Foreground message:', payload);
                this.handleNotification(payload);
            });
        },

        /**
         * Handle incoming notification
         * @param {Object} payload Notification payload
         */
        handleNotification(payload) {
            const notification = payload.notification || {};
            const data = payload.data || {};

            // Show browser notification if page is visible
            if (document.visibilityState === 'visible') {
                this.showInAppNotification(notification, data);
            }

            // Trigger callbacks
            this.callbacks.onNotification.forEach(cb => cb(notification, data));
        },

        /**
         * Show in-app notification toast
         * @param {Object} notification Notification object
         * @param {Object} data Data payload
         */
        showInAppNotification(notification, data) {
            const toast = document.createElement('div');
            toast.className = 'pf-notification-toast';
            toast.innerHTML = `
                <div class="pf-toast-content">
                    <strong>${this.escapeHtml(notification.title || '')}</strong>
                    <p>${this.escapeHtml(notification.body || '')}</p>
                </div>
                <button class="pf-toast-close">&times;</button>
            `;

            document.body.appendChild(toast);

            // Auto-dismiss after 5 seconds
            setTimeout(() => toast.remove(), 5000);

            // Close button
            toast.querySelector('.pf-toast-close').onclick = () => toast.remove();

            // Click to navigate
            if (data.link) {
                toast.style.cursor = 'pointer';
                toast.onclick = (e) => {
                    if (!e.target.classList.contains('pf-toast-close')) {
                        window.location.href = data.link;
                    }
                };
            }
        },

        // =========================================
        // Real-time Database Listeners
        // =========================================

        /**
         * Listen to vote updates
         * @param {string} showSlug Show slug
         * @param {string} groupName Group name
         * @param {Function} callback Callback function
         */
        listenToVotes(showSlug, groupName, callback) {
            if (!this.database) return;

            const path = `votes/${showSlug}/${groupName}`;
            const key = `votes_${showSlug}_${groupName}`;

            // Remove existing listener
            this.removeListener(key);

            const ref = this.database.ref(path);
            const listener = ref.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    callback(data);
                    this.callbacks.onVoteUpdate.forEach(cb => cb(showSlug, groupName, data));
                }
            });

            this.listeners.set(key, { ref, listener });
        },

        /**
         * Listen to match updates
         * @param {number} matchId Match ID
         * @param {Function} callback Callback function
         */
        listenToMatch(matchId, callback) {
            if (!this.database) return;

            const path = `matches/${matchId}`;
            const key = `match_${matchId}`;

            this.removeListener(key);

            const ref = this.database.ref(path);
            const listener = ref.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    callback(data);
                    this.callbacks.onMatchUpdate.forEach(cb => cb(matchId, data));
                }
            });

            this.listeners.set(key, { ref, listener });
        },

        /**
         * Listen to show updates
         * @param {number} showId Show ID
         * @param {Function} callback Callback function
         */
        listenToShow(showId, callback) {
            if (!this.database) return;

            const path = `shows/${showId}`;
            const key = `show_${showId}`;

            this.removeListener(key);

            const ref = this.database.ref(path);
            const listener = ref.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    callback(data);
                    this.callbacks.onShowUpdate.forEach(cb => cb(showId, data));
                }
            });

            this.listeners.set(key, { ref, listener });
        },

        /**
         * Listen to leaderboard updates
         * @param {number} festivalId Festival ID
         * @param {Function} callback Callback function
         */
        listenToLeaderboard(festivalId, callback) {
            if (!this.database) return;

            const path = `leaderboards/${festivalId}`;
            const key = `leaderboard_${festivalId}`;

            this.removeListener(key);

            const ref = this.database.ref(path);
            const listener = ref.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    callback(data);
                    this.callbacks.onLeaderboardUpdate.forEach(cb => cb(festivalId, data));
                }
            });

            this.listeners.set(key, { ref, listener });
        },

        /**
         * Listen to "now playing" updates for a festival
         * @param {number} festivalId Festival ID
         * @param {Function} callback Callback function
         */
        listenToNowPlaying(festivalId, callback) {
            if (!this.database) return;

            const path = `festivals/${festivalId}/now_playing`;
            const key = `now_playing_${festivalId}`;

            this.removeListener(key);

            const ref = this.database.ref(path);
            ref.on('value', (snapshot) => {
                const data = snapshot.val();
                callback(data);
            });

            this.listeners.set(key, { ref, listener: null });
        },

        /**
         * Remove a listener
         * @param {string} key Listener key
         */
        removeListener(key) {
            if (this.listeners.has(key)) {
                const { ref, listener } = this.listeners.get(key);
                if (ref && listener) {
                    ref.off('value', listener);
                }
                this.listeners.delete(key);
            }
        },

        /**
         * Remove all listeners
         */
        removeAllListeners() {
            this.listeners.forEach((value, key) => {
                this.removeListener(key);
            });
        },

        // =========================================
        // Topic Subscription
        // =========================================

        /**
         * Subscribe to festival notifications
         * @param {number} festivalId Festival ID
         */
        async subscribeToFestival(festivalId) {
            if (!this.fcmToken) {
                console.log('No FCM token available');
                return false;
            }

            try {
                const response = await fetch(pfPublic.apiUrl + '/firebase/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': pfPublic.nonce,
                    },
                    body: JSON.stringify({
                        token: this.fcmToken,
                        festival_id: festivalId,
                    }),
                });

                const data = await response.json();
                console.log('Subscribed to festival:', data);
                return data.success;

            } catch (error) {
                console.error('Failed to subscribe:', error);
                return false;
            }
        },

        // =========================================
        // Callback Registration
        // =========================================

        /**
         * Register callback for vote updates
         * @param {Function} callback Callback function
         */
        onVoteUpdate(callback) {
            this.callbacks.onVoteUpdate.push(callback);
        },

        /**
         * Register callback for match updates
         * @param {Function} callback Callback function
         */
        onMatchUpdate(callback) {
            this.callbacks.onMatchUpdate.push(callback);
        },

        /**
         * Register callback for show updates
         * @param {Function} callback Callback function
         */
        onShowUpdate(callback) {
            this.callbacks.onShowUpdate.push(callback);
        },

        /**
         * Register callback for leaderboard updates
         * @param {Function} callback Callback function
         */
        onLeaderboardUpdate(callback) {
            this.callbacks.onLeaderboardUpdate.push(callback);
        },

        /**
         * Register callback for notifications
         * @param {Function} callback Callback function
         */
        onNotification(callback) {
            this.callbacks.onNotification.push(callback);
        },

        // =========================================
        // Utilities
        // =========================================

        /**
         * Escape HTML to prevent XSS
         * @param {string} text Text to escape
         * @returns {string} Escaped text
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Check if Firebase is ready
         * @returns {boolean} Ready status
         */
        isReady() {
            return this.initialized && this.database !== null;
        },

        /**
         * Get current FCM token
         * @returns {string|null} FCM token
         */
        getToken() {
            return this.fcmToken || null;
        },
    };

    // Export to window
    window.PFFirebase = PFFirebase;

    // Auto-initialize if config is available
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof pfFirebaseConfig !== 'undefined' && pfFirebaseConfig.enabled) {
            PFFirebase.init(pfFirebaseConfig);
        }
    });

})(window);
