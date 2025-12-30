<?php
/**
 * Volunteers Management Class
 *
 * Handles volunteer registration, shift scheduling, assignments, and
 * check-in/check-out tracking for festival volunteers.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Volunteers
 *
 * Manages volunteers and their shift assignments. Supports creating shifts,
 * assigning volunteers, and tracking hours worked via check-in/check-out.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Volunteers {

    /**
     * Singleton instance.
     *
     * @since 1.0.0
     * @var Peanut_Festival_Volunteers|null
     */
    private static ?Peanut_Festival_Volunteers $instance = null;

    /**
     * Get singleton instance.
     *
     * @since 1.0.0
     * @return Peanut_Festival_Volunteers The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Volunteers {
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
     * Get all volunteers with optional filtering and pagination.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter and paginate results.
     *
     *     @type int|null $festival_id Filter by festival ID.
     *     @type string   $status      Filter by volunteer status.
     *     @type string   $search      Search in name and email fields.
     *     @type string   $order_by    Column to sort by. Default 'created_at'.
     *     @type string   $order       Sort direction: 'ASC' or 'DESC'. Default 'DESC'.
     *     @type int      $limit       Maximum results to return. 0 for unlimited.
     *     @type int      $offset      Number of results to skip.
     * }
     * @return array Array of volunteer objects.
     */
    public static function get_all(array $args = []): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('volunteers');

        $defaults = [
            'festival_id' => null,
            'status' => '',
            'search' => '',
            'order_by' => 'created_at',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['status']) {
            $sql .= " AND status = %s";
            $values[] = $args['status'];
        }

        if ($args['search']) {
            $sql .= " AND (name LIKE %s OR email LIKE %s)";
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            $values[] = $search;
            $values[] = $search;
        }

        // Whitelist allowed columns for ORDER BY to prevent SQL injection
        $allowed_columns = ['id', 'name', 'email', 'status', 'created_at', 'festival_id', 'hours_completed'];
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
     * Get a volunteer by ID.
     *
     * @since 1.0.0
     *
     * @param int $id The volunteer ID.
     * @return object|null The volunteer object or null if not found.
     */
    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('volunteers', ['id' => $id]);
    }

    /**
     * Create a new volunteer record.
     *
     * Encodes skills and availability arrays as JSON if provided.
     *
     * @since 1.0.0
     *
     * @param array $data Volunteer data (name, email, phone, skills, availability).
     * @return int|false The new volunteer ID on success, false on failure.
     */
    public static function create(array $data): int|false {
        $data['created_at'] = current_time('mysql');
        if (!empty($data['skills']) && is_array($data['skills'])) {
            $data['skills'] = wp_json_encode($data['skills']);
        }
        if (!empty($data['availability']) && is_array($data['availability'])) {
            $data['availability'] = wp_json_encode($data['availability']);
        }
        return Peanut_Festival_Database::insert('volunteers', $data);
    }

    /**
     * Update an existing volunteer record.
     *
     * Encodes skills and availability arrays as JSON if provided.
     *
     * @since 1.0.0
     *
     * @param int   $id   The volunteer ID to update.
     * @param array $data Fields to update.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');
        if (!empty($data['skills']) && is_array($data['skills'])) {
            $data['skills'] = wp_json_encode($data['skills']);
        }
        if (!empty($data['availability']) && is_array($data['availability'])) {
            $data['availability'] = wp_json_encode($data['availability']);
        }
        return Peanut_Festival_Database::update('volunteers', $data, ['id' => $id]);
    }

    /**
     * Delete a volunteer and their shift assignments.
     *
     * @since 1.0.0
     *
     * @param int $id The volunteer ID to delete.
     * @return int|false Number of rows deleted on success, false on failure.
     */
    public static function delete(int $id): int|false {
        Peanut_Festival_Database::delete('volunteer_assignments', ['volunteer_id' => $id]);
        return Peanut_Festival_Database::delete('volunteers', ['id' => $id]);
    }

    /**
     * Get volunteer shifts with optional filtering.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter results.
     *
     *     @type int|null $festival_id Filter by festival ID.
     *     @type string   $shift_date  Filter by specific date.
     *     @type string   $status      Filter by shift status.
     *     @type string   $order_by    Column to sort by. Default 'shift_date'.
     *     @type string   $order       Sort direction. Default 'ASC'.
     * }
     * @return array Array of shift objects.
     */
    public static function get_shifts(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'shift_date' => '',
            'status' => '',
            'order_by' => 'shift_date',
            'order' => 'ASC',
        ];
        $args = wp_parse_args($args, $defaults);

        $where = [];
        if ($args['festival_id']) $where['festival_id'] = $args['festival_id'];
        if ($args['status']) $where['status'] = $args['status'];

        return Peanut_Festival_Database::get_results('volunteer_shifts', $where, $args['order_by'], $args['order']);
    }

    /**
     * Create a new volunteer shift.
     *
     * @since 1.0.0
     *
     * @param array $data Shift data (festival_id, title, shift_date, start_time, end_time, slots_required).
     * @return int|false The new shift ID on success, false on failure.
     */
    public static function create_shift(array $data): int|false {
        return Peanut_Festival_Database::insert('volunteer_shifts', $data);
    }

    /**
     * Update an existing volunteer shift.
     *
     * @since 1.0.0
     *
     * @param int   $id   The shift ID to update.
     * @param array $data Fields to update.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function update_shift(int $id, array $data): int|false {
        return Peanut_Festival_Database::update('volunteer_shifts', $data, ['id' => $id]);
    }

    /**
     * Delete a volunteer shift and all its assignments.
     *
     * @since 1.0.0
     *
     * @param int $id The shift ID to delete.
     * @return int|false Number of rows deleted on success, false on failure.
     */
    public static function delete_shift(int $id): int|false {
        Peanut_Festival_Database::delete('volunteer_assignments', ['shift_id' => $id]);
        return Peanut_Festival_Database::delete('volunteer_shifts', ['id' => $id]);
    }

    /**
     * Assign a volunteer to a shift.
     *
     * Creates an assignment record and increments the shift's slots_filled count.
     *
     * @since 1.0.0
     *
     * @param int $shift_id     The shift ID.
     * @param int $volunteer_id The volunteer ID.
     * @return int|false The assignment ID on success, false on failure.
     */
    public static function assign_to_shift(int $shift_id, int $volunteer_id): int|false {
        $result = Peanut_Festival_Database::insert('volunteer_assignments', [
            'shift_id' => $shift_id,
            'volunteer_id' => $volunteer_id,
        ]);

        if ($result) {
            // Update slots_filled count
            global $wpdb;
            $table = Peanut_Festival_Database::get_table_name('volunteer_shifts');
            $wpdb->query($wpdb->prepare(
                "UPDATE $table SET slots_filled = slots_filled + 1 WHERE id = %d",
                $shift_id
            ));
        }

        return $result;
    }

    /**
     * Check in a volunteer for their shift.
     *
     * Records the check-in timestamp for the assignment.
     *
     * @since 1.0.0
     *
     * @param int $volunteer_id The volunteer ID.
     * @param int $shift_id     The shift ID.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function check_in(int $volunteer_id, int $shift_id): int|false {
        return Peanut_Festival_Database::update('volunteer_assignments', [
            'checked_in' => 1,
            'checked_in_at' => current_time('mysql'),
        ], [
            'volunteer_id' => $volunteer_id,
            'shift_id' => $shift_id,
        ]);
    }

    /**
     * Check out a volunteer from their shift.
     *
     * Calculates hours worked based on check-in time and updates the
     * volunteer's total hours_completed.
     *
     * @since 1.0.0
     *
     * @param int $volunteer_id The volunteer ID.
     * @param int $shift_id     The shift ID.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function check_out(int $volunteer_id, int $shift_id): int|false {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('volunteer_assignments');

        $assignment = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE volunteer_id = %d AND shift_id = %d",
            $volunteer_id, $shift_id
        ));

        if (!$assignment || !$assignment->checked_in_at) {
            return false;
        }

        $check_in = strtotime($assignment->checked_in_at);
        $check_out = current_time('timestamp');
        $hours = ($check_out - $check_in) / 3600;

        $result = Peanut_Festival_Database::update('volunteer_assignments', [
            'checked_out_at' => current_time('mysql'),
            'hours_worked' => round($hours, 2),
        ], [
            'volunteer_id' => $volunteer_id,
            'shift_id' => $shift_id,
        ]);

        if ($result) {
            // Update volunteer's total hours
            $vol_table = Peanut_Festival_Database::get_table_name('volunteers');
            $wpdb->query($wpdb->prepare(
                "UPDATE $vol_table SET hours_completed = hours_completed + %f WHERE id = %d",
                round($hours, 2), $volunteer_id
            ));
        }

        return $result;
    }

    /**
     * Count volunteers matching criteria.
     *
     * @since 1.0.0
     *
     * @param array $where Optional conditions for counting.
     * @return int The number of matching volunteers.
     */
    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('volunteers', $where);
    }
}
