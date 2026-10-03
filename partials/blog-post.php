<?php
/**
 * Native WordPress single-post template.
 *
 * Article content, title, featured image, publication date and author are
 * maintained in the core post editor. The only optional article setting is a
 * global label for the return button.
 */

if (!have_posts()) {
    return;
}

$posts_page_id = (int) get_option('page_for_posts');
$blog_url = $posts_page_id > 0 ? get_permalink($posts_page_id) : get_post_type_archive_link('post');
$blog_url = $blog_url ?: home_url('/blog/');
$return_label = function_exists('emko_option') ? trim((string) emko_option('emko_blog_return_label')) : '';
if ($return_label === '') {
    $return_label = __('Wróć do listy', 'slawinsky');
}

while (have_posts()) :
    the_post();
    $post_id = get_the_ID();
    $author_id = (int) get_post_field('post_author', $post_id);
    $author = trim((string) get_the_author_meta('display_name', $author_id));
    $published_date = get_the_date('', $post_id);
    $related_posts = new WP_Query([
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => 4,
        'post__not_in' => [$post_id],
        'ignore_sticky_posts' => true,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);
    ?>

    <div class="c-blog-post-article__breadcrumbs l-container" data-factory-component="breadcrumbs">
        <?php emko_render_breadcrumbs(); ?>
    </div>

    <article class="c-blog-post-article" data-factory-section="blog-post-article">
        <header class="c-blog-post-article__header">
            <h1 class="c-blog-post-article__title"><?php echo esc_html(get_the_title()); ?></h1>
            <p class="c-blog-post-article__meta">
                <time datetime="<?php echo esc_attr(get_post_time(DATE_W3C, true, $post_id)); ?>"><?php echo esc_html($published_date); ?></time>
                <?php if ($author !== '') : ?> <span aria-hidden="true">|</span> <span><?php echo esc_html($author); ?></span><?php endif; ?>
            </p>
        </header>

        <?php if (has_post_thumbnail()) : ?>
            <div class="c-blog-post-article__media">
                <?php the_post_thumbnail('full', ['loading' => false]); ?>
            </div>
        <?php endif; ?>

        <div class="c-blog-post-article__body">
            <?php the_content(); ?>
        </div>

        <a class="c-blog-post-article__return" href="<?php echo esc_url($blog_url); ?>">
            <span class="c-blog-post-article__return-icon" aria-hidden="true">←</span>
            <span><?php echo esc_html($return_label); ?></span>
        </a>
    </article>

    <?php if ($related_posts->have_posts()) : ?>
        <section class="c-blog-related l-container" data-factory-section="blog-post-related">
            <header class="c-blog-related__header">
                <h2 class="c-blog-related__heading"><?php esc_html_e('Polecane artykuły', 'slawinsky'); ?></h2>
                <a class="c-blog-related__all-link" href="<?php echo esc_url($blog_url); ?>">
                    <span><?php esc_html_e('Wszystkie', 'slawinsky'); ?></span>
                    <span aria-hidden="true">→</span>
                </a>
            </header>
            <div class="c-blog-grid c-blog-grid--related">
                <?php while ($related_posts->have_posts()) : $related_posts->the_post(); ?>
                    <?php get_template_part('partials/blog-card', null, [
                        'post_id' => get_the_ID(),
                        'heading_tag' => 'h3',
                        'variant' => 'related',
                        'show_excerpt' => true,
                        'excerpt_from_content' => true,
                        'loading' => 'lazy',
                    ]); ?>
                <?php endwhile; ?>
            </div>
        </section>
    <?php endif; ?>
    <?php wp_reset_postdata(); ?>
<?php endwhile; ?>
