<?php
$labels = get_field( 'aura_header_labels', 'option' );
if ( empty( $labels['search_label'] ) || empty( $labels['search_placeholder'] ) || empty( $labels['search_submit_label'] ) ) {
	return;
}
?>
<div class="aura-search" hidden data-aura-search>
	<button class="aura-search__backdrop" type="button" data-aura-search-close aria-label="<?php echo esc_attr( $labels['search_close_label'] ?? '' ); ?>"></button>
	<div class="aura-search__panel" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr( $labels['search_label'] ); ?>">
		<form action="<?php echo esc_url( home_url( '/' ) ); ?>" method="get" role="search">
			<label for="aura-search-input"><?php echo esc_html( $labels['search_label'] ); ?></label>
			<input id="aura-search-input" type="search" name="s" placeholder="<?php echo esc_attr( $labels['search_placeholder'] ); ?>">
			<?php if ( post_type_exists( 'product' ) ) : ?><input type="hidden" name="post_type" value="product"><?php endif; ?>
			<button class="aura-button" type="submit"><?php echo esc_html( $labels['search_submit_label'] ); ?></button>
		</form>
	</div>
</div>
