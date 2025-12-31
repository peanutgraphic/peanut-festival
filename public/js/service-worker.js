/**
 * Peanut Festival Service Worker
 *
 * Handles:
 * - Push notifications via Firebase Cloud Messaging
 * - Offline caching for schedule and static assets
 * - Background sync for vote submissions
 *
 * @package Peanut_Festival
 * @since 1.2.0
 */

const CACHE_VERSION = 'pf-v1.2.0';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
const SCHEDULE_CACHE = CACHE_VERSION + '-schedule';

// Assets to cache on install
const STATIC_ASSETS = [
    '/wp-content/plugins/peanut-festival/public/css/public.css',
    '/wp-content/plugins/peanut-festival/public/css/bracket.css',
    '/wp-content/plugins/peanut-festival/public/css/live-votes.css',
    '/wp-content/plugins/peanut-festival/public/css/leaderboard.css',
    '/wp-content/plugins/peanut-festival/public/css/winner.css',
    '/wp-content/plugins/peanut-festival/public/js/public.js',
    '/wp-content/plugins/peanut-festival/public/js/bracket.js',
    '/wp-content/plugins/peanut-festival/public/js/live-votes.js',
    '/wp-content/plugins/peanut-festival/public/js/leaderboard.js',
    '/wp-content/plugins/peanut-festival/public/js/winner.js',
    '/wp-content/plugins/peanut-festival/public/js/pf-firebase-client.js',
    '/wp-content/plugins/peanut-festival/public/images/icon-192.png',
];

// API endpoints to cache for offline
const CACHEABLE_API = [
    '/wp-json/peanut-festival/v1/events',
    '/wp-json/peanut-festival/v1/leaderboard',
];

// =========================================
// Install Event
// =========================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.filter(url => url));
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('[SW] Cache install failed:', error);
            })
    );
});

// =========================================
// Activate Event
// =========================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('pf-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== SCHEDULE_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// =========================================
// Fetch Event
// =========================================

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip browser extensions and other origins
    if (!url.origin.includes(self.location.origin)) {
        return;
    }

    // Handle API requests
    if (url.pathname.includes('/wp-json/peanut-festival/')) {
        event.respondWith(handleAPIRequest(event.request));
        return;
    }

    // Handle static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticRequest(event.request));
        return;
    }

    // Network first for everything else
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    return pathname.includes('/peanut-festival/public/') ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.svg');
}

/**
 * Handle static asset requests (cache first)
 */
async function handleStaticRequest(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Static fetch failed:', error);
        throw error;
    }
}

/**
 * Handle API requests (network first with cache fallback)
 */
async function handleAPIRequest(request) {
    const url = new URL(request.url);

    try {
        const response = await fetch(request);

        // Cache successful GET requests for certain endpoints
        if (response.ok && CACHEABLE_API.some(ep => url.pathname.includes(ep))) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }

        return response;

    } catch (error) {
        console.log('[SW] API fetch failed, trying cache:', request.url);

        const cached = await caches.match(request);
        if (cached) {
            // Add header to indicate cached response
            const headers = new Headers(cached.headers);
            headers.set('X-From-Cache', 'true');
            return new Response(cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers: headers,
            });
        }

        // Return offline JSON response
        return new Response(
            JSON.stringify({
                success: false,
                offline: true,
                message: 'You are offline. Please check your connection.',
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

// =========================================
// Push Notifications
// =========================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: 'Peanut Festival',
        body: 'You have a new notification',
        icon: '/wp-content/plugins/peanut-festival/public/images/icon-192.png',
        badge: '/wp-content/plugins/peanut-festival/public/images/badge-72.png',
        data: {},
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = {
                ...data,
                ...payload.notification,
                data: payload.data || {},
            };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: data.data,
        actions: getNotificationActions(data.data?.type),
        requireInteraction: data.data?.type === 'voting_starting',
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

/**
 * Get notification actions based on type
 */
function getNotificationActions(type) {
    switch (type) {
        case 'voting_starting':
            return [
                { action: 'vote', title: 'Vote Now', icon: '/wp-content/plugins/peanut-festival/public/images/icon-vote.png' },
                { action: 'dismiss', title: 'Dismiss' },
            ];
        case 'performer_on_stage':
            return [
                { action: 'view', title: 'View', icon: '/wp-content/plugins/peanut-festival/public/images/icon-view.png' },
                { action: 'dismiss', title: 'Dismiss' },
            ];
        case 'winner_announced':
            return [
                { action: 'celebrate', title: 'See Winner', icon: '/wp-content/plugins/peanut-festival/public/images/icon-trophy.png' },
            ];
        default:
            return [];
    }
}

// =========================================
// Notification Click
// =========================================

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    const data = event.notification.data || {};
    let url = '/';

    // Determine URL based on action and data
    if (event.action === 'vote' && data.show_id) {
        url = `/?vote=${data.show_id}`;
    } else if (event.action === 'view' && data.performer_id) {
        url = `/?performer=${data.performer_id}`;
    } else if (event.action === 'celebrate' && data.competition_id) {
        url = `/?winner=${data.competition_id}`;
    } else if (data.link) {
        url = data.link;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's an open window to focus
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // Open new window if none found
                return clients.openWindow(url);
            })
    );
});

// =========================================
// Background Sync
// =========================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-votes') {
        event.waitUntil(syncPendingVotes());
    }
});

/**
 * Sync pending votes from IndexedDB
 */
async function syncPendingVotes() {
    // This would require IndexedDB integration
    // For now, just log that sync was triggered
    console.log('[SW] Would sync pending votes here');
}

// =========================================
// Message Handling
// =========================================

self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_SCHEDULE') {
        cacheScheduleData(event.data.url);
    }
});

/**
 * Cache schedule data for offline use
 */
async function cacheScheduleData(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const cache = await caches.open(SCHEDULE_CACHE);
            await cache.put(url, response);
            console.log('[SW] Schedule cached for offline');
        }
    } catch (error) {
        console.error('[SW] Failed to cache schedule:', error);
    }
}

console.log('[SW] Service worker loaded');
