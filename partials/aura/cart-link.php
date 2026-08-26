<?php
$labels = get_field( 'aura_header_labels', 'option' );
$url    = aura_cart_url();
if ( ! $url || empty( $labels['cart_label'] ) ) {
	return;
}
?>
<a class="aura-header__utility aura-header__cart" href="<?php echo esc_url( $url ); ?>">
	<?php echo esc_html( $labels['cart_label'] ); ?> <span>(<?php echo esc_html( (string) aura_cart_count() ); ?>)</span>
</a>
