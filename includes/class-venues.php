<?php
/**
 * Venues management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Venues {

    private static ?Peanut_Festival_Venues $instance = null;

    public static function get_instance(): Peanut_Festival_Venues {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'venue_type' => '',
            'status' => '',
            'order_by' => 'name',
            'order' => 'ASC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        $where = [];
        if ($args['festival_id']) $where['festival_id'] = $args['festival_id'];
        if ($args['venue_type']) $where['venue_type'] = $args['venue_type'];
        if ($args['status']) $where['status'] = $args['status'];

        return Peanut_Festival_Database::get_results(
            'venues', $where, $args['order_by'], $args['order'], $args['limit'], $args['offset']
        );
    }

    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('venues', ['id' => $id]);
    }

    public static function create(array $data): int|false {
        $data['slug'] = sanitize_title($data['name']);
        $data['created_at'] = current_time('mysql');
        if (!empty($data['amenities']) && is_array($data['amenities'])) {
            $data['amenities'] = wp_json_encode($data['amenities']);
        }
        return Peanut_Festival_Database::insert('venues', $data);
    }

    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');
        if (!empty($data['amenities']) && is_array($data['amenities'])) {
            $data['amenities'] = wp_json_encode($data['amenities']);
        }
        return Peanut_Festival_Database::update('venues', $data, ['id' => $id]);
    }

    public static function delete(int $id): int|false {
        return Peanut_Festival_Database::delete('venues', ['id' => $id]);
    }

    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('venues', $where);
    }
}
