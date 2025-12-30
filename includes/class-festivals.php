<?php
/**
 * Festivals management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Festivals {

    private static ?Peanut_Festival_Festivals $instance = null;

    public static function get_instance(): Peanut_Festival_Festivals {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Initialize hooks
    }

    public static function get_all(array $args = []): array {
        $defaults = [
            'status' => '',
            'order_by' => 'start_date',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        $where = [];
        if (!empty($args['status'])) {
            $where['status'] = $args['status'];
        }

        return Peanut_Festival_Database::get_results(
            'festivals',
            $where,
            $args['order_by'],
            $args['order'],
            $args['limit'],
            $args['offset']
        );
    }

    public static function get_by_id(int $id): ?object {
        return Peanut_Festival_Database::get_row('festivals', ['id' => $id]);
    }

    public static function get_by_slug(string $slug): ?object {
        return Peanut_Festival_Database::get_row('festivals', ['slug' => $slug]);
    }

    public static function create(array $data): int|false {
        $data['slug'] = sanitize_title($data['name']);
        $data['created_at'] = current_time('mysql');

        return Peanut_Festival_Database::insert('festivals', $data);
    }

    public static function update(int $id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');

        return Peanut_Festival_Database::update('festivals', $data, ['id' => $id]);
    }

    public static function delete(int $id): int|false {
        return Peanut_Festival_Database::delete('festivals', ['id' => $id]);
    }

    public static function count(array $where = []): int {
        return Peanut_Festival_Database::count('festivals', $where);
    }
}
