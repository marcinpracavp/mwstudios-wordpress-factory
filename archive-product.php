<?php
/**
 * WooCommerce shop archive.
 *
 * The shop and product-category views intentionally share the same catalogue
 * composition. The product-list section detects the active category when one
 * is selected; on the shop archive it renders the complete product catalogue.
 */
defined('ABSPATH') || exit;

get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'product-list',
    'sections' => ['product-list-menu', 'product-list-items', 'product-list-filters'],
]);
get_footer();
