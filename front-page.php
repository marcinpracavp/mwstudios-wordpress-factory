<?php
/**
 * Front page.
 *
 * @package aura
 */

$hero              = get_field( 'aura_home_hero' );
$bestsellers       = get_field( 'aura_home_bestsellers' );
$statement         = get_field( 'aura_home_statement' );
$collections       = get_field( 'aura_home_collections' );
$editorial         = get_field( 'aura_home_editorial' );
$categories        = get_field( 'aura_home_categories' );
$usps              = get_field( 'aura_home_usps' );
$finder            = get_field( 'aura_home_finder' );
$featured          = get_field( 'aura_home_featured_product' );
$story             = get_field( 'aura_home_story' );
$reviews           = get_field( 'aura_home_reviews' );
$products          = ! empty( $bestsellers['title'] ) ? aura_get_products( (array) ( $bestsellers['query'] ?? array() ) ) : array();
$featured_product  = ! empty( $featured['product'] ) && function_exists( 'wc_get_product' ) ? wc_get_product( $featured['product'] ) : null;

get_header();
?>

<?php if ( ! empty( $hero['title'] ) && aura_image_id( $hero['image_desktop'] ?? 0 ) ) : ?>
	<section class="aura-hero">
		<div class="aura-hero__content">
			<?php if ( ! empty( $hero['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $hero['eyebrow'] ); ?></p><?php endif; ?>
			<h1><?php echo esc_html( $hero['title'] ); ?></h1>
			<?php if ( ! empty( $hero['text'] ) ) : ?><p class="aura-hero__text"><?php echo esc_html( $hero['text'] ); ?></p><?php endif; ?>
			<?php aura_render_link( $hero['link'] ?? null ); ?>
		</div>
		<picture class="aura-hero__media">
			<?php $mobile_image = aura_image_id( $hero['image_mobile'] ?? 0 ); ?>
			<?php if ( $mobile_image ) : ?><source media="(max-width: 767px)" srcset="<?php echo esc_url( wp_get_attachment_image_url( $mobile_image, 'full' ) ); ?>"><?php endif; ?>
			<?php aura_render_image( $hero['image_desktop'], 'full', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?>
		</picture>
	</section>
<?php endif; ?>

<?php if ( ! empty( $bestsellers['title'] ) && $products ) : ?>
	<section class="aura-section aura-bestsellers">
		<div class="l-container">
			<div class="aura-section-heading">
				<h2><?php echo esc_html( $bestsellers['title'] ); ?></h2>
				<?php aura_render_link( $bestsellers['link'] ?? null, 'aura-text-link' ); ?>
			</div>
			<div class="swiper aura-products-carousel" data-aura-products-slider>
				<div class="swiper-wrapper">
					<?php foreach ( $products as $product ) : ?>
						<div class="swiper-slide"><?php get_template_part( 'partials/aura/product-card', null, array( 'product' => $product ) ); ?></div>
					<?php endforeach; ?>
				</div>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $statement['title'] ) ) : ?>
	<section class="aura-statement">
		<div class="aura-statement__inner l-container">
			<?php if ( ! empty( $statement['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $statement['eyebrow'] ); ?></p><?php endif; ?>
			<h2><?php echo esc_html( $statement['title'] ); ?></h2>
			<?php if ( ! empty( $statement['text'] ) ) : ?><p><?php echo esc_html( $statement['text'] ); ?></p><?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $collections['title'] ) && ! empty( $collections['items'] ) ) : ?>
	<section class="aura-section aura-collections">
		<div class="l-container">
			<div class="aura-section-heading aura-section-heading--stacked">
				<h2><?php echo esc_html( $collections['title'] ); ?></h2>
				<?php if ( ! empty( $collections['text'] ) ) : ?><p><?php echo esc_html( $collections['text'] ); ?></p><?php endif; ?>
			</div>
			<div class="aura-collections__grid">
				<?php foreach ( $collections['items'] as $item ) : ?>
					<?php if ( empty( $item['title'] ) || ! aura_link_is_valid( $item['link'] ?? null ) || ! aura_image_id( $item['image'] ?? 0 ) ) { continue; } ?>
					<a class="aura-collection-card" href="<?php echo esc_url( $item['link']['url'] ); ?>">
						<?php aura_render_image( $item['image'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?>
						<span><?php echo esc_html( $item['title'] ); ?></span>
						<?php if ( ! empty( $item['text'] ) ) : ?><small><?php echo esc_html( $item['text'] ); ?></small><?php endif; ?>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $editorial['title'] ) && aura_image_id( $editorial['image_desktop'] ?? 0 ) ) : ?>
	<section class="aura-editorial aura-editorial--image-left">
		<picture class="aura-editorial__media">
			<?php if ( aura_image_id( $editorial['image_mobile'] ?? 0 ) ) : ?><source media="(max-width: 767px)" srcset="<?php echo esc_url( wp_get_attachment_image_url( aura_image_id( $editorial['image_mobile'] ), 'full' ) ); ?>"><?php endif; ?>
			<?php aura_render_image( $editorial['image_desktop'], 'full', array( 'loading' => 'lazy' ) ); ?>
		</picture>
		<div class="aura-editorial__content">
			<?php if ( ! empty( $editorial['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $editorial['eyebrow'] ); ?></p><?php endif; ?>
			<h2><?php echo esc_html( $editorial['title'] ); ?></h2>
			<?php if ( ! empty( $editorial['text'] ) ) : ?><p><?php echo esc_html( $editorial['text'] ); ?></p><?php endif; ?>
			<?php aura_render_link( $editorial['link'] ?? null, 'aura-text-link' ); ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $categories ) : ?>
	<section class="aura-section aura-category-split">
		<div class="l-container aura-category-split__grid">
			<?php foreach ( $categories as $item ) : ?>
				<?php if ( empty( $item['title'] ) || ! aura_link_is_valid( $item['link'] ?? null ) || ! aura_image_id( $item['image'] ?? 0 ) ) { continue; } ?>
				<a class="aura-category-card" href="<?php echo esc_url( $item['link']['url'] ); ?>">
					<?php aura_render_image( $item['image'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?>
					<span class="aura-category-card__content"><strong><?php echo esc_html( $item['title'] ); ?></strong><?php if ( ! empty( $item['text'] ) ) : ?><small><?php echo esc_html( $item['text'] ); ?></small><?php endif; ?><em><?php echo esc_html( $item['link']['title'] ); ?></em></span>
				</a>
			<?php endforeach; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $usps ) : ?>
	<section class="aura-usps">
		<div class="l-container aura-usps__grid">
			<?php foreach ( $usps as $item ) : ?>
				<?php if ( empty( $item['title'] ) || empty( $item['text'] ) ) { continue; } ?>
				<div class="aura-usp">
					<?php if ( aura_image_id( $item['icon'] ?? 0 ) ) : ?><div class="aura-usp__icon"><?php aura_render_image( $item['icon'], 'full' ); ?></div><?php endif; ?>
					<h3><?php echo esc_html( $item['title'] ); ?></h3><p><?php echo esc_html( $item['text'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $finder['title'] ) && aura_image_id( $finder['image_desktop'] ?? 0 ) ) : ?>
	<section class="aura-editorial aura-editorial--finder">
		<div class="aura-editorial__content">
			<?php if ( ! empty( $finder['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $finder['eyebrow'] ); ?></p><?php endif; ?>
			<h2><span class="aura-only-desktop"><?php echo esc_html( $finder['title'] ); ?></span><?php if ( ! empty( $finder['title_mobile'] ) ) : ?><span class="aura-only-mobile"><?php echo esc_html( $finder['title_mobile'] ); ?></span><?php endif; ?></h2>
			<?php if ( ! empty( $finder['text'] ) || ! empty( $finder['text_mobile'] ) ) : ?><p><span class="aura-only-desktop"><?php echo esc_html( $finder['text'] ?? '' ); ?></span><?php if ( ! empty( $finder['text_mobile'] ) ) : ?><span class="aura-only-mobile"><?php echo esc_html( $finder['text_mobile'] ); ?></span><?php endif; ?></p><?php endif; ?>
			<?php aura_render_link( $finder['link'] ?? null, 'aura-button aura-button--accent' ); ?>
		</div>
		<picture class="aura-editorial__media">
			<?php if ( aura_image_id( $finder['image_mobile'] ?? 0 ) ) : ?><source media="(max-width: 767px)" srcset="<?php echo esc_url( wp_get_attachment_image_url( aura_image_id( $finder['image_mobile'] ), 'full' ) ); ?>"><?php endif; ?>
			<?php aura_render_image( $finder['image_desktop'], 'full', array( 'loading' => 'lazy' ) ); ?>
		</picture>
	</section>
<?php endif; ?>

<?php if ( $featured_product instanceof WC_Product ) : ?>
	<section class="aura-section aura-featured-product">
		<div class="l-container aura-featured-product__inner">
			<div class="aura-featured-product__media"><?php echo $featured_product->get_image( 'full', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
			<div class="aura-featured-product__content">
				<?php if ( ! empty( $featured['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $featured['eyebrow'] ); ?></p><?php endif; ?>
				<h2><?php echo esc_html( $featured_product->get_name() ); ?></h2>
				<?php if ( ! empty( $featured['text'] ) ) : ?><p><?php echo esc_html( $featured['text'] ); ?></p><?php endif; ?>
				<?php if ( $featured_product->get_short_description() ) : ?><div class="aura-featured-product__description"><?php echo wp_kses_post( $featured_product->get_short_description() ); ?></div><?php endif; ?>
				<?php if ( ! empty( $featured['button_label'] ) ) : ?><a class="aura-button" href="<?php echo esc_url( $featured_product->get_permalink() ); ?>"><?php echo esc_html( $featured['button_label'] ); ?></a><?php endif; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $story['title'] ) ) : ?>
	<section class="aura-story">
		<div class="l-container">
			<?php if ( ! empty( $story['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $story['eyebrow'] ); ?></p><?php endif; ?>
			<h2><?php echo esc_html( $story['title'] ); ?></h2>
			<?php if ( ! empty( $story['text'] ) ) : ?><p><?php echo esc_html( $story['text'] ); ?></p><?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $reviews['title'] ) && ! empty( $reviews['items'] ) ) : ?>
	<section class="aura-section aura-reviews">
		<div class="l-container">
			<h2><span class="aura-only-desktop"><?php echo esc_html( $reviews['title'] ); ?></span><?php if ( ! empty( $reviews['title_mobile'] ) ) : ?><span class="aura-only-mobile"><?php echo esc_html( $reviews['title_mobile'] ); ?></span><?php endif; ?></h2>
			<div class="swiper aura-reviews__slider" data-aura-reviews-slider><div class="swiper-wrapper">
				<?php foreach ( $reviews['items'] as $review ) : ?>
					<?php if ( empty( $review['quote'] ) || empty( $review['author'] ) ) { continue; } ?>
					<div class="swiper-slide"><article class="aura-review-card">
						<?php if ( ! empty( $review['rating'] ) ) : ?><p class="aura-review-card__rating"><?php echo esc_html( $review['rating'] ); ?></p><?php endif; ?>
						<blockquote><?php echo esc_html( $review['quote'] ); ?></blockquote><p><?php echo esc_html( $review['author'] ); ?></p>
					</article></div>
				<?php endforeach; ?>
			</div></div>
		</div>
	</section>
<?php endif; ?>

<?php get_template_part( 'partials/aura/newsletter' ); ?>

<?php get_footer(); ?>
