<?php
/**
 * Object Caching Helper Class
 *
 * Provides a consistent interface for caching expensive operations.
 * Uses WordPress transients with automatic cache invalidation.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Cache
 *
 * Handles object caching for the plugin using WordPress transients.
 * Supports cache groups and automatic invalidation on data changes.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Cache {

    /**
     * Cache prefix to avoid collisions.
     *
     * @since 1.0.0
     * @var string
     */
    private const PREFIX = 'pf_cache_';

    /**
     * Default TTL values by cache type (in seconds).
     *
     * @since 1.0.0
     * @var array
     */
    private const DEFAULT_TTL = [
        'events'      => 300,   // 5 minutes - public event listings
        'shows'       => 300,   // 5 minutes - show data
        'performers'  => 600,   // 10 minutes - performer listings
        'venues'      => 3600,  // 1 hour - venue data rarely changes
        'settings'    => 3600,  // 1 hour - settings rarely change
        'stats'       => 60,    // 1 minute - dashboard stats
        'results'     => 30,    // 30 seconds - voting results (live)
        'default'     => 300,   // 5 minutes default
    ];

    /**
     * Get a cached value.
     *
     * @since 1.0.0
     *
     * @param string $key   The cache key.
     * @param string $group Optional cache group for TTL selection.
     * @return mixed The cached value or false if not found.
     */
    public static function get(string $key, string $group = 'default') {
        $cache_key = self::build_key($key, $group);
        $value = get_transient($cache_key);

        if ($value !== false) {
            Peanut_Festival_Logger::debug('Cache hit', [
                'key' => $key,
                'group' => $group,
            ]);
        }

        return $value;
    }

    /**
     * Set a cached value.
     *
     * @since 1.0.0
     *
     * @param string $key   The cache key.
     * @param mixed  $value The value to cache.
     * @param string $group Optional cache group for TTL selection.
     * @param int    $ttl   Optional custom TTL in seconds.
     * @return bool True on success, false on failure.
     */
    public static function set(string $key, $value, string $group = 'default', int $ttl = 0): bool {
        $cache_key = self::build_key($key, $group);
        $expiration = $ttl > 0 ? $ttl : self::get_ttl($group);

        Peanut_Festival_Logger::debug('Cache set', [
            'key' => $key,
            'group' => $group,
            'ttl' => $expiration,
        ]);

        return set_transient($cache_key, $value, $expiration);
    }

    /**
     * Delete a cached value.
     *
     * @since 1.0.0
     *
     * @param string $key   The cache key.
     * @param string $group Optional cache group.
     * @return bool True on success, false on failure.
     */
    public static function delete(string $key, string $group = 'default'): bool {
        $cache_key = self::build_key($key, $group);
        return delete_transient($cache_key);
    }

    /**
     * Get or set a cached value using a callback.
     *
     * If the value doesn't exist in cache, the callback is executed
     * and its return value is cached.
     *
     * @since 1.0.0
     *
     * @param string   $key      The cache key.
     * @param callable $callback Callback to generate the value if not cached.
     * @param string   $group    Optional cache group for TTL selection.
     * @param int      $ttl      Optional custom TTL in seconds.
     * @return mixed The cached or freshly generated value.
     */
    public static function remember(string $key, callable $callback, string $group = 'default', int $ttl = 0) {
        $cached = self::get($key, $group);

        if ($cached !== false) {
            return $cached;
        }

        $value = $callback();

        // Only cache non-null/non-false values
        if ($value !== null && $value !== false) {
            self::set($key, $value, $group, $ttl);
        }

        return $value;
    }

    /**
     * Invalidate all cache entries for a group.
     *
     * Uses a version key to invalidate all entries in a group
     * without having to delete each one individually.
     *
     * @since 1.0.0
     *
     * @param string $group The cache group to invalidate.
     * @return bool True on success.
     */
    public static function invalidate_group(string $group): bool {
        $version_key = self::PREFIX . 'version_' . $group;
        $new_version = time();

        Peanut_Festival_Logger::debug('Cache group invalidated', [
            'group' => $group,
            'new_version' => $new_version,
        ]);

        return set_transient($version_key, $new_version, 0);
    }

    /**
     * Clear all plugin caches.
     *
     * @since 1.0.0
     *
     * @return bool True on success.
     */
    public static function flush_all(): bool {
        global $wpdb;

        // Delete all transients with our prefix
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                '_transient_' . self::PREFIX . '%',
                '_transient_timeout_' . self::PREFIX . '%'
            )
        );

        Peanut_Festival_Logger::info('All plugin caches flushed');

        return true;
    }

    /**
     * Build a cache key with version support.
     *
     * @since 1.0.0
     *
     * @param string $key   The base cache key.
     * @param string $group The cache group.
     * @return string The full cache key.
     */
    private static function build_key(string $key, string $group): string {
        $version = self::get_group_version($group);
        return self::PREFIX . $group . '_v' . $version . '_' . md5($key);
    }

    /**
     * Get the current version for a cache group.
     *
     * @since 1.0.0
     *
     * @param string $group The cache group.
     * @return int The version number.
     */
    private static function get_group_version(string $group): int {
        $version_key = self::PREFIX . 'version_' . $group;
        $version = get_transient($version_key);

        if ($version === false) {
            $version = 1;
            set_transient($version_key, $version, 0);
        }

        return (int) $version;
    }

    /**
     * Get TTL for a cache group.
     *
     * @since 1.0.0
     *
     * @param string $group The cache group.
     * @return int TTL in seconds.
     */
    private static function get_ttl(string $group): int {
        return self::DEFAULT_TTL[$group] ?? self::DEFAULT_TTL['default'];
    }

    /**
     * Cache public events listing.
     *
     * @since 1.0.0
     *
     * @param int|null $festival_id Optional festival ID filter.
     * @return array Cached or fresh events list.
     */
    public static function get_public_events(?int $festival_id = null): array {
        $key = 'public_events_' . ($festival_id ?? 'all');

        return self::remember($key, function() use ($festival_id) {
            $args = [
                'festival_id' => $festival_id,
                'status' => ['on_sale', 'sold_out', 'scheduled'],
                'order_by' => 'show_date',
                'order' => 'ASC',
            ];

            $shows = Peanut_Festival_Shows::get_all($args);

            return array_map(function($show) {
                return [
                    'id' => $show->id,
                    'title' => $show->title,
                    'description' => $show->description,
                    'show_date' => $show->show_date,
                    'start_time' => $show->start_time,
                    'end_time' => $show->end_time,
                    'venue_name' => $show->venue_name ?? '',
                    'venue_address' => $show->venue_address ?? '',
                    'status' => $show->status,
                    'featured' => (bool) $show->featured,
                    'kid_friendly' => (bool) $show->kid_friendly,
                ];
            }, $shows);
        }, 'events');
    }

    /**
     * Cache show performers.
     *
     * @since 1.0.0
     *
     * @param int $show_id The show ID.
     * @return array Cached or fresh performers list.
     */
    public static function get_show_performers(int $show_id): array {
        $key = 'show_performers_' . $show_id;

        return self::remember($key, function() use ($show_id) {
            return Peanut_Festival_Shows::get_performers($show_id);
        }, 'shows');
    }

    /**
     * Cache dashboard statistics.
     *
     * @since 1.0.0
     *
     * @param int $festival_id The festival ID.
     * @return array Cached or fresh statistics.
     */
    public static function get_dashboard_stats(int $festival_id): array {
        $key = 'dashboard_stats_' . $festival_id;

        return self::remember($key, function() use ($festival_id) {
            return [
                'shows' => Peanut_Festival_Shows::count(['festival_id' => $festival_id]),
                'performers' => Peanut_Festival_Performers::count(['festival_id' => $festival_id]),
                'performers_pending' => Peanut_Festival_Performers::count([
                    'festival_id' => $festival_id,
                    'application_status' => 'pending',
                ]),
                'volunteers' => Peanut_Festival_Volunteers::count(['festival_id' => $festival_id]),
                'vendors' => Peanut_Festival_Vendors::count(['festival_id' => $festival_id]),
                'attendees' => Peanut_Festival_Attendees::count(['festival_id' => $festival_id]),
            ];
        }, 'stats');
    }

    /**
     * Cache venue list.
     *
     * @since 1.0.0
     *
     * @return array Cached or fresh venues list.
     */
    public static function get_venues(): array {
        return self::remember('all_venues', function() {
            return Peanut_Festival_Venues::get_all();
        }, 'venues');
    }
}
