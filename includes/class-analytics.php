<?php
/**
 * Analytics and metrics class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Analytics {

    private static ?Peanut_Festival_Analytics $instance = null;

    public static function get_instance(): Peanut_Festival_Analytics {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_dashboard_stats(int $festival_id): array {
        return [
            'shows' => self::get_shows_stats($festival_id),
            'performers' => self::get_performers_stats($festival_id),
            'volunteers' => self::get_volunteers_stats($festival_id),
            'tickets' => self::get_tickets_stats($festival_id),
            'financials' => self::get_financial_stats($festival_id),
        ];
    }

    public static function get_shows_stats(int $festival_id): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('shows');

        $results = $wpdb->get_row($wpdb->prepare(
            "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
                SUM(CASE WHEN status = 'on_sale' THEN 1 ELSE 0 END) as on_sale,
                SUM(CASE WHEN status = 'sold_out' THEN 1 ELSE 0 END) as sold_out
             FROM $table WHERE festival_id = %d",
            $festival_id
        ));

        return [
            'total' => (int) $results->total,
            'completed' => (int) $results->completed,
            'scheduled' => (int) $results->scheduled,
            'on_sale' => (int) $results->on_sale,
            'sold_out' => (int) $results->sold_out,
        ];
    }

    public static function get_performers_stats(int $festival_id): array {
        return Peanut_Festival_Performers::get_status_counts($festival_id);
    }

    public static function get_volunteers_stats(int $festival_id): array {
        global $wpdb;
        $vol_table = Peanut_Festival_Database::get_table_name('volunteers');
        $shift_table = Peanut_Festival_Database::get_table_name('volunteer_shifts');

        $volunteers = $wpdb->get_row($wpdb->prepare(
            "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(hours_completed) as total_hours
             FROM $vol_table WHERE festival_id = %d",
            $festival_id
        ));

        $shifts = $wpdb->get_row($wpdb->prepare(
            "SELECT
                COUNT(*) as total,
                SUM(slots_total) as total_slots,
                SUM(slots_filled) as filled_slots
             FROM $shift_table WHERE festival_id = %d",
            $festival_id
        ));

        return [
            'total_volunteers' => (int) $volunteers->total,
            'active_volunteers' => (int) $volunteers->active,
            'total_hours' => (float) $volunteers->total_hours,
            'total_shifts' => (int) $shifts->total,
            'total_slots' => (int) $shifts->total_slots,
            'filled_slots' => (int) $shifts->filled_slots,
        ];
    }

    public static function get_tickets_stats(int $festival_id): array {
        global $wpdb;
        $tickets_table = Peanut_Festival_Database::get_table_name('tickets');
        $shows_table = Peanut_Festival_Database::get_table_name('shows');

        $results = $wpdb->get_row($wpdb->prepare(
            "SELECT
                COUNT(DISTINCT t.id) as total_tickets,
                SUM(t.quantity) as total_quantity,
                SUM(t.total_paid) as total_revenue,
                SUM(CASE WHEN t.checked_in = 1 THEN t.quantity ELSE 0 END) as checked_in
             FROM $tickets_table t
             JOIN $shows_table s ON t.show_id = s.id
             WHERE s.festival_id = %d",
            $festival_id
        ));

        return [
            'total_tickets' => (int) $results->total_tickets,
            'total_quantity' => (int) $results->total_quantity,
            'total_revenue' => (float) $results->total_revenue,
            'checked_in' => (int) $results->checked_in,
        ];
    }

    public static function get_financial_stats(int $festival_id): array {
        return Peanut_Festival_Transactions::get_summary($festival_id);
    }

    public static function log_activity(array $data): int|false {
        $data['user_id'] = $data['user_id'] ?? get_current_user_id();
        $data['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? '';
        $data['created_at'] = current_time('mysql');

        if (!empty($data['details']) && is_array($data['details'])) {
            $data['details'] = wp_json_encode($data['details']);
        }

        return Peanut_Festival_Database::insert('activity_log', $data);
    }

    public static function get_activity_log(int $festival_id, int $limit = 50): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('activity_log');
        $users_table = $wpdb->users;

        return $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, u.display_name as user_name
             FROM $table a
             LEFT JOIN $users_table u ON a.user_id = u.ID
             WHERE a.festival_id = %d
             ORDER BY a.created_at DESC
             LIMIT %d",
            $festival_id, $limit
        ));
    }
}
