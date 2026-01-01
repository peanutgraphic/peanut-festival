# Developer Extension Guide

## Overview

Peanut Festival is designed to be extensible through WordPress hooks, filters, and APIs. This guide covers how to extend Festival functionality for custom festivals, voting systems, and integrations.

## Architecture

```
peanut-festival/
├── includes/
│   ├── class-peanut-festival.php    # Main plugin class
│   ├── class-activator.php          # Installation/activation
│   ├── class-migrations.php         # Database migrations
│   ├── api/                         # REST API controllers
│   ├── models/                      # Data models
│   └── services/                    # Business logic
├── public/
│   ├── class-public.php             # Frontend functionality
│   └── templates/                   # Template files
└── admin/
    ├── class-admin.php              # Admin functionality
    └── views/                       # Admin views
```

---

## Action Hooks

### Festival Lifecycle

```php
/**
 * Fired when a festival is created
 *
 * @param int   $festival_id Festival ID
 * @param array $data        Festival data
 */
do_action('pf_festival_created', $festival_id, $data);

/**
 * Fired when festival status changes
 *
 * @param int    $festival_id Festival ID
 * @param string $old_status  Previous status
 * @param string $new_status  New status
 */
do_action('pf_festival_status_changed', $festival_id, $old_status, $new_status);

/**
 * Fired when festival goes live
 *
 * @param int $festival_id Festival ID
 */
do_action('pf_festival_activated', $festival_id);

/**
 * Fired when festival is archived
 *
 * @param int $festival_id Festival ID
 */
do_action('pf_festival_archived', $festival_id);
```

### Show Management

```php
/**
 * Fired when a show is created
 *
 * @param int   $show_id Show ID
 * @param int   $festival_id Festival ID
 * @param array $data Show data
 */
do_action('pf_show_created', $show_id, $festival_id, $data);

/**
 * Fired when show lineup is finalized
 *
 * @param int   $show_id Show ID
 * @param array $performer_ids Array of performer IDs
 */
do_action('pf_show_lineup_finalized', $show_id, $performer_ids);

/**
 * Fired when show starts
 *
 * @param int $show_id Show ID
 */
do_action('pf_show_started', $show_id);

/**
 * Fired when show ends
 *
 * @param int $show_id Show ID
 */
do_action('pf_show_ended', $show_id);
```

### Performer Lifecycle

```php
/**
 * Fired when performer applies to festival
 *
 * @param int   $performer_id Performer ID
 * @param int   $festival_id Festival ID
 * @param array $application Application data
 */
do_action('pf_performer_applied', $performer_id, $festival_id, $application);

/**
 * Fired when performer is approved
 *
 * @param int $performer_id Performer ID
 * @param int $approved_by Admin user ID
 */
do_action('pf_performer_approved', $performer_id, $approved_by);

/**
 * Fired when performer is assigned to show
 *
 * @param int $performer_id Performer ID
 * @param int $show_id Show ID
 * @param int $slot_order Performance order
 */
do_action('pf_performer_assigned_to_show', $performer_id, $show_id, $slot_order);

/**
 * Fired when performer completes their set
 *
 * @param int $performer_id Performer ID
 * @param int $show_id Show ID
 */
do_action('pf_performer_completed_show', $performer_id, $show_id);
```

### Voting System

```php
/**
 * Fired when voting opens for a show
 *
 * @param int $show_id Show ID
 * @param array $config Voting configuration
 */
do_action('pf_voting_opened', $show_id, $config);

/**
 * Fired when a vote is cast
 *
 * @param int    $show_id Show slug
 * @param int    $performer_id Performer ID
 * @param int    $vote_rank Vote rank (1, 2, etc.)
 * @param string $voter_token Anonymous voter token
 */
do_action('pf_vote_cast', $show_id, $performer_id, $vote_rank, $voter_token);

/**
 * Fired when voting closes
 *
 * @param int $show_id Show ID
 */
do_action('pf_voting_closed', $show_id);

/**
 * Fired when results are calculated
 *
 * @param int   $show_id Show ID
 * @param array $results Calculated results
 */
do_action('pf_results_calculated', $show_id, $results);

/**
 * Fired when winner is announced
 *
 * @param int $show_id Show ID
 * @param int $winner_id Winning performer ID
 */
do_action('pf_winner_announced', $show_id, $winner_id);
```

### Ticketing

