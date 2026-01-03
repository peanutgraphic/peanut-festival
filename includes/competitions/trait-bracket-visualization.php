<?php
/**
 * Competitions Bracket Visualization Trait
 *
 * @package    Peanut_Festival
 * @subpackage Includes/Competitions
 * @since      1.2.1
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Trait Peanut_Festival_Competitions_Bracket_Visualization
 *
 * Handles standings and bracket visualization for competitions.
 *
 * @since 1.2.1
 */
trait Peanut_Festival_Competitions_Bracket_Visualization {

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
        $is_double_elim = $competition->competition_type === self::TYPE_DOUBLE_ELIMINATION;

        // For double elimination, group by bracket type then round
        if ($is_double_elim) {
            return self::get_double_elim_bracket($competition, $matches);
        }

        // Standard grouping by round for single elimination and round robin
        $rounds = [];
        foreach ($matches as $match) {
            $round = $match->round_number;
            if (!isset($rounds[$round])) {
                $rounds[$round] = [];
            }
            $rounds[$round][] = self::format_match_for_bracket($match);
        }

        return [
            'competition' => self::format_competition_for_bracket($competition),
            'rounds' => $rounds,
        ];
    }

    /**
     * Get double elimination bracket structure.
     *
     * @since 1.4.0
     *
     * @param object $competition Competition object.
     * @param array  $matches All matches.
     * @return array Bracket structure.
     */
    private static function get_double_elim_bracket(object $competition, array $matches): array {
        $winners_bracket = [];
        $losers_bracket = [];
        $grand_finals = null;
        $grand_finals_reset = null;

        foreach ($matches as $match) {
            $formatted = self::format_match_for_bracket($match);

            switch ($match->bracket_type ?? 'winners') {
                case 'winners':
                    $round = $match->round_number;
                    if (!isset($winners_bracket[$round])) {
                        $winners_bracket[$round] = [];
                    }
                    $winners_bracket[$round][] = $formatted;
                    break;

                case 'losers':
                    // Extract losers round from bracket_position (L_R{n}M{m})
                    preg_match('/L_R(\d+)/', $match->bracket_position ?? '', $m);
                    $l_round = (int) ($m[1] ?? 0);
                    if (!isset($losers_bracket[$l_round])) {
                        $losers_bracket[$l_round] = [];
                    }
                    $losers_bracket[$l_round][] = $formatted;
                    break;

                case 'grand_finals':
                    $grand_finals = $formatted;
                    break;

                case 'grand_finals_reset':
                    $grand_finals_reset = $formatted;
                    break;
            }
        }

        return [
            'competition' => self::format_competition_for_bracket($competition),
            'winners_bracket' => $winners_bracket,
            'losers_bracket' => $losers_bracket,
            'grand_finals' => $grand_finals,
            'grand_finals_reset' => $grand_finals_reset,
        ];
    }

    /**
     * Format match data for bracket response.
     *
     * @since 1.4.0
     *
     * @param object $match Match object.
     * @return array Formatted match data.
     */
    private static function format_match_for_bracket(object $match): array {
        return [
            'id' => $match->id,
            'match_number' => $match->match_number,
            'bracket_position' => $match->bracket_position ?? null,
            'bracket_type' => $match->bracket_type ?? 'winners',
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
            'loser_id' => $match->loser_id ?? null,
            'status' => $match->status,
            'scheduled_time' => $match->scheduled_time,
            'voting_closes_at' => $match->voting_closes_at,
        ];
    }

    /**
     * Format competition data for bracket response.
     *
     * @since 1.4.0
     *
     * @param object $competition Competition object.
     * @return array Formatted competition data.
     */
    private static function format_competition_for_bracket(object $competition): array {
        return [
            'id' => $competition->id,
            'name' => $competition->name,
            'type' => $competition->competition_type,
            'status' => $competition->status,
            'rounds_count' => $competition->rounds_count,
            'current_round' => $competition->current_round,
            'winner_id' => $competition->winner_performer_id,
            'config' => $competition->config ?? [],
        ];
    }
}
