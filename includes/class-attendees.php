<?php
/**
 * Attendees and Tickets Management Class
 *
 * Handles attendee registration, ticket management, check-ins,
 * and coupon redemption for festival events.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Attendees
 *
 * Manages festival attendees, their tickets, and promotional coupons.
 * Supports ticket check-in functionality and coupon validation/redemption.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Attendees {

    /**
     * Singleton instance.
     *
     * @since 1.0.0
     * @var Peanut_Festival_Attendees|null
     */
    private static ?Peanut_Festival_Attendees $instance = null;

    /**
     * Get singleton instance.
     *
     * @since 1.0.0
     * @return Peanut_Festival_Attendees The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Attendees {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor for singleton pattern.
     *
     * @since 1.0.0
     */
    private function __construct() {}

    /**
     * Get all attendees with optional filtering and pagination.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter and paginate results.
     *
     *     @type int|null $festival_id Filter by festival ID.
     *     @type string   $search      Search in name and email fields.
     *     @type string   $order_by    Column to sort by. Default 'created_at'.
     *     @type string   $order       Sort direction: 'ASC' or 'DESC'. Default 'DESC'.
     *     @type int      $limit       Maximum results to return. 0 for unlimited.
     *     @type int      $offset      Number of results to skip.
     * }
     * @return array Array of attendee objects.
     */
    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'search' => '',
            'order_by' => 'created_at',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('attendees');

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['search']) {
            $sql .= " AND (name LIKE %s OR email LIKE %s)";
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            $values[] = $search;
            $values[] = $search;
        }

        // Whitelist allowed columns for ORDER BY to prevent SQL injection
        $allowed_columns = ['id', 'name', 'email', 'created_at', 'festival_id'];
        $order_by = in_array($args['order_by'], $allowed_columns, true) ? $args['order_by'] : 'created_at';
        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';
        $sql .= " ORDER BY {$order_by} {$order}";

        if ($args['limit'] > 0) {
            $sql .= " LIMIT %d OFFSET %d";
            $values[] = $args['limit'];
            $values[] = $args['offset'];
        }

        if (!empty($values)) {
            $sql = $wpdb->prepare($sql, ...$values);
        }

        return $wpdb->get_results($sql);
    }

    /**
     * Get an attendee by ID.
     *
     * @since 1.0.0
     *
     * @param int $id The attendee ID.
     * @return object|null The attendee object or null if not found.
     */
    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('attendees', ['id' => $id]);
    }

    /**
     * Get all tickets for an attendee with show information.
     *
     * Returns tickets with joined show details including title, date, and venue.
     *
     * @since 1.0.0
     *
     * @param int $attendee_id The attendee ID.
     * @return array Array of ticket objects with show details.
     */
    public static function get_tickets(int $attendee_id): array {
        global $wpdb;
        $tickets_table = Peanut_Festival_Database::get_table_name('tickets');
        $shows_table = Peanut_Festival_Database::get_table_name('shows');

        return $wpdb->get_results($wpdb->prepare(
            "SELECT t.*, s.title as show_title, s.show_date, s.start_time, s.venue_id
             FROM $tickets_table t
             LEFT JOIN $shows_table s ON t.show_id = s.id
             WHERE t.attendee_id = %d
             ORDER BY s.show_date ASC",
            $attendee_id
        ));
    }

    /**
     * Check in a ticket.
     *
     * Marks the ticket as checked in with a timestamp.
     *
     * @since 1.0.0
     *
     * @param int $ticket_id The ticket ID.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function check_in_ticket(int $ticket_id): int|false {
        return Peanut_Festival_Database::update('tickets', [
            'checked_in' => 1,
            'checked_in_at' => current_time('mysql'),
        ], ['id' => $ticket_id]);
    }

    /**
     * Get coupons with optional filtering.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter results.
     *
     *     @type int|null $festival_id Filter by festival ID.
     *     @type string   $status      Filter by coupon status.
     *     @type int|null $vendor_id   Filter by vendor ID.
     * }
     * @return array Array of coupon objects.
     */
    public static function get_coupons(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'status' => '',
            'vendor_id' => null,
        ];
        $args = wp_parse_args($args, $defaults);

        $where = [];
        if ($args['festival_id']) $where['festival_id'] = $args['festival_id'];
        if ($args['status']) $where['status'] = $args['status'];
        if ($args['vendor_id']) $where['vendor_id'] = $args['vendor_id'];

        return Peanut_Festival_Database::get_results('coupons', $where, 'valid_until', 'ASC');
    }

    /**
     * Create a new coupon.
     *
     * @since 1.0.0
     *
     * @param array $data Coupon data (code, discount_type, discount_value, valid_from, valid_until).
     * @return int|false The new coupon ID on success, false on failure.
     */
    public static function create_coupon(array $data): int|false {
        return Peanut_Festival_Database::insert('coupons', $data);
    }

    /**
     * Redeem a coupon by code.
     *
     * Validates the coupon (active status, date range, usage limits) and increments
     * the usage counter if valid.
     *
     * @since 1.0.0
     *
     * @param string $code The coupon code to redeem.
     * @return object|null The coupon object if valid and redeemed, null otherwise.
     */
    public static function redeem_coupon(string $code): ?object {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('coupons');

        $coupon = Peanut_Festival_Database::get_row('coupons', ['code' => $code]);

        if (!$coupon || $coupon->status !== 'active') {
            return null;
        }

        $today = current_time('Y-m-d');
        if ($coupon->valid_from && $coupon->valid_from > $today) {
            return null;
        }
        if ($coupon->valid_until && $coupon->valid_until < $today) {
            return null;
        }
        if ($coupon->max_uses && $coupon->times_used >= $coupon->max_uses) {
            return null;
        }

        $wpdb->query($wpdb->prepare(
            "UPDATE $table SET times_used = times_used + 1 WHERE id = %d",
            $coupon->id
        ));

        return $coupon;
    }

    /**
     * Count attendees matching criteria.
     *
     * @since 1.0.0
     *
     * @param array $where Optional conditions for counting.
     * @return int The number of matching attendees.
     */
    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('attendees', $where);
    }
}
