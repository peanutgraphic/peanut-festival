<?php
/**
 * Settings management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Settings {

    private const OPTION_KEY = 'peanut_festival_settings';

    public static function get(string $key = '', mixed $default = null): mixed {
        $settings = get_option(self::OPTION_KEY, []);

        if (empty($key)) {
            return $settings;
        }

        return $settings[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): bool {
        $settings = get_option(self::OPTION_KEY, []);
        $settings[$key] = $value;
        return update_option(self::OPTION_KEY, $settings);
    }

    public static function update(array $values): bool {
        $settings = get_option(self::OPTION_KEY, []);
        $settings = array_merge($settings, $values);
        return update_option(self::OPTION_KEY, $settings);
    }

    public static function delete(string $key): bool {
        $settings = get_option(self::OPTION_KEY, []);
        unset($settings[$key]);
        return update_option(self::OPTION_KEY, $settings);
    }

    public static function get_active_festival_id(): ?int {
        $id = self::get('active_festival_id');
        return $id ? (int) $id : null;
    }

    public static function set_active_festival_id(?int $id): bool {
        return self::set('active_festival_id', $id);
    }
}
