<?php
/**
 * Competitions Management Class
 *
 * Handles tournament brackets, elimination competitions, and head-to-head voting.
 * Supports single elimination, double elimination, and round robin formats.
 *
 * @package    Peanut_Festival
 * @subpackage Includes
 * @since      1.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Peanut_Festival_Competitions
 *
 * Manages competition brackets and tournament-style performer matchups.
 *
 * @since 1.1.0
 */
class Peanut_Festival_Competitions {

    /**
     * Singleton instance.
     *
     * @since 1.1.0
     * @var Peanut_Festival_Competitions|null
     */
    private static ?Peanut_Festival_Competitions $instance = null;

    /**
     * Competition types.
     */
    public const TYPE_SINGLE_ELIMINATION = 'single_elimination';
    public const TYPE_DOUBLE_ELIMINATION = 'double_elimination';
    public const TYPE_ROUND_ROBIN = 'round_robin';

    /**
     * Voting methods.
     */
    public const VOTING_HEAD_TO_HEAD = 'head_to_head';
    public const VOTING_BORDA = 'borda';
    public const VOTING_JUDGES = 'judges';
    public const VOTING_COMBINED = 'combined';

    /**
     * Competition statuses.
     */
    public const STATUS_SETUP = 'setup';
    public const STATUS_REGISTRATION = 'registration';
    public const STATUS_SEEDING = 'seeding';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Match statuses.
     */
    public const MATCH_PENDING = 'pending';
    public const MATCH_SCHEDULED = 'scheduled';
    public const MATCH_VOTING = 'voting';
    public const MATCH_COMPLETED = 'completed';
    public const MATCH_BYE = 'bye';

    /**
     * Get singleton instance.
     *
     * @since 1.1.0
     * @return Peanut_Festival_Competitions The singleton instance.
     */
    public static function get_instance(): Peanut_Festival_Competitions {
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
        $this->init_hooks();
    }

    /**
     * Initialize hooks.
     *
     * @since 1.1.0
     */
    private function init_hooks(): void {
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Cron for auto-advancing matches
        add_action('peanut_festival_check_match_deadlines', [$this, 'check_match_deadlines']);
        if (!wp_next_scheduled('peanut_festival_check_match_deadlines')) {
            wp_schedule_event(time(), 'five_minutes', 'peanut_festival_check_match_deadlines');
        }
    }

    // =========================================================================
    // Competition CRUD
    // =========================================================================

