<?php
/**
 * Sponsors management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Sponsors {

    private static ?Peanut_Festival_Sponsors $instance = null;

    public static function get_instance(): Peanut_Festival_Sponsors {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'tier' => '',
            'status' => '',
            'order_by' => 'sponsorship_amount',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        $where = [];
        if ($args['festival_id']) $where['festival_id'] = $args['festival_id'];
        if ($args['tier']) $where['tier'] = $args['tier'];
        if ($args['status']) $where['status'] = $args['status'];

        return Peanut_Festival_Database::get_results(
            'sponsors', $where, $args['order_by'], $args['order'], $args['limit'], $args['offset']
        );
    }

    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('sponsors', ['id' => $id]);
    }

    public static function create(array $data): int|false {
        $data['created_at'] = current_time('mysql');
        if (!empty($data['benefits']) && is_array($data['benefits'])) {
            $data['benefits'] = wp_json_encode($data['benefits']);
        }
        if (!empty($data['social_links']) && is_array($data['social_links'])) {
            $data['social_links'] = wp_json_encode($data['social_links']);
        }
        return Peanut_Festival_Database::insert('sponsors', $data);
    }

    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');
        if (!empty($data['benefits']) && is_array($data['benefits'])) {
            $data['benefits'] = wp_json_encode($data['benefits']);
        }
        if (!empty($data['social_links']) && is_array($data['social_links'])) {
            $data['social_links'] = wp_json_encode($data['social_links']);
        }
        return Peanut_Festival_Database::update('sponsors', $data, ['id' => $id]);
    }

    public static function delete(int $id): int|false {
        return Peanut_Festival_Database::delete('sponsors', ['id' => $id]);
    }

    public static function get_total_sponsorship(int $festival_id): float {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('sponsors');

        return (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(sponsorship_amount), 0) + COALESCE(SUM(in_kind_value), 0)
             FROM $table WHERE festival_id = %d AND status IN ('confirmed', 'past')",
            $festival_id
        ));
    }

    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('sponsors', $where);
    }
}
