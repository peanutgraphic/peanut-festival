<?php
/**
 * Voting system class (ported from mcf-voting)
 *
 * @package Peanut_Festival
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Voting {

    private static ?Peanut_Festival_Voting $instance = null;

    /**
     * Cache expiration in seconds (30 seconds for active voting)
     */
    private const CACHE_EXPIRATION = 30;

    public static function get_instance(): Peanut_Festival_Voting {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    /**
     * Get voting configuration for a show (with caching)
     *
     * @param string $show_slug The show slug
     * @param bool $bypass_cache Force fresh data from database
     * @return array The voting configuration
     */
    public static function get_show_config(string $show_slug, bool $bypass_cache = false): array {
        $cache_key = 'pf_voting_cfg_' . md5($show_slug);

        // Try to get from transient cache first
        if (!$bypass_cache) {
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return $cached;
            }
        }

        $config = get_option("pf_voting_config_{$show_slug}", []);

        $defaults = [
            'groups' => [],
            'pool' => [],
            'active_group' => 'pool',
            'timer_start' => null,
            'timer_duration' => 0,
            'num_groups' => 3,
            'top_per_group' => 2,
            'weight_first' => 3,
            'weight_second' => 2,
            'weight_third' => 1,
            'hide_bios' => false,
            'reveal_results' => false,
        ];

        $config = wp_parse_args($config, $defaults);

        // Cache for 30 seconds during active voting
        set_transient($cache_key, $config, self::CACHE_EXPIRATION);

        return $config;
    }

    /**
     * Save voting configuration for a show
     *
     * @param string $show_slug The show slug
     * @param array $config The configuration to save
     * @return bool Success
     */
    public static function save_show_config(string $show_slug, array $config): bool {
        // Clear the cache when config is updated
        $cache_key = 'pf_voting_cfg_' . md5($show_slug);
        delete_transient($cache_key);

        return update_option("pf_voting_config_{$show_slug}", $config);
    }

    /**
     * Clear voting config cache for a show
     *
     * @param string $show_slug The show slug
     */
    public static function clear_config_cache(string $show_slug): void {
        $cache_key = 'pf_voting_cfg_' . md5($show_slug);
        delete_transient($cache_key);
    }

    public static function is_voting_open(string $show_slug): bool {
        $config = self::get_show_config($show_slug);

        if ($config['active_group'] === 'pool') {
            return false;
        }

        if ($config['timer_duration'] > 0 && $config['timer_start']) {
            $start = strtotime($config['timer_start']);
            $end = $start + ($config['timer_duration'] * 60);
            $now = current_time('timestamp');

            return $now < $end;
        }

        return true;
    }

    public static function get_time_remaining(string $show_slug): ?int {
        $config = self::get_show_config($show_slug);

        if (!$config['timer_start'] || $config['timer_duration'] <= 0) {
            return null;
        }

        $start = strtotime($config['timer_start']);
        $end = $start + ($config['timer_duration'] * 60);
        $now = current_time('timestamp');

        $remaining = $end - $now;
        return max(0, $remaining);
    }

    public static function has_voted(string $show_slug, string $group_name, string $token, string $ip_hash): bool {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('votes');

        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE show_slug = %s AND group_name = %s AND (token = %s OR ip_hash = %s)",
            $show_slug, $group_name, $token, $ip_hash
        ));

        return (int) $count > 0;
    }

    public static function record_vote(array $data): int|false {
        return Peanut_Festival_Database::insert('votes', [
            'show_slug' => $data['show_slug'],
            'group_name' => $data['group_name'],
            'performer_id' => $data['performer_id'],
            'vote_rank' => $data['vote_rank'] ?? 1,
            'ip_hash' => $data['ip_hash'],
            'ua_hash' => $data['ua_hash'],
            'token' => $data['token'],
            'voted_at' => current_time('mysql'),
        ]);
    }

    public static function get_results(string $show_slug, string $group_name = ''): array {
        global $wpdb;
        $votes_table = Peanut_Festival_Database::get_table_name('votes');
        $performers_table = Peanut_Festival_Database::get_table_name('performers');

        $config = self::get_show_config($show_slug);

        $sql = "SELECT
                    v.performer_id,
                    p.name as performer_name,
                    p.photo_url,
                    v.group_name,
                    SUM(CASE WHEN v.vote_rank = 1 THEN 1 ELSE 0 END) as first_place,
                    SUM(CASE WHEN v.vote_rank = 2 THEN 1 ELSE 0 END) as second_place,
                    SUM(CASE WHEN v.vote_rank = 3 THEN 1 ELSE 0 END) as third_place,
                    COUNT(*) as total_votes,
                    SUM(
                        CASE v.vote_rank
                            WHEN 1 THEN %d
                            WHEN 2 THEN %d
                            WHEN 3 THEN %d
                            ELSE 0
                        END
                    ) as weighted_score
                FROM $votes_table v
                LEFT JOIN $performers_table p ON v.performer_id = p.id
                WHERE v.show_slug = %s";

        $values = [
            $config['weight_first'],
            $config['weight_second'],
            $config['weight_third'],
            $show_slug,
        ];

        if ($group_name) {
            $sql .= " AND v.group_name = %s";
            $values[] = $group_name;
        }

        $sql .= " GROUP BY v.performer_id, v.group_name, p.name, p.photo_url
                  ORDER BY weighted_score DESC, first_place DESC";

        return $wpdb->get_results($wpdb->prepare($sql, ...$values));
    }

    public static function get_vote_logs(string $show_slug = '', int $limit = 200): array {
        global $wpdb;
        $votes_table = Peanut_Festival_Database::get_table_name('votes');
        $performers_table = Peanut_Festival_Database::get_table_name('performers');

        $sql = "SELECT v.*, p.name as performer_name
                FROM $votes_table v
                LEFT JOIN $performers_table p ON v.performer_id = p.id";

        $values = [];

        if ($show_slug) {
            $sql .= " WHERE v.show_slug = %s";
            $values[] = $show_slug;
        }

        $sql .= " ORDER BY v.voted_at DESC LIMIT %d";
        $values[] = $limit;

        return $wpdb->get_results($wpdb->prepare($sql, ...$values));
    }

    public static function calculate_finals(string $show_slug): array {
        $config = self::get_show_config($show_slug);
        $results = self::get_results($show_slug);

        if (empty($results)) {
            return [];
        }

        // Group results by group_name
        $grouped = [];
        foreach ($results as $row) {
            $grouped[$row->group_name][] = $row;
        }

        // Calculate normalized scores
        $all_results = [];
        $group_count = count($grouped);

        if ($group_count === 0) {
            return [];
        }

        // Get average votes across all groups
        $total_votes_all = 0;
        $group_sizes = [];

        foreach ($grouped as $group_name => $group_results) {
            $group_votes = 0;
            foreach ($group_results as $r) {
                $group_votes += $r->total_votes;
            }
            $group_sizes[$group_name] = [
                'count' => count($group_results),
                'votes' => $group_votes,
            ];
            $total_votes_all += $group_votes;
        }

        $avg_votes = $group_count > 0 ? $total_votes_all / $group_count : 1;

        foreach ($grouped as $group_name => $group_results) {
            $group_size = $group_sizes[$group_name]['count'];
            $group_votes = $group_sizes[$group_name]['votes'];

            foreach ($group_results as $r) {
                $raw_score = (float) $r->weighted_score;

                // Normalize: (raw / group_size) * (avg_votes / group_votes)
                $normalized = $group_size > 0 && $group_votes > 0
                    ? ($raw_score / $group_size) * ($avg_votes / $group_votes)
                    : $raw_score;

                $all_results[] = [
                    'performer_id' => $r->performer_id,
                    'performer_name' => $r->performer_name,
                    'photo_url' => $r->photo_url,
                    'group_name' => $group_name,
                    'raw_score' => $raw_score,
                    'normalized_score' => round($normalized, 2),
                    'first_place_votes' => (int) $r->first_place,
                    'second_place_votes' => (int) $r->second_place,
                    'total_votes' => (int) $r->total_votes,
                ];
            }
        }

        // Sort by normalized score, then first place votes (tie breaker)
        usort($all_results, function($a, $b) {
            if ($a['normalized_score'] !== $b['normalized_score']) {
                return $b['normalized_score'] <=> $a['normalized_score'];
            }
            return $b['first_place_votes'] <=> $a['first_place_votes'];
        });

        // Assign ranks
        $rank = 1;
        foreach ($all_results as &$result) {
            $result['final_rank'] = $rank++;
        }

        // Store in finals table
        self::save_finals($show_slug, $all_results);

        return $all_results;
    }

    private static function save_finals(string $show_slug, array $results): void {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('voting_finals');

        // Clear existing finals for this show
        $wpdb->delete($table, ['show_slug' => $show_slug]);

        foreach ($results as $result) {
            Peanut_Festival_Database::insert('voting_finals', [
                'show_slug' => $show_slug,
                'performer_id' => $result['performer_id'],
                'group_name' => $result['group_name'],
                'raw_score' => $result['raw_score'],
                'normalized_score' => $result['normalized_score'],
                'final_rank' => $result['final_rank'],
                'first_place_votes' => $result['first_place_votes'],
                'second_place_votes' => $result['second_place_votes'],
                'total_votes' => $result['total_votes'],
                'calculated_at' => current_time('mysql'),
            ]);
        }
    }

    public static function clear_votes(string $show_slug, string $group_name = ''): int|false {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('votes');

        if ($group_name) {
            return $wpdb->delete($table, [
                'show_slug' => $show_slug,
                'group_name' => $group_name,
            ]);
        }

        return $wpdb->delete($table, ['show_slug' => $show_slug]);
    }

    public static function hash_ip(string $ip): string {
        return hash('sha256', $ip . NONCE_SALT);
    }

    public static function hash_ua(string $ua): string {
        return hash('sha256', $ua . NONCE_SALT);
    }
}
