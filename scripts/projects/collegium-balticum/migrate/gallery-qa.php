<?php
/** Read-only evidence for the local full-size gallery import. */
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local WP CLI required');
$rows = [];
foreach ((array) get_option('cb_gallery_original_map', []) as $source => $record) {
    $file = get_attached_file($record['id']);
    $size = is_file($file) ? getimagesize($file) : false;
    $rows[] = ['sourceUrl'=>$source, 'id'=>$record['id'], 'type'=>get_post_type($record['id']),
        'url'=>wp_get_attachment_url($record['id']), 'sha256'=>is_file($file) ? hash_file('sha256', $file) : null,
        'width'=>$size ? $size[0] : null, 'height'=>$size ? $size[1] : null,
        'alt'=>get_post_meta($record['id'], '_wp_attachment_image_alt', true),
        'thumbnails'=>array_map(function ($id) { return ['id'=>$id, 'url'=>wp_get_attachment_url($id), 'alt'=>get_post_meta($id, '_wp_attachment_image_alt', true)]; }, $record['thumbnailIds'])];
}
echo wp_json_encode(['rows'=>$rows, 'attachments'=>(int) wp_count_posts('attachment')->inherit,
    'galleryHash'=>hash('sha256', serialize(get_option('cb_gallery_original_map', []))),
    'documentsHash'=>hash('sha256', serialize(get_option('cb_document_map', [])))]);
