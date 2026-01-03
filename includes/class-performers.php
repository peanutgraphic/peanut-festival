<?php
/**
 * Performers Management Class
 *
 * Handles all performer-related operations including CRUD operations,
 * application workflow management, and status tracking for festival performers.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Performers
 *
 * Manages performers who apply and are scheduled to perform at festivals.
 * Supports application review workflow with statuses: pending, under_review,
 * accepted, rejected, waitlisted, confirmed, cancelled.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Performers {

    /**
     * Singleton instance.
     *
     * @since 1.0.0
     * @var Peanut_Festival_Performers|null
     */
    private static ?Peanut_Festival_Performers $instance = null;

    /**
     * Get singleton instance.
     *
     * @since 1.0.0
     * @return Peanut_Festival_Performers The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Performers {
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
    private function __construct() {
        // Initialize hooks
    }

    /**
     * Get all performers with optional filtering and pagination.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter and paginate results.
     *
     *     @type int|null $festival_id        Filter by festival ID.
     *     @type string   $application_status Filter by status (pending, accepted, etc.).
     *     @type string   $search             Search in name, email, and bio fields.
     *     @type string   $performance_type   Filter by performance type.
     *     @type string   $order_by           Column to sort by. Default 'created_at'.
     *     @type string   $order              Sort direction: 'ASC' or 'DESC'. Default 'DESC'.
     *     @type int      $limit              Maximum results to return. 0 for unlimited.
     *     @type int      $offset             Number of results to skip.
     * }
     * @return array Array of performer objects.
     */
    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'application_status' => '',
            'search' => '',
            'performance_type' => '',
            'order_by' => 'created_at',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('performers');

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['application_status']) {
            $sql .= " AND application_status = %s";
            $values[] = $args['application_status'];
        }

        if ($args['performance_type']) {
            $sql .= " AND performance_type = %s";
            $values[] = $args['performance_type'];
        }

        if ($args['search']) {
            $sql .= " AND (name LIKE %s OR email LIKE %s OR bio LIKE %s)";
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
        }

        // Whitelist allowed columns for ORDER BY to prevent SQL injection
        $allowed_columns = ['id', 'name', 'email', 'application_status', 'created_at', 'application_date', 'festival_id'];
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
     * Get a performer by ID.
     *
     * @since 1.0.0
     *
     * @param int $id The performer ID.
     * @return object|null The performer object or null if not found.
     */
    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('performers', ['id' => $id]);
    }

    /**
     * Get a performer by email address.
     *
     * @since 1.0.0
     *
     * @param string $email The performer's email address.
     * @return object|null The performer object or null if not found.
     */
    public static function get_by_email(string $email): ?object {
        return Peanut_Festival_Database::get_row('performers', ['email' => $email]);
    }

    /**
     * Create a new performer record.
     *
     * Automatically sets application_date and created_at timestamps.
     * Encodes social_links array as JSON if provided.
     *
     * @since 1.0.0
     *
     * @param array $data Performer data including name, email, bio, etc.
     * @return int|false The new performer ID on success, false on failure.
     */
    public static function create(array $data): int|false {
        $data['application_date'] = current_time('mysql');
        $data['created_at'] = current_time('mysql');

        if (!empty($data['social_links']) && is_array($data['social_links'])) {
            $data['social_links'] = wp_json_encode($data['social_links']);
        }

        return Peanut_Festival_Database::insert('performers', $data);
    }

    /**
     * Update an existing performer record.
     *
     * Automatically sets updated_at timestamp.
     * Encodes social_links array as JSON if provided.
     *
     * @since 1.0.0
     *
     * @param int   $id   The performer ID to update.
     * @param array $data Fields to update.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');

        if (!empty($data['social_links']) && is_array($data['social_links'])) {
            $data['social_links'] = wp_json_encode($data['social_links']);
        }

        return Peanut_Festival_Database::update('performers', $data, ['id' => $id]);
    }

    /**
     * Delete a performer and their show associations.
     *
     * Also removes performer from any shows they were assigned to.
     *
     * @since 1.0.0
     *
     * @param int $id The performer ID to delete.
     * @return int|false Number of rows deleted on success, false on failure.
     */
    public static function delete(int $id): int|false {
        // Remove from shows first
        Peanut_Festival_Database::delete('show_performers', ['performer_id' => $id]);

        return Peanut_Festival_Database::delete('performers', ['id' => $id]);
    }

    /**
     * Review a performer application.
     *
     * Updates the application status and records review metadata.
     *
     * @since 1.0.0
     *
     * @param int    $id          The performer ID.
     * @param string $status      New status (pending, accepted, rejected, waitlisted, etc.).
     * @param string $notes       Optional review notes.
     * @param int    $reviewer_id Optional reviewer user ID. Defaults to current user.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function review(int $id, string $status, string $notes = '', int $reviewer_id = 0): int|false {
        return self::update($id, [
            'application_status' => $status,
            'review_notes' => $notes,
            'reviewed_by' => $reviewer_id ?: get_current_user_id(),
            'reviewed_at' => current_time('mysql'),
        ]);
    }

    /**
     * Accept a performer application.
     *
     * @since 1.0.0
     *
     * @param int    $id    The performer ID.
     * @param string $notes Optional acceptance notes.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function accept(int $id, string $notes = ''): int|false {
        $result = self::review($id, 'accepted', $notes);

        if ($result !== false) {
            $performer = self::get_by_id($id);
            if ($performer) {
                // Fire hook for Booker integration
                Peanut_Festival_Booker_Integration::fire_performer_accepted($id, $performer);
            }
        }

        return $result;
    }

    /**
     * Reject a performer application.
     *
     * @since 1.0.0
     *
     * @param int    $id    The performer ID.
     * @param string $notes Optional rejection notes.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function reject(int $id, string $notes = ''): int|false {
        return self::review($id, 'rejected', $notes);
    }

    /**
     * Waitlist a performer application.
     *
     * @since 1.0.0
     *
     * @param int    $id    The performer ID.
     * @param string $notes Optional waitlist notes.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function waitlist(int $id, string $notes = ''): int|false {
        return self::review($id, 'waitlisted', $notes);
    }

    /**
     * Count performers matching criteria.
     *
     * @since 1.0.0
     *
     * @param array $where Optional conditions for counting.
     * @return int The number of matching performers.
     */
    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('performers', $where);
    }

    /**
     * Get performer counts grouped by application status.
     *
     * Returns counts for all status types: pending, under_review, accepted,
     * rejected, waitlisted, confirmed, cancelled.
     *
     * @since 1.0.0
     *
     * @param int|null $festival_id Optional festival ID to filter by.
     * @return array Associative array of status => count.
     */
    public static function get_status_counts(?int $festival_id = null): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('performers');

        $sql = "SELECT application_status, COUNT(*) as count FROM $table";
        $values = [];

        if ($festival_id) {
            $sql .= " WHERE festival_id = %d";
            $values[] = $festival_id;
        }

        $sql .= " GROUP BY application_status";

        if (!empty($values)) {
            $sql = $wpdb->prepare($sql, ...$values);
        }

        $results = $wpdb->get_results($sql, OBJECT_K);

        $statuses = ['pending', 'under_review', 'accepted', 'rejected', 'waitlisted', 'confirmed', 'cancelled'];
        $counts = [];

        foreach ($statuses as $status) {
            $counts[$status] = isset($results[$status]) ? (int) $results[$status]->count : 0;
        }

        return $counts;
    }
}
