<?php
/** Import only verified full-size CB-05 originals. No page provisioning or document changes. */
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local WP CLI required');
$cache = get_stylesheet_directory() . '/.factory-cache/live/collegium-balticum/migration';
if (!is_file($cache . '/gallery-ready.json')) throw new RuntimeException('Verified gallery ZIP must be imported first');
$pointer = json_decode(file_get_contents($cache . '/gallery-ready.json'), true);
$bundle = realpath(get_stylesheet_directory() . '/' . ($pointer['bundle'] ?? ''));
if (!$bundle || strpos($bundle, realpath($cache) . DIRECTORY_SEPARATOR) !== 0) throw new RuntimeException('Invalid gallery bundle path');
$manifestPath = $bundle . '/manifest.json';
if (hash_file('sha256', $manifestPath) !== ($pointer['manifestSha256'] ?? '')) throw new RuntimeException('Changed gallery manifest');
$manifest = json_decode(file_get_contents($manifestPath), true);
if (($manifest['kind'] ?? '') !== 'cb-gallery-originals' || ($manifest['project'] ?? '') !== 'collegium-balticum') throw new RuntimeException('Wrong provenance');
foreach ($manifest['files'] as $entry) {
    $file = realpath($bundle . '/' . $entry['path']);
    if (!$file || strpos($file, $bundle . DIRECTORY_SEPARATOR) !== 0 || filesize($file) !== $entry['bytes'] || hash_file('sha256', $file) !== $entry['sha256']) throw new RuntimeException('Changed gallery file');
}
$records = json_decode(file_get_contents($bundle . '/gallery.json'), true);
$source = json_decode(file_get_contents(get_stylesheet_directory() . '/docs/projects/collegium-balticum/TASK-4E-GALLERY-ORIGINALS.json'), true);
$allowed = array_column($source['originals'], 'sourceUrl');
if (count($records) !== 21 || count(array_unique(array_column($records, 'sourceUrl'))) !== 21) throw new RuntimeException('Incomplete gallery allowlist');
// Validate every file before the first Media Library write.
foreach ($records as $record) {
    if (!in_array($record['sourceUrl'], $allowed, true)) throw new RuntimeException('Unknown original URL');
    if ($record['status'] !== 'DONE') continue;
    $file = realpath($bundle . '/' . $record['file']);
    if (!$file || strpos($file, $bundle . DIRECTORY_SEPARATOR) !== 0 || hash_file('sha256', $file) !== $record['sha256']) throw new RuntimeException('Invalid original hash');
    $size = getimagesize($file);
    if (!$size || $size['mime'] !== 'image/jpeg' || $size[0] !== $record['width'] || $size[1] !== $record['height'] || max($size[0], $size[1]) <= 400) throw new RuntimeException('Not a full-size JPEG');
}
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
$map = (array) get_option('cb_gallery_original_map', []);
$assets = (array) get_option('cb_asset_map', []);
foreach ($records as $record) {
    if ($record['status'] !== 'DONE') continue;
    $item = $source['originals'][array_search($record['sourceUrl'], $allowed, true)];
    $candidates = [$item['thumbnailSource']];
    foreach (explode(',', $item['srcset']) as $variant) if (preg_match('~^\s*(\S+)\s+\d+w\s*$~', $variant, $match)) $candidates[] = $match[1];
    $thumbnailIds = [];
    foreach ($candidates as $url) if (isset($assets[$url]['id'])) $thumbnailIds[] = (int) $assets[$url]['id'];
    $thumbnailIds = array_values(array_unique($thumbnailIds));
    if (!$thumbnailIds) throw new RuntimeException('No existing thumbnail matches the evidenced srcset');
    $found = get_posts(['post_type'=>'attachment','post_status'=>'inherit','meta_key'=>'_cb_sha256','meta_value'=>$record['sha256'],'numberposts'=>1]);
    if ($found) $id = $found[0]->ID;
    else {
        $tmp = wp_tempnam(basename($record['file'])); copy($bundle . '/' . $record['file'], $tmp);
        $id = media_handle_sideload(['name'=>rawurldecode(basename(wp_parse_url($record['sourceUrl'], PHP_URL_PATH))),'tmp_name'=>$tmp], 0);
        if (is_wp_error($id)) { @unlink($tmp); throw new RuntimeException($id->get_error_message()); }
        update_post_meta($id, '_cb_sha256', $record['sha256']); update_post_meta($id, '_cb_source_url', $record['sourceUrl']);
        // Retain the verified existing thumbnail ALT, rather than invent a new caption.
        $thumb = $thumbnailIds[0];
        if ($thumb) update_post_meta($id, '_wp_attachment_image_alt', get_post_meta($thumb, '_wp_attachment_image_alt', true));
    }
    $map[$record['sourceUrl']] = ['id'=>$id,'sha256'=>$record['sha256'],'thumbnailSource'=>$record['thumbnailSource'],'thumbnailIds'=>$thumbnailIds];
}
update_option('cb_gallery_original_map', $map, false);
WP_CLI::success('Verified full-size gallery originals: ' . count($map) . '; missing: ' . (21-count($map)));
