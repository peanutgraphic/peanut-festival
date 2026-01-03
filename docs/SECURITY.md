# Security Documentation

## Overview

Peanut Festival implements security measures focused on voting integrity, payment processing, and protecting performer and festival data.

## Authentication & Authorization

### REST API Endpoints

| Endpoint Type | Authentication | Authorization |
|--------------|----------------|---------------|
| Public voting | None (token-based fraud prevention) | Rate limited |
| Festival data | None (public) | Read-only |
| Admin endpoints | WordPress auth | `manage_options` capability |
| Performer updates | WordPress auth | Festival admin or performer |

### Admin Permission Callback

```php
public static function permission_admin(): bool|WP_Error {
    if (!current_user_can('manage_options')) {
        return new WP_Error('rest_forbidden', 'Unauthorized', ['status' => 403]);
    }
    return true;
}
```

## Voting Security

### Multi-Layer Fraud Prevention

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| IP Hash | Prevent repeat votes | MD5 hash stored, not raw IP |
| Token | Anonymous user tracking | Random UUID per voter session |
| Fingerprint | Device fingerprinting | Hash of browser characteristics |
| Rate Limit | Prevent rapid voting | Max 10 votes/minute |

### Duplicate Vote Detection

```php
// Check for existing vote
$existing = $wpdb->get_row($wpdb->prepare(
    "SELECT id FROM {$table}
     WHERE show_slug = %s
     AND group_name = %s
     AND (ip_hash = %s OR token = %s OR fingerprint_hash = %s)",
    $show_slug, $group, $ip_hash, $token, $fingerprint_hash
));
```

### Vote Time Windows

Votes are only accepted when:
1. Voting is enabled for the show
2. Current time is within start/end window
3. Show is not archived

### CSRF Protection

All voting endpoints verify nonce:

```php
if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
    return new WP_Error('invalid_nonce', 'Invalid security token', ['status' => 403]);
}
```

## Payment Security

### Stripe Integration

Payments are processed through Stripe with these protections:

| Protection | Implementation |
|------------|----------------|
| API Keys | Environment variables preferred |
| Webhook Signature | HMAC verification |
| PCI Compliance | No card data touches server |

### API Key Storage

```php
// Priority: Environment > Constant > Database
private static function get_stripe_key(): string {
    // Check environment variable first
    $env_value = getenv('STRIPE_SECRET_KEY');
    if ($env_value) return $env_value;

    // Check constant
    if (defined('STRIPE_SECRET_KEY')) return STRIPE_SECRET_KEY;

    // Fall back to database (with admin warning)
    return get_option('pf_stripe_secret_key', '');
}
```

### Webhook Verification

```php
// Verify Stripe webhook signature
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$event = \Stripe\Webhook::constructEvent(
    $payload,
    $sig_header,
    $webhook_secret
);
```

## SQL Injection Prevention

### Parameterized Queries

All database operations use prepared statements:

```php
$results = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$table}
     WHERE festival_id = %d
     AND category = %s
     ORDER BY transaction_date DESC",
    $festival_id,
    $category
));
```

### Dynamic ORDER BY

```php
$allowed_columns = ['created_at', 'name', 'votes'];
$orderby = in_array($request_orderby, $allowed_columns, true)
    ? $request_orderby
    : 'created_at';
```

### LIKE Clause Escaping

```php
$search = '%' . $wpdb->esc_like($search_term) . '%';
$query = $wpdb->prepare("SELECT * FROM {$table} WHERE name LIKE %s", $search);
```

## Input Validation

### Festival Data

| Field | Validation |
|-------|------------|
| `name` | `sanitize_text_field()`, max 255 chars |
| `slug` | `sanitize_title()`, unique check |
| `dates` | Valid date format, end >= start |
| `venue_address` | `sanitize_textarea_field()` |

### Performer Data

```php
// Sanitize performer submission
$data = [
    'name' => sanitize_text_field($request['name']),
    'email' => sanitize_email($request['email']),
    'bio' => wp_kses_post($request['bio']),
    'social_links' => array_map('esc_url_raw', $request['social_links'] ?? []),
];
```

### Voting Data

```php
// Validate performer IDs in ballot
$valid_performers = get_show_performers($show_slug);
foreach ($ballot as $performer_id) {
    if (!in_array($performer_id, $valid_performers, true)) {
        return new WP_Error('invalid_performer', 'Invalid performer ID');
    }
}
```

## Rate Limiting

### Configuration

```php
// Voting rate limits
'vote_submit' => ['limit' => 10, 'window' => 60],   // 10/min
'vote_results' => ['limit' => 60, 'window' => 60],  // 60/min

// API rate limits
'api_public' => ['limit' => 100, 'window' => 60],   // 100/min
'api_admin' => ['limit' => 300, 'window' => 60],    // 300/min
```

### Implementation

```php
if (!Peanut_Festival_Rate_Limiter::check('vote_submit')) {
    return new WP_Error(
        'rate_limited',
        'Too many votes. Please wait.',
        ['status' => 429, 'retry_after' => 60]
    );
}
```

## Firebase Security

### Admin SDK Credentials

Firebase credentials are stored securely:

```php
// Credentials stored as WordPress option (encrypted)
// Never exposed in JavaScript or public endpoints
$credentials = json_decode(
    Peanut_Festival_Encryption::decrypt(
        get_option('pf_firebase_credentials')
    ),
    true
);
```

### Database Rules

Firebase Realtime Database rules restrict access:

```json
{
  "rules": {
    "festivals": {
      "$festivalId": {
        ".read": true,
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

## Data Privacy

### Voter Privacy

- IP addresses stored as one-way hash
- No personally identifiable information collected
- Voting tokens are random and unlinkable

### Performer Data

| Data Type | Visibility | Storage |
|-----------|------------|---------|
| Public bio | Public | Plain text |
| Email | Festival admins only | Encrypted |
| Phone | Festival admins only | Encrypted |
| Payment info | Owner only | Stripe (not on server) |

## Security Logging

```php
Peanut_Festival_Logger::log('security', 'vote_fraud_detected', [
    'show_slug' => $show_slug,
    'ip_hash' => $ip_hash,
    'fingerprint' => $fingerprint_hash,
    'reason' => 'duplicate_fingerprint',
]);
```

## Security Headers

```php
// Set on API responses
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
```

## Reporting Security Issues

Report vulnerabilities to: security@peanutgraphic.com

**Responsible Disclosure**: Please allow 90 days for remediation before public disclosure.

## Security Checklist

### For Festival Administrators

- [ ] Use strong passwords
- [ ] Enable two-factor authentication
- [ ] Regularly review vote patterns for anomalies
- [ ] Keep WordPress and plugins updated
- [ ] Use HTTPS for all festival pages

### For Developers

- [ ] All user input validated and sanitized
- [ ] SQL queries use prepared statements
- [ ] Vote fraud detection enabled
- [ ] Rate limiting configured
- [ ] Stripe API keys in environment variables
- [ ] Firebase credentials encrypted
