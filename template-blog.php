<?php
/**
 * Template Name: Blog
 * @package slawinsky_pl
 */
get_header();
$paged = max(1, (int) get_query_var('paged'), (int) get_query_var('page'));
$blog_query = new WP_Query([
    'post_type' => 'post',
    'post_status' => 'publish',
    'posts_per_page' => (int) get_option('posts_per_page'),
    'orderby' => 'date',
    'order' => 'DESC',
    'paged' => $paged,
]);
get_template_part('partials/factory/archive', null, ['query' => $blog_query, 'title' => get_the_title()]);
get_footer();
