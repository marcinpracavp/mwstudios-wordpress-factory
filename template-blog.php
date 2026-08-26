<?php
/**
 * Template Name: Aura — Journal
 *
 * @package aura
 */

$intro       = get_field( 'aura_blog_intro' );
$featured_id = (int) get_field( 'aura_blog_featured_post' );
$labels      = get_field( 'aura_blog_labels', 'option' );
$paged       = max( 1, (int) get_query_var( 'paged' ) );
$query       = new WP_Query(
	array(
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => 6,
		'paged'          => $paged,
		'post__not_in'   => $featured_id ? array( $featured_id ) : array(),
	)
);
$categories  = get_categories( array( 'hide_empty' => true ) );

get_header();
?>

<?php if ( ! empty( $intro['title'] ) ) : ?>
	<section class="aura-blog-hero l-container">
		<?php if ( ! empty( $intro['eyebrow'] ) ) : ?><p class="aura-eyebrow"><?php echo esc_html( $intro['eyebrow'] ); ?></p><?php endif; ?>
		<h1><?php echo esc_html( $intro['title'] ); ?></h1>
		<?php if ( ! empty( $intro['text'] ) ) : ?><p><?php echo esc_html( $intro['text'] ); ?></p><?php endif; ?>
		<?php if ( $categories || ! empty( $labels['all_posts_label'] ) ) : ?>
			<nav class="aura-blog-categories">
				<?php if ( ! empty( $labels['all_posts_label'] ) ) : ?><a class="is-active" href="<?php echo esc_url( get_permalink() ); ?>"><?php echo esc_html( $labels['all_posts_label'] ); ?></a><?php endif; ?>
				<?php foreach ( $categories as $category ) : ?><a href="<?php echo esc_url( get_category_link( $category ) ); ?>"><?php echo esc_html( $category->name ); ?></a><?php endforeach; ?>
			</nav>
		<?php endif; ?>
	</section>
<?php endif; ?>

<?php if ( $featured_id && 'publish' === get_post_status( $featured_id ) ) : ?>
	<section class="aura-blog-featured l-container">
		<?php if ( has_post_thumbnail( $featured_id ) ) : ?><a class="aura-blog-featured__image" href="<?php echo esc_url( get_permalink( $featured_id ) ); ?>"><?php echo get_the_post_thumbnail( $featured_id, 'full' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a><?php endif; ?>
		<div class="aura-blog-featured__content">
			<?php $featured_categories = get_the_category( $featured_id ); ?>
			<div class="aura-article-card__meta"><?php if ( $featured_categories ) : ?><span><?php echo esc_html( $featured_categories[0]->name ); ?></span><?php endif; ?><time datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $featured_id ) ); ?>"><?php echo esc_html( get_the_date( '', $featured_id ) ); ?></time></div>
			<h2><?php echo esc_html( get_the_title( $featured_id ) ); ?></h2>
			<?php if ( has_excerpt( $featured_id ) ) : ?><p><?php echo esc_html( get_the_excerpt( $featured_id ) ); ?></p><?php endif; ?>
			<?php if ( ! empty( $labels['read_article_label'] ) ) : ?><a class="aura-text-link" href="<?php echo esc_url( get_permalink( $featured_id ) ); ?>"><?php echo esc_html( $labels['read_article_label'] ); ?></a><?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $query->have_posts() ) : ?>
	<section class="aura-section"><div class="l-container">
		<div class="aura-blog-grid">
			<?php while ( $query->have_posts() ) : $query->the_post(); ?><?php get_template_part( 'partials/aura/article-card', null, array( 'post_id' => get_the_ID() ) ); ?><?php endwhile; ?>
		</div>
		<?php if ( $query->max_num_pages > 1 ) : ?><nav class="aura-pagination"><?php echo wp_kses_post( paginate_links( array( 'total' => $query->max_num_pages, 'current' => $paged, 'prev_text' => $labels['previous_label'] ?? '', 'next_text' => $labels['next_label'] ?? '' ) ) ); ?></nav><?php endif; ?>
	</div></section>
	<?php wp_reset_postdata(); ?>
<?php endif; ?>

<?php get_template_part( 'partials/aura/newsletter' ); ?>
<?php get_footer(); ?>
