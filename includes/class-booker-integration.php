<?php
/**
 * Peanut Booker Integration Class
 *
 * Handles bidirectional integration between Peanut Festival and Peanut Booker.
 * Syncs performers, calendar availability, and cross-platform profile data.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Booker_Integration
 *
 * Core integration class for Festival-Booker connectivity.
 * Provides performer linking, data sync, and cross-platform features.
 *
 * @since 1.1.0
 */
class Peanut_Festival_Booker_Integration {

    /**
     * Singleton instance.
     *
     * @since 1.1.0
     * @var Peanut_Festival_Booker_Integration|null
     */
    private static ?Peanut_Festival_Booker_Integration $instance = null;

    /**
     * Whether Peanut Booker plugin is active.
     *
     * @since 1.1.0
     * @var bool
     */
    private bool $booker_active = false;

    /**
     * Integration settings.
     *
     * @since 1.1.0
     * @var array
     */
    private array $settings = [];

    /**
     * Get singleton instance.
     *
     * @since 1.1.0
     * @return Peanut_Festival_Booker_Integration The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Booker_Integration {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor for singleton pattern.
     *
     * @since 1.1.0
     */
    private function __construct() {
        $this->load_settings();
        $this->check_booker_status();
        $this->init_hooks();
    }

    /**
     * Load integration settings.
     *
     * @since 1.1.0
     */
    private function load_settings(): void {
        $defaults = [
            'enabled' => true,
            'auto_sync' => true,
            'sync_direction' => 'both', // both, festival_only, booker_only
            'sync_fields' => [
                'name' => true,
                'email' => true,
                'bio' => true,
                'photo' => true,
                'social_links' => true,
            ],
            'show_booker_badge' => true,
            'show_booker_rating' => true,
            'calendar_sync' => true,
        ];

        $saved = get_option('peanut_festival_booker_integration', []);
        $this->settings = wp_parse_args($saved, $defaults);
    }

