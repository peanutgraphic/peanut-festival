<?php
/**
 * Eventbrite integration class (ported from mcf-eventbrite-schedule)
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Eventbrite {

    private static ?Peanut_Festival_Eventbrite $instance = null;
    private const TRANSIENT_KEY = 'pf_eventbrite_cache';

    public static function get_instance(): Peanut_Festival_Eventbrite {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_credentials(): array {
        $settings = Peanut_Festival_Settings::get();
        return [
            'token' => $settings['eventbrite_token'] ?? '',
            'org_id' => $settings['eventbrite_org_id'] ?? '',
        ];
    }

    public static function test_connection(): array {
        $credentials = self::get_credentials();

        if (empty($credentials['token'])) {
            return ['success' => false, 'error' => 'Missing API token'];
        }

        $response = self::api_request('/users/me/organizations/');

        if (is_wp_error($response)) {
            return ['success' => false, 'error' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $organizations = $body['organizations'] ?? [];

        return [
            'success' => true,
            'organizations' => $organizations,
            'count' => count($organizations),
        ];
    }

    public static function fetch_events(array $params = [], bool $force = false): array {
        $credentials = self::get_credentials();

        if (empty($credentials['token']) || empty($credentials['org_id'])) {
            return [];
        }

        $cache_key = self::TRANSIENT_KEY . '_' . md5(serialize($params));

        if (!$force) {
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return $cached;
            }
        }

        $defaults = [
            'status' => 'live',
            'order_by' => 'start_asc',
            'expand' => 'venue,category,format,logo',
            'page_size' => 50,
        ];

        $query = array_merge($defaults, $params);
        $endpoint = "/organizations/{$credentials['org_id']}/events/";

        $events = [];
        $continuation = '';
        $attempts = 0;

        do {
            if ($continuation) {
                $query['continuation'] = $continuation;
            }

            $response = self::api_request($endpoint, $query);

            if (is_wp_error($response)) {
                error_log('Peanut Festival Eventbrite Error: ' . $response->get_error_message());
                break;
            }

            $code = wp_remote_retrieve_response_code($response);
            if ($code !== 200) {
                error_log("Peanut Festival Eventbrite HTTP $code");
                break;
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);

            if (!is_array($body)) {
                break;
            }

            foreach (($body['events'] ?? []) as $event) {
                $events[] = $event;
            }

            $pagination = $body['pagination'] ?? [];
            $continuation = $pagination['continuation'] ?? '';
            $has_more = !empty($pagination['has_more_items']);

            $attempts++;
        } while ($has_more && $attempts < 20);

        // Cache for 5 minutes
        set_transient($cache_key, $events, 5 * MINUTE_IN_SECONDS);

        return $events;
    }

    public static function get_event(string $event_id): ?array {
        $response = self::api_request("/events/{$event_id}/", [
            'expand' => 'venue,category,format,logo,ticket_availability',
        ]);

        if (is_wp_error($response)) {
            return null;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return is_array($body) ? $body : null;
    }

    public static function sync_events(int $festival_id): array {
        $events = self::fetch_events([], true);
        $synced = 0;
        $errors = [];

        foreach ($events as $event) {
            $eventbrite_id = $event['id'] ?? '';
            if (!$eventbrite_id) {
                continue;
            }

            // Check if show already exists
            global $wpdb;
            $shows_table = Peanut_Festival_Database::get_table_name('shows');
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $shows_table WHERE eventbrite_id = %s",
                $eventbrite_id
            ));

            $show_data = [
                'festival_id' => $festival_id,
                'eventbrite_id' => $eventbrite_id,
                'title' => $event['name']['text'] ?? 'Untitled',
                'description' => $event['description']['text'] ?? '',
                'show_date' => isset($event['start']['local']) ? date('Y-m-d', strtotime($event['start']['local'])) : null,
                'start_time' => isset($event['start']['local']) ? date('H:i:s', strtotime($event['start']['local'])) : null,
                'end_time' => isset($event['end']['local']) ? date('H:i:s', strtotime($event['end']['local'])) : null,
                'capacity' => $event['capacity'] ?? null,
                'status' => self::map_status($event['status'] ?? ''),
            ];

            // Handle venue
            if (!empty($event['venue'])) {
                $venue_id = self::sync_venue($festival_id, $event['venue']);
                if ($venue_id) {
                    $show_data['venue_id'] = $venue_id;
                }
            }

            if ($existing) {
                Peanut_Festival_Shows::update((int) $existing, $show_data);
            } else {
                Peanut_Festival_Shows::create($show_data);
            }

            $synced++;
        }

        // Clear cache
        delete_transient(self::TRANSIENT_KEY);

        return [
            'synced' => $synced,
            'total' => count($events),
            'errors' => $errors,
        ];
    }

    private static function sync_venue(int $festival_id, array $venue_data): ?int {
        $name = $venue_data['name'] ?? '';
        if (!$name) {
            return null;
        }

        // Check if venue exists by name
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('venues');
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE festival_id = %d AND name = %s",
            $festival_id, $name
        ));

        $data = [
            'festival_id' => $festival_id,
            'name' => $name,
            'address' => $venue_data['address']['localized_address_display'] ?? '',
            'city' => $venue_data['address']['city'] ?? '',
            'state' => $venue_data['address']['region'] ?? '',
            'zip' => $venue_data['address']['postal_code'] ?? '',
            'capacity' => $venue_data['capacity'] ?? null,
        ];

        if ($existing) {
            Peanut_Festival_Venues::update((int) $existing, $data);
            return (int) $existing;
        }

        return Peanut_Festival_Venues::create($data) ?: null;
    }

    private static function map_status(string $eventbrite_status): string {
        return match ($eventbrite_status) {
            'live' => 'on_sale',
            'started' => 'on_sale',
            'ended' => 'completed',
            'completed' => 'completed',
            'canceled' => 'cancelled',
            default => 'draft',
        };
    }

    private static function api_request(string $endpoint, array $params = []): array|\WP_Error {
        $credentials = self::get_credentials();
        $base_url = 'https://www.eventbriteapi.com/v3';

        $url = $base_url . $endpoint;
        if (!empty($params)) {
            $url = add_query_arg($params, $url);
        }

        return wp_remote_get($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $credentials['token'],
                'Accept' => 'application/json',
            ],
            'timeout' => 30,
        ]);
    }

    public static function clear_cache(): void {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_pf_eventbrite%'");
    }
}
