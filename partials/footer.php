<?php
$intro     = get_field( 'aura_footer_intro', 'option' );
$copyright = get_field( 'aura_footer_copyright', 'option' );
$socials   = get_field( 'aura_social_links', 'option' );
$locations = get_nav_menu_locations();
$columns   = array( 'footer_shop', 'footer_help', 'footer_brand' );
$has_menu  = false;
foreach ( $columns as $location ) {
	$has_menu = $has_menu || ! empty( $locations[ $location ] );
}
?>
<footer class="aura-footer">
	<div class="aura-footer__mobile-quick">
		<div class="l-container">
			<a class="aura-footer__mobile-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
			<?php if ( ! empty( $locations['mobile'] ) ) : ?>
				<?php wp_nav_menu( array( 'theme_location' => 'mobile', 'container' => 'nav', 'container_aria_label' => wp_get_nav_menu_name( 'mobile' ), 'fallback_cb' => false ) ); ?>
			<?php endif; ?>
		</div>
	</div>
	<div class="aura-footer__inner l-container">
		<div class="aura-footer__top">
			<div class="aura-footer__brand">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
				<?php if ( $intro ) : ?><p><?php echo esc_html( $intro ); ?></p><?php endif; ?>
			</div>
			<?php if ( $has_menu ) : ?>
				<div class="aura-footer__menus">
					<?php foreach ( $columns as $location ) : ?>
						<?php if ( empty( $locations[ $location ] ) ) { continue; } ?>
						<?php $menu = wp_get_nav_menu_object( $locations[ $location ] ); ?>
						<nav class="aura-footer__menu" aria-label="<?php echo esc_attr( $menu ? $menu->name : '' ); ?>">
							<?php if ( $menu ) : ?><h2><?php echo esc_html( $menu->name ); ?></h2><?php endif; ?>
							<?php wp_nav_menu( array( 'theme_location' => $location, 'container' => false, 'fallback_cb' => false ) ); ?>
						</nav>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
		<?php if ( $copyright || $socials ) : ?>
			<div class="aura-footer__bottom">
				<?php if ( $copyright ) : ?><p><?php echo esc_html( $copyright ); ?></p><?php endif; ?>
				<?php if ( $socials ) : ?>
					<div class="aura-footer__socials">
						<?php foreach ( $socials as $social ) : ?>
							<?php if ( empty( $social['label'] ) || ! aura_link_is_valid( $social['link'] ?? null ) ) { continue; } ?>
							<a href="<?php echo esc_url( $social['link']['url'] ); ?>" target="<?php echo esc_attr( $social['link']['target'] ?: '_self' ); ?>"><?php echo esc_html( $social['label'] ); ?></a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</footer>
