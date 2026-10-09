<?php
/** Idempotent development-only preview setup. Never imports client content. */
if (!defined('WP_CLI') || !WP_CLI || (int) get_option('blog_public') !== 0 || get_stylesheet() !== 'mwstudios-wordpress-factory') {
    throw new RuntimeException('Requires isolated noindex factory WordPress.');
}
require __DIR__ . '/content-fixtures.php';
$manifest = json_decode(file_get_contents(get_template_directory() . '/.factory-cache/content-qa/fixtures.json'), true);
$blog = get_page_by_path('factory-qa-blog');
$blog_id = $blog ? $blog->ID : wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_name' => 'factory-qa-blog', 'post_title' => 'Factory QA — blog, dane testowe'], true);
if (is_wp_error($blog_id)) { throw new RuntimeException($blog_id->get_error_message()); }
update_post_meta($blog_id, '_wp_page_template', 'template-blog.php');
$items = $manifest['pages'];
$items['blog-page'] = ['url' => get_permalink($blog_id)];
$items['archive'] = ['url' => get_category_link($category->term_id)];
$items['single'] = ['url' => get_permalink($posts[0])];
$content = '<p>Środowisko testowe factory. To są jawne dane QA, a nie treści Collegium Balticum.</p><ul>';
foreach ($items as $label => $item) { $content .= '<li><a href="' . esc_url($item['url']) . '">' . esc_html($label) . '</a></li>'; }
$content .= '</ul>';
$hub = get_page_by_path('factory-qa-preview');
$data = ['post_type' => 'page', 'post_status' => 'publish', 'post_name' => 'factory-qa-preview', 'post_title' => 'Factory QA — katalog podglądów', 'post_content' => $content];
if ($hub) { $data['ID'] = $hub->ID; }
$hub_id = wp_insert_post($data, true);
if (is_wp_error($hub_id)) { throw new RuntimeException($hub_id->get_error_message()); }
$footer_fields = ['mwf_footer_content', 'mwf_footer_columns', 'mwf_accessibility_link'];
if (get_option('mwf_qa_original_footer', false) === false) {
    $original_footer = [];
    foreach ($footer_fields as $field) { $original_footer[$field] = get_field($field, 'options'); }
    add_option('mwf_qa_original_footer', $original_footer, '', false);
}
update_field('field_group_mwf_footer_mwf_footer_content', '<p>Stopka QA — dane testowe. Bez importu treści Collegium Balticum.</p>', 'options');
update_field('field_group_mwf_footer_mwf_footer_columns', [
    ['title' => 'Podglądy QA', 'links' => [['link' => ['url' => get_permalink($hub_id), 'title' => 'Katalog podglądów QA', 'target' => '']]]],
    ['title' => 'Kontakt QA', 'links' => [['link' => ['url' => $manifest['pages']['contact']['url'], 'title' => 'Kontakt — dane testowe', 'target' => '']]]],
], 'options');
update_field('field_group_mwf_footer_mwf_accessibility_link', ['url' => get_permalink($hub_id), 'title' => 'Deklaracja dostępności — link testowy QA', 'target' => ''], 'options');
if (get_option('mwf_qa_original_front_options', false) === false) {
    add_option('mwf_qa_original_front_options', ['show_on_front' => get_option('show_on_front'), 'page_on_front' => get_option('page_on_front'), 'page_for_posts' => get_option('page_for_posts')], '', false);
}
update_option('show_on_front', 'page');
update_option('page_on_front', $manifest['pages']['home']['id']);
$preview = ['fixtureOnly' => true, 'hub' => get_permalink($hub_id), 'blog' => get_permalink($blog_id), 'homepage' => home_url('/'), 'items' => $items, 'theme' => get_stylesheet(), 'acfVersion' => ACF_VERSION, 'permalinkStructure' => get_option('permalink_structure')];
file_put_contents(get_template_directory() . '/.factory-cache/content-qa/preview.json', wp_json_encode($preview, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\n" . wp_json_encode($preview, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
