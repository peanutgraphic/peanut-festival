<?php
/**
 * Vendors Management Class
 *
 * Handles all vendor-related operations including CRUD operations,
 * vendor type filtering, and status management for festival vendors.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Vendors
 *
 * Manages vendors (food, merchandise, craft, sponsor) who participate in festivals.
 * Supports vendor applications, booth assignments, and payment tracking.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Vendors {

    /**
     * Singleton instance.
     *
     * @since 1.0.0
     * @var Peanut_Festival_Vendors|null
     */
    private static ?Peanut_Festival_Vendors $instance = null;

    /**
     * Get singleton instance.
     *
     * @since 1.0.0
     * @return Peanut_Festival_Vendors The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Vendors {
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
     * Get all vendors with optional filtering and pagination.
     *
     * @since 1.0.0
     *
     * @param array $args {
     *     Optional. Arguments to filter and paginate results.
     *
     *     @type int|null $festival_id Filter by festival ID.
     *     @type string   $vendor_type Filter by type (food, merchandise, craft, sponsor).
     *     @type string   $status      Filter by vendor status.
     *     @type string   $search      Search in business_name, contact_name, email.
     *     @type string   $order_by    Column to sort by. Default 'created_at'.
     *     @type string   $order       Sort direction: 'ASC' or 'DESC'. Default 'DESC'.
     *     @type int      $limit       Maximum results to return. 0 for unlimited.
     *     @type int      $offset      Number of results to skip.
     * }
     * @return array Array of vendor objects.
     */
    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'vendor_type' => '',
            'status' => '',
            'search' => '',
            'order_by' => 'created_at',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('vendors');

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['vendor_type']) {
            $sql .= " AND vendor_type = %s";
            $values[] = $args['vendor_type'];
        }

        if ($args['status']) {
            $sql .= " AND status = %s";
            $values[] = $args['status'];
        }

        if ($args['search']) {
            $sql .= " AND (business_name LIKE %s OR contact_name LIKE %s OR email LIKE %s)";
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            $values[] = $search;
            $values[] = $search;
            $values[] = $search;
        }

        // Whitelist allowed columns for ORDER BY to prevent SQL injection
        $allowed_columns = ['id', 'business_name', 'contact_name', 'email', 'status', 'created_at', 'festival_id', 'vendor_type'];
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
     * Get a vendor by ID.
     *
     * @since 1.0.0
     *
     * @param int $id The vendor ID.
     * @return object|null The vendor object or null if not found.
     */
    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('vendors', ['id' => $id]);
    }

    /**
     * Create a new vendor record.
     *
     * @since 1.0.0
     *
     * @param array $data Vendor data (business_name, contact_name, email, vendor_type, etc.).
     * @return int|false The new vendor ID on success, false on failure.
     */
    public static function create(array $data): int|false {
        $data['created_at'] = current_time('mysql');
        return Peanut_Festival_Database::insert('vendors', $data);
    }

    /**
     * Update an existing vendor record.
     *
     * @since 1.0.0
     *
     * @param int   $id   The vendor ID to update.
     * @param array $data Fields to update.
     * @return int|false Number of rows updated on success, false on failure.
     */
    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');
        return Peanut_Festival_Database::update('vendors', $data, ['id' => $id]);
    }

    /**
     * Delete a vendor.
     *
     * @since 1.0.0
     *
     * @param int $id The vendor ID to delete.
     * @return int|false Number of rows deleted on success, false on failure.
     */
    public static function delete(int $id): int|false {
        return Peanut_Festival_Database::delete('vendors', ['id' => $id]);
    }

    /**
     * Count vendors matching criteria.
     *
     * @since 1.0.0
     *
     * @param array $where Optional conditions for counting.
     * @return int The number of matching vendors.
     */
    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('vendors', $where);
    }
}
