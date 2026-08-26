<?php
$post_id = isset( $args['post_id'] ) ? (int) $args['post_id'] : get_the_ID();
if ( ! $post_id || 'publish' !== get_post_status( $post_id ) ) {
	return;
}
$categories = get_the_category( $post_id );
?>
<article class="aura-article-card">
	<?php if ( has_post_thumbnail( $post_id ) ) : ?>
		<a class="aura-article-card__image" href="<?php echo esc_url( get_permalink( $post_id ) ); ?>"><?php echo get_the_post_thumbnail( $post_id, 'aura-article-card', array( 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
	<?php endif; ?>
	<div class="aura-article-card__content">
		<div class="aura-article-card__meta">
			<?php if ( $categories ) : ?><span><?php echo esc_html( $categories[0]->name ); ?></span><?php endif; ?>
			<time datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time>
		</div>
		<h2><a href="<?php echo esc_url( get_permalink( $post_id ) ); ?>"><?php echo esc_html( get_the_title( $post_id ) ); ?></a></h2>
		<?php if ( has_excerpt( $post_id ) ) : ?><p><?php echo esc_html( get_the_excerpt( $post_id ) ); ?></p><?php endif; ?>
	</div>
</article>
