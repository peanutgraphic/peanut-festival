<?php
/**
 * Public REST API endpoints
 *
 * @package Peanut_Festival
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_REST_API {

    private const NAMESPACE = 'peanut-festival/v1';

    /**
     * Register all public REST routes
     */
    public function register_routes(): void {
        // Voting endpoints
        register_rest_route(self::NAMESPACE, '/vote/status/(?P<show_slug>[a-zA-Z0-9-_]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_voting_status'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/vote/submit', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_vote'],
            'permission_callback' => '__return_true',
        ]);

        // Public events
        register_rest_route(self::NAMESPACE, '/events', [
            'methods' => 'GET',
            'callback' => [$this, 'get_public_events'],
            'permission_callback' => '__return_true',
        ]);

        // Performer application
        register_rest_route(self::NAMESPACE, '/apply/performer', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_performer_application'],
            'permission_callback' => '__return_true',
        ]);

        // Volunteer signup
        register_rest_route(self::NAMESPACE, '/volunteer/signup', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_volunteer_signup'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/volunteer/shifts/(?P<festival_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_public_shifts'],
            'permission_callback' => '__return_true',
        ]);

        // Flyer templates
        register_rest_route(self::NAMESPACE, '/flyer/templates/(?P<festival_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_flyer_templates'],
            'permission_callback' => '__return_true',
        ]);

        // Vendor application
        register_rest_route(self::NAMESPACE, '/apply/vendor', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_vendor_application'],
            'permission_callback' => '__return_true',
        ]);

        // Payments
        register_rest_route(self::NAMESPACE, '/payments/config', [
            'methods' => 'GET',
            'callback' => [$this, 'get_payment_config'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/payments/create-intent', [
            'methods' => 'POST',
            'callback' => [$this, 'create_payment_intent'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/payments/confirm', [
            'methods' => 'POST',
            'callback' => [$this, 'confirm_payment'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/payments/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function get_voting_status(\WP_REST_Request $request): \WP_REST_Response {
        $show_slug = $request->get_param('show_slug');
        $config = Peanut_Festival_Voting::get_show_config($show_slug);

        $active_group = $config['active_group'];
        $performers = [];

        if ($active_group !== 'pool' && !empty($config['groups'][$active_group])) {
            $performer_ids = $config['groups'][$active_group];
            foreach ($performer_ids as $id) {
                $performer = Peanut_Festival_Performers::get_by_id($id);
                if ($performer) {
                    $performers[] = [
                        'id' => $performer->id,
                        'name' => $performer->name,
                        'bio' => $config['hide_bios'] ? '' : $performer->bio,
                        'photo_url' => $performer->photo_url,
                    ];
                }
            }
        }

        return Peanut_Festival_REST_Response::success([
            'active_group' => $active_group,
            'is_open' => Peanut_Festival_Voting::is_voting_open($show_slug),
            'time_remaining' => Peanut_Festival_Voting::get_time_remaining($show_slug),
            'performers' => $performers,
            'hide_bios' => $config['hide_bios'],
        ]);
    }

    public function submit_vote(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 10 votes per minute
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('vote');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $show_slug = sanitize_text_field($request->get_param('show_slug'));
        $performer_ids = $request->get_param('performer_ids');
        $token = sanitize_text_field($request->get_param('token'));

        if (!$show_slug || !is_array($performer_ids) || !$token) {
            return Peanut_Festival_REST_Response::error('missing_parameters');
        }

        if (!Peanut_Festival_Voting::is_voting_open($show_slug)) {
            return Peanut_Festival_REST_Response::error('voting_closed');
        }

        $config = Peanut_Festival_Voting::get_show_config($show_slug);
        $group_name = $config['active_group'];

        $ip_hash = Peanut_Festival_Voting::hash_ip($_SERVER['REMOTE_ADDR'] ?? '');
        $ua_hash = Peanut_Festival_Voting::hash_ua($_SERVER['HTTP_USER_AGENT'] ?? '');

        // Check if already voted (skip for admins)
        if (!current_user_can('manage_options')) {
            if (Peanut_Festival_Voting::has_voted($show_slug, $group_name, $token, $ip_hash)) {
                return Peanut_Festival_REST_Response::error('already_voted');
            }
        }

        // Record votes with ranks
        foreach ($performer_ids as $rank => $performer_id) {
            Peanut_Festival_Voting::record_vote([
                'show_slug' => $show_slug,
                'group_name' => $group_name,
                'performer_id' => (int) $performer_id,
                'vote_rank' => $rank + 1,
                'ip_hash' => $ip_hash,
                'ua_hash' => $ua_hash,
                'token' => $token,
            ]);
        }

        return Peanut_Festival_REST_Response::success(null, 'Vote recorded successfully');
    }

    public function get_public_events(\WP_REST_Request $request): \WP_REST_Response {
        $festival_id = $request->get_param('festival_id');

        // Use cached events for better performance
        $events = Peanut_Festival_Cache::get_public_events(
            $festival_id ? (int) $festival_id : null
        );

        return new \WP_REST_Response([
            'success' => true,
            'data' => $events,
        ]);
    }

    public function submit_performer_application(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 5 applications per 5 minutes
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('application');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $data = [
            'festival_id' => (int) $request->get_param('festival_id'),
            'name' => sanitize_text_field($request->get_param('name')),
            'email' => sanitize_email($request->get_param('email')),
            'phone' => sanitize_text_field($request->get_param('phone')),
            'bio' => sanitize_textarea_field($request->get_param('bio')),
            'website' => esc_url_raw($request->get_param('website')),
            'performance_type' => sanitize_text_field($request->get_param('performance_type')),
            'technical_requirements' => sanitize_textarea_field($request->get_param('technical_requirements')),
            'social_links' => $request->get_param('social_links'),
            'application_status' => 'pending',
        ];

        if (empty($data['name']) || empty($data['email'])) {
            return new \WP_REST_Response([
                'success' => false,
                'code' => 'missing_required_fields',
                'message' => 'Name and email are required',
            ], 400);
        }

        // Check for duplicate
        $existing = Peanut_Festival_Performers::get_by_email($data['email']);
        if ($existing && $existing->festival_id == $data['festival_id']) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'An application with this email already exists',
            ], 400);
        }

        $id = Peanut_Festival_Performers::create($data);

        if (!$id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Failed to submit application',
            ], 500);
        }

        // Send admin notification
        Peanut_Festival_Notifications::notify_new_application('performer', $id);

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Application submitted successfully',
            'data' => ['id' => $id],
        ]);
    }

    public function submit_volunteer_signup(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 5 applications per 5 minutes
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('application');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $data = [
            'festival_id' => (int) $request->get_param('festival_id'),
            'name' => sanitize_text_field($request->get_param('name')),
            'email' => sanitize_email($request->get_param('email')),
            'phone' => sanitize_text_field($request->get_param('phone')),
            'emergency_contact' => sanitize_text_field($request->get_param('emergency_contact')),
            'emergency_phone' => sanitize_text_field($request->get_param('emergency_phone')),
            'skills' => $request->get_param('skills'),
            'availability' => $request->get_param('availability'),
            'shirt_size' => sanitize_text_field($request->get_param('shirt_size')),
            'dietary_restrictions' => sanitize_textarea_field($request->get_param('dietary_restrictions')),
            'status' => 'applied',
        ];

        if (empty($data['name']) || empty($data['email'])) {
            return new \WP_REST_Response([
                'success' => false,
                'code' => 'missing_required_fields',
                'message' => 'Name and email are required',
            ], 400);
        }

        $id = Peanut_Festival_Volunteers::create($data);

        if (!$id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Failed to submit signup',
            ], 500);
        }

        // Send notifications
        Peanut_Festival_Notifications::notify_new_application('volunteer', $id);
        Peanut_Festival_Notifications::notify_volunteer_welcome($id);

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Volunteer signup submitted successfully',
            'data' => ['id' => $id],
        ]);
    }

    public function get_public_shifts(\WP_REST_Request $request): \WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_id');

        $shifts = Peanut_Festival_Volunteers::get_shifts([
            'festival_id' => $festival_id,
            'status' => 'open',
        ]);

        $data = array_map(function($shift) {
            return [
                'id' => $shift->id,
                'task_name' => $shift->task_name,
                'description' => $shift->description,
                'location' => $shift->location,
                'shift_date' => $shift->shift_date,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'slots_available' => max(0, $shift->slots_total - $shift->slots_filled),
            ];
        }, $shifts);

        return new \WP_REST_Response([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function get_flyer_templates(\WP_REST_Request $request): \WP_REST_Response {
        $festival_id = (int) $request->get_param('festival_id');

        $templates = Peanut_Festival_Flyer_Generator::get_templates($festival_id);

        $data = array_map(function($template) {
            return [
                'id' => $template->id,
                'name' => $template->name,
                'template_url' => $template->template_url,
                'mask_url' => $template->mask_url,
                'frame' => json_decode($template->frame, true),
                'namebox' => json_decode($template->namebox, true),
                'title' => $template->title,
                'subtitle' => $template->subtitle,
            ];
        }, $templates);

        return new \WP_REST_Response([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function submit_vendor_application(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 5 applications per 5 minutes
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('application');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $data = [
            'festival_id' => (int) $request->get_param('festival_id'),
            'business_name' => sanitize_text_field($request->get_param('business_name')),
            'contact_name' => sanitize_text_field($request->get_param('contact_name')),
            'email' => sanitize_email($request->get_param('email')),
            'phone' => sanitize_text_field($request->get_param('phone')),
            'vendor_type' => sanitize_text_field($request->get_param('vendor_type')),
            'description' => sanitize_textarea_field($request->get_param('description')),
            'products' => sanitize_textarea_field($request->get_param('products')),
            'booth_requirements' => sanitize_textarea_field($request->get_param('booth_requirements')),
            'electricity_needed' => (bool) $request->get_param('electricity_needed'),
            'status' => 'applied',
        ];

        if (empty($data['business_name']) || empty($data['email'])) {
            return new \WP_REST_Response([
                'success' => false,
                'code' => 'missing_required_fields',
                'message' => 'Business name and email are required',
            ], 400);
        }

        $id = Peanut_Festival_Vendors::create($data);

        if (!$id) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Failed to submit application',
            ], 500);
        }

        // Send admin notification
        Peanut_Festival_Notifications::notify_new_application('vendor', $id);

        return new \WP_REST_Response([
            'success' => true,
            'message' => 'Vendor application submitted successfully',
            'data' => ['id' => $id],
        ]);
    }

    // Payment endpoints
    public function get_payment_config(\WP_REST_Request $request): \WP_REST_Response {
        if (!Peanut_Festival_Payments::is_configured()) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Payments not configured',
            ]);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'publishable_key' => Peanut_Festival_Payments::get_publishable_key(),
                'test_mode' => Peanut_Festival_Payments::is_test_mode(),
            ],
        ]);
    }

    public function create_payment_intent(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 10 payment attempts per minute
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('payment');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $show_id = (int) $request->get_param('show_id');
        $quantity = (int) $request->get_param('quantity') ?: 1;
        $customer_name = sanitize_text_field($request->get_param('name'));
        $customer_email = sanitize_email($request->get_param('email'));
        $customer_phone = sanitize_text_field($request->get_param('phone'));

        if (!$show_id || !$customer_email) {
            return new \WP_REST_Response([
                'success' => false,
                'code' => 'missing_required_fields',
                'message' => 'Show ID and email are required',
            ], 400);
        }

        $show = Peanut_Festival_Shows::get_by_id($show_id);
        if (!$show) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Show not found',
            ], 404);
        }

        // Calculate price (assuming price is stored on show)
        $price_per_ticket = (float) ($show->ticket_price ?? 0);
        $total_amount = $price_per_ticket * $quantity;

        if ($total_amount <= 0) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Invalid ticket price',
            ], 400);
        }

        $result = Peanut_Festival_Payments::create_payment_intent([
            'amount' => $total_amount,
            'currency' => 'usd',
            'metadata' => [
                'show_id' => $show_id,
                'quantity' => $quantity,
                'customer_name' => $customer_name,
                'customer_email' => $customer_email,
                'customer_phone' => $customer_phone,
                'festival_id' => $show->festival_id ?? 0,
            ],
        ]);

        if (!$result['success']) {
            return new \WP_REST_Response($result, 500);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'client_secret' => $result['client_secret'],
                'amount' => $total_amount,
            ],
        ]);
    }

    public function confirm_payment(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limiting: 10 payment attempts per minute
        $rate_limit = Peanut_Festival_Rate_Limiter::enforce('payment');
        if ($rate_limit !== null) {
            return $rate_limit;
        }

        $payment_intent_id = sanitize_text_field($request->get_param('payment_intent_id'));

        if (!$payment_intent_id) {
            return new \WP_REST_Response([
                'success' => false,
                'code' => 'missing_payment_intent',
                'message' => 'Payment intent ID required',
            ], 400);
        }

        $result = Peanut_Festival_Payments::confirm_payment($payment_intent_id);

        if (!$result['success']) {
            return new \WP_REST_Response($result, 400);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'ticket_id' => $result['ticket_id'],
                'ticket_code' => $result['ticket_code'],
            ],
        ]);
    }

    public function handle_webhook(\WP_REST_Request $request): \WP_REST_Response {
        Peanut_Festival_Payments::handle_webhook();
        // The handle_webhook method calls exit, so this won't be reached
        return new \WP_REST_Response(['received' => true]);
    }
}
