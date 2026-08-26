<?php
/**
 * Read-only verification for the AURA importer.
 */

defined( 'ABSPATH' ) || exit;

$count = static function ( string $post_type ): int {
	$status = 'attachment' === $post_type ? 'inherit' : 'any';
	$meta_key = 'attachment' === $post_type ? '_aura_factory_asset_key' : '_aura_factory_owned';
	$query = new WP_Query( array( 'post_type' => $post_type, 'post_status' => $status, 'posts_per_page' => 1, 'meta_key' => $meta_key, 'fields' => 'ids' ) );
	return (int) $query->found_posts;
};

$front_id = (int) get_option( 'page_on_front' );
$shop_id  = (int) get_option( 'woocommerce_shop_page_id' );
$hero     = function_exists( 'get_field' ) ? get_field( 'aura_home_hero', $front_id ) : array();
$labels   = function_exists( 'get_field' ) ? get_field( 'aura_header_labels', 'option' ) : array();
$menus    = get_nav_menu_locations();

$result = array(
	'site_title'       => get_bloginfo( 'name' ),
	'front_page'       => array( 'id' => $front_id, 'title' => get_the_title( $front_id ), 'url' => get_permalink( $front_id ) ),
	'shop_page'        => array( 'id' => $shop_id, 'title' => get_the_title( $shop_id ), 'url' => $shop_id ? get_permalink( $shop_id ) : '' ),
	'owned_pages'      => $count( 'page' ),
	'owned_products'   => $count( 'product' ),
	'owned_posts'      => $count( 'post' ),
	'owned_attachments'=> $count( 'attachment' ),
	'hero_title'       => $hero['title'] ?? '',
	'header_cart_label'=> $labels['cart_label'] ?? '',
	'menu_locations'   => array_intersect_key( $menus, array_flip( array( 'header', 'mobile', 'footer_shop', 'footer_help', 'footer_brand' ) ) ),
	'plugins'          => array( 'acf' => function_exists( 'get_field' ), 'cf7' => class_exists( 'WPCF7' ), 'woocommerce' => class_exists( 'WooCommerce' ), 'polylang' => function_exists( 'pll_languages_list' ) ),
	'languages'        => function_exists( 'pll_languages_list' ) ? pll_languages_list() : array(),
);

WP_CLI::log( wp_json_encode( $result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