```php
/**
 * Fired when ticket is purchased
 *
 * @param int $ticket_id Ticket ID
 * @param int $show_id Show ID
 * @param int $attendee_id Attendee ID
 */
do_action('pf_ticket_purchased', $ticket_id, $show_id, $attendee_id);

/**
 * Fired when attendee checks in
 *
 * @param int    $ticket_id Ticket ID
 * @param int    $show_id Show ID
 * @param string $method Check-in method
 */
do_action('pf_attendee_checked_in', $ticket_id, $show_id, $method);
```

### Volunteer Management

```php
/**
 * Fired when volunteer signs up
 *
 * @param int $volunteer_id Volunteer ID
 * @param int $festival_id Festival ID
 */
do_action('pf_volunteer_registered', $volunteer_id, $festival_id);

/**
 * Fired when volunteer is assigned to shift
 *
 * @param int $assignment_id Assignment ID
 * @param int $volunteer_id Volunteer ID
 * @param int $shift_id Shift ID
 */
do_action('pf_volunteer_assigned', $assignment_id, $volunteer_id, $shift_id);

/**
 * Fired when volunteer checks in to shift
 *
 * @param int $assignment_id Assignment ID
 */
do_action('pf_volunteer_checked_in', $assignment_id);
```

---

## Filter Hooks

### Festival Data

```php
/**
 * Filter festival settings before save
 *
 * @param array $settings Settings array
 * @param int   $festival_id Festival ID
 */
$settings = apply_filters('pf_festival_settings', $settings, $festival_id);

/**
 * Filter festival public data
 *
 * @param array  $data Festival data for frontend
 * @param object $festival Festival object
 */
$data = apply_filters('pf_festival_public_data', $data, $festival);
```

### Voting Configuration

```php
/**
 * Filter voting methods available
 *
 * @param array $methods Array of voting methods
 */
$methods = apply_filters('pf_voting_methods', [
    'single_choice'  => 'Single Choice',
    'ranked_choice'  => 'Ranked Choice',
    'approval'       => 'Approval Voting',
]);

/**
 * Filter vote validation rules
 *
 * @param array $rules Validation rules
 * @param int   $show_id Show ID
 */
$rules = apply_filters('pf_vote_validation_rules', $rules, $show_id);

/**
 * Filter duplicate detection methods
 *
 * @param array $methods Detection methods
 */
$methods = apply_filters('pf_duplicate_vote_detection', [
    'ip_hash'     => true,
    'fingerprint' => true,
    'token'       => true,
]);

/**
 * Filter scoring algorithm
 *
 * @param callable $algorithm Scoring function
 * @param string   $method Voting method
 */
$algorithm = apply_filters('pf_scoring_algorithm', $algorithm, $method);
```

### Performer Display

```php
/**
 * Filter performer card output
 *
 * @param string $html Performer card HTML
 * @param object $performer Performer object
 * @param array  $args Display arguments
 */
$html = apply_filters('pf_performer_card_html', $html, $performer, $args);

/**
 * Filter performer bio display
 *
 * @param string $bio Bio content
 * @param object $performer Performer object
 */
$bio = apply_filters('pf_performer_bio_display', $bio, $performer);
```

### Ticket Pricing

```php
/**
 * Filter ticket price
 *
 * @param float  $price Ticket price
 * @param int    $show_id Show ID
 * @param string $ticket_type Ticket type
 */
$price = apply_filters('pf_ticket_price', $price, $show_id, $ticket_type);

/**
 * Filter coupon discount
 *
 * @param float  $discount Discount amount
 * @param object $coupon Coupon object
 * @param float  $subtotal Order subtotal
 */
$discount = apply_filters('pf_coupon_discount', $discount, $coupon, $subtotal);
```

---

## REST API Extension

### Custom Endpoints

