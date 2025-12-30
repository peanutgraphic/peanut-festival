<?php
/**
 * Public-facing functionality
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Public {

    public function enqueue_scripts(): void {
        // Only enqueue on pages with our shortcodes
        global $post;
        if (!$post) {
            return;
        }

        $shortcodes = ['pf_vote', 'pf_results', 'pf_schedule', 'pf_flyer', 'pf_performer_apply', 'pf_volunteer_signup', 'pf_vendor_apply', 'pf_checkin'];
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
                            <td><?php echo $rank++; ?></td>
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
}
