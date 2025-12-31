<?php
/**
 * Real-time Sync Class
 *
 * Manages real-time synchronization between WordPress and Firebase.
 * Handles debouncing, batching, and error recovery.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Realtime_Sync
 *
 * Coordinates real-time data sync operations.
 *
 * @since 1.2.0
 */
class Peanut_Festival_Realtime_Sync {

    /**
     * Singleton instance.
     *
     * @var Peanut_Festival_Realtime_Sync|null
     */
    private static ?Peanut_Festival_Realtime_Sync $instance = null;

    /**
     * Pending sync operations (for batching).
     *
     * @var array
     */
    private array $pending_syncs = [];

    /**
     * Debounce timers.
     *
     * @var array
     */
    private array $debounce_timers = [];

    /**
     * Get singleton instance.
     *
     * @return Peanut_Festival_Realtime_Sync
     */
    public static function get_instance(): Peanut_Festival_Realtime_Sync {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor.
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize WordPress hooks.
     */
    private function init_hooks(): void {
        if (!Peanut_Festival_Firebase::is_enabled()) {
            return;
        }

        // Sync on vote submission
        add_action('peanut_festival_vote_recorded', [$this, 'queue_vote_sync'], 10, 2);

        // Sync on match vote
        add_action('peanut_festival_match_vote_recorded', [$this, 'queue_match_sync'], 10, 2);

        // Sync on show changes
        add_action('peanut_festival_show_updated', [$this, 'queue_show_sync'], 10, 1);
        add_action('peanut_festival_show_status_changed', [$this, 'queue_show_sync'], 10, 2);

        // Sync on performer changes
        add_action('peanut_festival_performer_updated', [$this, 'queue_performer_sync'], 10, 1);
        add_action('peanut_festival_performer_checkin', [$this, 'queue_performer_sync'], 10, 2);

        // Sync leaderboard periodically
        add_action('peanut_festival_leaderboard_sync', [$this, 'sync_leaderboard']);

        // Process pending syncs on shutdown
        add_action('shutdown', [$this, 'process_pending_syncs']);
    }

    /**
     * Queue a vote sync operation.
     *
     * @param string $show_slug Show slug
     * @param array $vote_data Vote data
     */
    public function queue_vote_sync(string $show_slug, array $vote_data): void {
        $key = 'vote_' . $show_slug . '_' . ($vote_data['group_name'] ?? 'default');

        $this->pending_syncs[$key] = [
            'type' => 'vote',
            'show_slug' => $show_slug,
            'group_name' => $vote_data['group_name'] ?? 'default',
        ];
    }

    /**
     * Queue a match sync operation.
     *
     * @param int $match_id Match ID
     * @param array $vote_data Vote data
     */
    public function queue_match_sync(int $match_id, array $vote_data): void {
        $key = 'match_' . $match_id;

        $this->pending_syncs[$key] = [
            'type' => 'match',
            'match_id' => $match_id,
        ];
    }

    /**
     * Queue a show sync operation.
     *
     * @param int $show_id Show ID
     * @param string $status Optional status
     */
    public function queue_show_sync(int $show_id, string $status = ''): void {
        $key = 'show_' . $show_id;

        $this->pending_syncs[$key] = [
            'type' => 'show',
            'show_id' => $show_id,
            'status' => $status,
        ];
    }

    /**
     * Queue a performer sync operation.
     *
     * @param int $performer_id Performer ID
     * @param array $data Optional additional data
     */
    public function queue_performer_sync(int $performer_id, array $data = []): void {
        $key = 'performer_' . $performer_id;

        $this->pending_syncs[$key] = array_merge([
            'type' => 'performer',
            'performer_id' => $performer_id,
        ], $data);
    }

    /**
     * Process all pending sync operations.
     */
    public function process_pending_syncs(): void {
        if (empty($this->pending_syncs)) {
            return;
        }

        $firebase = Peanut_Festival_Firebase::get_instance();

        foreach ($this->pending_syncs as $key => $sync) {
            try {
                switch ($sync['type']) {
                    case 'vote':
                        $this->sync_votes($firebase, $sync['show_slug'], $sync['group_name']);
                        break;

                    case 'match':
                        $this->sync_match($firebase, $sync['match_id']);
                        break;

                    case 'show':
                        $this->sync_show($firebase, $sync['show_id'], $sync['status']);
                        break;

                    case 'performer':
                        $this->sync_performer($firebase, $sync['performer_id'], $sync);
                        break;
                }
            } catch (\Exception $e) {
                Peanut_Festival_Logger::error('Sync failed for ' . $key . ': ' . $e->getMessage());
            }
        }

        $this->pending_syncs = [];
    }

    /**
     * Sync vote results to Firebase.
     *
     * @param Peanut_Festival_Firebase $firebase Firebase instance
     * @param string $show_slug Show slug
     * @param string $group_name Group name
     */
    private function sync_votes(Peanut_Festival_Firebase $firebase, string $show_slug, string $group_name): void {
        $results = Peanut_Festival_Voting::get_results($show_slug, $group_name);
        $config = Peanut_Festival_Voting::get_show_config($show_slug);

        $data = [
            'performers' => [],
            'total_votes' => 0,
            'is_open' => Peanut_Festival_Voting::is_voting_open($show_slug),
            'time_remaining' => Peanut_Festival_Voting::get_time_remaining($show_slug),
            'updated_at' => gmdate('c'),
        ];

        foreach ($results as $result) {
            $data['performers'][$result->performer_id] = [
                'name' => $result->performer_name,
                'photo_url' => $result->photo_url ?? '',
                'score' => (int) $result->weighted_score,
                'votes' => (int) $result->total_votes,
                'first_place' => (int) $result->first_place,
                'second_place' => (int) $result->second_place,
                'third_place' => (int) $result->third_place,
            ];
            $data['total_votes'] += (int) $result->total_votes;
        }

        $path = 'votes/' . sanitize_key($show_slug) . '/' . sanitize_key($group_name);
        $firebase->write($path, $data);
    }

    /**
     * Sync match data to Firebase.
     *
     * @param Peanut_Festival_Firebase $firebase Firebase instance
     * @param int $match_id Match ID
     */
    private function sync_match(Peanut_Festival_Firebase $firebase, int $match_id): void {
        $match = Peanut_Festival_Competitions::get_match($match_id);
        if (!$match) {
            return;
        }

        $performer1 = $match->performer_1_id ? Peanut_Festival_Performers::get_by_id($match->performer_1_id) : null;
        $performer2 = $match->performer_2_id ? Peanut_Festival_Performers::get_by_id($match->performer_2_id) : null;

        $time_remaining = null;
        if ($match->status === 'voting' && !empty($match->voting_ends_at)) {
            $time_remaining = max(0, strtotime($match->voting_ends_at) - time());
        }

        $data = [
            'performer_1' => $performer1 ? [
                'id' => (int) $performer1->id,
                'name' => $performer1->name,
                'photo_url' => $performer1->photo_url ?? '',
                'votes' => (int) ($match->votes_performer_1 ?? 0),
            ] : null,
            'performer_2' => $performer2 ? [
                'id' => (int) $performer2->id,
                'name' => $performer2->name,
                'photo_url' => $performer2->photo_url ?? '',
                'votes' => (int) ($match->votes_performer_2 ?? 0),
            ] : null,
            'status' => $match->status,
            'winner_id' => $match->winner_id ? (int) $match->winner_id : null,
            'is_voting' => $match->status === 'voting',
            'time_remaining' => $time_remaining,
            'updated_at' => gmdate('c'),
        ];

        $path = 'matches/' . $match_id;
        $firebase->write($path, $data);
    }

    /**
     * Sync show data to Firebase.
     *
     * @param Peanut_Festival_Firebase $firebase Firebase instance
     * @param int $show_id Show ID
     * @param string $status Status override
     */
    private function sync_show(Peanut_Festival_Firebase $firebase, int $show_id, string $status = ''): void {
        $show = Peanut_Festival_Shows::get_by_id($show_id);
        if (!$show) {
            return;
        }

        $current_status = $status ?: $show->status;

        $data = [
            'id' => (int) $show->id,
            'title' => $show->title,
            'description' => $show->description ?? '',
            'status' => $current_status,
            'now_playing' => $current_status === 'in_progress',
            'show_date' => $show->show_date,
            'start_time' => $show->start_time,
            'end_time' => $show->end_time,
            'venue_name' => $show->venue_name ?? '',
            'updated_at' => gmdate('c'),
        ];

        $path = 'shows/' . $show_id;
        $firebase->write($path, $data);

        // Also update festival-level now playing if this show is in progress
        if ($current_status === 'in_progress') {
            $firebase->write('festivals/' . $show->festival_id . '/now_playing', [
                'show_id' => (int) $show_id,
                'title' => $show->title,
                'venue_name' => $show->venue_name ?? '',
            ]);
        }
    }

    /**
     * Sync performer data to Firebase.
     *
     * @param Peanut_Festival_Firebase $firebase Firebase instance
     * @param int $performer_id Performer ID
     * @param array $extra_data Extra data to merge
     */
    private function sync_performer(Peanut_Festival_Firebase $firebase, int $performer_id, array $extra_data = []): void {
        $performer = Peanut_Festival_Performers::get_by_id($performer_id);
        if (!$performer) {
            return;
        }

        $data = [
            'id' => (int) $performer->id,
            'name' => $performer->name,
            'photo_url' => $performer->photo_url ?? '',
            'bio' => $performer->bio ?? '',
            'status' => $performer->status,
            'updated_at' => gmdate('c'),
        ];

        // Add check-in data if present
        if (!empty($extra_data['checked_in'])) {
            $data['checked_in'] = true;
            $data['checked_in_at'] = gmdate('c');
            $data['show_id'] = $extra_data['show_id'] ?? null;
        }

        $path = 'performers/' . $performer_id;
        $firebase->write($path, $data);
    }

    /**
     * Sync full leaderboard to Firebase.
     *
     * @param int|null $festival_id Festival ID (optional)
     */
    public function sync_leaderboard(?int $festival_id = null): void {
        if (!Peanut_Festival_Firebase::is_enabled()) {
            return;
        }

        $festival_id = $festival_id ?? Peanut_Festival_Settings::get_active_festival_id();
        if (!$festival_id) {
            return;
        }

        global $wpdb;
        $performers_table = Peanut_Festival_Database::get_table_name('performers');
        $votes_table = Peanut_Festival_Database::get_table_name('votes');

        $sql = $wpdb->prepare(
            "SELECT
                p.id,
                p.name,
                p.photo_url,
                COALESCE(SUM(
                    CASE v.vote_rank
                        WHEN 1 THEN 5
                        WHEN 2 THEN 3
                        WHEN 3 THEN 1
                        ELSE 0
                    END
                ), 0) as score
            FROM $performers_table p
            LEFT JOIN $votes_table v ON p.id = v.performer_id
            WHERE p.festival_id = %d
            AND p.status = 'accepted'
            GROUP BY p.id
            ORDER BY score DESC, p.name ASC
            LIMIT 50",
            $festival_id
        );

        $performers = $wpdb->get_results($sql);

        $data = [
            'updated_at' => gmdate('c'),
            'performers' => [],
        ];

        $rank = 1;
        foreach ($performers as $p) {
            $data['performers'][$p->id] = [
                'rank' => $rank++,
                'name' => $p->name,
                'photo_url' => $p->photo_url ?? '',
                'score' => (int) $p->score,
            ];
        }

        $firebase = Peanut_Festival_Firebase::get_instance();
        $firebase->write('leaderboards/' . $festival_id, $data);
    }

    /**
     * Initialize full festival sync to Firebase.
     *
     * @param int $festival_id Festival ID
     */
    public static function init_festival_sync(int $festival_id): void {
        if (!Peanut_Festival_Firebase::is_enabled()) {
            return;
        }

        $instance = self::get_instance();
        $firebase = Peanut_Festival_Firebase::get_instance();

        // Sync festival info
        $festival = Peanut_Festival_Festivals::get_by_id($festival_id);
        if ($festival) {
            $firebase->write('festivals/' . $festival_id, [
                'id' => (int) $festival->id,
                'name' => $festival->name,
                'slug' => $festival->slug,
                'start_date' => $festival->start_date,
                'end_date' => $festival->end_date,
                'status' => $festival->status,
                'synced_at' => gmdate('c'),
            ]);
        }

        // Sync all shows
        $shows = Peanut_Festival_Shows::get_all(['festival_id' => $festival_id]);
        foreach ($shows as $show) {
            $instance->sync_show($firebase, $show->id, $show->status);
        }

        // Sync leaderboard
        $instance->sync_leaderboard($festival_id);

        Peanut_Festival_Logger::info('Festival ' . $festival_id . ' synced to Firebase');
    }

    /**
     * Clear all Firebase data for a festival.
     *
     * @param int $festival_id Festival ID
     */
    public static function clear_festival_sync(int $festival_id): void {
        if (!Peanut_Festival_Firebase::is_enabled()) {
            return;
        }

        $firebase = Peanut_Festival_Firebase::get_instance();

        $firebase->delete('festivals/' . $festival_id);
        $firebase->delete('leaderboards/' . $festival_id);

        Peanut_Festival_Logger::info('Festival ' . $festival_id . ' cleared from Firebase');
    }
}