```php
add_action('rest_api_init', function() {
    // Custom voting endpoint
    register_rest_route('peanut-festival/v1', '/custom/vote', [
        'methods'             => 'POST',
        'callback'            => 'handle_custom_vote',
        'permission_callback' => '__return_true', // Public voting
        'args' => [
            'show_slug' => [
                'required' => true,
                'type'     => 'string',
            ],
            'performer_id' => [
                'required' => true,
                'type'     => 'integer',
            ],
        ],
    ]);
});

function handle_custom_vote($request) {
    // Rate limiting
    if (!pf_rate_limit_check('vote_submit')) {
        return new WP_Error('rate_limited', 'Too many votes', ['status' => 429]);
    }

    // Fraud detection
    $ip_hash = md5($_SERVER['REMOTE_ADDR']);
    if (pf_is_vote_duplicate($request['show_slug'], $ip_hash)) {
        return new WP_Error('duplicate_vote', 'Already voted', ['status' => 403]);
    }

    // Process vote
    $result = pf_record_vote([
        'show_slug'    => $request['show_slug'],
        'performer_id' => $request['performer_id'],
        'ip_hash'      => $ip_hash,
    ]);

    return rest_ensure_response(['success' => true]);
}
```

### Extending Existing Endpoints

```php
// Add custom fields to show response
add_filter('pf_rest_show_response', function($response, $show) {
    $response['custom_data'] = pf_get_show_meta($show->id, 'custom_data');
    return $response;
}, 10, 2);

// Add custom query parameters
add_filter('pf_rest_shows_query', function($args, $request) {
    if ($venue_type = $request->get_param('venue_type')) {
        $args['venue_type'] = sanitize_text_field($venue_type);
    }
    return $args;
}, 10, 2);
```

---

## Custom Voting Methods

### Registering a Voting Method

```php
add_filter('pf_voting_methods', function($methods) {
    $methods['approval_with_limit'] = [
        'name'        => 'Approval with Limit',
        'description' => 'Vote for up to N performers',
        'handler'     => 'My_Voting_Handler',
        'settings'    => [
            'max_votes' => [
                'type'    => 'number',
                'default' => 3,
                'label'   => 'Maximum votes per person',
            ],
        ],
    ];
    return $methods;
});

class My_Voting_Handler implements PF_Voting_Interface {

    public function validate_vote($vote_data, $show_config) {
        $existing_votes = pf_get_voter_votes(
            $vote_data['token'],
            $vote_data['show_slug']
        );

        $max_votes = $show_config['settings']['max_votes'] ?? 3;

        if (count($existing_votes) >= $max_votes) {
            return new WP_Error(
                'max_votes_reached',
                sprintf('Maximum %d votes allowed', $max_votes)
            );
        }

        return true;
    }

    public function calculate_results($votes, $show_config) {
        $scores = [];

        foreach ($votes as $vote) {
            $performer_id = $vote->performer_id;
            if (!isset($scores[$performer_id])) {
                $scores[$performer_id] = 0;
            }
            $scores[$performer_id]++; // Each approval = 1 point
        }

        arsort($scores);

        return $this->format_results($scores);
    }
}
```

### Custom Scoring Algorithm

```php
// Borda count scoring for ranked choice
add_filter('pf_scoring_algorithm', function($algorithm, $method) {
    if ($method === 'ranked_choice_borda') {
        return function($votes, $performer_count) {
            $scores = [];

            foreach ($votes as $vote) {
                $points = $performer_count - $vote->vote_rank;
                $scores[$vote->performer_id] =
                    ($scores[$vote->performer_id] ?? 0) + $points;
            }

            return $scores;
        };
    }
    return $algorithm;
}, 10, 2);
```

---

## Competition Extensions

### Custom Bracket Types

```php
add_filter('pf_competition_types', function($types) {
    $types['swiss'] = [
        'name'        => 'Swiss System',
        'description' => 'Round-robin with dynamic pairings',
        'handler'     => 'PF_Swiss_Competition',
        'min_competitors' => 8,
    ];
    return $types;
});

class PF_Swiss_Competition implements PF_Competition_Interface {

    public function generate_bracket($performers, $config) {
        // Swiss system pairing logic
        $rounds = ceil(log2(count($performers)));

        $bracket = [
            'rounds' => $rounds,
            'matches' => [],
        ];

        // First round: random pairing
        $shuffled = $performers;
        shuffle($shuffled);

        for ($i = 0; $i < count($shuffled); $i += 2) {
            $bracket['matches'][] = [
                'round'        => 1,
                'performer_1'  => $shuffled[$i],
                'performer_2'  => $shuffled[$i + 1] ?? null,
            ];
        }

        return $bracket;
    }

    public function advance_round($competition_id, $results) {
        // Swiss pairing: match competitors with similar records
        $standings = $this->calculate_standings($competition_id);

        // Group by win count
        $groups = [];
        foreach ($standings as $performer_id => $record) {
            $wins = $record['wins'];
            $groups[$wins][] = $performer_id;
        }

        // Pair within groups
        $matches = [];
        foreach ($groups as $wins => $performers) {
            shuffle($performers);
            for ($i = 0; $i < count($performers); $i += 2) {
                $matches[] = [
                    'performer_1' => $performers[$i],
                    'performer_2' => $performers[$i + 1] ?? null,
                ];
            }
        }

        return $matches;
    }
}
```