    /**
     * Get all competitions with optional filtering.
     *
     * @since 1.1.0
     *
     * @param array $args {
     *     Optional arguments.
     *
     *     @type int    $festival_id Filter by festival.
     *     @type string $status Filter by status.
     *     @type string $type Filter by competition type.
     *     @type string $order_by Column to sort by.
     *     @type string $order Sort direction.
     *     @type int    $limit Maximum results.
     *     @type int    $offset Pagination offset.
     * }
     * @return array Array of competition objects.
     */
    public static function get_all(array $args = []): array {
        $defaults = [
            'festival_id' => null,
            'status' => '',
            'type' => '',
            'order_by' => 'created_at',
            'order' => 'DESC',
            'limit' => 0,
            'offset' => 0,
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('competitions');

        $sql = "SELECT * FROM $table WHERE 1=1";
        $values = [];

        if ($args['festival_id']) {
            $sql .= " AND festival_id = %d";
            $values[] = $args['festival_id'];
        }

        if ($args['status']) {
            $sql .= " AND status = %s";
            $values[] = $args['status'];
        }

        if ($args['type']) {
            $sql .= " AND competition_type = %s";
            $values[] = $args['type'];
        }

        $allowed_columns = ['id', 'name', 'status', 'competition_type', 'created_at', 'scheduled_start'];
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

        $results = $wpdb->get_results($sql);

        // Decode config JSON
        foreach ($results as &$competition) {
            if (!empty($competition->config)) {
                $competition->config = json_decode($competition->config, true);
            }
        }

        return $results;
    }

    /**
     * Get competition by ID.
     *
     * @since 1.1.0
     *
     * @param int $id Competition ID.
     * @return object|null Competition object or null.
     */
    public static function get_by_id(int $id): ?object {
        $competition = Peanut_Festival_Database::get_row('competitions', ['id' => $id]);

        if ($competition && !empty($competition->config)) {
            $competition->config = json_decode($competition->config, true);
        }

        return $competition;
    }

    /**
     * Create a new competition.
     *
     * @since 1.1.0
     *
     * @param array $data Competition data.
     * @return int|false Competition ID or false on failure.
     */
    public static function create(array $data): int|false {
        $defaults = [
            'competition_type' => self::TYPE_SINGLE_ELIMINATION,
            'voting_method' => self::VOTING_HEAD_TO_HEAD,
            'status' => self::STATUS_SETUP,
            'rounds_count' => 0,
            'current_round' => 0,
            'config' => [],
        ];
        $data = wp_parse_args($data, $defaults);

        // Encode config as JSON
        if (is_array($data['config'])) {
            $data['config'] = wp_json_encode($data['config']);
        }

        $data['created_by'] = get_current_user_id();
        $data['created_at'] = current_time('mysql');

        return Peanut_Festival_Database::insert('competitions', $data);
    }

    /**
     * Update a competition.
     *
     * @since 1.1.0
     *
     * @param int   $id Competition ID.
     * @param array $data Fields to update.
     * @return int|false Rows updated or false.
     */
    public static function update(int $id, array $data): int|false {
        if (isset($data['config']) && is_array($data['config'])) {
            $data['config'] = wp_json_encode($data['config']);
        }

        $data['updated_at'] = current_time('mysql');

        return Peanut_Festival_Database::update('competitions', $data, ['id' => $id]);
    }

    /**
     * Delete a competition and its matches.
     *
     * @since 1.1.0
     *
     * @param int $id Competition ID.
     * @return int|false Rows deleted or false.
     */
    public static function delete(int $id): int|false {
        // Delete all matches first
        Peanut_Festival_Database::delete('competition_matches', ['competition_id' => $id]);

        return Peanut_Festival_Database::delete('competitions', ['id' => $id]);
    }

    // =========================================================================
    // Match CRUD
    // =========================================================================

    /**
     * Get matches for a competition.
     *
     * @since 1.1.0
     *
     * @param int   $competition_id Competition ID.
     * @param array $args Optional filters.
     * @return array Array of match objects.
     */
    public static function get_matches(int $competition_id, array $args = []): array {
        $defaults = [
            'round_number' => null,
            'status' => '',
            'order_by' => 'round_number',
            'order' => 'ASC',
        ];
        $args = wp_parse_args($args, $defaults);

        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('competition_matches');
        $performers_table = Peanut_Festival_Database::get_table_name('performers');

        $sql = "SELECT m.*,
                       p1.name as performer_1_name,
                       p2.name as performer_2_name,
                       pw.name as winner_name
                FROM $table m
                LEFT JOIN $performers_table p1 ON m.performer_1_id = p1.id
                LEFT JOIN $performers_table p2 ON m.performer_2_id = p2.id
                LEFT JOIN $performers_table pw ON m.winner_id = pw.id
                WHERE m.competition_id = %d";
        $values = [$competition_id];

        if ($args['round_number'] !== null) {
            $sql .= " AND m.round_number = %d";
            $values[] = $args['round_number'];
        }

        if ($args['status']) {
            $sql .= " AND m.status = %s";
            $values[] = $args['status'];
        }

        $order_by = in_array($args['order_by'], ['round_number', 'match_number', 'scheduled_time'], true)
            ? $args['order_by']
            : 'round_number';
        $order = strtoupper($args['order']) === 'DESC' ? 'DESC' : 'ASC';
        $sql .= " ORDER BY m.{$order_by} {$order}, m.match_number ASC";

        $sql = $wpdb->prepare($sql, ...$values);

        return $wpdb->get_results($sql);
    }

    /**
     * Get a single match by ID.
     *
     * @since 1.1.0
     *
     * @param int $match_id Match ID.
     * @return object|null Match object or null.
     */
    public static function get_match(int $match_id): ?object {
        return Peanut_Festival_Database::get_row('competition_matches', ['id' => $match_id]);
    }

    /**
     * Create a match.
     *
     * @since 1.1.0
     *
     * @param array $data Match data.
     * @return int|false Match ID or false.
     */
    public static function create_match(array $data): int|false {
        $data['created_at'] = current_time('mysql');
        return Peanut_Festival_Database::insert('competition_matches', $data);
    }

    /**
     * Update a match.
     *
     * @since 1.1.0
     *
     * @param int   $match_id Match ID.
     * @param array $data Fields to update.
     * @return int|false Rows updated or false.
     */
    public static function update_match(int $match_id, array $data): int|false {
        $data['updated_at'] = current_time('mysql');
        return Peanut_Festival_Database::update('competition_matches', $data, ['id' => $match_id]);
    }

    // =========================================================================
    // Bracket Generation
    // =========================================================================

    /**
     * Generate bracket for a competition.
     *
     * @since 1.1.0
     *
     * @param int   $competition_id Competition ID.
     * @param array $performer_ids Array of performer IDs (in seed order).
     * @return bool Success.
     */
    public static function generate_bracket(int $competition_id, array $performer_ids): bool {
        $competition = self::get_by_id($competition_id);
        if (!$competition) {
            return false;
        }

        // Clear existing matches
        Peanut_Festival_Database::delete('competition_matches', ['competition_id' => $competition_id]);

        $count = count($performer_ids);
        if ($count < 2) {
            return false;
        }

        switch ($competition->competition_type) {
            case self::TYPE_SINGLE_ELIMINATION:
                return self::generate_single_elimination($competition_id, $performer_ids);

            case self::TYPE_DOUBLE_ELIMINATION:
                return self::generate_double_elimination($competition_id, $performer_ids);

            case self::TYPE_ROUND_ROBIN:
                return self::generate_round_robin($competition_id, $performer_ids);

            default:
                return false;
        }
    }

    /**
     * Generate single elimination bracket.
     *
     * @since 1.1.0
     *
     * @param int   $competition_id Competition ID.
     * @param array $performer_ids Performer IDs in seed order.
     * @return bool Success.
     */
    private static function generate_single_elimination(int $competition_id, array $performer_ids): bool {
        $count = count($performer_ids);

        // Calculate number of rounds needed
        $rounds = (int) ceil(log($count, 2));

        // Calculate bracket size (next power of 2)
        $bracket_size = pow(2, $rounds);

        // Calculate number of byes needed
        $byes = $bracket_size - $count;

        // Seed the bracket (standard tournament seeding)
        $seeded = self::seed_bracket($performer_ids, $bracket_size);

        // Generate first round matches
        $match_number = 1;
        $first_round_matches = [];

        for ($i = 0; $i < $bracket_size; $i += 2) {
            $p1_id = $seeded[$i];
            $p2_id = $seeded[$i + 1];

            $match_data = [
                'competition_id' => $competition_id,
                'round_number' => 1,
                'match_number' => $match_number,
                'bracket_position' => "R1M{$match_number}",
                'performer_1_id' => $p1_id,
                'performer_2_id' => $p2_id,
                'performer_1_seed' => $p1_id ? array_search($p1_id, $performer_ids) + 1 : null,
                'performer_2_seed' => $p2_id ? array_search($p2_id, $performer_ids) + 1 : null,
                'status' => self::MATCH_PENDING,
            ];

            // Handle byes
            if (!$p1_id && $p2_id) {
                $match_data['winner_id'] = $p2_id;
                $match_data['status'] = self::MATCH_BYE;
            } elseif ($p1_id && !$p2_id) {
                $match_data['winner_id'] = $p1_id;
                $match_data['status'] = self::MATCH_BYE;
            }

            $match_id = self::create_match($match_data);
            $first_round_matches[] = $match_id;
            $match_number++;
        }

        // Generate subsequent round placeholders
        $matches_in_round = count($first_round_matches) / 2;
        for ($round = 2; $round <= $rounds; $round++) {
            for ($m = 1; $m <= $matches_in_round; $m++) {
                self::create_match([
                    'competition_id' => $competition_id,
                    'round_number' => $round,
                    'match_number' => $m,
                    'bracket_position' => "R{$round}M{$m}",
                    'status' => self::MATCH_PENDING,
                ]);
            }
            $matches_in_round = (int) ($matches_in_round / 2);
        }

        // Update competition
        self::update($competition_id, [
            'rounds_count' => $rounds,
            'current_round' => 1,
            'status' => self::STATUS_ACTIVE,
        ]);

        // Advance any bye winners
        self::advance_bye_winners($competition_id);

        return true;
    }

    /**
     * Generate double elimination bracket.
     *
     * @since 1.1.0
     *
     * @param int   $competition_id Competition ID.
     * @param array $performer_ids Performer IDs.
     * @return bool Success.
     */
    private static function generate_double_elimination(int $competition_id, array $performer_ids): bool {
        // For now, implement as single elimination
        // TODO: Implement full double elimination with losers bracket
        return self::generate_single_elimination($competition_id, $performer_ids);
    }

    /**
     * Generate round robin schedule.
     *
     * @since 1.1.0
     *
     * @param int   $competition_id Competition ID.
     * @param array $performer_ids Performer IDs.
     * @return bool Success.
     */
    private static function generate_round_robin(int $competition_id, array $performer_ids): bool {
        $count = count($performer_ids);

        // Add dummy player if odd number
        if ($count % 2 !== 0) {
            $performer_ids[] = null; // Bye
            $count++;
        }

        $rounds = $count - 1;
        $matches_per_round = $count / 2;

        // Generate round robin schedule using circle method
        $players = $performer_ids;
        $fixed = array_shift($players); // Fix first player

        $match_number = 1;
        for ($round = 1; $round <= $rounds; $round++) {
            // First match: fixed player vs player at position 0
            $pairs = [];
            $pairs[] = [$fixed, $players[0]];

            // Remaining matches
            for ($i = 1; $i < $matches_per_round; $i++) {
                $pairs[] = [$players[$i], $players[$count - 1 - $i]];
            }

            // Create matches
            foreach ($pairs as $pair) {
                if ($pair[0] !== null && $pair[1] !== null) {
                    self::create_match([
                        'competition_id' => $competition_id,
                        'round_number' => $round,
                        'match_number' => $match_number,
                        'bracket_position' => "RR-R{$round}M{$match_number}",
                        'performer_1_id' => $pair[0],
                        'performer_2_id' => $pair[1],
                        'status' => self::MATCH_PENDING,
                    ]);
                    $match_number++;
                }
            }

            // Rotate players (not the fixed one)
            $last = array_pop($players);
            array_unshift($players, $last);
        }

        self::update($competition_id, [
            'rounds_count' => $rounds,
            'current_round' => 1,
            'status' => self::STATUS_ACTIVE,
        ]);

        return true;
    }

    /**
     * Seed bracket in standard tournament format.
     *
     * @since 1.1.0
     *
     * @param array $performers Performer IDs in seed order.
     * @param int   $size Bracket size.
     * @return array Seeded positions.
     */
    private static function seed_bracket(array $performers, int $size): array {
        $seeded = array_fill(0, $size, null);

        // Standard tournament seeding positions
        $positions = self::get_seed_positions($size);

        foreach ($performers as $seed => $performer_id) {
            if (isset($positions[$seed])) {
                $seeded[$positions[$seed]] = $performer_id;
            }
        }

        return $seeded;
    }

    /**
     * Get standard tournament seed positions.
     *
     * @since 1.1.0
     *
     * @param int $size Bracket size.
     * @return array Position map.
     */
    private static function get_seed_positions(int $size): array {
        // Standard seeding: 1 vs last, 2 vs second-last, etc.
        $positions = [];
        $matches = $size / 2;

        for ($i = 0; $i < $matches; $i++) {
            $positions[$i] = $i * 2;                    // Top seeds
            $positions[$size - 1 - $i] = $i * 2 + 1;   // Bottom seeds
        }

        return $positions;
    }

    /**
     * Advance winners from bye matches.
     *
     * @since 1.1.0
     *
     * @param int $competition_id Competition ID.
     */
    private static function advance_bye_winners(int $competition_id): void {
        $bye_matches = self::get_matches($competition_id, ['status' => self::MATCH_BYE]);

        foreach ($bye_matches as $match) {
            if ($match->winner_id) {
                self::advance_winner($match->id, $match->winner_id);
            }
        }
    }

    // =========================================================================
    // Match Operations
    // =========================================================================

    /**
     * Start voting for a match.
     *
     * @since 1.1.0
     *
     * @param int      $match_id Match ID.
     * @param int|null $duration_minutes Voting duration in minutes.
     * @return bool Success.
     */
    public static function start_match_voting(int $match_id, ?int $duration_minutes = 10): bool {
        $match = self::get_match($match_id);
        if (!$match || !$match->performer_1_id || !$match->performer_2_id) {
            return false;
        }

        $now = current_time('mysql');
        $closes = date('Y-m-d H:i:s', strtotime("+{$duration_minutes} minutes"));

        self::update_match($match_id, [
            'status' => self::MATCH_VOTING,
            'voting_opens_at' => $now,
            'voting_closes_at' => $closes,
            'started_at' => $now,
        ]);

        /**
         * Fires when match voting starts.
         *
         * @since 1.1.0
         *
         * @param int    $match_id Match ID.
         * @param object $match Match object.
         */
        do_action('peanut_festival_match_voting_started', $match_id, $match);

        return true;
    }

    /**
     * Submit vote for a match.
     *
     * @since 1.1.0
     *
     * @param int    $match_id Match ID.
     * @param int    $performer_id Performer being voted for.
     * @param string $voter_id Unique voter identifier.
     * @return bool|WP_Error Success or error.
     */
    public static function submit_match_vote(int $match_id, int $performer_id, string $voter_id): bool|WP_Error {
        $match = self::get_match($match_id);

        if (!$match) {
            return new WP_Error('invalid_match', 'Match not found');
        }

        if ($match->status !== self::MATCH_VOTING) {
            return new WP_Error('voting_closed', 'Voting is not open for this match');
        }

        // Check if voting period has ended
        if ($match->voting_closes_at && strtotime($match->voting_closes_at) < time()) {
            return new WP_Error('voting_closed', 'Voting period has ended');
        }

        // Validate performer is in this match
        if ($performer_id != $match->performer_1_id && $performer_id != $match->performer_2_id) {
            return new WP_Error('invalid_performer', 'Performer not in this match');
        }

        // Check for duplicate vote (using transient for simplicity)
        $vote_key = "pf_match_vote_{$match_id}_{$voter_id}";
        if (get_transient($vote_key)) {
            return new WP_Error('already_voted', 'You have already voted in this match');
        }

        // Record vote
        if ($performer_id == $match->performer_1_id) {
            self::update_match($match_id, [
                'votes_performer_1' => $match->votes_performer_1 + 1,
            ]);
        } else {
            self::update_match($match_id, [
                'votes_performer_2' => $match->votes_performer_2 + 1,
            ]);
        }

        // Mark voter (expires when voting closes)
        $ttl = max(60, strtotime($match->voting_closes_at) - time());
        set_transient($vote_key, true, $ttl);

        /**
         * Fires when a match vote is submitted.
         *
         * @since 1.1.0
         *
         * @param int    $match_id Match ID.
         * @param int    $performer_id Performer voted for.
         * @param string $voter_id Voter identifier.
         */
        do_action('peanut_festival_match_vote_submitted', $match_id, $performer_id, $voter_id);

        return true;
    }

    /**
     * Complete a match and determine winner.
     *
     * @since 1.1.0
     *
     * @param int      $match_id Match ID.
     * @param int|null $winner_id Optional winner ID (if not using votes).
     * @return bool Success.
     */
    public static function complete_match(int $match_id, ?int $winner_id = null): bool {
        $match = self::get_match($match_id);
        if (!$match) {
            return false;
        }

        // Determine winner by votes if not specified
        if (!$winner_id) {
            if ($match->votes_performer_1 > $match->votes_performer_2) {
                $winner_id = $match->performer_1_id;
            } elseif ($match->votes_performer_2 > $match->votes_performer_1) {
                $winner_id = $match->performer_2_id;
            } else {
                // Tie - could implement tiebreaker logic here
                // For now, performer 1 wins ties (higher seed usually)
                $winner_id = $match->performer_1_id;
            }
        }

        self::update_match($match_id, [
            'winner_id' => $winner_id,
            'status' => self::MATCH_COMPLETED,
            'completed_at' => current_time('mysql'),
        ]);

        // Advance winner to next round
        self::advance_winner($match_id, $winner_id);

        // Fire hook for Booker integration
        Peanut_Festival_Booker_Integration::fire_vote_winner(
            $winner_id,
            0, // No show_id for competition matches
            $winner_id == $match->performer_1_id ? $match->votes_performer_1 : $match->votes_performer_2
        );

        return true;
    }

    /**
     * Advance winner to next round.
     *
     * @since 1.1.0
     *
     * @param int $match_id Completed match ID.
     * @param int $winner_id Winner performer ID.
     */
    private static function advance_winner(int $match_id, int $winner_id): void {
        $match = self::get_match($match_id);
        if (!$match) {
            return;
        }

        $competition = self::get_by_id($match->competition_id);
        if (!$competition || $competition->competition_type === self::TYPE_ROUND_ROBIN) {
            return; // Round robin doesn't advance
        }

        // Find next round match
        $next_round = $match->round_number + 1;
        $next_match_number = (int) ceil($match->match_number / 2);

        $next_match = Peanut_Festival_Database::get_row('competition_matches', [
            'competition_id' => $match->competition_id,
            'round_number' => $next_round,
            'match_number' => $next_match_number,
        ]);

        if (!$next_match) {
            // This was the final - update competition winner
            if ($next_round > $competition->rounds_count) {
                self::update($competition->id, [
                    'winner_performer_id' => $winner_id,
                    'status' => self::STATUS_COMPLETED,
                    'completed_at' => current_time('mysql'),
                ]);

                /**
                 * Fires when a competition is completed.
                 *
                 * @since 1.1.0
                 *
                 * @param int $competition_id Competition ID.
                 * @param int $winner_id Winner performer ID.
                 */
                do_action('peanut_festival_competition_completed', $competition->id, $winner_id);
            }
            return;
        }

        // Determine position in next match (top or bottom)
        $is_top = ($match->match_number % 2) === 1;

        $update_data = $is_top
            ? ['performer_1_id' => $winner_id]
            : ['performer_2_id' => $winner_id];

        self::update_match($next_match->id, $update_data);
    }

    /**
     * Check and complete matches past their deadline.
     *
     * @since 1.1.0
     */
    public function check_match_deadlines(): void {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('competition_matches');

        $overdue = $wpdb->get_results(
            "SELECT id FROM $table
             WHERE status = 'voting'
             AND voting_closes_at < NOW()"
        );

        foreach ($overdue as $match) {
            self::complete_match($match->id);
        }
    }

    // =========================================================================
    // Results & Standings
    // =========================================================================

    /**
     * Get competition standings (for round robin).
     *
     * @since 1.1.0
     *
     * @param int $competition_id Competition ID.
     * @return array Standings array.
     */
    public static function get_standings(int $competition_id): array {
        $competition = self::get_by_id($competition_id);
        if (!$competition || $competition->competition_type !== self::TYPE_ROUND_ROBIN) {
            return [];
        }

        $matches = self::get_matches($competition_id, ['status' => self::MATCH_COMPLETED]);

        $standings = [];

        foreach ($matches as $match) {
            // Initialize performers in standings
            foreach ([$match->performer_1_id, $match->performer_2_id] as $pid) {
                if (!isset($standings[$pid])) {
                    $standings[$pid] = [
                        'performer_id' => $pid,
                        'wins' => 0,
                        'losses' => 0,
                        'total_votes' => 0,
                        'points' => 0,
                    ];
                }
            }

            // Update standings
            if ($match->winner_id == $match->performer_1_id) {
                $standings[$match->performer_1_id]['wins']++;
                $standings[$match->performer_2_id]['losses']++;
            } else {
                $standings[$match->performer_2_id]['wins']++;
                $standings[$match->performer_1_id]['losses']++;
            }

            $standings[$match->performer_1_id]['total_votes'] += $match->votes_performer_1;
            $standings[$match->performer_2_id]['total_votes'] += $match->votes_performer_2;
        }

        // Calculate points (3 for win, 0 for loss)
        foreach ($standings as &$standing) {
            $standing['points'] = $standing['wins'] * 3;
        }

        // Sort by points, then by total votes
        usort($standings, function ($a, $b) {
            if ($a['points'] !== $b['points']) {
                return $b['points'] - $a['points'];
            }
            return $b['total_votes'] - $a['total_votes'];
        });

        return array_values($standings);
    }

    /**
     * Get bracket data for visualization.
     *
     * @since 1.1.0
     *
     * @param int $competition_id Competition ID.
     * @return array Bracket structure.
     */
    public static function get_bracket(int $competition_id): array {
        $competition = self::get_by_id($competition_id);
        if (!$competition) {
            return [];
        }

        $matches = self::get_matches($competition_id);

        // Group by round
        $rounds = [];
        foreach ($matches as $match) {
            $round = $match->round_number;
            if (!isset($rounds[$round])) {
                $rounds[$round] = [];
            }
            $rounds[$round][] = [
                'id' => $match->id,
                'match_number' => $match->match_number,
                'performer_1' => [
                    'id' => $match->performer_1_id,
                    'name' => $match->performer_1_name ?? 'TBD',
                    'seed' => $match->performer_1_seed,
                    'votes' => $match->votes_performer_1,
                ],
                'performer_2' => [
                    'id' => $match->performer_2_id,
                    'name' => $match->performer_2_name ?? 'TBD',
                    'seed' => $match->performer_2_seed,
                    'votes' => $match->votes_performer_2,
                ],
                'winner_id' => $match->winner_id,
                'status' => $match->status,
                'scheduled_time' => $match->scheduled_time,
                'voting_closes_at' => $match->voting_closes_at,
            ];
        }

        return [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'type' => $competition->competition_type,
                'status' => $competition->status,
                'rounds_count' => $competition->rounds_count,
                'current_round' => $competition->current_round,
                'winner_id' => $competition->winner_performer_id,
            ],
            'rounds' => $rounds,
        ];
    }

