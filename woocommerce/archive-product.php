<?php
/**
 * Product archive.
 *
 * @package aura
 */

defined( 'ABSPATH' ) || exit;

$shop_id = (int) wc_get_page_id( 'shop' );
$intro   = get_field( 'aura_shop_intro', $shop_id );
$promo   = get_field( 'aura_shop_promo', $shop_id );
$seo     = get_field( 'aura_shop_seo', $shop_id );
$labels  = get_field( 'aura_store_copy', 'option' );

get_header();
?>

<?php if ( ! empty( $intro['title'] ) ) : ?>
	<section class="aura-shop-hero l-container">
		<?php woocommerce_breadcrumb(); ?>
		<?php if ( ! empty( $intro['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $intro['eyebrow'] ); ?></p><?php endif; ?>
		<h1><?php echo esc_html( $intro['title'] ); ?></h1>
		<?php if ( ! empty( $intro['text'] ) ) : ?><p><?php echo esc_html( $intro['text'] ); ?></p><?php endif; ?>
	</section>
<?php endif; ?>

<?php $product_categories = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => true, 'parent' => 0 ) ); ?>
<?php if ( ! is_wp_error( $product_categories ) && $product_categories ) : ?>
	<nav class="aura-shop-categories l-container">
		<?php if ( ! empty( $labels['all_products_label'] ) ) : ?><a class="is-active" href="<?php echo esc_url( get_permalink( $shop_id ) ); ?>"><?php echo esc_html( $labels['all_products_label'] ); ?></a><?php endif; ?>
		<?php foreach ( $product_categories as $category ) : ?><a href="<?php echo esc_url( get_term_link( $category ) ); ?>"><?php echo esc_html( $category->name ); ?></a><?php endforeach; ?>
	</nav>
<?php endif; ?>

<section class="aura-shop aura-section"><div class="l-container">
	<?php if ( woocommerce_product_loop() ) : ?>
		<div class="aura-shop__toolbar">
			<?php if ( ! empty( $labels['filters_label'] ) ) : ?><button type="button" data-aura-filters-open><?php echo esc_html( $labels['filters_label'] ); ?></button><?php endif; ?>
			<?php woocommerce_result_count(); ?>
			<?php woocommerce_catalog_ordering(); ?>
		</div>
		<div class="aura-shop__layout">
			<aside class="aura-shop__filters" data-aura-filters><?php if ( is_active_sidebar( 'shop-filters' ) ) { dynamic_sidebar( 'shop-filters' ); } ?></aside>
			<div class="aura-shop__results">
				<div class="aura-products">
					<?php while ( have_posts() ) : the_post(); ?>
						<?php $loop_product = wc_get_product( get_the_ID() ); ?>
						<?php get_template_part( 'partials/aura/product-card', null, array( 'product' => $loop_product ) ); ?>
					<?php endwhile; ?>
				</div>
				<?php woocommerce_pagination(); ?>
			</div>
		</div>
	<?php else : ?>
		<?php do_action( 'woocommerce_no_products_found' ); ?>
	<?php endif; ?>
</div></section>

<?php if ( ! empty( $promo['title'] ) && aura_image_id( $promo['image_desktop'] ?? 0 ) ) : ?>
	<section class="aura-shop-promo l-container">
		<div class="aura-shop-promo__content"><?php if ( ! empty( $promo['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $promo['eyebrow'] ); ?></p><?php endif; ?><h2><?php echo esc_html( $promo['title'] ); ?></h2><?php if ( ! empty( $promo['text'] ) ) : ?><p><?php echo esc_html( $promo['text'] ); ?></p><?php endif; ?><?php aura_render_link( $promo['link'] ?? null, 'aura-text-link' ); ?></div>
		<picture><?php if ( aura_image_id( $promo['image_mobile'] ?? 0 ) ) : ?><source media="(max-width: 767px)" srcset="<?php echo esc_url( wp_get_attachment_image_url( aura_image_id( $promo['image_mobile'] ), 'full' ) ); ?>"><?php endif; ?><?php aura_render_image( $promo['image_desktop'], 'full', array( 'loading' => 'lazy' ) ); ?></picture>
	</section>
<?php endif; ?>

<?php if ( ! empty( $seo['title'] ) && ! empty( $seo['content'] ) ) : ?><section class="aura-shop-seo l-container"><h2><?php echo esc_html( $seo['title'] ); ?></h2><div><?php echo wp_kses_post( $seo['content'] ); ?></div></section><?php endif; ?>

<?php get_footer(); ?>
