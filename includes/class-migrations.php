<?php
/**
 * Database migrations system
 *
 * Handles incremental database schema updates with version tracking.
 *
 * @package Peanut_Festival
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Migrations {

    /**
     * Current database schema version
     */
    private const CURRENT_VERSION = '1.2.0';

    /**
     * Option name for storing DB version
     */
    private const VERSION_OPTION = 'peanut_festival_db_version';

    /**
     * Option name for storing migration history
     */
    private const HISTORY_OPTION = 'peanut_festival_migration_history';

    /**
     * Check if migrations need to run
     *
     * @return bool
     */
    public static function needs_migration(): bool {
        $current = get_option(self::VERSION_OPTION, '1.0.0');
        return version_compare($current, self::CURRENT_VERSION, '<');
    }

    /**
     * Run all pending migrations
     *
     * @return array Results of migration run
     */
    public static function run(): array {
        $current_version = get_option(self::VERSION_OPTION, '1.0.0');
        $results = [
            'success' => true,
            'from_version' => $current_version,
            'to_version' => self::CURRENT_VERSION,
            'migrations' => [],
        ];

        // Get all migrations that need to run
        $migrations = self::get_migrations();

        foreach ($migrations as $version => $migration) {
            if (version_compare($current_version, $version, '>=')) {
                continue; // Already applied
            }

            $start_time = microtime(true);

            try {
                $migration_result = call_user_func($migration['callback']);

                $results['migrations'][$version] = [
                    'name' => $migration['name'],
                    'success' => true,
                    'time' => round(microtime(true) - $start_time, 4),
                ];

                // Update version after each successful migration
                update_option(self::VERSION_OPTION, $version);

                // Log to history
                self::log_migration($version, $migration['name'], true);

            } catch (Throwable $e) {
                $results['success'] = false;
                $results['migrations'][$version] = [
                    'name' => $migration['name'],
                    'success' => false,
                    'error' => $e->getMessage(),
                    'time' => round(microtime(true) - $start_time, 4),
                ];

                // Log failure
                self::log_migration($version, $migration['name'], false, $e->getMessage());

                // Stop on error
                error_log('Peanut Festival Migration Error: ' . wp_json_encode([
                    'version' => $version,
                    'name' => $migration['name'],
                    'error' => $e->getMessage(),
                ]));

                break;
            }
        }

        return $results;
    }

    /**
     * Get all migrations in version order
     *
     * @return array
     */
    private static function get_migrations(): array {
        return [
            '1.0.1' => [
                'name' => 'Add payment fields to tickets table',
                'callback' => [self::class, 'migration_1_0_1'],
            ],
            '1.0.2' => [
                'name' => 'Add check-in table for QR codes',
                'callback' => [self::class, 'migration_1_0_2'],
            ],
            '1.0.3' => [
                'name' => 'Add email logs table',
                'callback' => [self::class, 'migration_1_0_3'],
            ],
            '1.1.0' => [
                'name' => 'Add settings table and indexes',
                'callback' => [self::class, 'migration_1_1_0'],
            ],
            '1.2.0' => [
                'name' => 'Add job queue table for background processing',
                'callback' => [self::class, 'migration_1_2_0'],
            ],
        ];
    }

    /**
     * Log migration to history
     *
     * @param string $version Migration version
     * @param string $name Migration name
     * @param bool $success Whether migration succeeded
     * @param string|null $error Error message if failed
     */
    private static function log_migration(
        string $version,
        string $name,
        bool $success,
        ?string $error = null
    ): void {
        $history = get_option(self::HISTORY_OPTION, []);

        $history[] = [
            'version' => $version,
            'name' => $name,
            'success' => $success,
            'error' => $error,
            'timestamp' => current_time('mysql'),
        ];

        // Keep last 50 migrations in history
        if (count($history) > 50) {
            $history = array_slice($history, -50);
        }

        update_option(self::HISTORY_OPTION, $history);
    }

    /**
     * Get migration history
     *
     * @return array
     */
    public static function get_history(): array {
        return get_option(self::HISTORY_OPTION, []);
    }

    /**
     * Get current schema version
     *
     * @return string
     */
    public static function get_version(): string {
        return get_option(self::VERSION_OPTION, '1.0.0');
    }

    /**
     * Get target schema version
     *
     * @return string
     */
    public static function get_target_version(): string {
        return self::CURRENT_VERSION;
    }

    // =========================================================================
    // Migration Methods
    // =========================================================================

    /**
     * Migration 1.0.1: Add payment fields to tickets table
     */
    private static function migration_1_0_1(): bool {
        global $wpdb;

        $table = $wpdb->prefix . 'pf_tickets';

        // Check if columns already exist
        $columns = $wpdb->get_col("SHOW COLUMNS FROM $table");

        if (!in_array('payment_id', $columns)) {
            $wpdb->query("ALTER TABLE $table ADD COLUMN payment_id varchar(100) DEFAULT NULL AFTER qr_code");
        }

        if (!in_array('payment_amount', $columns)) {
            $wpdb->query("ALTER TABLE $table ADD COLUMN payment_amount decimal(10,2) DEFAULT NULL AFTER payment_id");
        }

        if (!in_array('payment_status', $columns)) {
            $wpdb->query("ALTER TABLE $table ADD COLUMN payment_status varchar(20) DEFAULT 'pending' AFTER payment_amount");
        }

        if (!in_array('ticket_code', $columns)) {
            $wpdb->query("ALTER TABLE $table ADD COLUMN ticket_code varchar(20) DEFAULT NULL AFTER quantity");
        }

        // Add index for payment_id
        $indexes = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = 'payment_id'");
        if (empty($indexes)) {
            $wpdb->query("ALTER TABLE $table ADD INDEX payment_id (payment_id)");
        }

        return true;
    }

    /**
     * Migration 1.0.2: Add check-in events table
     */
    private static function migration_1_0_2(): bool {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $table = $wpdb->prefix . 'pf_check_ins';

        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            ticket_id bigint(20) unsigned NOT NULL,
            show_id bigint(20) unsigned NOT NULL,
            checked_in_by bigint(20) unsigned DEFAULT NULL,
            check_in_method varchar(20) DEFAULT 'manual',
            device_info text,
            location varchar(255) DEFAULT NULL,
            notes text,
            checked_in_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY ticket_id (ticket_id),
            KEY show_id (show_id),
            KEY checked_in_at (checked_in_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        return true;
    }

    /**
     * Migration 1.0.3: Add email logs table
     */
    private static function migration_1_0_3(): bool {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $table = $wpdb->prefix . 'pf_email_logs';

        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            festival_id bigint(20) unsigned DEFAULT NULL,
            recipient_email varchar(255) NOT NULL,
            recipient_name varchar(255) DEFAULT NULL,
            subject varchar(255) NOT NULL,
            template varchar(100) DEFAULT NULL,
            status varchar(20) DEFAULT 'sent',
            error_message text,
            sent_by bigint(20) unsigned DEFAULT NULL,
            opened_at datetime DEFAULT NULL,
            clicked_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY festival_id (festival_id),
            KEY recipient_email (recipient_email),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        return true;
    }

    /**
     * Migration 1.1.0: Add plugin settings table and optimize indexes
     */
    private static function migration_1_1_0(): bool {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Create settings table for faster option retrieval
        $table = $wpdb->prefix . 'pf_settings';

        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            setting_key varchar(100) NOT NULL,
            setting_value longtext,
            autoload varchar(3) DEFAULT 'yes',
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Add reference field to transactions table if not exists
        $transactions_table = $wpdb->prefix . 'pf_transactions';
        $columns = $wpdb->get_col("SHOW COLUMNS FROM $transactions_table");

        if (!in_array('reference', $columns)) {
            $wpdb->query("ALTER TABLE $transactions_table ADD COLUMN reference varchar(255) DEFAULT NULL AFTER description");
        }

        return true;
    }

    /**
     * Migration 1.2.0: Add job queue table for background processing
     */
    private static function migration_1_2_0(): bool {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $table = $wpdb->prefix . 'pf_job_queue';

        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            job_type varchar(50) NOT NULL,
            payload longtext NOT NULL,
            status varchar(20) DEFAULT 'pending',
            attempts tinyint(3) unsigned DEFAULT 0,
            last_error text,
            scheduled_at datetime NOT NULL,
            started_at datetime DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY job_type (job_type),
            KEY scheduled_at (scheduled_at),
            KEY status_scheduled (status, scheduled_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        return true;
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Reset migration state (for testing/debugging only)
     *
     * @param string $version Version to reset to
     */
    public static function reset_to_version(string $version): void {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return; // Only allow in debug mode
        }

        update_option(self::VERSION_OPTION, $version);
    }

    /**
     * Force run a specific migration (for debugging)
     *
     * @param string $version Migration version to run
     * @return array Result
     */
    public static function run_single(string $version): array {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return ['success' => false, 'error' => 'Debug mode required'];
        }

        $migrations = self::get_migrations();

        if (!isset($migrations[$version])) {
            return ['success' => false, 'error' => 'Migration not found'];
        }

        try {
            call_user_func($migrations[$version]['callback']);
            return ['success' => true];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
