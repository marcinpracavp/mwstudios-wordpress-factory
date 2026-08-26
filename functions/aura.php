<?php
/**
 * Project-specific integration for AURA.
 *
 * @package aura
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/aura-acf.php';

add_action(
	'after_setup_theme',
	static function () {
		add_theme_support( 'woocommerce' );
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		add_theme_support( 'wc-product-gallery-slider' );
		add_image_size( 'aura-product-card', 608, 640, true );
		add_image_size( 'aura-editorial', 1248, 900, true );
		add_image_size( 'aura-article-card', 832, 554, true );
	}
);

add_filter(
	'body_class',
	static function ( array $classes ): array {
		$classes[] = 'aura-site';
		return $classes;
	}
);

function aura_link_is_valid( $link ): bool {
	return is_array( $link ) && ! empty( $link['url'] ) && ! empty( $link['title'] );
}

function aura_render_link( $link, string $class = 'aura-button' ): void {
	if ( ! aura_link_is_valid( $link ) ) {
		return;
	}

	$target = ! empty( $link['target'] ) ? $link['target'] : '_self';
	?>
	<a class="<?php echo esc_attr( $class ); ?>" href="<?php echo esc_url( $link['url'] ); ?>" target="<?php echo esc_attr( $target ); ?>">
		<?php echo esc_html( $link['title'] ); ?>
	</a>
	<?php
}

function aura_image_id( $image ): int {
	if ( is_numeric( $image ) ) {
		return (int) $image;
	}

	return is_array( $image ) && ! empty( $image['ID'] ) ? (int) $image['ID'] : 0;
}

function aura_render_image( $image, string $size = 'full', array $attributes = array() ): void {
	$image_id = aura_image_id( $image );
	if ( ! $image_id ) {
		return;
	}

	echo wp_get_attachment_image( $image_id, $size, false, $attributes ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function aura_cart_url(): string {
	return function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : '';
}

function aura_account_url(): string {
	return function_exists( 'wc_get_page_permalink' ) ? (string) wc_get_page_permalink( 'myaccount' ) : '';
}

function aura_cart_count(): int {
	return function_exists( 'WC' ) && WC()->cart ? (int) WC()->cart->get_cart_contents_count() : 0;
}

add_filter(
	'woocommerce_add_to_cart_fragments',
	static function ( array $fragments ): array {
		ob_start();
		get_template_part( 'partials/aura/cart-link' );
		$fragments['a.aura-header__cart'] = (string) ob_get_clean();
		return $fragments;
	}
);

/**
 * @return array<int, WC_Product>
 */
function aura_get_products( array $config = array() ): array {
	if ( ! function_exists( 'wc_get_products' ) ) {
		return array();
	}

	$limit   = isset( $config['limit'] ) ? max( 1, min( 24, (int) $config['limit'] ) ) : 4;
	$order   = ! empty( $config['order'] ) && 'ASC' === strtoupper( $config['order'] ) ? 'ASC' : 'DESC';
	$orderby = ! empty( $config['orderby'] ) ? $config['orderby'] : 'menu_order';
	$args    = array(
		'status'  => 'publish',
		'limit'   => $limit,
		'order'   => $order,
		'orderby' => in_array( $orderby, array( 'date', 'price', 'popularity', 'rating', 'menu_order' ), true ) ? $orderby : 'menu_order',
		'return'  => 'objects',
	);

	if ( 'manual' === ( $config['source'] ?? '' ) && ! empty( $config['manual_products'] ) ) {
		$args['include'] = array_map( 'intval', (array) $config['manual_products'] );
		$args['orderby'] = 'include';
	}

	if ( 'category' === ( $config['source'] ?? '' ) && ! empty( $config['category'] ) ) {
		$term = get_term( (int) $config['category'], 'product_cat' );
		if ( $term && ! is_wp_error( $term ) ) {
			$args['category'] = array( $term->slug );
		}
	}

	return wc_get_products( $args );
}

function aura_product_badge( WC_Product $product ): string {
	if ( ! $product->is_in_stock() ) {
		return (string) get_field( 'sold_out_badge', 'option' );
	}
	if ( $product->is_on_sale() ) {
		return (string) get_field( 'sale_badge', 'option' );
	}
	if ( $product->is_featured() ) {
		return (string) get_field( 'bestseller_badge', 'option' );
	}
	return '';
}

function aura_product_scent_label( WC_Product $product ): string {
	$values = array_filter(
		array(
			$product->get_attribute( 'pa_scent-family' ),
			$product->get_attribute( 'pa_scent-family-secondary' ),
		)
	);
	return implode( ' · ', $values );
}

add_filter( 'woocommerce_enqueue_styles', '__return_empty_array' );

add_action(
	'widgets_init',
	static function () {
		register_sidebar(
			array(
				'name'          => 'AURA — filtry sklepu',
				'id'            => 'shop-filters',
				'before_widget' => '<section class="aura-filter-widget">',
				'after_widget'  => '</section>',
				'before_title'  => '<h2>',
				'after_title'   => '</h2>',
			)
		);
	}
);
