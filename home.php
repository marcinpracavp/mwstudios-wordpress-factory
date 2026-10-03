<?php
/**
 * Template Name: Blog archive
 *
 * @package slawinsky_pl
 */

get_header();
$archive_header = function_exists('emko_option') ? emko_option('emko_blog_archive_header') : [];
if (!is_array($archive_header)) { $archive_header = get_option('options_emko_blog_archive_header', []); }
if (!is_array($archive_header)) { $archive_header = []; }
$archive_title = trim((string) ($archive_header['banner_label'] ?? ''));
if ($archive_title === '') {
    $archive_page_id = (int) get_option('page_for_posts');
    $archive_title = $archive_page_id ? trim((string) get_the_title($archive_page_id)) : '';
}
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'blog',
    'sections' => ['blog-archive'],
    'archive_header' => $archive_header,
    'archive_title' => $archive_title !== '' ? $archive_title : 'Blog',
]);
get_footer();
