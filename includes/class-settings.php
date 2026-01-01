<?php
/**
 * Settings management class
 *
 * Supports loading sensitive settings from environment variables.
 * Environment variables take precedence over database settings.
 *
 * Environment variable naming convention:
 *   Setting key: firebase_api_key
 *   Env var:     PEANUT_FESTIVAL_FIREBASE_API_KEY
 *
 * Supported environment variables:
 *   - PEANUT_FESTIVAL_FIREBASE_API_KEY
 *   - PEANUT_FESTIVAL_FIREBASE_PROJECT_ID
 *   - PEANUT_FESTIVAL_FIREBASE_DATABASE_URL
 *   - PEANUT_FESTIVAL_FIREBASE_SERVICE_ACCOUNT (JSON string or base64-encoded)
 *   - PEANUT_FESTIVAL_FIREBASE_VAPID_KEY
 *   - PEANUT_FESTIVAL_STRIPE_SECRET_KEY
 *   - PEANUT_FESTIVAL_STRIPE_WEBHOOK_SECRET
 *   - PEANUT_FESTIVAL_EVENTBRITE_API_KEY
 *   - PEANUT_FESTIVAL_EVENTBRITE_CLIENT_SECRET
 *   - PEANUT_FESTIVAL_MAILCHIMP_API_KEY
 *
 * @package Peanut_Festival
 * @since   1.0.0
 * @since   1.3.0 Added environment variable support for sensitive settings.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Settings {

    private const OPTION_KEY = 'peanut_festival_settings';

    /**
     * Prefix for environment variables.
     */
    private const ENV_PREFIX = 'PEANUT_FESTIVAL_';

    /**
     * Settings that support environment variable override.
     * These are sensitive credentials that should not be stored in the database.
     */
    private const SENSITIVE_KEYS = [
        'firebase_api_key',
        'firebase_project_id',
        'firebase_database_url',
        'firebase_service_account',
        'firebase_vapid_key',
        'stripe_secret_key',
        'stripe_publishable_key',
        'stripe_webhook_secret',
        'eventbrite_api_key',
        'eventbrite_client_id',
        'eventbrite_client_secret',
        'eventbrite_webhook_secret',
        'mailchimp_api_key',
        'booker_api_url',
        'booker_api_key',
    ];

    /**
     * Get a setting value.
     *
     * For sensitive settings, checks environment variables first.
     *
     * @since 1.0.0
     * @since 1.3.0 Added environment variable support.
     *
     * @param string $key Setting key. Empty to get all settings.
     * @param mixed $default Default value if not found.
     * @return mixed Setting value or all settings.
     */
    public static function get(string $key = '', mixed $default = null): mixed {
        // Return all settings (excluding env-only values for security)
        if (empty($key)) {
            return get_option(self::OPTION_KEY, []);
        }

        // Check environment variable first for sensitive keys
        if (self::is_sensitive($key)) {
            $env_value = self::get_from_env($key);
            if ($env_value !== null) {
                return $env_value;
            }
        }

        // Fall back to database
        $settings = get_option(self::OPTION_KEY, []);
        return $settings[$key] ?? $default;
    }

    /**
     * Get a setting from environment variable.
     *
     * @since 1.3.0
     *
     * @param string $key Setting key.
     * @return mixed|null Value from env or null if not set.
     */
    private static function get_from_env(string $key): mixed {
        $env_name = self::ENV_PREFIX . strtoupper($key);
        $value = getenv($env_name);

        // Also check $_ENV and $_SERVER for environments that don't populate getenv()
        if ($value === false) {
            $value = $_ENV[$env_name] ?? $_SERVER[$env_name] ?? false;
        }

        if ($value === false) {
            return null;
        }

        // Special handling for service account (may be base64 encoded)
        if ($key === 'firebase_service_account') {
            // Check if it's base64 encoded (doesn't start with '{')
            if (strpos($value, '{') !== 0) {
                $decoded = base64_decode($value, true);
                if ($decoded !== false && strpos($decoded, '{') === 0) {
                    $value = $decoded;
                }
            }
        }

        return $value;
    }

    /**
     * Check if a setting key is sensitive.
     *
     * @since 1.3.0
     *
     * @param string $key Setting key.
     * @return bool Whether the key is sensitive.
     */
    public static function is_sensitive(string $key): bool {
        return in_array($key, self::SENSITIVE_KEYS, true);
    }

    /**
     * Check if a sensitive setting is provided via environment variable.
     *
     * @since 1.3.0
     *
     * @param string $key Setting key.
     * @return bool Whether the setting is from an environment variable.
     */
    public static function is_from_env(string $key): bool {
        if (!self::is_sensitive($key)) {
            return false;
        }
        return self::get_from_env($key) !== null;
    }

    /**
     * Get the environment variable name for a setting.
     *
     * @since 1.3.0
     *
     * @param string $key Setting key.
     * @return string Environment variable name.
     */
    public static function get_env_name(string $key): string {
        return self::ENV_PREFIX . strtoupper($key);
    }

    /**
     * Set a setting value.
     *
     * Note: Setting values for keys that have environment variable overrides
     * will be stored but not used until the env var is removed.
     *
     * @since 1.0.0
     *
     * @param string $key Setting key.
     * @param mixed $value Setting value.
     * @return bool Success.
     */
    public static function set(string $key, mixed $value): bool {
        $settings = get_option(self::OPTION_KEY, []);
        $settings[$key] = $value;
        return update_option(self::OPTION_KEY, $settings);
    }

    /**
     * Update multiple settings at once.
     *
     * @since 1.0.0
     *
     * @param array $values Key-value pairs to update.
     * @return bool Success.
     */
    public static function update(array $values): bool {
        $settings = get_option(self::OPTION_KEY, []);
        $settings = array_merge($settings, $values);
        return update_option(self::OPTION_KEY, $settings);
    }

    /**
     * Delete a setting.
     *
     * @since 1.0.0
     *
     * @param string $key Setting key.
     * @return bool Success.
     */
    public static function delete(string $key): bool {
        $settings = get_option(self::OPTION_KEY, []);
        unset($settings[$key]);
        return update_option(self::OPTION_KEY, $settings);
    }

    /**
     * Get the active festival ID.
     *
     * @since 1.0.0
     *
     * @return int|null Festival ID or null.
     */
    public static function get_active_festival_id(): ?int {
        $id = self::get('active_festival_id');
        return $id ? (int) $id : null;
    }

    /**
     * Set the active festival ID.
     *
     * @since 1.0.0
     *
     * @param int|null $id Festival ID.
     * @return bool Success.
     */
    public static function set_active_festival_id(?int $id): bool {
        return self::set('active_festival_id', $id);
    }

    /**
     * Get all sensitive setting keys.
     *
     * @since 1.3.0
     *
     * @return array List of sensitive setting keys.
     */
    public static function get_sensitive_keys(): array {
        return self::SENSITIVE_KEYS;
    }

    /**
     * Get status of environment variable configuration.
     *
     * Useful for admin UI to show which settings are from env vars.
     *
     * @since 1.3.0
     *
     * @return array Associative array of key => bool (true if from env).
     */
    public static function get_env_status(): array {
        $status = [];
        foreach (self::SENSITIVE_KEYS as $key) {
            $status[$key] = self::is_from_env($key);
        }
        return $status;
    }
}