---

## Template Customization

### Override Templates

Place custom templates in your theme:

```
your-theme/
└── peanut-festival/
    ├── show-listing.php
    ├── performer-card.php
    ├── voting-form.php
    └── results-display.php
```

### Template Parts

```php
// Load template with custom data
pf_get_template_part('performer', 'card', [
    'performer' => $performer,
    'show_vote_button' => true,
    'custom_class' => 'featured-performer',
]);
```

### Template Hooks

```php
// Add content before voting form
add_action('pf_before_voting_form', function($show) {
    echo '<div class="voting-instructions">';
    echo '<p>Vote for your favorite performers!</p>';
    echo '</div>';
});

// Add content after results
add_action('pf_after_results_display', function($show, $results) {
    echo '<div class="share-results">';
    echo pf_get_share_buttons($show);
    echo '</div>';
}, 10, 2);
```

---

## Custom Show Types

```php
add_filter('pf_show_types', function($types) {
    $types['workshop'] = [
        'name'        => 'Workshop',
        'icon'        => 'dashicons-welcome-learn-more',
        'supports'    => ['ticketing', 'capacity'],
        'voting'      => false,
    ];

    $types['panel'] = [
        'name'        => 'Panel Discussion',
        'icon'        => 'dashicons-groups',
        'supports'    => ['ticketing'],
        'voting'      => false,
    ];

    return $types;
});

// Add custom fields for show type
add_action('pf_show_edit_fields_workshop', function($show) {
    $materials = pf_get_show_meta($show->id, 'materials_provided');
    ?>
    <tr>
        <th>Materials Provided</th>
        <td>
            <textarea name="materials_provided"><?php
                echo esc_textarea($materials);
            ?></textarea>
        </td>
    </tr>
    <?php
});
```

---

## Notification System

### Custom Email Templates

```php
add_filter('pf_email_templates', function($templates) {
    $templates['performer_winner'] = [
        'name'    => 'Winner Announcement',
        'subject' => 'Congratulations! You won at {festival_name}',
        'body'    => 'templates/emails/winner.php',
    ];
    return $templates;
});

// Trigger custom email
add_action('pf_winner_announced', function($show_id, $winner_id) {
    $performer = pf_get_performer($winner_id);
    $show = pf_get_show($show_id);

    pf_send_email('performer_winner', $performer->email, [
        'performer_name' => $performer->name,
        'show_name'      => $show->title,
        'festival_name'  => pf_get_festival_name($show->festival_id),
    ]);
}, 10, 2);
```

### Push Notifications

```php
// Hook into Firebase for real-time updates
add_action('pf_vote_cast', function($show_id, $performer_id) {
    if (class_exists('PF_Firebase')) {
        PF_Firebase::push('votes/' . $show_id, [
            'performer_id' => $performer_id,
            'timestamp'    => time(),
        ]);
    }
}, 10, 2);
```

---

## Booker Integration

### Auto-Link Performers

```php
// When performer applies with email matching Booker
add_action('pf_performer_applied', function($performer_id, $festival_id) {
    if (!class_exists('Peanut_Booker')) {
        return;
    }

    $performer = pf_get_performer($performer_id);
    $booker_performer = Peanut_Booker_Performer::get_by_email($performer->email);

    if ($booker_performer) {
        pf_create_booker_link($performer_id, $booker_performer->id);

        // Import Booker data
        pf_update_performer($performer_id, [
            'photo_url' => $booker_performer->photo_url,
            'bio'       => $booker_performer->bio,
        ]);
    }
}, 10, 2);
```

### Sync Achievements

```php
// When performer wins, update Booker profile
add_action('pf_winner_announced', function($show_id, $winner_id) {
    $link = pf_get_booker_link($winner_id);

    if ($link && class_exists('Peanut_Booker')) {
        // Award festival winner badge
        Peanut_Booker_Performer::award_badge(
            $link->booker_performer_id,
            'festival_winner'
        );

        // Add achievement points
        Peanut_Booker_Performer::add_achievement_points(
            $link->booker_performer_id,
            100 // points for winning
        );
    }
}, 10, 2);
```

