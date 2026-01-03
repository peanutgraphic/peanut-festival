<?php
/**
 * Flyer generator class (ported from mcf-flyer-generator)
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Flyer_Generator {

    private static ?Peanut_Festival_Flyer_Generator $instance = null;

    public static function get_instance(): Peanut_Festival_Flyer_Generator {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('wp_ajax_pf_flyer_log', [$this, 'ajax_log']);
        add_action('wp_ajax_nopriv_pf_flyer_log', [$this, 'ajax_log']);
    }

    public static function get_templates(?int $festival_id = null): array {
        $where = [];
        if ($festival_id) {
            $where['festival_id'] = $festival_id;
        }
        $where['is_active'] = 1;

        return Peanut_Festival_Database::get_results('flyer_templates', $where, 'name', 'ASC');
    }

    public static function get_template(int $id): ?object {
        return Peanut_Festival_Database::get_row('flyer_templates', ['id' => $id]);
    }

    public static function create_template(array $data): int|false {
        $data['slug'] = sanitize_title($data['name']);
        $data['created_at'] = current_time('mysql');

        if (!empty($data['frame']) && is_array($data['frame'])) {
            $data['frame'] = wp_json_encode($data['frame']);
        }
        if (!empty($data['namebox']) && is_array($data['namebox'])) {
            $data['namebox'] = wp_json_encode($data['namebox']);
        }

        return Peanut_Festival_Database::insert('flyer_templates', $data);
    }

    public static function update_template(int $id, array $data): int|false {
        if (!empty($data['frame']) && is_array($data['frame'])) {
            $data['frame'] = wp_json_encode($data['frame']);
        }
        if (!empty($data['namebox']) && is_array($data['namebox'])) {
            $data['namebox'] = wp_json_encode($data['namebox']);
        }

        return Peanut_Festival_Database::update('flyer_templates', $data, ['id' => $id]);
    }

    public static function delete_template(int $id): int|false {
        return Peanut_Festival_Database::delete('flyer_templates', ['id' => $id]);
    }

    public static function log_usage(array $data): int|false {
        return Peanut_Festival_Database::insert('flyer_usage', [
            'template_id' => $data['template_id'] ?? null,
            'performer_name' => $data['performer_name'] ?? '',
            'image_url' => $data['image_url'] ?? '',
            'thumb_url' => $data['thumb_url'] ?? '',
            'page_url' => $data['page_url'] ?? '',
            'user_agent' => substr($data['user_agent'] ?? '', 0, 500),
            'created_at' => current_time('mysql'),
        ]);
    }

    public static function get_usage_log(int $limit = 100): array {
        global $wpdb;
        $usage_table = Peanut_Festival_Database::get_table_name('flyer_usage');
        $templates_table = Peanut_Festival_Database::get_table_name('flyer_templates');

        return $wpdb->get_results($wpdb->prepare(
            "SELECT u.*, t.name as template_name
             FROM $usage_table u
             LEFT JOIN $templates_table t ON u.template_id = t.id
             ORDER BY u.created_at DESC
             LIMIT %d",
            $limit
        ));
    }

    public function ajax_log(): void {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : '';
        if (!wp_verify_nonce($nonce, 'pf_flyer_log')) {
            wp_send_json_error(['error' => 'invalid_nonce'], 403);
        }

        $template_id = isset($_POST['template_id']) ? (int) $_POST['template_id'] : null;
        $performer_name = sanitize_text_field($_POST['name'] ?? '');
        $page_url = esc_url_raw($_POST['page'] ?? '');
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $image_url = '';
        $thumb_url = '';

        // Handle image data if provided
        $image_data = $_POST['image_data'] ?? '';
        if (is_string($image_data) && preg_match('#^data:image/jpeg;base64,#', $image_data)) {
            $decoded = base64_decode(substr($image_data, 23));

            if ($decoded !== false && strlen($decoded) <= 5 * 1024 * 1024) {
                // Verify MIME type of decoded content for security
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $mime_type = $finfo->buffer($decoded);
                if ($mime_type !== 'image/jpeg') {
                    wp_send_json_error(['error' => 'invalid_image_type'], 400);
                    return;
                }

                $upload = wp_upload_dir();
                $dir = trailingslashit($upload['basedir']) . 'pf-flyers';
                $url = trailingslashit($upload['baseurl']) . 'pf-flyers';

                if (!file_exists($dir)) {
                    wp_mkdir_p($dir);
                    // Add security files to prevent direct access
                    $htaccess = $dir . '/.htaccess';
                    if (!file_exists($htaccess)) {
                        file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\.php$\">\nOrder Deny,Allow\nDeny from all\n</FilesMatch>");
                    }
                    $index = $dir . '/index.php';
                    if (!file_exists($index)) {
                        file_put_contents($index, '<?php // Silence is golden');
                    }
                }

                $filename = 'flyer-' . gmdate('Ymd-His') . '-' . wp_generate_password(6, false, false) . '.jpg';
                $filepath = trailingslashit($dir) . $filename;

                if (file_put_contents($filepath, $decoded) !== false) {
                    $image_url = trailingslashit($url) . $filename;

                    // Create thumbnail
                    if (function_exists('wp_get_image_editor')) {
                        $editor = wp_get_image_editor($filepath);
                        if (!is_wp_error($editor)) {
                            $editor->resize(320, 320, false);
                            $thumb_path = $editor->generate_filename('thumb');
                            $saved = $editor->save($thumb_path, 'image/jpeg');
                            if (!is_wp_error($saved)) {
                                $thumb_url = str_replace(basename($filepath), basename($thumb_path), $image_url);
                            }
                        }
                    }
                }
            }
        }

        self::log_usage([
            'template_id' => $template_id,
            'performer_name' => $performer_name,
            'image_url' => $image_url,
            'thumb_url' => $thumb_url,
            'page_url' => $page_url,
            'user_agent' => $user_agent,
        ]);

        wp_send_json_success([
            'image_url' => $image_url,
            'thumb_url' => $thumb_url,
        ]);
    }
}
