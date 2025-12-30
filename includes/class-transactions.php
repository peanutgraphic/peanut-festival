<?php
/**
 * Financial transactions management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Transactions {

    private static ?Peanut_Festival_Transactions $instance = null;

    public static function get_instance(): Peanut_Festival_Transactions {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'transaction_type' => '',
            'category' => '',
            'date_from' => '',
            'date_to' => '',
            'order_by' => 'transaction_date',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('transactions');

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['transaction_type']) {
            $sql .= " AND transaction_type = %s";
            $values[] = $args['transaction_type'];
        }

        if ($args['category']) {
            $sql .= " AND category = %s";
            $values[] = $args['category'];
        }

        if ($args['date_from']) {
            $sql .= " AND transaction_date >= %s";
            $values[] = $args['date_from'];
        }

        if ($args['date_to']) {
            $sql .= " AND transaction_date <= %s";
            $values[] = $args['date_to'];
        }

        // Whitelist allowed columns for ORDER BY to prevent SQL injection
        $allowed_columns = ['id', 'transaction_date', 'amount', 'transaction_type', 'category', 'created_at', 'festival_id'];
        $order_by = in_array($args['order_by'], $allowed_columns, true) ? $args['order_by'] : 'transaction_date';
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

    public static function create(array $data): int|false {
        $data['recorded_by'] = $data['recorded_by'] ?? get_current_user_id();
        $data['created_at'] = current_time('mysql');
        return Peanut_Festival_Database::insert('transactions', $data);
    }

    public static function get_summary(int $festival_id): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('transactions');

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT transaction_type, category, SUM(amount) as total
             FROM $table
             WHERE festival_id = %d
             GROUP BY transaction_type, category",
            $festival_id
        ));

        $summary = [
            'total_income' => 0,
            'total_expenses' => 0,
            'net' => 0,
            'by_category' => [
                'income' => [],
                'expense' => [],
            ],
        ];

        foreach ($results as $row) {
            $amount = (float) $row->total;
            if ($row->transaction_type === 'income') {
                $summary['total_income'] += $amount;
                $summary['by_category']['income'][$row->category] = $amount;
            } else {
                $summary['total_expenses'] += $amount;
                $summary['by_category']['expense'][$row->category] = $amount;
            }
        }

        $summary['net'] = $summary['total_income'] - $summary['total_expenses'];

        return $summary;
    }

    public static function delete(int $id): int|false {
        return Peanut_Festival_Database::delete('transactions', ['id' => $id]);
    }
}
