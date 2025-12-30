<?php
/**
 * Background Job Queue Class
 *
 * Handles asynchronous processing of tasks like email sending
 * using WordPress cron and custom job table.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Job_Queue
 *
 * Manages background job processing for the plugin.
 * Jobs are stored in a database table and processed via WP-Cron.
 *
 * @since 1.0.0
 */
class Peanut_Festival_Job_Queue {

    /**
     * Job status constants.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    /**
     * Job type constants.
     */
    public const TYPE_EMAIL = 'email';
    public const TYPE_SYNC = 'sync';
    public const TYPE_NOTIFICATION = 'notification';

    /**
     * Maximum retries for failed jobs.
     *
     * @since 1.0.0
     * @var int
     */
    private const MAX_RETRIES = 3;

    /**
     * Batch size for processing jobs.
     *
     * @since 1.0.0
     * @var int
     */
    private const BATCH_SIZE = 10;

    /**
     * Initialize the job queue.
     *
     * Registers cron hooks for job processing.
     *
     * @since 1.0.0
     */
    public static function init(): void {
        add_action('pf_process_job_queue', [self::class, 'process_queue']);
        add_action('pf_process_single_job', [self::class, 'process_single_job'], 10, 1);

        // Schedule cron if not already scheduled
        if (!wp_next_scheduled('pf_process_job_queue')) {
            wp_schedule_event(time(), 'every_minute', 'pf_process_job_queue');
        }
    }

    /**
     * Register custom cron interval.
     *
     * @since 1.0.0
     *
     * @param array $schedules Existing cron schedules.
     * @return array Modified schedules.
     */
    public static function register_cron_interval(array $schedules): array {
        $schedules['every_minute'] = [
            'interval' => 60,
            'display' => __('Every Minute', 'peanut-festival'),
        ];
        return $schedules;
    }

    /**
     * Add a job to the queue.
     *
     * @since 1.0.0
     *
     * @param string $type    Job type (email, sync, notification).
     * @param array  $payload Job data.
     * @param int    $delay   Optional delay in seconds before processing.
     * @return int|false Job ID on success, false on failure.
     */
    public static function add(string $type, array $payload, int $delay = 0): int|false {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        $scheduled_at = $delay > 0
            ? date('Y-m-d H:i:s', time() + $delay)
            : current_time('mysql');

        $result = $wpdb->insert(
            $table,
            [
                'job_type' => $type,
                'payload' => wp_json_encode($payload),
                'status' => self::STATUS_PENDING,
                'attempts' => 0,
                'scheduled_at' => $scheduled_at,
                'created_at' => current_time('mysql'),
            ],
            ['%s', '%s', '%s', '%d', '%s', '%s']
        );

        if ($result) {
            $job_id = $wpdb->insert_id;

            Peanut_Festival_Logger::debug('Job added to queue', [
                'job_id' => $job_id,
                'type' => $type,
                'scheduled_at' => $scheduled_at,
            ]);

            // Trigger immediate processing for urgent jobs
            if ($delay === 0) {
                wp_schedule_single_event(time(), 'pf_process_single_job', [$job_id]);
            }

            return $job_id;
        }

        return false;
    }

    /**
     * Queue an email for background sending.
     *
     * @since 1.0.0
     *
     * @param string       $to      Recipient email.
     * @param string       $subject Email subject.
     * @param string       $message Email body.
     * @param array|string $headers Optional headers.
     * @param array        $attachments Optional attachments.
     * @return int|false Job ID on success, false on failure.
     */
    public static function queue_email(
        string $to,
        string $subject,
        string $message,
        $headers = '',
        array $attachments = []
    ): int|false {
        return self::add(self::TYPE_EMAIL, [
            'to' => $to,
            'subject' => $subject,
            'message' => $message,
            'headers' => $headers,
            'attachments' => $attachments,
        ]);
    }

