<?php
/**
 * Notifications class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Notifications {

    private static ?Peanut_Festival_Notifications $instance = null;

    public static function get_instance(): Peanut_Festival_Notifications {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function send_email(string $to, string $subject, string $message, array $headers = []): bool {
        $default_headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
        ];

        $headers = array_merge($default_headers, $headers);

        // Wrap in template
        $html = self::get_email_template($subject, $message);

        return wp_mail($to, $subject, $html, $headers);
    }

    public static function notify_performer_status(int $performer_id, string $status): bool {
        $performer = Peanut_Festival_Performers::get_by_id($performer_id);
        if (!$performer || !$performer->email) {
            return false;
        }

        $festival = null;
        if ($performer->festival_id) {
            $festival = Peanut_Festival_Festivals::get_by_id($performer->festival_id);
        }

        $festival_name = $festival ? $festival->name : get_bloginfo('name');

        $subjects = [
            'accepted' => "You've been accepted to {$festival_name}!",
            'rejected' => "Update on your {$festival_name} application",
            'waitlisted' => "You're on the waitlist for {$festival_name}",
            'confirmed' => "Your spot at {$festival_name} is confirmed!",
        ];

        $messages = [
            'accepted' => self::get_acceptance_message($performer, $festival),
            'rejected' => self::get_rejection_message($performer, $festival),
            'waitlisted' => self::get_waitlist_message($performer, $festival),
            'confirmed' => self::get_confirmation_message($performer, $festival),
        ];

        $subject = $subjects[$status] ?? "Application Update - {$festival_name}";
        $message = $messages[$status] ?? "Your application status has been updated to: {$status}";

        $result = self::send_email($performer->email, $subject, $message);

        if ($result) {
            Peanut_Festival_Performers::update($performer_id, ['notification_sent' => 1]);
        }

        return $result;
    }

    public static function notify_volunteer_shift(int $volunteer_id, int $shift_id): bool {
        $volunteer = Peanut_Festival_Database::get_row('volunteers', ['id' => $volunteer_id]);
        $shift = Peanut_Festival_Database::get_row('volunteer_shifts', ['id' => $shift_id]);

        if (!$volunteer || !$shift || !$volunteer->email) {
            return false;
        }

        $subject = "You've been assigned to a volunteer shift";
        $message = sprintf(
            "<p>Hi %s,</p>
            <p>You've been assigned to the following volunteer shift:</p>
            <ul>
                <li><strong>Task:</strong> %s</li>
                <li><strong>Date:</strong> %s</li>
                <li><strong>Time:</strong> %s - %s</li>
                <li><strong>Location:</strong> %s</li>
            </ul>
            <p>%s</p>
            <p>Thank you for volunteering!</p>",
            esc_html($volunteer->name),
            esc_html($shift->task_name),
            date_i18n(get_option('date_format'), strtotime($shift->shift_date)),
            date_i18n(get_option('time_format'), strtotime($shift->start_time)),
            date_i18n(get_option('time_format'), strtotime($shift->end_time)),
            esc_html($shift->location ?: 'TBD'),
            $shift->description ? '<p>' . esc_html($shift->description) . '</p>' : ''
        );

        return self::send_email($volunteer->email, $subject, $message);
    }

    private static function get_acceptance_message(object $performer, ?object $festival): string {
        $festival_name = $festival ? $festival->name : 'our festival';

        return sprintf(
            "<p>Dear %s,</p>
            <p>Congratulations! We're thrilled to let you know that you've been accepted to perform at %s!</p>
            <p>We were impressed by your application and can't wait to have you as part of our lineup.</p>
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>We'll be in touch soon with scheduling details</li>
                <li>Please confirm your availability</li>
                <li>Review any technical requirements</li>
            </ul>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <p>Welcome aboard!</p>",
            esc_html($performer->name),
            esc_html($festival_name)
        );
    }

    private static function get_rejection_message(object $performer, ?object $festival): string {
        $festival_name = $festival ? $festival->name : 'our festival';

        return sprintf(
            "<p>Dear %s,</p>
            <p>Thank you for your interest in performing at %s and for taking the time to apply.</p>
            <p>After careful consideration, we regret to inform you that we are unable to offer you a spot in this year's lineup.</p>
            <p>Please know that this was a difficult decision. We received many applications from talented performers, and unfortunately, we couldn't accommodate everyone.</p>
            <p>We encourage you to apply again next year and wish you all the best in your future performances.</p>
            <p>Thank you for your understanding.</p>",
            esc_html($performer->name),
            esc_html($festival_name)
        );
    }

    private static function get_waitlist_message(object $performer, ?object $festival): string {
        $festival_name = $festival ? $festival->name : 'our festival';

        return sprintf(
            "<p>Dear %s,</p>
            <p>Thank you for your application to perform at %s.</p>
            <p>We wanted to let you know that you've been placed on our waitlist. This means that while we don't have a confirmed spot for you at this time, we may reach out if an opening becomes available.</p>
            <p>We'll keep you updated on any changes. In the meantime, please keep your schedule flexible if possible.</p>
            <p>Thank you for your patience and understanding.</p>",
            esc_html($performer->name),
            esc_html($festival_name)
        );
    }

    private static function get_confirmation_message(object $performer, ?object $festival): string {
        $festival_name = $festival ? $festival->name : 'our festival';

        return sprintf(
            "<p>Dear %s,</p>
            <p>This email confirms your spot at %s!</p>
            <p>Please review the following details and let us know if anything needs to be updated.</p>
            <p>We're looking forward to seeing you there!</p>",
            esc_html($performer->name),
            esc_html($festival_name)
        );
    }

    public static function notify_new_application(string $type, int $id): bool {
        $admin_email = Peanut_Festival_Settings::get('notification_email');
        if (!$admin_email) {
            $admin_email = get_option('admin_email');
        }

        $type_labels = [
            'performer' => 'Performer Application',
            'volunteer' => 'Volunteer Signup',
            'vendor' => 'Vendor Application',
        ];

        $type_label = $type_labels[$type] ?? ucfirst($type);
        $data = null;
        $name = '';
        $email = '';

        switch ($type) {
            case 'performer':
                $data = Peanut_Festival_Performers::get_by_id($id);
                if ($data) {
                    $name = $data->name;
                    $email = $data->email;
                }
                break;
            case 'volunteer':
                $data = Peanut_Festival_Database::get_row('volunteers', ['id' => $id]);
                if ($data) {
                    $name = $data->name;
                    $email = $data->email;
                }
                break;
            case 'vendor':
                $data = Peanut_Festival_Database::get_row('vendors', ['id' => $id]);
                if ($data) {
                    $name = $data->business_name;
                    $email = $data->email ?? '';
                }
                break;
        }

        if (!$data) {
            return false;
        }

        $subject = "New {$type_label}: {$name}";
        $admin_url = admin_url("admin.php?page=peanut-festival#{$type}s");

        $message = sprintf(
            "<p>A new %s has been submitted.</p>
            <ul>
                <li><strong>Name:</strong> %s</li>
                <li><strong>Email:</strong> %s</li>
                <li><strong>Submitted:</strong> %s</li>
            </ul>
            <p><a href='%s' style='display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px;'>View in Dashboard</a></p>",
            strtolower($type_label),
            esc_html($name),
            esc_html($email),
            current_time('F j, Y g:i a'),
            esc_url($admin_url)
        );

        return self::send_email($admin_email, $subject, $message);
    }

    public static function notify_volunteer_welcome(int $volunteer_id): bool {
        $volunteer = Peanut_Festival_Database::get_row('volunteers', ['id' => $volunteer_id]);
        if (!$volunteer || !$volunteer->email) {
            return false;
        }

        $festival = null;
        if ($volunteer->festival_id) {
            $festival = Peanut_Festival_Festivals::get_by_id($volunteer->festival_id);
        }

        $festival_name = $festival ? $festival->name : get_bloginfo('name');

        $subject = "Thank you for signing up to volunteer at {$festival_name}!";
        $message = sprintf(
            "<p>Hi %s,</p>
            <p>Thank you for signing up to volunteer at %s! We're excited to have you on our team.</p>
            <p>Your application is now being reviewed. We'll be in touch soon with shift assignments and more details.</p>
            <p>In the meantime, please make note of any dates you're available to help out.</p>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Thank you for your support!</p>",
            esc_html($volunteer->name),
            esc_html($festival_name)
        );

        return self::send_email($volunteer->email, $subject, $message);
    }

    public static function notify_vendor_status(int $vendor_id, string $status): bool {
        $vendor = Peanut_Festival_Database::get_row('vendors', ['id' => $vendor_id]);
        if (!$vendor || !$vendor->email) {
            return false;
        }

        $festival = null;
        if ($vendor->festival_id) {
            $festival = Peanut_Festival_Festivals::get_by_id($vendor->festival_id);
        }

        $festival_name = $festival ? $festival->name : get_bloginfo('name');

        $subjects = [
            'approved' => "Your vendor application for {$festival_name} has been approved!",
            'rejected' => "Update on your {$festival_name} vendor application",
        ];

        $subject = $subjects[$status] ?? "Vendor Application Update - {$festival_name}";

        if ($status === 'approved') {
            $message = sprintf(
                "<p>Dear %s,</p>
                <p>Great news! Your vendor application for %s has been approved.</p>
                <p>We'll be sending you more information about booth setup, fees, and logistics soon.</p>
                <p>If you have any questions, please don't hesitate to reach out.</p>
                <p>We look forward to having you at the festival!</p>",
                esc_html($vendor->contact_name ?: $vendor->business_name),
                esc_html($festival_name)
            );
        } else {
            $message = sprintf(
                "<p>Dear %s,</p>
                <p>Thank you for your interest in being a vendor at %s.</p>
                <p>After careful review, we regret to inform you that we are unable to accommodate your vendor application at this time.</p>
                <p>We encourage you to apply again for future events.</p>
                <p>Thank you for your understanding.</p>",
                esc_html($vendor->contact_name ?: $vendor->business_name),
                esc_html($festival_name)
            );
        }

        return self::send_email($vendor->email, $subject, $message);
    }

    private static function get_email_template(string $subject, string $content): string {
        $site_name = get_bloginfo('name');

        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{$subject}</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #f5f5f5;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
            <div style='text-align: center; margin-bottom: 30px;'>
                <h1 style='margin: 0; color: #333; font-size: 24px;'>{$site_name}</h1>
            </div>
            <div style='color: #333; font-size: 16px; line-height: 1.6;'>
                {$content}
            </div>
            <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;'>
                <p>&copy; " . date('Y') . " {$site_name}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }
}
