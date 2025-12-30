<?php
/**
 * Plugin deactivation handler
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Deactivator {

    public static function deactivate(): void {
        flush_rewrite_rules();

        // Clear any scheduled events
        wp_clear_scheduled_hook('pf_daily_cleanup');
        wp_clear_scheduled_hook('pf_eventbrite_sync');
    }
}
