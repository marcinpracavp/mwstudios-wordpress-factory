<?php
$newsletter = get_field( 'aura_newsletter', 'option' );
if ( empty( $newsletter['title'] ) || empty( $newsletter['form_shortcode'] ) ) {
	return;
}
?>
<section class="aura-newsletter">
	<div class="aura-newsletter__inner l-container">
		<div>
			<?php if ( ! empty( $newsletter['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $newsletter['eyebrow'] ); ?></p><?php endif; ?>
			<h2><span class="aura-only-desktop"><?php echo esc_html( $newsletter['title'] ); ?></span><?php if ( ! empty( $newsletter['title_mobile'] ) ) : ?><span class="aura-only-mobile"><?php echo esc_html( $newsletter['title_mobile'] ); ?></span><?php endif; ?></h2>
			<?php if ( ! empty( $newsletter['text'] ) || ! empty( $newsletter['text_mobile'] ) ) : ?><p><span class="aura-only-desktop"><?php echo esc_html( $newsletter['text'] ?? '' ); ?></span><?php if ( ! empty( $newsletter['text_mobile'] ) ) : ?><span class="aura-only-mobile"><?php echo esc_html( $newsletter['text_mobile'] ); ?></span><?php endif; ?></p><?php endif; ?>
		</div>
		<div class="aura-newsletter__form"><?php echo do_shortcode( $newsletter['form_shortcode'] ); ?></div>
	</div>
</section>
