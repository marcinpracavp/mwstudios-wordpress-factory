<?php
/** Local-only evidence from the real Media Library, without exposing database data. */
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local WP CLI required');
$documents = (array) get_option('cb_document_map', []);
$rows = [];
foreach ($documents as $source => $asset) {
    $file = get_attached_file($asset['id']);
    $rows[] = [
        'sourceUrl' => $source, 'id' => (int) $asset['id'],
        'url' => wp_get_attachment_url($asset['id']), 'postType' => get_post_type($asset['id']),
        'mime' => get_post_mime_type($asset['id']), 'exists' => is_file($file),
        'bytes' => is_file($file) ? filesize($file) : null,
        'sha256' => is_file($file) ? hash_file('sha256', $file) : null,
    ];
}
global $wpdb;
echo wp_json_encode([
    'rows' => $rows,
    'counts' => array_map(function ($type) use ($wpdb) {
        return (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type=%s", $type));
    }, ['page', 'post', 'attachment', 'nav_menu_item']),
]);
