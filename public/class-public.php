<?php
/**
 * Public-facing functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Public {

    /**
     * Constructor - register PWA hooks
     */
    public function __construct() {
        // Phase 3: PWA and Firebase support
        add_action('wp_head', [$this, 'add_pwa_meta']);
        add_action('wp_footer', [$this, 'register_service_worker'], 99);
    }

    /**
     * Add PWA meta tags and manifest link
     */
    public function add_pwa_meta(): void {
        $manifest_url = PEANUT_FESTIVAL_URL . 'public/manifest.json';
        ?>
        <!-- Peanut Festival PWA -->
        <link rel="manifest" href="<?php echo esc_url($manifest_url); ?>">
        <meta name="theme-color" content="#6366f1">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="Peanut Festival">
        <link rel="apple-touch-icon" href="<?php echo esc_url(PEANUT_FESTIVAL_URL . 'public/images/icon-192.png'); ?>">
        <?php
    }

    /**
     * Register service worker in footer
     */
    public function register_service_worker(): void {
        $sw_url = PEANUT_FESTIVAL_URL . 'public/js/service-worker.js';
        ?>
        <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('<?php echo esc_js($sw_url); ?>')
                    .then(function(registration) {
                        console.log('[PF] Service Worker registered:', registration.scope);
                    })
                    .catch(function(error) {
                        console.log('[PF] Service Worker registration failed:', error);
                    });
            });
        }
        </script>
        <?php
    }

    public function enqueue_scripts(): void {
        // Only enqueue on pages with our shortcodes
        global $post;
        if (!$post) {
            return;
        }

        $shortcodes = ['pf_vote', 'pf_results', 'pf_schedule', 'pf_flyer', 'pf_performer_apply', 'pf_volunteer_signup', 'pf_vendor_apply', 'pf_checkin', 'pf_bracket', 'pf_live_votes', 'pf_leaderboard', 'pf_winner'];
        $has_shortcode = false;

        foreach ($shortcodes as $shortcode) {
            if (has_shortcode($post->post_content, $shortcode)) {
                $has_shortcode = true;
                break;
            }
        }

        if (!$has_shortcode) {
            return;
        }

        wp_enqueue_style(
            'peanut-festival-public',
            PEANUT_FESTIVAL_URL . 'public/css/public.css',
            [],
            PEANUT_FESTIVAL_VERSION
        );

        wp_enqueue_script(
            'peanut-festival-public',
            PEANUT_FESTIVAL_URL . 'public/js/public.js',
            ['jquery'],
            PEANUT_FESTIVAL_VERSION,
            true
        );

        wp_localize_script('peanut-festival-public', 'pfPublic', [
            'apiUrl' => rest_url('peanut-festival/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // Phase 3: Firebase client script
        if (Peanut_Festival_Firebase::is_enabled()) {
            wp_enqueue_style(
                'peanut-festival-notifications',
                PEANUT_FESTIVAL_URL . 'public/css/notifications.css',
                [],
                PEANUT_FESTIVAL_VERSION
            );

            wp_enqueue_script(
                'peanut-festival-firebase',
                PEANUT_FESTIVAL_URL . 'public/js/pf-firebase-client.js',
                ['jquery'],
                PEANUT_FESTIVAL_VERSION,
                true
            );

            // Inject Firebase configuration
            $firebase_config = Peanut_Festival_Firebase::get_client_config();
            wp_localize_script('peanut-festival-firebase', 'pfFirebaseConfig', $firebase_config);
        }
    }

    public function register_shortcodes(): void {
        add_shortcode('pf_vote', [$this, 'shortcode_vote']);
        add_shortcode('pf_results', [$this, 'shortcode_results']);
        add_shortcode('pf_schedule', [$this, 'shortcode_schedule']);
        add_shortcode('pf_flyer', [$this, 'shortcode_flyer']);
        add_shortcode('pf_performer_apply', [$this, 'shortcode_performer_apply']);
        add_shortcode('pf_volunteer_signup', [$this, 'shortcode_volunteer_signup']);
        add_shortcode('pf_vendor_apply', [$this, 'shortcode_vendor_apply']);
        add_shortcode('pf_checkin', [$this, 'shortcode_checkin']);
        // Phase 2: Live voting display shortcodes
        add_shortcode('pf_bracket', [$this, 'shortcode_bracket']);
        add_shortcode('pf_live_votes', [$this, 'shortcode_live_votes']);
        add_shortcode('pf_leaderboard', [$this, 'shortcode_leaderboard']);
        add_shortcode('pf_winner', [$this, 'shortcode_winner']);
    }

    public function shortcode_vote(array $atts): string {
        $atts = shortcode_atts([
            'show_slug' => '',
            'top_n' => 2,
            'show_timer' => 1,
        ], $atts, 'pf_vote');

        if (empty($atts['show_slug'])) {
            return '<div class="pf-error">Please specify a show_slug attribute.</div>';
        }

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/voting-widget.php';
        return ob_get_clean();
    }

    public function shortcode_results(array $atts): string {
        $atts = shortcode_atts([
            'show_slug' => '',
        ], $atts, 'pf_results');

        if (empty($atts['show_slug'])) {
            return '<div class="pf-error">Please specify a show_slug attribute.</div>';
        }

        $config = Peanut_Festival_Voting::get_show_config($atts['show_slug']);

        if (!$config['reveal_results'] && !current_user_can('manage_options')) {
            return '<div class="pf-notice">Results are not yet available.</div>';
        }

        $results = Peanut_Festival_Voting::get_results($atts['show_slug']);

        ob_start();
        ?>
        <div class="pf-results">
            <h3>Results for <?php echo esc_html($atts['show_slug']); ?></h3>
            <?php if (empty($results)): ?>
                <p>No votes recorded yet.</p>
            <?php else: ?>
                <table class="pf-results-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Performer</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $rank = 1;
                        foreach ($results as $row):
                        ?>
                        <tr>
                            <td><?php echo esc_html($rank++); ?></td>
                            <td><?php echo esc_html($row->performer_name); ?></td>
                            <td><?php echo esc_html($row->weighted_score); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function shortcode_schedule(array $atts): string {
        $atts = shortcode_atts([
            'festival' => '',
            'view' => 'grid',
            'filters' => 'yes',
        ], $atts, 'pf_schedule');

        $festival_id = null;
        if (!empty($atts['festival'])) {
            $festival = Peanut_Festival_Festivals::get_by_slug($atts['festival']);
            $festival_id = $festival ? $festival->id : null;
        }

        if (!$festival_id) {
            $festival_id = Peanut_Festival_Settings::get_active_festival_id();
        }

        $shows = Peanut_Festival_Shows::get_all([
            'festival_id' => $festival_id,
            'status' => ['on_sale', 'sold_out', 'scheduled'],
        ]);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/schedule-widget.php';
        return ob_get_clean();
    }

    public function shortcode_flyer(array $atts): string {
        $atts = shortcode_atts([
            'festival' => '',
        ], $atts, 'pf_flyer');

        $festival_id = null;
        if (!empty($atts['festival'])) {
            $festival = Peanut_Festival_Festivals::get_by_slug($atts['festival']);
            $festival_id = $festival ? $festival->id : null;
        }

        if (!$festival_id) {
            $festival_id = Peanut_Festival_Settings::get_active_festival_id();
        }

        $templates = Peanut_Festival_Flyer_Generator::get_templates($festival_id);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/flyer-widget.php';
        return ob_get_clean();
    }

    public function shortcode_performer_apply(array $atts): string {
        $atts = shortcode_atts([
            'festival' => '',
        ], $atts, 'pf_performer_apply');

        $festival_id = null;
        if (!empty($atts['festival'])) {
            $festival = Peanut_Festival_Festivals::get_by_slug($atts['festival']);
            $festival_id = $festival ? $festival->id : null;
        }

        if (!$festival_id) {
            $festival_id = Peanut_Festival_Settings::get_active_festival_id();
        }

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/performer-application.php';
        return ob_get_clean();
    }

    public function shortcode_volunteer_signup(array $atts): string {
        $atts = shortcode_atts([
            'festival' => '',
        ], $atts, 'pf_volunteer_signup');

        $festival_id = null;
        if (!empty($atts['festival'])) {
            $festival = Peanut_Festival_Festivals::get_by_slug($atts['festival']);
            $festival_id = $festival ? $festival->id : null;
        }

        if (!$festival_id) {
            $festival_id = Peanut_Festival_Settings::get_active_festival_id();
        }

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/volunteer-signup.php';
        return ob_get_clean();
    }

    public function shortcode_vendor_apply(array $atts): string {
        $atts = shortcode_atts([
            'festival' => '',
        ], $atts, 'pf_vendor_apply');

        $festival_id = null;
        if (!empty($atts['festival'])) {
            $festival = Peanut_Festival_Festivals::get_by_slug($atts['festival']);
            $festival_id = $festival ? $festival->id : null;
        }

        if (!$festival_id) {
            $festival_id = Peanut_Festival_Settings::get_active_festival_id();
        }

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/vendor-application.php';
        return ob_get_clean();
    }

    public function shortcode_checkin(array $atts): string {
        // Check-in requires authentication
        if (!current_user_can('manage_options') && !current_user_can('manage_pf_festival')) {
            return '<div class="pf-error">You must be logged in with admin permissions to use the check-in feature.</div>';
        }

        $atts = shortcode_atts([
            'show' => '',
        ], $atts, 'pf_checkin');

        // Enqueue QR scanner library
        wp_enqueue_script(
            'html5-qrcode',
            'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
            [],
            '2.3.8',
            true
        );

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/checkin-widget.php';
        return ob_get_clean();
    }

    /**
     * Display tournament bracket
     * Usage: [pf_bracket competition_id="1"]
     */
    public function shortcode_bracket(array $atts): string {
        $atts = shortcode_atts([
            'competition_id' => '',
            'show_votes' => 'yes',
            'animate' => 'yes',
        ], $atts, 'pf_bracket');

        if (empty($atts['competition_id'])) {
            return '<div class="pf-error">Please specify a competition_id attribute.</div>';
        }

        $competition = Peanut_Festival_Competitions::get_by_id((int) $atts['competition_id']);
        if (!$competition) {
            return '<div class="pf-error">Competition not found.</div>';
        }

        $bracket = Peanut_Festival_Competitions::get_bracket((int) $atts['competition_id']);

        // Enqueue bracket-specific styles and scripts
        wp_enqueue_style(
            'peanut-festival-bracket',
            PEANUT_FESTIVAL_URL . 'public/css/bracket.css',
            [],
            PEANUT_FESTIVAL_VERSION
        );

        wp_enqueue_script(
            'peanut-festival-bracket',
            PEANUT_FESTIVAL_URL . 'public/js/bracket.js',
            ['jquery'],
            PEANUT_FESTIVAL_VERSION,
            true
        );

        wp_localize_script('peanut-festival-bracket', 'pfBracket', [
            'competitionId' => $atts['competition_id'],
            'apiUrl' => rest_url('peanut-festival/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'refreshInterval' => 5000,
            'showVotes' => $atts['show_votes'] === 'yes',
            'animate' => $atts['animate'] === 'yes',
        ]);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/bracket.php';
        return ob_get_clean();
    }

    /**
     * Display live voting counter
     * Usage: [pf_live_votes show_id="1"] or [pf_live_votes match_id="1"]
     */
    public function shortcode_live_votes(array $atts): string {
        $atts = shortcode_atts([
            'show_id' => '',
            'match_id' => '',
            'style' => 'bars', // bars, numbers, pie
            'refresh' => 3,
        ], $atts, 'pf_live_votes');

        if (empty($atts['show_id']) && empty($atts['match_id'])) {
            return '<div class="pf-error">Please specify either show_id or match_id attribute.</div>';
        }

        wp_enqueue_style(
            'peanut-festival-live-votes',
            PEANUT_FESTIVAL_URL . 'public/css/live-votes.css',
            [],
            PEANUT_FESTIVAL_VERSION
        );

        wp_enqueue_script(
            'peanut-festival-live-votes',
            PEANUT_FESTIVAL_URL . 'public/js/live-votes.js',
            ['jquery'],
            PEANUT_FESTIVAL_VERSION,
            true
        );

        wp_localize_script('peanut-festival-live-votes', 'pfLiveVotes', [
            'showId' => $atts['show_id'],
            'matchId' => $atts['match_id'],
            'apiUrl' => rest_url('peanut-festival/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'refreshInterval' => (int) $atts['refresh'] * 1000,
            'style' => $atts['style'],
        ]);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/live-votes.php';
        return ob_get_clean();
    }

    /**
     * Display performer leaderboard
     * Usage: [pf_leaderboard festival_id="1" limit="10"]
     */
    public function shortcode_leaderboard(array $atts): string {
        $atts = shortcode_atts([
            'festival_id' => '',
            'limit' => 10,
            'show_scores' => 'yes',
            'refresh' => 10,
        ], $atts, 'pf_leaderboard');

        $festival_id = !empty($atts['festival_id'])
            ? (int) $atts['festival_id']
            : Peanut_Festival_Settings::get_active_festival_id();

        if (!$festival_id) {
            return '<div class="pf-error">No active festival found.</div>';
        }

        wp_enqueue_style(
            'peanut-festival-leaderboard',
            PEANUT_FESTIVAL_URL . 'public/css/leaderboard.css',
            [],
            PEANUT_FESTIVAL_VERSION
        );

        wp_enqueue_script(
            'peanut-festival-leaderboard',
            PEANUT_FESTIVAL_URL . 'public/js/leaderboard.js',
            ['jquery'],
            PEANUT_FESTIVAL_VERSION,
            true
        );

        wp_localize_script('peanut-festival-leaderboard', 'pfLeaderboard', [
            'festivalId' => $festival_id,
            'limit' => (int) $atts['limit'],
            'apiUrl' => rest_url('peanut-festival/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'refreshInterval' => (int) $atts['refresh'] * 1000,
            'showScores' => $atts['show_scores'] === 'yes',
        ]);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/leaderboard.php';
        return ob_get_clean();
    }

    /**
     * Display winner announcement with celebration animation
     * Usage: [pf_winner competition_id="1"] or [pf_winner show_slug="finals"]
     */
    public function shortcode_winner(array $atts): string {
        $atts = shortcode_atts([
            'competition_id' => '',
            'show_slug' => '',
            'confetti' => 'yes',
            'sound' => 'no',
        ], $atts, 'pf_winner');

        if (empty($atts['competition_id']) && empty($atts['show_slug'])) {
            return '<div class="pf-error">Please specify either competition_id or show_slug attribute.</div>';
        }

        $winner = null;
        $source_type = '';

        if (!empty($atts['competition_id'])) {
            $competition = Peanut_Festival_Competitions::get_by_id((int) $atts['competition_id']);
            if ($competition && $competition->status === 'completed' && $competition->winner_performer_id) {
                $winner = Peanut_Festival_Performers::get_by_id($competition->winner_performer_id);
                $source_type = 'competition';
            }
        } elseif (!empty($atts['show_slug'])) {
            $results = Peanut_Festival_Voting::get_results($atts['show_slug']);
            if (!empty($results)) {
                $winner = Peanut_Festival_Performers::get_by_id($results[0]->performer_id);
                $source_type = 'show';
            }
        }

        if (!$winner) {
            return '<div class="pf-winner-pending">Winner will be announced soon!</div>';
        }

        wp_enqueue_style(
            'peanut-festival-winner',
            PEANUT_FESTIVAL_URL . 'public/css/winner.css',
            [],
            PEANUT_FESTIVAL_VERSION
        );

        if ($atts['confetti'] === 'yes') {
            wp_enqueue_script(
                'canvas-confetti',
                'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
                [],
                '1.9.2',
                true
            );
        }

        wp_enqueue_script(
            'peanut-festival-winner',
            PEANUT_FESTIVAL_URL . 'public/js/winner.js',
            ['jquery'],
            PEANUT_FESTIVAL_VERSION,
            true
        );

        wp_localize_script('peanut-festival-winner', 'pfWinner', [
            'confetti' => $atts['confetti'] === 'yes',
            'sound' => $atts['sound'] === 'yes',
        ]);

        ob_start();
        include PEANUT_FESTIVAL_PATH . 'public/templates/winner.php';
        return ob_get_clean();
    }
}