    // =========================================================================
    // REST API
    // =========================================================================

    /**
     * Register REST routes.
     *
     * @since 1.1.0
     */
    public function register_rest_routes(): void {
        // Public endpoints
        register_rest_route('peanut-festival/v1', '/competitions', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_competitions'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('peanut-festival/v1', '/competitions/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_competition'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('peanut-festival/v1', '/competitions/(?P<id>\d+)/bracket', [
            'methods' => 'GET',
            'callback' => [$this, 'rest_get_bracket'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('peanut-festival/v1', '/matches/(?P<id>\d+)/vote', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_submit_vote'],
            'permission_callback' => '__return_true',
        ]);

        // Admin endpoints
        register_rest_route('peanut-festival/v1/admin', '/competitions', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_create_competition'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1/admin', '/competitions/(?P<id>\d+)', [
            'methods' => 'PATCH',
            'callback' => [$this, 'rest_update_competition'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1/admin', '/competitions/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'rest_delete_competition'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1/admin', '/competitions/(?P<id>\d+)/generate', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_generate_bracket'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1/admin', '/matches/(?P<id>\d+)/start', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_start_voting'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route('peanut-festival/v1/admin', '/matches/(?P<id>\d+)/complete', [
            'methods' => 'POST',
            'callback' => [$this, 'rest_complete_match'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);
    }

    /**
     * Check admin permission.
     *
     * @since 1.1.0
     *
     * @return bool
     */
    public function check_admin_permission(): bool {
        return current_user_can('manage_options');
    }

    /**
     * REST: Get competitions.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_competitions(WP_REST_Request $request): WP_REST_Response {
        $competitions = self::get_all([
            'festival_id' => $request->get_param('festival_id'),
            'status' => $request->get_param('status'),
        ]);

        return new WP_REST_Response(['competitions' => $competitions]);
    }

    /**
     * REST: Get single competition.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_competition(WP_REST_Request $request): WP_REST_Response {
        $competition = self::get_by_id((int) $request->get_param('id'));

        if (!$competition) {
            return new WP_REST_Response(['error' => 'Competition not found'], 404);
        }

        return new WP_REST_Response(['competition' => $competition]);
    }

    /**
     * REST: Get bracket.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_get_bracket(WP_REST_Request $request): WP_REST_Response {
        $bracket = self::get_bracket((int) $request->get_param('id'));

        if (empty($bracket)) {
            return new WP_REST_Response(['error' => 'Bracket not found'], 404);
        }

        return new WP_REST_Response($bracket);
    }

    /**
     * REST: Submit vote.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_submit_vote(WP_REST_Request $request): WP_REST_Response {
        $match_id = (int) $request->get_param('id');
        $performer_id = (int) $request->get_param('performer_id');

        // Generate voter ID from IP + user agent
        $voter_id = md5($_SERVER['REMOTE_ADDR'] . ($_SERVER['HTTP_USER_AGENT'] ?? ''));

        $result = self::submit_match_vote($match_id, $performer_id, $voter_id);

        if (is_wp_error($result)) {
            return new WP_REST_Response([
                'error' => $result->get_error_message(),
            ], 400);
        }

        return new WP_REST_Response(['success' => true]);
    }

    /**
     * REST: Create competition.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_create_competition(WP_REST_Request $request): WP_REST_Response {
        $data = [
            'festival_id' => (int) $request->get_param('festival_id'),
            'name' => sanitize_text_field($request->get_param('name')),
            'description' => sanitize_textarea_field($request->get_param('description') ?? ''),
            'competition_type' => sanitize_text_field($request->get_param('competition_type') ?? self::TYPE_SINGLE_ELIMINATION),
            'voting_method' => sanitize_text_field($request->get_param('voting_method') ?? self::VOTING_HEAD_TO_HEAD),
            'config' => $request->get_param('config') ?? [],
        ];

        $id = self::create($data);

        if (!$id) {
            return new WP_REST_Response(['error' => 'Failed to create competition'], 500);
        }

        return new WP_REST_Response([
            'success' => true,
            'competition_id' => $id,
        ], 201);
    }

    /**
     * REST: Update competition.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_update_competition(WP_REST_Request $request): WP_REST_Response {
        $id = (int) $request->get_param('id');
        $data = [];

        if ($request->has_param('name')) {
            $data['name'] = sanitize_text_field($request->get_param('name'));
        }
        if ($request->has_param('description')) {
            $data['description'] = sanitize_textarea_field($request->get_param('description'));
        }
        if ($request->has_param('status')) {
            $data['status'] = sanitize_text_field($request->get_param('status'));
        }
        if ($request->has_param('config')) {
            $data['config'] = $request->get_param('config');
        }

        $result = self::update($id, $data);

        return new WP_REST_Response(['success' => $result !== false]);
    }

    /**
     * REST: Delete competition.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_delete_competition(WP_REST_Request $request): WP_REST_Response {
        $result = self::delete((int) $request->get_param('id'));

        return new WP_REST_Response(['success' => $result !== false]);
    }

    /**
     * REST: Generate bracket.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_generate_bracket(WP_REST_Request $request): WP_REST_Response {
        $id = (int) $request->get_param('id');
        $performer_ids = $request->get_param('performer_ids');

        if (!is_array($performer_ids) || count($performer_ids) < 2) {
            return new WP_REST_Response(['error' => 'At least 2 performers required'], 400);
        }

        $result = self::generate_bracket($id, array_map('intval', $performer_ids));

        if (!$result) {
            return new WP_REST_Response(['error' => 'Failed to generate bracket'], 500);
        }

        return new WP_REST_Response([
            'success' => true,
            'bracket' => self::get_bracket($id),
        ]);
    }

    /**
     * REST: Start match voting.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_start_voting(WP_REST_Request $request): WP_REST_Response {
        $match_id = (int) $request->get_param('id');
        $duration = (int) ($request->get_param('duration') ?? 10);

        $result = self::start_match_voting($match_id, $duration);

        return new WP_REST_Response(['success' => $result]);
    }

    /**
     * REST: Complete match.
     *
     * @since 1.1.0
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function rest_complete_match(WP_REST_Request $request): WP_REST_Response {
        $match_id = (int) $request->get_param('id');
        $winner_id = $request->get_param('winner_id') ? (int) $request->get_param('winner_id') : null;

        $result = self::complete_match($match_id, $winner_id);

        return new WP_REST_Response(['success' => $result]);
    }
}