    /**
     * Queue a batch of emails (e.g., for broadcasts).
     *
     * @since 1.0.0
     *
     * @param array  $recipients List of email addresses.
     * @param string $subject    Email subject.
     * @param string $message    Email body.
     * @param array  $headers    Optional headers.
     * @return array Array of job IDs.
     */
    public static function queue_email_batch(
        array $recipients,
        string $subject,
        string $message,
        array $headers = []
    ): array {
        $job_ids = [];

        foreach ($recipients as $i => $to) {
            // Stagger emails to avoid rate limiting
            $delay = (int) floor($i / 5) * 2; // 2 second delay every 5 emails

            $job_id = self::add(self::TYPE_EMAIL, [
                'to' => $to,
                'subject' => $subject,
                'message' => $message,
                'headers' => $headers,
            ], $delay);

            if ($job_id) {
                $job_ids[] = $job_id;
            }
        }

        Peanut_Festival_Logger::info('Email batch queued', [
            'count' => count($job_ids),
            'subject' => $subject,
        ]);

        return $job_ids;
    }

    /**
     * Process pending jobs from the queue.
     *
     * @since 1.0.0
     */
    public static function process_queue(): void {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        // Get pending jobs that are due
        $jobs = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table
             WHERE status = %s
             AND scheduled_at <= %s
             ORDER BY created_at ASC
             LIMIT %d",
            self::STATUS_PENDING,
            current_time('mysql'),
            self::BATCH_SIZE
        ));

        foreach ($jobs as $job) {
            self::process_job($job);
        }

        // Clean up old completed jobs (older than 7 days)
        $wpdb->query($wpdb->prepare(
            "DELETE FROM $table
             WHERE status = %s
             AND completed_at < %s",
            self::STATUS_COMPLETED,
            date('Y-m-d H:i:s', strtotime('-7 days'))
        ));
    }

    /**
     * Process a single job by ID.
     *
     * @since 1.0.0
     *
     * @param int $job_id The job ID.
     */
    public static function process_single_job(int $job_id): void {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        $job = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $job_id
        ));

        if ($job && $job->status === self::STATUS_PENDING) {
            self::process_job($job);
        }
    }

    /**
     * Process a job.
     *
     * @since 1.0.0
     *
     * @param object $job The job object from database.
     */
    private static function process_job(object $job): void {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        // Mark as processing
        $wpdb->update(
            $table,
            [
                'status' => self::STATUS_PROCESSING,
                'attempts' => $job->attempts + 1,
                'started_at' => current_time('mysql'),
            ],
            ['id' => $job->id],
            ['%s', '%d', '%s'],
            ['%d']
        );

        $payload = json_decode($job->payload, true);
        $success = false;
        $error = null;

        try {
            switch ($job->job_type) {
                case self::TYPE_EMAIL:
                    $success = self::process_email_job($payload);
                    break;

                case self::TYPE_NOTIFICATION:
                    $success = self::process_notification_job($payload);
                    break;

                case self::TYPE_SYNC:
                    $success = self::process_sync_job($payload);
                    break;

                default:
                    $error = 'Unknown job type: ' . $job->job_type;
            }
        } catch (\Exception $e) {
            $error = $e->getMessage();
            Peanut_Festival_Logger::exception($e, 'Job processing failed');
        }

        if ($success) {
            // Mark as completed
            $wpdb->update(
                $table,
                [
                    'status' => self::STATUS_COMPLETED,
                    'completed_at' => current_time('mysql'),
                ],
                ['id' => $job->id],
                ['%s', '%s'],
                ['%d']
            );

            Peanut_Festival_Logger::debug('Job completed', [
                'job_id' => $job->id,
                'type' => $job->job_type,
            ]);
        } else {
            // Check if we should retry
            if ($job->attempts < self::MAX_RETRIES) {
                // Reschedule with exponential backoff
                $delay = pow(2, $job->attempts) * 60; // 2, 4, 8 minutes
                $wpdb->update(
                    $table,
                    [
                        'status' => self::STATUS_PENDING,
                        'scheduled_at' => date('Y-m-d H:i:s', time() + $delay),
                        'last_error' => $error,
                    ],
                    ['id' => $job->id],
                    ['%s', '%s', '%s'],
                    ['%d']
                );

                Peanut_Festival_Logger::warning('Job scheduled for retry', [
                    'job_id' => $job->id,
                    'attempt' => $job->attempts + 1,
                    'next_retry_in' => $delay . ' seconds',
                    'error' => $error,
                ]);
            } else {
                // Mark as failed
                $wpdb->update(
                    $table,
                    [
                        'status' => self::STATUS_FAILED,
                        'completed_at' => current_time('mysql'),
                        'last_error' => $error,
                    ],
                    ['id' => $job->id],
                    ['%s', '%s', '%s'],
                    ['%d']
                );

                Peanut_Festival_Logger::error('Job failed permanently', [
                    'job_id' => $job->id,
                    'type' => $job->job_type,
                    'error' => $error,
                ]);
            }
        }
    }

    /**
     * Process an email job.
     *
     * @since 1.0.0
     *
     * @param array $payload Email data.
     * @return bool True on success, false on failure.
     */
    private static function process_email_job(array $payload): bool {
        return wp_mail(
            $payload['to'],
            $payload['subject'],
            $payload['message'],
            $payload['headers'] ?? '',
            $payload['attachments'] ?? []
        );
    }

    /**
     * Process a notification job.
     *
     * @since 1.0.0
     *
     * @param array $payload Notification data.
     * @return bool True on success, false on failure.
     */
    private static function process_notification_job(array $payload): bool {
        // Delegate to notifications class
        $type = $payload['notification_type'] ?? '';
        $id = $payload['entity_id'] ?? 0;

        switch ($type) {
            case 'performer_application':
                Peanut_Festival_Notifications::notify_new_application('performer', $id);
                return true;

            case 'volunteer_welcome':
                Peanut_Festival_Notifications::notify_volunteer_welcome($id);
                return true;

            case 'ticket_confirmation':
                Peanut_Festival_Notifications::notify_ticket_purchase($id);
                return true;

            default:
                return false;
        }
    }

    /**
     * Process a sync job.
     *
     * @since 1.0.0
     *
     * @param array $payload Sync data.
     * @return bool True on success, false on failure.
     */
    private static function process_sync_job(array $payload): bool {
        $service = $payload['service'] ?? '';

        switch ($service) {
            case 'eventbrite':
                Peanut_Festival_Eventbrite::sync($payload['festival_id'] ?? 0);
                return true;

            case 'mailchimp':
                $list_id = $payload['list_id'] ?? '';
                $type = $payload['sync_type'] ?? '';
                Peanut_Festival_Mailchimp::sync($list_id, $type);
                return true;

            default:
                return false;
        }
    }

    /**
     * Get job queue statistics.
     *
     * @since 1.0.0
     *
     * @return array Queue statistics.
     */
    public static function get_stats(): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        $stats = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM $table GROUP BY status",
            OBJECT_K
        );

        return [
            'pending' => (int) ($stats[self::STATUS_PENDING]->count ?? 0),
            'processing' => (int) ($stats[self::STATUS_PROCESSING]->count ?? 0),
            'completed' => (int) ($stats[self::STATUS_COMPLETED]->count ?? 0),
            'failed' => (int) ($stats[self::STATUS_FAILED]->count ?? 0),
        ];
    }

    /**
     * Retry a failed job.
     *
     * @since 1.0.0
     *
     * @param int $job_id The job ID.
     * @return bool True on success, false on failure.
     */
    public static function retry(int $job_id): bool {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        return (bool) $wpdb->update(
            $table,
            [
                'status' => self::STATUS_PENDING,
                'attempts' => 0,
                'scheduled_at' => current_time('mysql'),
                'last_error' => null,
            ],
            ['id' => $job_id, 'status' => self::STATUS_FAILED],
            ['%s', '%d', '%s', '%s'],
            ['%d', '%s']
        );
    }

    /**
     * Cancel a pending job.
     *
     * @since 1.0.0
     *
     * @param int $job_id The job ID.
     * @return bool True on success, false on failure.
     */
    public static function cancel(int $job_id): bool {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('job_queue');

        return (bool) $wpdb->delete(
            $table,
            ['id' => $job_id, 'status' => self::STATUS_PENDING],
            ['%d', '%s']
        );
    }
}

// Register cron interval filter
add_filter('cron_schedules', [Peanut_Festival_Job_Queue::class, 'register_cron_interval']);
