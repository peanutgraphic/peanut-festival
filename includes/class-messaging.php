<?php
/**
 * Messaging management class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Peanut_Festival_Messaging {

    private static ?Peanut_Festival_Messaging $instance = null;

    public static function get_instance(): Peanut_Festival_Messaging {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {}

    public static function get_conversations(int $festival_id, int $user_id, string $user_type): array {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('messages');

        return $wpdb->get_results($wpdb->prepare(
            "SELECT conversation_id,
                    MAX(created_at) as last_message_at,
                    SUM(CASE WHEN recipient_id = %d AND recipient_type = %s AND is_read = 0 THEN 1 ELSE 0 END) as unread_count
             FROM $table
             WHERE festival_id = %d
               AND ((sender_id = %d AND sender_type = %s) OR (recipient_id = %d AND recipient_type = %s))
             GROUP BY conversation_id
             ORDER BY last_message_at DESC",
            $user_id, $user_type, $festival_id, $user_id, $user_type, $user_id, $user_type
        ));
    }

    public static function get_messages(string $conversation_id): array {
        return Peanut_Festival_Database::get_results(
            'messages',
            ['conversation_id' => $conversation_id],
            'created_at',
            'ASC'
        );
    }

    public static function send_message(array $data): int|false {
        if (empty($data['conversation_id'])) {
            $data['conversation_id'] = self::generate_conversation_id(
                $data['sender_id'], $data['sender_type'],
                $data['recipient_id'], $data['recipient_type']
            );
        }

        $data['created_at'] = current_time('mysql');
        return Peanut_Festival_Database::insert('messages', $data);
    }

    public static function send_broadcast(int $festival_id, int $sender_id, string $group, string $subject, string $content): int {
        $data = [
            'festival_id' => $festival_id,
            'conversation_id' => 'broadcast_' . uniqid(),
            'sender_id' => $sender_id,
            'sender_type' => 'admin',
            'recipient_type' => 'group',
            'subject' => $subject,
            'content' => $content,
            'is_broadcast' => 1,
            'broadcast_group' => $group,
            'created_at' => current_time('mysql'),
        ];

        return Peanut_Festival_Database::insert('messages', $data);
    }

    public static function mark_as_read(string $conversation_id, int $user_id, string $user_type): int|false {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('messages');

        return $wpdb->query($wpdb->prepare(
            "UPDATE $table SET is_read = 1
             WHERE conversation_id = %s AND recipient_id = %d AND recipient_type = %s AND is_read = 0",
            $conversation_id, $user_id, $user_type
        ));
    }

    public static function get_unread_count(int $festival_id, int $user_id, string $user_type): int {
        global $wpdb;
        $table = Peanut_Festival_Database::get_table_name('messages');

        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table
             WHERE festival_id = %d AND recipient_id = %d AND recipient_type = %s AND is_read = 0",
            $festival_id, $user_id, $user_type
        ));
    }

    private static function generate_conversation_id(int $id1, string $type1, int $id2, string $type2): string {
        $parts = [
            "{$type1}_{$id1}",
            "{$type2}_{$id2}",
        ];
        sort($parts);
        return implode('_', $parts);
    }
}
