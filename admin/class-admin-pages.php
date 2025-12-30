<?php
/**
 * Admin pages class - mounts the React SPA
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Admin_Pages {

    public function add_admin_menu(): void {
        add_menu_page(
            __('Festival', 'peanut-festival'),
            __('Festival', 'peanut-festival'),
            'manage_options',
            'peanut-festival',
            [$this, 'render_admin_page'],
            'dashicons-tickets-alt',
            26
        );
    }

    public function render_admin_page(): void {
        echo '<div id="peanut-festival-app"></div>';
    }

    public function enqueue_scripts(string $hook): void {
        if ($hook !== 'toplevel_page_peanut-festival') {
            return;
        }

        $dist_path = PEANUT_FESTIVAL_PATH . 'assets/dist/';
        $dist_url = PEANUT_FESTIVAL_URL . 'assets/dist/';
        $manifest_path = $dist_path . '.vite/manifest.json';

        // Check if we're in development mode (manifest doesn't exist)
        $is_dev = !file_exists($manifest_path);

        if ($is_dev) {
            // Development mode - load from Vite dev server
            $dev_url = 'http://localhost:3002';

            wp_enqueue_script(
                'peanut-festival-react-refresh',
                $dev_url . '/@react-refresh',
                [],
                null,
                false
            );

            wp_enqueue_script(
                'peanut-festival-vite-client',
                $dev_url . '/@vite/client',
                [],
                null,
                true
            );

            wp_enqueue_script(
                'peanut-festival-app',
                $dev_url . '/src/main.tsx',
                ['peanut-festival-vite-client'],
                null,
                true
            );

            // Add type="module" to scripts
            add_filter('script_loader_tag', function($tag, $handle) {
                if (strpos($handle, 'peanut-festival') !== false) {
                    return str_replace(' src', ' type="module" src', $tag);
                }
                return $tag;
            }, 10, 2);
        } else {
            // Production mode - load from manifest
            $manifest = json_decode(file_get_contents($manifest_path), true);

            if (isset($manifest['src/main.tsx'])) {
                $entry = $manifest['src/main.tsx'];

                // Enqueue CSS
                if (!empty($entry['css'])) {
                    foreach ($entry['css'] as $index => $css_file) {
                        wp_enqueue_style(
                            'peanut-festival-app-' . $index,
                            $dist_url . $css_file,
                            [],
                            PEANUT_FESTIVAL_VERSION
                        );
                    }
                }

                // Enqueue JS
                wp_enqueue_script(
                    'peanut-festival-app',
                    $dist_url . $entry['file'],
                    [],
                    PEANUT_FESTIVAL_VERSION,
                    true
                );

                // Add type="module"
                add_filter('script_loader_tag', function($tag, $handle) {
                    if ($handle === 'peanut-festival-app') {
                        return str_replace(' src', ' type="module" src', $tag);
                    }
                    return $tag;
                }, 10, 2);
            }
        }

        // Localize script with API data
        wp_localize_script('peanut-festival-app', 'peanutFestival', [
            'apiUrl' => rest_url('peanut-festival/v1'),
            'adminApiUrl' => rest_url('peanut-festival/v1/admin'),
            'nonce' => wp_create_nonce('wp_rest'),
            'version' => PEANUT_FESTIVAL_VERSION,
            'siteUrl' => get_site_url(),
            'adminUrl' => admin_url(),
            'userId' => get_current_user_id(),
            'isAdmin' => current_user_can('manage_options'),
        ]);

        // Hide admin notices on our page
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');

        // Add custom admin styles
        wp_add_inline_style('peanut-festival-app-0', '
            #wpcontent { padding-left: 0; }
            #wpbody-content { padding-bottom: 0; }
            #peanut-festival-app { margin: 0; }
            .update-nag, .notice { display: none !important; }
            #wpfooter { display: none; }
        ');
    }
}
