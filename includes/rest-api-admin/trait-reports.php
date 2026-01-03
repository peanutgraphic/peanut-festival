<?php
/**
 * REST API Admin Reports Trait
 *
 * @package    Peanut_Festival
 * @subpackage Includes/REST_API_Admin
 * @since      1.2.1
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Trait Peanut_Festival_REST_Admin_Reports
 *
 * Handles report generation and export endpoints.
 *
 * @since 1.2.1
 */
trait Peanut_Festival_REST_Admin_Reports {

    /**
     * Get reports overview.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function get_reports_overview(\WP_REST_Request $request): \WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_id') ?: Peanut_Festival_Settings::get_active_festival_id();

        if (!$festival_id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'No festival selected',
            ], 400);
        }

        $stats = Peanut_Festival_Analytics::get_dashboard_stats($festival_id);
        $activity = Peanut_Festival_Analytics::get_activity_log($festival_id, 10);

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_activity' => $activity,
            ],
        ]);
    }

    /**
     * Get ticket sales report.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function get_ticket_sales_report(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $festival_id = (int) $request->get_param('festival_id') ?: Peanut_Festival_Settings::get_active_festival_id();
        $period = sanitize_text_field($request->get_param('period') ?: 'daily');

        if (!$festival_id) {
            return new \WP_REST_Response(['success' => false, 'message' => 'No festival selected'], 400);
        }

        // SECURITY: Validate period against whitelist to prevent SQL injection
        if (!isset(self::VALID_PERIODS[$period])) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Invalid period. Must be one of: ' . implode(', ', array_keys(self::VALID_PERIODS)),
            ], 400);
        }

        $tickets_table = Peanut_Festival_Database::get_table_name('tickets');
        $shows_table = Peanut_Festival_Database::get_table_name('shows');

        // Use whitelisted date format (safe from SQL injection)
        $date_format = self::VALID_PERIODS[$period];

        // Sales over time
        $sales_over_time = $wpdb->get_results($wpdb->prepare(
            "SELECT
                DATE_FORMAT(t.created_at, %s) as period,
                COUNT(*) as ticket_count,
                SUM(t.quantity) as total_quantity,
                SUM(t.total_paid) as total_revenue
             FROM $tickets_table t
             JOIN $shows_table s ON t.show_id = s.id
             WHERE s.festival_id = %d AND t.payment_status = 'completed'
             GROUP BY period
             ORDER BY period ASC",
            $date_format, $festival_id
        ));

        // Sales by show
        $sales_by_show = $wpdb->get_results($wpdb->prepare(
            "SELECT
                s.id, s.title, s.show_date,
                COUNT(t.id) as ticket_count,
                SUM(t.quantity) as total_quantity,
                SUM(t.total_paid) as total_revenue,
                SUM(CASE WHEN t.checked_in = 1 THEN t.quantity ELSE 0 END) as checked_in
             FROM $shows_table s
             LEFT JOIN $tickets_table t ON t.show_id = s.id AND t.payment_status = 'completed'
             WHERE s.festival_id = %d
             GROUP BY s.id
             ORDER BY s.show_date ASC",
            $festival_id
        ));

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'over_time' => $sales_over_time,
                'by_show' => $sales_by_show,
            ],
        ]);
    }

    /**
     * Get revenue report.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function get_revenue_report(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $festival_id = (int) $request->get_param('festival_id') ?: Peanut_Festival_Settings::get_active_festival_id();

        if (!$festival_id) {
            return new \WP_REST_Response(['success' => false, 'message' => 'No festival selected'], 400);
        }

        $trans_table = Peanut_Festival_Database::get_table_name('transactions');

        // Revenue by category
        $by_category = $wpdb->get_results($wpdb->prepare(
            "SELECT
                category,
                transaction_type,
                SUM(amount) as total
             FROM $trans_table
             WHERE festival_id = %d
             GROUP BY category, transaction_type
             ORDER BY category, transaction_type",
            $festival_id
        ));

        // Revenue over time
        $over_time = $wpdb->get_results($wpdb->prepare(
            "SELECT
                DATE(transaction_date) as date,
                SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expense
             FROM $trans_table
             WHERE festival_id = %d
             GROUP BY DATE(transaction_date)
             ORDER BY date ASC",
            $festival_id
        ));

        // Summary
        $summary = Peanut_Festival_Transactions::get_summary($festival_id);

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'by_category' => $by_category,
                'over_time' => $over_time,
                'summary' => $summary,
            ],
        ]);
    }

    /**
     * Get activity report.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function get_activity_report(\WP_REST_Request $request): \WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_id') ?: Peanut_Festival_Settings::get_active_festival_id();
        $limit = (int) ($request->get_param('limit') ?: 100);

        if (!$festival_id) {
            return new \WP_REST_Response(['success' => false, 'message' => 'No festival selected'], 400);
        }

        $activity = Peanut_Festival_Analytics::get_activity_log($festival_id, $limit);

        return new \WP_REST_Response([
            'success' => true,
            'data' => $activity,
        ]);
    }

    /**
     * Export report data.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function export_report(\WP_REST_Request $request): \WP_REST_Response {
        $type = sanitize_text_field($request->get_param('type'));
        $festival_id = (int) $request->get_param('festival_id') ?: Peanut_Festival_Settings::get_active_festival_id();
        $format = sanitize_text_field($request->get_param('format') ?: 'csv');

        if (!$festival_id) {
            return new \WP_REST_Response(['success' => false, 'message' => 'No festival selected'], 400);
        }

        $data = [];
        $filename = '';

        switch ($type) {
            case 'performers':
                $data = Peanut_Festival_Performers::get_all(['festival_id' => $festival_id, 'limit' => 10000]);
                $filename = 'performers';
                break;
            case 'volunteers':
                $data = Peanut_Festival_Volunteers::get_all(['festival_id' => $festival_id, 'limit' => 10000]);
                $filename = 'volunteers';
                break;
            case 'attendees':
                $data = Peanut_Festival_Attendees::get_all(['festival_id' => $festival_id, 'limit' => 10000]);
                $filename = 'attendees';
                break;
            case 'transactions':
                $data = Peanut_Festival_Transactions::get_all(['festival_id' => $festival_id, 'limit' => 10000]);
                $filename = 'transactions';
                break;
            case 'tickets':
                global $wpdb;
                $tickets_table = Peanut_Festival_Database::get_table_name('tickets');
                $shows_table = Peanut_Festival_Database::get_table_name('shows');
                $attendees_table = Peanut_Festival_Database::get_table_name('attendees');
                $data = $wpdb->get_results($wpdb->prepare(
                    "SELECT t.ticket_code, t.quantity, t.total_paid, t.payment_status,
                            t.checked_in, t.checked_in_at, t.created_at,
                            a.name as attendee_name, a.email as attendee_email,
                            s.title as show_title, s.show_date
                     FROM $tickets_table t
                     JOIN $shows_table s ON t.show_id = s.id
                     LEFT JOIN $attendees_table a ON t.attendee_id = a.id
                     WHERE s.festival_id = %d
                     ORDER BY t.created_at DESC",
                    $festival_id
                ));
                $filename = 'tickets';
                break;
            default:
                return new \WP_REST_Response(['success' => false, 'message' => 'Invalid report type'], 400);
        }

        if ($format === 'csv') {
            $csv = $this->array_to_csv($data);
            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'filename' => $filename . '_' . date('Y-m-d') . '.csv',
                    'content' => $csv,
                    'mime_type' => 'text/csv',
                ],
            ]);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Convert array to CSV string.
     *
     * @param array $data Data to convert.
     * @return string CSV string.
     */
    private function array_to_csv(array $data): string {
        if (empty($data)) {
            return '';
        }

        $output = fopen('php://temp', 'r+');
        $first = (array) $data[0];
        fputcsv($output, array_keys($first));

        foreach ($data as $row) {
            fputcsv($output, (array) $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}
