<?php
$announcement = get_field( 'aura_announcement', 'option' );
$labels       = get_field( 'aura_header_labels', 'option' );
$cart_url     = aura_cart_url();
$account_url  = aura_account_url();
?>

<?php if ( ! empty( $announcement['enabled'] ) && ! empty( $announcement['content'] ) ) : ?>
	<div class="aura-announcement" data-aura-announcement>
		<div class="aura-announcement__content"><?php echo wp_kses_post( $announcement['content'] ); ?></div>
	</div>
<?php endif; ?>

<header class="aura-header js-headroom">
	<div class="aura-header__inner">
		<a class="aura-header__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>

		<nav class="aura-header__nav" aria-label="<?php echo esc_attr( wp_get_nav_menu_name( 'header' ) ); ?>">
			<?php wp_nav_menu( array( 'theme_location' => 'header', 'container' => false, 'fallback_cb' => false ) ); ?>
		</nav>

		<div class="aura-header__utilities">
			<?php if ( ! empty( $labels['search_label'] ) ) : ?>
				<button class="aura-header__utility" type="button" data-aura-search-open><?php echo esc_html( $labels['search_label'] ); ?></button>
			<?php endif; ?>
			<?php if ( $account_url && ! empty( $labels['account_label'] ) ) : ?>
				<a class="aura-header__utility" href="<?php echo esc_url( $account_url ); ?>"><?php echo esc_html( $labels['account_label'] ); ?></a>
			<?php endif; ?>
			<?php if ( $cart_url && ! empty( $labels['cart_label'] ) ) : ?><?php get_template_part( 'partials/aura/cart-link' ); ?><?php endif; ?>
		</div>

		<?php if ( ! empty( $labels['menu_open_label'] ) ) : ?>
			<button class="aura-header__menu-toggle" type="button" aria-expanded="false" aria-controls="aura-mobile-menu" data-aura-menu-toggle>
				<span class="screen-reader-text"><?php echo esc_html( $labels['menu_open_label'] ); ?></span>
				<span aria-hidden="true"></span><span aria-hidden="true"></span>
			</button>
		<?php endif; ?>
	</div>

	<div class="aura-mobile-menu" id="aura-mobile-menu" hidden data-aura-mobile-menu>
		<nav aria-label="<?php echo esc_attr( wp_get_nav_menu_name( 'mobile' ) ); ?>">
			<?php wp_nav_menu( array( 'theme_location' => 'mobile', 'container' => false, 'fallback_cb' => false ) ); ?>
		</nav>
		<?php if ( $account_url && ! empty( $labels['account_label'] ) ) : ?>
			<a href="<?php echo esc_url( $account_url ); ?>"><?php echo esc_html( $labels['account_label'] ); ?></a>
		<?php endif; ?>
	</div>
</header>

<?php get_template_part( 'partials/aura/search-overlay' ); ?>