    /**
     * Check if Peanut Booker plugin is active.
     *
     * @since 1.1.0
     */
    private function check_booker_status(): void {
        // Check if the main Booker class exists (plugin is loaded)
        $this->booker_active = class_exists('Peanut_Booker') ||
                               function_exists('peanut_booker_init') ||
                               defined('PEANUT_BOOKER_VERSION');

        // Also check if the plugin file is active
        if (!$this->booker_active) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
            $this->booker_active = is_plugin_active('peanut-booker/peanut-booker.php');
        }
    }

    /**
     * Initialize hooks for integration.
     *
     * @since 1.1.0
     */
    private function init_hooks(): void {
        // Only set up Booker hooks if enabled and Booker is active
        if ($this->is_enabled() && $this->booker_active) {
            $this->setup_booker_listeners();
        }

        // Always set up Festival hooks (Booker can listen even if Festival doesn't listen back)
        $this->setup_festival_hooks();

        // Admin settings
        add_action('admin_init', [$this, 'register_settings']);

        // REST API endpoints for integration
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    /**
     * Set up listeners for Peanut Booker hooks.
     *
     * @since 1.1.0
     */
    private function setup_booker_listeners(): void {
        // Performer lifecycle hooks
        add_action('peanut_booker_performer_created', [$this, 'on_booker_performer_created'], 10, 3);
        add_action('peanut_booker_performer_updated', [$this, 'on_booker_performer_updated'], 10, 2);
        add_action('peanut_booker_performer_deleted', [$this, 'on_booker_performer_deleted'], 10, 1);

        // Achievement and rating updates
        add_action('peanut_booker_achievement_updated', [$this, 'on_booker_achievement_updated'], 10, 3);
        add_action('peanut_booker_review_submitted', [$this, 'on_booker_review_submitted'], 10, 2);

        // Booking events (for calendar sync)
        add_action('peanut_booker_booking_created', [$this, 'on_booker_booking_created'], 10, 2);
        add_action('peanut_booker_booking_confirmed', [$this, 'on_booker_booking_confirmed'], 10, 2);
        add_action('peanut_booker_booking_completed', [$this, 'on_booker_booking_completed'], 10, 2);
        add_action('peanut_booker_booking_cancelled', [$this, 'on_booker_booking_cancelled'], 10, 2);

        // Availability changes
        add_action('peanut_booker_availability_updated', [$this, 'on_booker_availability_updated'], 10, 2);
    }

    /**
     * Set up Festival hooks for Booker to consume.
     *
     * @since 1.1.0
     */
    private function setup_festival_hooks(): void {
        // These are fired by Festival for Booker (or other plugins) to listen to
        // The actual firing happens in the respective Festival classes
    }

    // =========================================================================
    // Booker Event Handlers
    // =========================================================================

    /**
     * Handle Booker performer creation.
     *
     * @since 1.1.0
     *
     * @param int $performer_id Booker performer ID.
     * @param int $user_id WordPress user ID.
     * @param int $profile_id Booker profile post ID.
     */
    public function on_booker_performer_created(int $performer_id, int $user_id, int $profile_id): void {
        if (!$this->should_sync('booker_to_festival')) {
            return;
        }

        // Check if this user already has a Festival performer record
        $existing_link = $this->get_link_by_booker_id($performer_id);
        if ($existing_link) {
            return; // Already linked
        }

        // Get Booker performer data
        $booker_data = $this->get_booker_performer_data($performer_id);
        if (!$booker_data) {
            return;
        }

        // Create or find Festival performer and link
        $this->create_festival_performer_from_booker($booker_data, $performer_id, $user_id, $profile_id);
    }

    /**
     * Handle Booker performer update.
     *
     * @since 1.1.0
     *
     * @param int    $performer_id Booker performer ID.
     * @param object $performer Booker performer object.
     */
    public function on_booker_performer_updated(int $performer_id, object $performer): void {
        if (!$this->should_sync('booker_to_festival')) {
            return;
        }

        $link = $this->get_link_by_booker_id($performer_id);
        if (!$link) {
            return; // Not linked
        }

        // Sync updated data to Festival performer
        $this->sync_booker_to_festival($link, $performer);
    }

    /**
     * Handle Booker performer deletion.
     *
     * @since 1.1.0
     *
     * @param int $performer_id Booker performer ID.
     */
    public function on_booker_performer_deleted(int $performer_id): void {
        $link = $this->get_link_by_booker_id($performer_id);
        if (!$link) {
            return;
        }

        // Update link status but don't delete Festival performer
        Peanut_Festival_Database::update('booker_links', [
            'sync_status' => 'disconnected',
            'booker_performer_id' => null,
            'updated_at' => current_time('mysql'),
        ], ['id' => $link->id]);
    }

    /**
     * Handle Booker achievement update.
     *
     * @since 1.1.0
     *
     * @param int    $performer_id Booker performer ID.
     * @param string $level Achievement level.
     * @param int    $score Achievement score.
     */
    public function on_booker_achievement_updated(int $performer_id, string $level, int $score): void {
        $link = $this->get_link_by_booker_id($performer_id);
        if (!$link) {
            return;
        }

        Peanut_Festival_Database::update('booker_links', [
            'booker_achievement_level' => $level,
            'last_synced_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ], ['id' => $link->id]);
    }

    /**
     * Handle Booker review submission.
     *
     * @since 1.1.0
     *
     * @param int    $review_id Review ID.
     * @param object $review Review object.
     */
    public function on_booker_review_submitted(int $review_id, object $review): void {
        // Get the performer being reviewed
        $performer_id = $review->reviewee_id ?? 0;
        if (!$performer_id) {
            return;
        }

        $link = $this->get_link_by_booker_id($performer_id);
        if (!$link) {
            return;
        }

        // Update cached rating
        $new_rating = $this->get_booker_performer_rating($performer_id);
        if ($new_rating !== null) {
            Peanut_Festival_Database::update('booker_links', [
                'booker_rating' => $new_rating,
                'last_synced_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ], ['id' => $link->id]);
        }
    }

    /**
     * Handle Booker booking creation (for calendar sync).
     *
     * @since 1.1.0
     *
     * @param int    $booking_id Booking ID.
     * @param object $booking Booking object.
     */
    public function on_booker_booking_created(int $booking_id, object $booking): void {
        if (!$this->settings['calendar_sync']) {
            return;
        }

        // Fire action for calendar sync module
        do_action('peanut_festival_booker_booking_created', $booking_id, $booking);
    }

    /**
     * Handle Booker booking confirmation.
     *
     * @since 1.1.0
     *
     * @param int    $booking_id Booking ID.
     * @param object $booking Booking object.
     */
    public function on_booker_booking_confirmed(int $booking_id, object $booking): void {
        if (!$this->settings['calendar_sync']) {
            return;
        }

        do_action('peanut_festival_booker_booking_confirmed', $booking_id, $booking);
    }

    /**
     * Handle Booker booking completion.
     *
     * @since 1.1.0
     *
     * @param int    $booking_id Booking ID.
     * @param object $booking Booking object.
     */
    public function on_booker_booking_completed(int $booking_id, object $booking): void {
        $link = $this->get_link_by_booker_id($booking->performer_id ?? 0);
        if ($link) {
            // Update completed bookings count
            Peanut_Festival_Database::update('booker_links', [
                'booker_completed_bookings' => ($link->booker_completed_bookings ?? 0) + 1,
                'last_synced_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ], ['id' => $link->id]);
        }

        do_action('peanut_festival_booker_booking_completed', $booking_id, $booking);
    }

    /**
     * Handle Booker booking cancellation.
     *
     * @since 1.1.0
     *
     * @param int    $booking_id Booking ID.
     * @param string $reason Cancellation reason.
     */
    public function on_booker_booking_cancelled(int $booking_id, string $reason): void {
        do_action('peanut_festival_booker_booking_cancelled', $booking_id, $reason);
    }

    /**
     * Handle Booker availability update.
     *
     * @since 1.1.0
     *
     * @param int   $performer_id Performer ID.
     * @param array $availability Updated availability data.
     */
    public function on_booker_availability_updated(int $performer_id, array $availability): void {
        if (!$this->settings['calendar_sync']) {
            return;
        }

        do_action('peanut_festival_booker_availability_updated', $performer_id, $availability);
    }

    // =========================================================================
    // Festival Event Firing (for Booker to consume)
    // =========================================================================

    /**
     * Fire hook when Festival performer is accepted.
     *
     * @since 1.1.0
     *
     * @param int    $performer_id Festival performer ID.
     * @param object $performer Performer object.
     */
    public static function fire_performer_accepted(int $performer_id, object $performer): void {
        /**
         * Fires when a Festival performer application is accepted.
         *
         * @since 1.1.0
         *
         * @param int    $performer_id Festival performer ID.
         * @param object $performer The performer object.
         */
        do_action('peanut_festival_performer_accepted', $performer_id, $performer);
    }

    /**
     * Fire hook when Festival show is completed.
     *
     * @since 1.1.0
     *
     * @param int   $show_id Show ID.
     * @param array $performer_ids Array of performer IDs who performed.
     */
    public static function fire_show_completed(int $show_id, array $performer_ids): void {
        /**
         * Fires when a Festival show is completed.
         *
         * @since 1.1.0
         *
         * @param int   $show_id The show ID.
         * @param array $performer_ids Array of performer IDs who performed.
         */
        do_action('peanut_festival_show_completed', $show_id, $performer_ids);
    }

    /**
     * Fire hook when a Festival voting winner is declared.
     *
     * @since 1.1.0
     *
     * @param int $performer_id Winner performer ID.
     * @param int $show_id Show ID.
     * @param int $vote_count Total votes received.
     */
    public static function fire_vote_winner(int $performer_id, int $show_id, int $vote_count): void {
        /**
         * Fires when a Festival performer wins a vote.
         *
         * @since 1.1.0
         *
         * @param int $performer_id The winning performer ID.
         * @param int $show_id The show ID.
         * @param int $vote_count Total votes received.
         */
        do_action('peanut_festival_vote_winner', $performer_id, $show_id, $vote_count);
    }

    /**
     * Fire hook when Festival performer receives rating.
     *
     * @since 1.1.0
     *
     * @param int   $performer_id Performer ID.
     * @param float $rating Rating value.
     * @param int   $show_id Show ID where rating was given.
     */
    public static function fire_performer_rating(int $performer_id, float $rating, int $show_id): void {
        /**
         * Fires when a Festival performer receives a rating.
         *
         * @since 1.1.0
         *
         * @param int   $performer_id The performer ID.
         * @param float $rating The rating value.
         * @param int   $show_id The show ID.
         */
        do_action('peanut_festival_performer_rating', $performer_id, $rating, $show_id);
    }

    /**
     * Fire hook when Festival show is scheduled.
     *
     * @since 1.1.0
     *
     * @param int    $show_id Show ID.
     * @param array  $performer_ids Performer IDs assigned to show.
     * @param string $date Show date.
     * @param string $start_time Show start time.
     * @param string $end_time Show end time.
     */
    public static function fire_show_scheduled(int $show_id, array $performer_ids, string $date, string $start_time, string $end_time): void {
        /**
         * Fires when a Festival show is scheduled with performers.
         *
         * @since 1.1.0
         *
         * @param int    $show_id The show ID.
         * @param array  $performer_ids Array of performer IDs.
         * @param string $date Show date (Y-m-d).
         * @param string $start_time Show start time.
         * @param string $end_time Show end time.
         */
        do_action('peanut_festival_show_scheduled', $show_id, $performer_ids, $date, $start_time, $end_time);
    }

    // =========================================================================
    // Link Management
    // =========================================================================

    /**
     * Get link by Festival performer ID.
     *
     * @since 1.1.0
     *
     * @param int $festival_performer_id Festival performer ID.
     * @return object|null Link object or null.
     */
    public function get_link_by_festival_id(int $festival_performer_id): ?object {
        return Peanut_Festival_Database::get_row('booker_links', [
            'festival_performer_id' => $festival_performer_id,
        ]);
    }

    /**
     * Get link by Booker performer ID.
     *
     * @since 1.1.0
     *
     * @param int $booker_performer_id Booker performer ID.
     * @return object|null Link object or null.
     */
    public function get_link_by_booker_id(int $booker_performer_id): ?object {
        return Peanut_Festival_Database::get_row('booker_links', [
            'booker_performer_id' => $booker_performer_id,
        ]);
    }

    /**
     * Get link by WordPress user ID.
     *
     * @since 1.1.0
     *
     * @param int $user_id WordPress user ID.
     * @return object|null Link object or null.
     */
    public function get_link_by_user_id(int $user_id): ?object {
        return Peanut_Festival_Database::get_row('booker_links', [
            'booker_user_id' => $user_id,
        ]);
    }

    /**
     * Create a link between Festival and Booker performers.
     *
     * @since 1.1.0
     *
     * @param int      $festival_performer_id Festival performer ID.
     * @param int      $booker_performer_id Booker performer ID.
     * @param int|null $booker_user_id WordPress user ID.
     * @param int|null $booker_profile_id Booker profile post ID.
     * @return int|false New link ID or false on failure.
     */
    public function create_link(
        int $festival_performer_id,
        int $booker_performer_id,
        ?int $booker_user_id = null,
        ?int $booker_profile_id = null
    ): int|false {
        // Check if link already exists
        $existing = $this->get_link_by_festival_id($festival_performer_id);
        if ($existing) {
            // Update existing link
            Peanut_Festival_Database::update('booker_links', [
                'booker_performer_id' => $booker_performer_id,
                'booker_user_id' => $booker_user_id,
                'booker_profile_id' => $booker_profile_id,
                'sync_status' => 'active',
                'updated_at' => current_time('mysql'),
            ], ['id' => $existing->id]);
            return $existing->id;
        }

        // Get Booker performer data for caching
        $booker_data = $this->get_booker_performer_data($booker_performer_id);

        return Peanut_Festival_Database::insert('booker_links', [
            'festival_performer_id' => $festival_performer_id,
            'booker_performer_id' => $booker_performer_id,
            'booker_user_id' => $booker_user_id,
            'booker_profile_id' => $booker_profile_id,
            'sync_direction' => $this->settings['sync_direction'],
            'sync_status' => 'active',
            'booker_achievement_level' => $booker_data['achievement_level'] ?? null,
            'booker_rating' => $booker_data['average_rating'] ?? null,
            'booker_completed_bookings' => $booker_data['completed_bookings'] ?? 0,
            'last_synced_at' => current_time('mysql'),
            'created_at' => current_time('mysql'),
        ]);
    }

    /**
     * Remove link between performers.
     *
     * @since 1.1.0
     *
     * @param int $link_id Link ID to remove.
     * @return int|false Number of rows deleted or false.
     */
    public function remove_link(int $link_id): int|false {
        return Peanut_Festival_Database::delete('booker_links', ['id' => $link_id]);
    }

    // =========================================================================
    // Data Sync Methods
    // =========================================================================

    /**
     * Sync data from Booker to Festival performer.
     *
     * @since 1.1.0
     *
     * @param object $link Link object.
     * @param object $booker_performer Booker performer object.
     */
    private function sync_booker_to_festival(object $link, object $booker_performer): void {
        $sync_fields = $this->settings['sync_fields'];
        $update_data = [];

        if (!empty($sync_fields['name']) && !empty($booker_performer->stage_name)) {
            $update_data['name'] = $booker_performer->stage_name;
        }

        if (!empty($sync_fields['bio']) && !empty($booker_performer->bio)) {
            $update_data['bio'] = $booker_performer->bio;
        }

        if (!empty($update_data)) {
            $update_data['updated_at'] = current_time('mysql');
            Peanut_Festival_Database::update('performers', $update_data, ['id' => $link->festival_performer_id]);
        }

        // Update link with latest Booker data
        Peanut_Festival_Database::update('booker_links', [
            'booker_achievement_level' => $booker_performer->achievement_level ?? null,
            'booker_rating' => $booker_performer->average_rating ?? null,
            'booker_completed_bookings' => $booker_performer->completed_bookings ?? 0,
            'last_synced_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ], ['id' => $link->id]);
    }

    /**
     * Create Festival performer from Booker data.
     *
     * @since 1.1.0
     *
     * @param array $booker_data Booker performer data.
     * @param int   $booker_performer_id Booker performer ID.
     * @param int   $booker_user_id WordPress user ID.
     * @param int   $booker_profile_id Booker profile post ID.
     * @return int|false Festival performer ID or false.
     */
    private function create_festival_performer_from_booker(
        array $booker_data,
        int $booker_performer_id,
        int $booker_user_id,
        int $booker_profile_id
    ): int|false {
        // Check if user already has a Festival performer (by email)
        $email = $booker_data['email'] ?? '';
        if ($email) {
            $existing = Peanut_Festival_Performers::get_by_email($email);
            if ($existing) {
                // Link existing performer
                $this->create_link($existing->id, $booker_performer_id, $booker_user_id, $booker_profile_id);
                return $existing->id;
            }
        }

        // Create new Festival performer
        $festival_data = [
            'name' => $booker_data['stage_name'] ?? $booker_data['display_name'] ?? '',
            'email' => $email,
            'bio' => $booker_data['bio'] ?? '',
            'phone' => $booker_data['phone'] ?? '',
            'website' => $booker_data['website'] ?? '',
            'social_links' => $booker_data['social_links'] ?? [],
            'performance_type' => $booker_data['category'] ?? 'other',
            'application_status' => 'imported', // Special status for Booker imports
        ];

        $festival_performer_id = Peanut_Festival_Performers::create($festival_data);

        if ($festival_performer_id) {
            $this->create_link($festival_performer_id, $booker_performer_id, $booker_user_id, $booker_profile_id);
        }

        return $festival_performer_id;
    }

    // =========================================================================
    // Booker Data Retrieval
    // =========================================================================

    /**
     * Get Booker performer data.
     *
     * @since 1.1.0
     *
     * @param int $performer_id Booker performer ID.
     * @return array|null Performer data or null.
     */
    public function get_booker_performer_data(int $performer_id): ?array {
        if (!$this->booker_active) {
            return null;
        }

        // Try to use Booker's API
        if (class_exists('Peanut_Booker_Performer')) {
            $performer = Peanut_Booker_Performer::get($performer_id);
            if ($performer) {
                return (array) $performer;
            }
        }

        // Fallback: direct database query
        global $wpdb;
        $table = $wpdb->prefix . 'pb_performers';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return null;
        }

        $performer = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $performer_id
        ), ARRAY_A);

        return $performer ?: null;
    }

    /**
     * Get Booker performer rating.
     *
     * @since 1.1.0
     *
     * @param int $performer_id Booker performer ID.
     * @return float|null Rating or null.
     */
    public function get_booker_performer_rating(int $performer_id): ?float {
        $data = $this->get_booker_performer_data($performer_id);
        return $data ? (float) ($data['average_rating'] ?? 0) : null;
    }

    /**
     * Get Booker performer's upcoming availability.
     *
     * @since 1.1.0
     *
     * @param int    $performer_id Booker performer ID.
     * @param string $start_date Start date (Y-m-d).
     * @param string $end_date End date (Y-m-d).
     * @return array Array of blocked dates/times.
     */
    public function get_booker_availability(int $performer_id, string $start_date, string $end_date): array {
        if (!$this->booker_active) {
            return [];
        }

        global $wpdb;
        $table = $wpdb->prefix . 'pb_availability';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return [];
        }

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table
             WHERE performer_id = %d
             AND date BETWEEN %s AND %s
             AND status IN ('blocked', 'booked')
             ORDER BY date ASC",
            $performer_id,
            $start_date,
            $end_date
        ), ARRAY_A) ?: [];
    }

    // =========================================================================
    // REST API
    // =========================================================================

    /**
     * Register REST API routes.
     *
     * @since 1.1.0
     */
    public function register_rest_routes(): void {
        register_rest_route('peanut-festival/v1', '/booker/status', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_status'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1', '/booker/performers', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_booker_performers'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1', '/booker/link', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_create_link'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1', '/booker/unlink', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_remove_link'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1', '/booker/sync', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_sync_performer'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1', '/performers/(?P<id>\d+)/booker-profile', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_booker_profile'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Check admin permission for REST requests.
     *
     * @since 1.1.0
     *
     * @return bool Whether user has permission.
     */
    public function check_admin_permission(): bool {
        return current_user_can('manage_options');
    }

    /**
     * REST: Get integration status.
     *
     * @since 1.1.0
     *
     * @return WP_REST_Response
     */
    public function rest_get_status(): WP_REST_Response {
        return new WP_REST_Response([
            'booker_active' => $this->booker_active,
            'integration_enabled' => $this->is_enabled(),
            'settings' => $this->settings,
            'linked_performers' => Peanut_Festival_Database::count('booker_links', ['sync_status' => 'active']),
        ]);
    }

    /**
     * REST: Get available Booker performers for linking.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function rest_get_booker_performers(WP_REST_Request $request): WP_REST_Response {
        if (!$this->booker_active) {
            return new WP_REST_Response(['error' => 'Booker not active'], 400);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'pb_performers';

        $performers = $wpdb->get_results(
            "SELECT p.id, p.user_id, p.tier, p.achievement_level, p.average_rating, p.completed_bookings,
                    u.display_name, u.user_email
             FROM $table p
             LEFT JOIN {$wpdb->users} u ON p.user_id = u.ID
             WHERE p.status = 'active'
             ORDER BY p.completed_bookings DESC
             LIMIT 100"
        );

        return new WP_REST_Response(['performers' => $performers]);
    }

    /**
     * REST: Create performer link.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function rest_create_link(WP_REST_Request $request): WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_performer_id');
        $booker_id = (int) $request->get_param('booker_performer_id');

        if (!$festival_id || !$booker_id) {
            return new WP_REST_Response(['error' => 'Missing performer IDs'], 400);
        }

        $booker_data = $this->get_booker_performer_data($booker_id);
        $link_id = $this->create_link(
            $festival_id,
            $booker_id,
            $booker_data['user_id'] ?? null,
            $booker_data['profile_id'] ?? null
        );

        if ($link_id) {
            return new WP_REST_Response(['success' => true, 'link_id' => $link_id]);
        }

        return new WP_REST_Response(['error' => 'Failed to create link'], 500);
    }

    /**
     * REST: Remove performer link.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function rest_remove_link(WP_REST_Request $request): WP_REST_Response {
        $link_id = (int) $request->get_param('link_id');

        if (!$link_id) {
            return new WP_REST_Response(['error' => 'Missing link ID'], 400);
        }

        $result = $this->remove_link($link_id);

        return new WP_REST_Response(['success' => $result !== false]);
    }

    /**
     * REST: Sync performer data.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function rest_sync_performer(WP_REST_Request $request): WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_performer_id');

        $link = $this->get_link_by_festival_id($festival_id);
        if (!$link) {
            return new WP_REST_Response(['error' => 'Performer not linked'], 400);
        }

        $booker_data = $this->get_booker_performer_data($link->booker_performer_id);
        if (!$booker_data) {
            return new WP_REST_Response(['error' => 'Booker performer not found'], 404);
        }

        $this->sync_booker_to_festival($link, (object) $booker_data);

        return new WP_REST_Response(['success' => true, 'synced_at' => current_time('mysql')]);
    }

    /**
     * REST: Get Booker profile for Festival performer.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response
     */
    public function rest_get_booker_profile(WP_REST_Request $request): WP_REST_Response {
        $performer_id = (int) $request->get_param('id');

        $link = $this->get_link_by_festival_id($performer_id);
        if (!$link || $link->sync_status !== 'active') {
            return new WP_REST_Response(['linked' => false]);
        }

        $response = [
            'linked' => true,
            'booker_performer_id' => $link->booker_performer_id,
            'achievement_level' => $link->booker_achievement_level,
            'rating' => $link->booker_rating,
            'completed_bookings' => $link->booker_completed_bookings,
            'last_synced' => $link->last_synced_at,
        ];

        // Add profile URL if available
        if ($link->booker_profile_id) {
            $response['profile_url'] = get_permalink($link->booker_profile_id);
        }

        return new WP_REST_Response($response);
    }

    // =========================================================================
    // Settings
    // =========================================================================

    /**
     * Register integration settings.
     *
     * @since 1.1.0
     */
    public function register_settings(): void {
        register_setting('peanut_festival_settings', 'peanut_festival_booker_integration', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_settings'],
        ]);
    }

    /**
     * Sanitize integration settings.
     *
     * @since 1.1.0
     *
     * @param array $input Raw input.
     * @return array Sanitized settings.
     */
    public function sanitize_settings(array $input): array {
        return [
            'enabled' => !empty($input['enabled']),
            'auto_sync' => !empty($input['auto_sync']),
            'sync_direction' => sanitize_text_field($input['sync_direction'] ?? 'both'),
            'sync_fields' => [
                'name' => !empty($input['sync_fields']['name']),
                'email' => !empty($input['sync_fields']['email']),
                'bio' => !empty($input['sync_fields']['bio']),
                'photo' => !empty($input['sync_fields']['photo']),
                'social_links' => !empty($input['sync_fields']['social_links']),
            ],
            'show_booker_badge' => !empty($input['show_booker_badge']),
            'show_booker_rating' => !empty($input['show_booker_rating']),
            'calendar_sync' => !empty($input['calendar_sync']),
        ];
    }

    /**
     * Update integration settings.
     *
     * @since 1.1.0
     *
     * @param array $settings New settings.
     */
    public function update_settings(array $settings): void {
        $this->settings = $this->sanitize_settings($settings);
        update_option('peanut_festival_booker_integration', $this->settings);
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Check if integration is enabled.
     *
     * @since 1.1.0
     *
     * @return bool
     */
    public function is_enabled(): bool {
        return !empty($this->settings['enabled']);
    }

    /**
     * Check if Booker is active.
     *
     * @since 1.1.0
     *
     * @return bool
     */
    public function is_booker_active(): bool {
        return $this->booker_active;
    }

    /**
     * Check if sync should happen in given direction.
     *
     * @since 1.1.0
     *
     * @param string $direction Direction to check (booker_to_festival, festival_to_booker).
     * @return bool
     */
    private function should_sync(string $direction): bool {
        if (!$this->settings['auto_sync']) {
            return false;
        }

        $sync_direction = $this->settings['sync_direction'];

        if ($sync_direction === 'both') {
            return true;
        }

        if ($direction === 'booker_to_festival' && $sync_direction === 'booker_only') {
            return true;
        }

        if ($direction === 'festival_to_booker' && $sync_direction === 'festival_only') {
            return true;
        }

        return false;
    }

    /**
     * Get integration settings.
     *
     * @since 1.1.0
     *
     * @return array
     */
    public function get_settings(): array {
        return $this->settings;
    }
}
