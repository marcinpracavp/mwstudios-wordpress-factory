<?php
$product = $args['product'] ?? null;
if ( ! $product instanceof WC_Product || ! $product->is_visible() ) {
	return;
}
$badge       = aura_product_badge( $product );
$scent_label = aura_product_scent_label( $product );
$quick_label = get_field( 'quick_add_label', 'option' );
?>
<article class="aura-product-card">
	<a class="aura-product-card__image" href="<?php echo esc_url( $product->get_permalink() ); ?>">
		<?php echo $product->get_image( 'aura-product-card', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<?php if ( $badge ) : ?><span class="aura-badge"><?php echo esc_html( $badge ); ?></span><?php endif; ?>
	</a>
	<div class="aura-product-card__content">
		<?php if ( $scent_label ) : ?><p class="aura-product-card__meta"><?php echo esc_html( $scent_label ); ?></p><?php endif; ?>
		<h3><a href="<?php echo esc_url( $product->get_permalink() ); ?>"><?php echo esc_html( $product->get_name() ); ?></a></h3>
		<div class="aura-product-card__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></div>
		<?php if ( $quick_label && $product->is_purchasable() && $product->is_in_stock() && $product->is_type( 'simple' ) ) : ?>
			<a class="aura-button aura-button--small add_to_cart_button ajax_add_to_cart" href="<?php echo esc_url( $product->add_to_cart_url() ); ?>" data-product_id="<?php echo esc_attr( (string) $product->get_id() ); ?>" data-quantity="1" rel="nofollow"><?php echo esc_html( $quick_label ); ?></a>
		<?php endif; ?>
	</div>
</article>
