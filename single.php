<?php
/**
 * Single blog article.
 *
 * @package aura
 */

get_header();

while ( have_posts() ) :
	the_post();
	$categories   = get_the_category();
	$reading_time = get_field( 'aura_post_reading_time' );
	$lead         = get_field( 'aura_post_lead' );
	$author       = get_field( 'aura_post_author' );
	$labels       = get_field( 'aura_blog_labels', 'option' );
	$related      = get_field( 'aura_post_related' );
	if ( ! $related && $categories ) {
		$related = get_posts( array( 'post_type' => 'post', 'posts_per_page' => 3, 'post__not_in' => array( get_the_ID() ), 'category__in' => array( $categories[0]->term_id ), 'fields' => 'ids' ) );
	}
	?>
	<article class="aura-article">
		<header class="aura-article__header l-container">
			<div class="aura-article__meta"><?php if ( $categories ) : ?><span><?php echo esc_html( $categories[0]->name ); ?></span><?php endif; ?><time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time><?php if ( $reading_time ) : ?><span><?php echo esc_html( $reading_time ); ?></span><?php endif; ?></div>
			<h1><?php the_title(); ?></h1>
			<?php if ( $lead ) : ?><p class="aura-article__lead"><?php echo esc_html( $lead ); ?></p><?php endif; ?>
		</header>
		<?php if ( has_post_thumbnail() ) : ?><div class="aura-article__hero l-container"><?php the_post_thumbnail( 'full', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?></div><?php endif; ?>
		<div class="aura-article__body l-container"><?php the_content(); ?></div>
		<?php if ( ! empty( $author['name'] ) ) : ?>
			<aside class="aura-article-author l-container">
				<?php if ( aura_image_id( $author['image'] ?? 0 ) ) : ?><?php aura_render_image( $author['image'], 'thumbnail' ); ?><?php endif; ?>
				<div><h2><?php echo esc_html( $author['name'] ); ?></h2><?php if ( ! empty( $author['quote'] ) ) : ?><blockquote><?php echo esc_html( $author['quote'] ); ?></blockquote><?php endif; ?><?php if ( ! empty( $author['bio'] ) ) : ?><p><?php echo esc_html( $author['bio'] ); ?></p><?php endif; ?></div>
			</aside>
		<?php endif; ?>
	</article>

	<?php if ( $related && ! empty( $labels['related_title'] ) ) : ?>
		<section class="aura-section aura-related"><div class="l-container"><div class="aura-section-heading"><h2><?php echo esc_html( $labels['related_title'] ); ?></h2><?php if ( aura_link_is_valid( $labels['journal_link'] ?? null ) ) : ?><?php aura_render_link( $labels['journal_link'], 'aura-text-link' ); ?><?php endif; ?></div><div class="aura-blog-grid"><?php foreach ( array_slice( (array) $related, 0, 3 ) as $post_id ) : ?><?php get_template_part( 'partials/aura/article-card', null, array( 'post_id' => (int) $post_id ) ); ?><?php endforeach; ?></div></div></section>
	<?php endif; ?>
	<?php get_template_part( 'partials/aura/newsletter' ); ?>
<?php endwhile; ?>

<?php get_footer(); ?>