---

## Flyer Generator Extension

### Custom Templates

```php
add_filter('pf_flyer_templates', function($templates) {
    $templates['custom_style'] = [
        'name'        => 'Custom Style',
        'template_url' => plugin_dir_url(__FILE__) . 'templates/custom-flyer.png',
        'mask_url'     => plugin_dir_url(__FILE__) . 'templates/custom-mask.png',
        'frame' => [
            'x'      => 50,
            'y'      => 100,
            'width'  => 400,
            'height' => 400,
        ],
        'namebox' => [
            'x'         => 50,
            'y'         => 520,
            'width'     => 400,
            'font_size' => 24,
            'color'     => '#ffffff',
        ],
    ];
    return $templates;
});
```

---

## Analytics Extension

```php
// Track custom events
add_action('pf_vote_cast', function($show_id, $performer_id) {
    if (function_exists('pf_track_event')) {
        pf_track_event('vote', [
            'show_id'      => $show_id,
            'performer_id' => $performer_id,
            'source'       => isset($_GET['utm_source']) ? sanitize_text_field($_GET['utm_source']) : 'direct',
        ]);
    }
}, 10, 2);

// Custom analytics dashboard widget
add_action('pf_admin_dashboard_widgets', function() {
    ?>
    <div class="pf-widget">
        <h3>Custom Analytics</h3>
        <?php echo pf_render_custom_analytics(); ?>
    </div>
    <?php
});
```

---

## Security Best Practices

### Input Validation

```php
// Validate vote submission
function validate_vote_request($request) {
    // Verify nonce
    if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
        return new WP_Error('invalid_nonce', 'Invalid security token');
    }

    // Validate show exists
    $show = pf_get_show_by_slug($request['show_slug']);
    if (!$show) {
        return new WP_Error('invalid_show', 'Show not found');
    }

    // Validate performer is in show
    $performers = pf_get_show_performers($show->id);
    $performer_ids = wp_list_pluck($performers, 'id');

    if (!in_array($request['performer_id'], $performer_ids)) {
        return new WP_Error('invalid_performer', 'Performer not in show');
    }

    // Validate voting is open
    if (!pf_is_voting_open($show->id)) {
        return new WP_Error('voting_closed', 'Voting is not open');
    }

    return true;
}
```

### Fraud Prevention

```php
// Custom fraud detection
add_filter('pf_fraud_checks', function($checks) {
    $checks['device_fingerprint'] = function($vote_data) {
        $fingerprint = $vote_data['fingerprint'] ?? '';

        if (empty($fingerprint)) {
            return true; // Allow if no fingerprint
        }

        // Check for existing vote with same fingerprint
        global $wpdb;
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}pf_votes
             WHERE show_slug = %s AND fingerprint_hash = %s",
            $vote_data['show_slug'],
            md5($fingerprint)
        ));

        if ($exists > 0) {
            return new WP_Error('duplicate_fingerprint', 'Vote already recorded');
        }

        return true;
    };

    return $checks;
});
```

---

## Testing

### Unit Test Example

```php
class Custom_Voting_Test extends WP_UnitTestCase {

    public function test_custom_voting_method() {
        // Create test show
        $show_id = pf_create_show([
            'title'      => 'Test Show',
            'festival_id' => 1,
            'voting_config' => [
                'method'   => 'approval_with_limit',
                'settings' => ['max_votes' => 2],
            ],
        ]);

        // Add performers
        $performer_1 = pf_create_performer(['name' => 'Performer 1']);
        $performer_2 = pf_create_performer(['name' => 'Performer 2']);
        $performer_3 = pf_create_performer(['name' => 'Performer 3']);

        // Cast votes at limit
        $token = wp_generate_uuid4();
        pf_record_vote(['show_id' => $show_id, 'performer_id' => $performer_1, 'token' => $token]);
        pf_record_vote(['show_id' => $show_id, 'performer_id' => $performer_2, 'token' => $token]);

        // Third vote should fail
        $result = pf_record_vote(['show_id' => $show_id, 'performer_id' => $performer_3, 'token' => $token]);

        $this->assertWPError($result);
        $this->assertEquals('max_votes_reached', $result->get_error_code());
    }
}
```
