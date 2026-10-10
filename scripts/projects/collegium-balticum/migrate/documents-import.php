<?php
/** Explicit, local-only Media Library import of an already verified document bundle. */
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local WP CLI required');
$cache = get_stylesheet_directory() . '/.factory-cache/live/collegium-balticum/migration';
$pointer = json_decode(file_get_contents($cache . '/documents-ready.json'), true);
$bundle = realpath(get_stylesheet_directory() . '/' . ($pointer['bundle'] ?? ''));
if (!$bundle || strpos($bundle, realpath($cache) . DIRECTORY_SEPARATOR) !== 0) throw new RuntimeException('Invalid document bundle path');
$manifestPath = $bundle . '/manifest.json';
if (hash_file('sha256', $manifestPath) !== ($pointer['manifestSha256'] ?? '')) throw new RuntimeException('Changed document manifest');
$manifest = json_decode(file_get_contents($manifestPath), true);
if (($manifest['kind'] ?? '') !== 'cb-documents' || ($manifest['project'] ?? '') !== 'collegium-balticum') throw new RuntimeException('Wrong document provenance');
foreach ($manifest['files'] as $file) {
    $candidate = realpath($bundle . '/' . $file['path']);
    if (!$candidate || strpos($candidate, $bundle . DIRECTORY_SEPARATOR) !== 0 || filesize($candidate) !== $file['bytes'] || hash_file('sha256', $candidate) !== $file['sha256']) throw new RuntimeException('Changed document file');
}
$records = json_decode(file_get_contents($bundle . '/documents.json'), true);
$source = json_decode(file_get_contents(get_stylesheet_directory() . '/docs/projects/collegium-balticum/documents-source.json'), true);
$allowed = array_column($source['documents'], 'url');
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
$map = (array) get_option('cb_document_map', []);
foreach ($records as $record) {
    if (!in_array($record['url'], $allowed, true)) throw new RuntimeException('Unknown document URL');
    if ($record['status'] !== 'DONE') continue;
    $file = realpath($bundle . '/' . $record['file']);
    if (!$file || strpos($file, $bundle . DIRECTORY_SEPARATOR) !== 0 || hash_file('sha256', $file) !== $record['sha256']) throw new RuntimeException('Invalid document hash');
    $found = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_cb_sha256', 'meta_value' => $record['sha256'], 'numberposts' => 1]);
    if ($found) $id = $found[0]->ID;
    else {
        $tmp = wp_tempnam(basename($file)); copy($file, $tmp);
        $id = media_handle_sideload(['name' => rawurldecode(basename(wp_parse_url($record['url'], PHP_URL_PATH))), 'tmp_name' => $tmp], 0);
        if (is_wp_error($id)) { @unlink($tmp); throw new RuntimeException($id->get_error_message()); }
        update_post_meta($id, '_cb_sha256', $record['sha256']);
        update_post_meta($id, '_cb_source_url', $record['url']);
    }
    $map[$record['url']] = ['id' => $id, 'url' => wp_get_attachment_url($id), 'sha256' => $record['sha256']];
}
update_option('cb_document_map', $map, false);
function cb_document_replace($value, $map, $key = '') {
    if (is_array($value)) { foreach ($value as $childKey => &$item) $item = cb_document_replace($item, $map, $childKey); return $value; }
    if (!is_string($value)) return $value;
    if ($key === 'url' && isset($map[$value])) return $map[$value]['url'];
    // Change destinations only; the source's visible link labels stay intact.
    return preg_replace_callback('/(\bhref\s*=\s*)(["\x27])(.*?)\2/is', function ($match) use ($map) {
        $source = html_entity_decode($match[3], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return isset($map[$source]) ? $match[1] . $match[2] . esc_url($map[$source]['url']) . $match[2] : $match[0];
    }, $value);
}
$posts = get_posts(['post_type' => ['page', 'post'], 'post_status' => 'any', 'meta_key' => '_cb_source_id', 'posts_per_page' => -1]);
foreach ($posts as $post) {
    $sections = get_field('cb_sections', $post->ID, false);
    if ($sections) update_field('field_cb_sections', cb_document_replace($sections, $map), $post->ID);
    if ($post->post_content) wp_update_post(['ID' => $post->ID, 'post_content' => cb_document_replace($post->post_content, $map)]);
}
foreach (['cb_header', 'cb_footer', 'cb_sections'] as $field) {
    $value = get_field($field, 'option', false);
    if ($value) update_field('field_' . $field, cb_document_replace($value, $map), 'option');
}
$documents = json_decode(file_get_contents($cache . '/documents.json'), true);
foreach ($documents as &$page) foreach ($page['documents'] as &$document) if (isset($map[$document['url']])) {
    $document['localCopy'] = 'DONE'; $document['attachmentId'] = $map[$document['url']]['id']; $document['localUrl'] = $map[$document['url']]['url']; unset($document['reason']);
}
file_put_contents($cache . '/documents.json', wp_json_encode($documents, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
WP_CLI::success('Original documents mapped to local Media Library: ' . count($map));
