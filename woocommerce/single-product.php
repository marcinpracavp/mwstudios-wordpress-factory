<?php
/**
 * Single product page.
 *
 * @package aura
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	global $product;
	$scent    = get_field( 'aura_product_scent' );
	$facts    = get_field( 'aura_product_facts' );
	$story    = get_field( 'aura_product_story' );
	$care     = get_field( 'aura_product_care' );
	$labels   = get_field( 'aura_store_copy', 'option' );
	$related  = wc_get_related_products( $product->get_id(), 4 );
	?>
	<article class="aura-product">
		<div class="l-container aura-product__breadcrumb"><?php woocommerce_breadcrumb(); ?></div>
		<section class="aura-product__summary l-container">
			<?php $gallery_ids = array_values( array_filter( array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() ) ) ); ?>
			<div class="aura-product__gallery">
				<?php if ( $gallery_ids ) : ?><div class="woocommerce-product-gallery__wrapper">
					<?php foreach ( $gallery_ids as $gallery_id ) : ?><figure class="woocommerce-product-gallery__image"><?php echo wp_get_attachment_image( $gallery_id, 'full', false, array( 'loading' => 0 === array_search( $gallery_id, $gallery_ids, true ) ? 'eager' : 'lazy' ) ); ?></figure><?php endforeach; ?>
				</div><?php endif; ?>
			</div>
			<div class="aura-product__buy">
				<h1><?php echo esc_html( $product->get_name() ); ?></h1>
				<?php if ( wc_review_ratings_enabled() ) : ?><?php woocommerce_template_single_rating(); ?><?php endif; ?>
				<div class="aura-product__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></div>
				<?php if ( $product->get_short_description() ) : ?><div class="aura-product__short-description"><?php echo wp_kses_post( $product->get_short_description() ); ?></div><?php endif; ?>
				<?php $attributes = $product->get_attributes(); ?>
				<?php if ( $attributes ) : ?><div class="aura-product__attributes"><?php foreach ( $attributes as $attribute ) : ?><span><?php echo esc_html( wc_attribute_label( $attribute->get_name() ) ); ?>: <?php echo esc_html( $product->get_attribute( $attribute->get_name() ) ); ?></span><?php endforeach; ?></div><?php endif; ?>
				<?php woocommerce_template_single_add_to_cart(); ?>
				<?php if ( ! empty( $labels['shipping_note'] ) ) : ?><p class="aura-product__note"><?php echo esc_html( $labels['shipping_note'] ); ?></p><?php endif; ?>
				<?php if ( ! empty( $labels['payment_note'] ) ) : ?><p class="aura-product__note"><?php echo esc_html( $labels['payment_note'] ); ?></p><?php endif; ?>
			</div>
		</section>

		<?php if ( ! empty( $scent['title'] ) && ! empty( $scent['notes'] ) ) : ?>
			<section class="aura-product-scent aura-section"><div class="l-container">
				<?php if ( ! empty( $scent['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $scent['eyebrow'] ); ?></p><?php endif; ?>
				<h2><?php echo esc_html( $scent['title'] ); ?></h2>
				<?php if ( ! empty( $scent['feels_like'] ) ) : ?><p class="aura-product-scent__lead"><?php echo esc_html( $scent['feels_like'] ); ?></p><?php endif; ?>
				<div class="aura-product-scent__grid"><?php foreach ( $scent['notes'] as $note ) : ?><?php if ( empty( $note['stage'] ) || empty( $note['title'] ) ) { continue; } ?><article><?php if ( aura_image_id( $note['image'] ?? 0 ) ) : ?><?php aura_render_image( $note['image'], 'medium', array( 'loading' => 'lazy' ) ); ?><?php endif; ?><p><?php echo esc_html( $note['stage'] ); ?></p><h3><?php echo esc_html( $note['title'] ); ?></h3><?php if ( ! empty( $note['notes'] ) ) : ?><p><?php echo esc_html( $note['notes'] ); ?></p><?php endif; ?></article><?php endforeach; ?></div>
			</div></section>
		<?php endif; ?>

		<?php if ( $facts ) : ?><section class="aura-product-facts"><div class="l-container"><?php foreach ( $facts as $fact ) : ?><?php if ( empty( $fact['value'] ) || empty( $fact['label'] ) ) { continue; } ?><div><strong><?php echo esc_html( $fact['value'] ); ?></strong><span><?php echo esc_html( $fact['label'] ); ?></span></div><?php endforeach; ?></div></section><?php endif; ?>

		<?php if ( ! empty( $story['title'] ) && aura_image_id( $story['image'] ?? 0 ) ) : ?><section class="aura-product-story"><div><?php aura_render_image( $story['image'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?></div><div><?php if ( ! empty( $story['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $story['eyebrow'] ); ?></p><?php endif; ?><h2><?php echo esc_html( $story['title'] ); ?></h2><?php if ( ! empty( $story['content'] ) ) : ?><div><?php echo wp_kses_post( $story['content'] ); ?></div><?php endif; ?></div></section><?php endif; ?>

		<?php if ( ! empty( $care['title'] ) ) : ?><section class="aura-product-care aura-section"><div class="l-container"><h2><?php echo esc_html( $care['title'] ); ?></h2><?php if ( ! empty( $care['content'] ) ) : ?><div class="aura-product-care__intro"><?php echo wp_kses_post( $care['content'] ); ?></div><?php endif; ?><?php if ( ! empty( $care['items'] ) ) : ?><div class="aura-accordion" data-aura-accordion><?php foreach ( $care['items'] as $item ) : ?><?php if ( empty( $item['title'] ) || empty( $item['content'] ) ) { continue; } ?><details><summary><?php echo esc_html( $item['title'] ); ?></summary><div><?php echo wp_kses_post( $item['content'] ); ?></div></details><?php endforeach; ?></div><?php endif; ?></div></section><?php endif; ?>
	</article>

	<?php $product_reviews = get_comments( array( 'post_id' => $product->get_id(), 'status' => 'approve', 'type' => 'review', 'number' => 3 ) ); ?>
	<?php if ( $product_reviews ) : ?><section class="aura-product-reviews"><div class="l-container">
		<h2><?php echo esc_html( wc_format_decimal( $product->get_average_rating(), 1 ) ); ?> / 5 · <?php echo esc_html( $product->get_review_count() ); ?></h2>
		<div class="aura-product-reviews__grid"><?php foreach ( $product_reviews as $review ) : ?><article class="aura-review-card"><p class="aura-review-card__rating"><?php echo wp_kses_post( wc_get_rating_html( (float) get_comment_meta( $review->comment_ID, 'rating', true ) ) ); ?></p><blockquote><?php echo esc_html( $review->comment_content ); ?></blockquote><p><?php echo esc_html( $review->comment_author ); ?></p></article><?php endforeach; ?></div>
	</div></section><?php endif; ?>

	<?php if ( $related && ! empty( $labels['related_products_title'] ) ) : ?><section class="aura-section aura-related-products"><div class="l-container"><h2><?php echo esc_html( $labels['related_products_title'] ); ?></h2><div class="aura-products"><?php foreach ( $related as $related_id ) : ?><?php get_template_part( 'partials/aura/product-card', null, array( 'product' => wc_get_product( $related_id ) ) ); ?><?php endforeach; ?></div></div></section><?php endif; ?>
	<?php if ( ! empty( $labels['sticky_add_label'] ) && $product->is_purchasable() && $product->is_in_stock() ) : ?><div class="aura-sticky-cart" data-aura-sticky-cart><span><?php echo esc_html( $product->get_name() ); ?></span><span><?php echo wp_kses_post( $product->get_price_html() ); ?></span><button type="button" data-aura-sticky-submit><?php echo esc_html( $labels['sticky_add_label'] ); ?></button></div><?php endif; ?>
<?php endwhile; ?>

<?php get_footer(); ?>
