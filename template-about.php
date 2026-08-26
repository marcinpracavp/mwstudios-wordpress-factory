<?php
/**
 * Template Name: Aura — About
 *
 * @package aura
 */

$hero     = get_field( 'aura_about_hero' );
$manifest = get_field( 'aura_about_manifest' );
$origin   = get_field( 'aura_about_origin' );
$process  = get_field( 'aura_about_process' );
$materials = get_field( 'aura_about_materials' );
$values   = get_field( 'aura_about_values' );
$cta      = get_field( 'aura_about_cta' );

get_header();
?>

<?php if ( ! empty( $hero['title'] ) && aura_image_id( $hero['image_desktop'] ?? 0 ) ) : ?>
	<section class="aura-about-hero">
		<div class="aura-about-hero__content">
			<?php if ( ! empty( $hero['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $hero['eyebrow'] ); ?></p><?php endif; ?>
			<h1><?php echo esc_html( $hero['title'] ); ?></h1>
			<?php if ( ! empty( $hero['text'] ) ) : ?><p><?php echo esc_html( $hero['text'] ); ?></p><?php endif; ?>
		</div>
		<picture class="aura-about-hero__media">
			<?php if ( aura_image_id( $hero['image_mobile'] ?? 0 ) ) : ?><source media="(max-width: 767px)" srcset="<?php echo esc_url( wp_get_attachment_image_url( aura_image_id( $hero['image_mobile'] ), 'full' ) ); ?>"><?php endif; ?>
			<?php aura_render_image( $hero['image_desktop'], 'full', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?>
		</picture>
	</section>
<?php endif; ?>

<?php if ( ! empty( $manifest['quote'] ) ) : ?>
	<section class="aura-about-manifest"><blockquote><?php echo esc_html( $manifest['quote'] ); ?></blockquote><?php if ( ! empty( $manifest['attribution'] ) ) : ?><p><?php echo esc_html( $manifest['attribution'] ); ?></p><?php endif; ?></section>
<?php endif; ?>

<?php if ( ! empty( $origin['title'] ) && aura_image_id( $origin['image'] ?? 0 ) ) : ?>
	<section class="aura-about-origin l-container">
		<div class="aura-about-origin__media"><?php aura_render_image( $origin['image'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?></div>
		<div class="aura-about-origin__content">
			<?php if ( ! empty( $origin['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $origin['eyebrow'] ); ?></p><?php endif; ?>
			<h2><?php echo esc_html( $origin['title'] ); ?></h2>
			<?php if ( ! empty( $origin['content'] ) ) : ?><div><?php echo wp_kses_post( $origin['content'] ); ?></div><?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( ! empty( $process['title'] ) && ! empty( $process['items'] ) ) : ?>
	<section class="aura-about-process aura-section"><div class="l-container">
		<h2><?php echo esc_html( $process['title'] ); ?></h2>
		<div class="aura-about-process__grid">
			<?php foreach ( $process['items'] as $item ) : ?>
				<?php if ( empty( $item['number'] ) || empty( $item['title'] ) ) { continue; } ?>
				<article><span><?php echo esc_html( $item['number'] ); ?></span><h3><?php echo esc_html( $item['title'] ); ?></h3><?php if ( ! empty( $item['text'] ) ) : ?><p><?php echo esc_html( $item['text'] ); ?></p><?php endif; ?></article>
			<?php endforeach; ?>
		</div>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $materials['title'] ) && aura_image_id( $materials['image_primary'] ?? 0 ) ) : ?>
	<section class="aura-about-materials">
		<div class="aura-about-materials__images">
			<?php aura_render_image( $materials['image_primary'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?>
			<?php if ( aura_image_id( $materials['image_secondary'] ?? 0 ) ) : ?><?php aura_render_image( $materials['image_secondary'], 'aura-editorial', array( 'loading' => 'lazy' ) ); ?><?php endif; ?>
		</div>
		<div class="aura-about-materials__content">
			<?php if ( ! empty( $materials['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $materials['eyebrow'] ); ?></p><?php endif; ?>
			<h2><?php echo esc_html( $materials['title'] ); ?></h2>
			<?php if ( ! empty( $materials['content'] ) ) : ?><div><?php echo wp_kses_post( $materials['content'] ); ?></div><?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $values ) : ?>
	<section class="aura-about-values aura-section"><div class="l-container aura-about-values__grid">
		<?php foreach ( $values as $item ) : ?><?php if ( empty( $item['title'] ) || empty( $item['text'] ) ) { continue; } ?><article><h2><?php echo esc_html( $item['title'] ); ?></h2><p><?php echo esc_html( $item['text'] ); ?></p></article><?php endforeach; ?>
	</div></section>
<?php endif; ?>

<?php if ( ! empty( $cta['title'] ) && aura_link_is_valid( $cta['link'] ?? null ) ) : ?>
	<section class="aura-about-cta"><div class="l-container"><h2><?php echo esc_html( $cta['title'] ); ?></h2><?php aura_render_link( $cta['link'] ); ?></div></section>
<?php endif; ?>

<?php get_footer(); ?>
