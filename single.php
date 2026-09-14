<?php
get_header();
while (have_posts()) : the_post();
$article_header = function_exists('get_field') ? get_field('rudnikagro_blog_article_header') : [];
if (!is_array($article_header)) { $article_header = []; }
$article_date = function_exists('get_field') ? (string) get_field('rudnikagro_blog_card_date') : '';
$return_label = function_exists('get_field') ? (string) get_field('rudnikagro_blog_article_return_label') : '';
$related_heading = function_exists('get_field') ? (string) get_field('rudnikagro_blog_related_heading') : '';
?>
<section class="c-blog-article__heading" data-factory-section="blog-article-heading">
<?php get_template_part('partials/page-banner', null, [
    'banner' => $article_header,
    'title' => (string) ($article_header['banner_label'] ?? ''),
    'breadcrumb' => (string) ($article_header['breadcrumb'] ?? ''),
    'breadcrumb_current' => get_the_title(),
    'image_id' => (int) ($article_header['banner'] ?? 0),
    'factory_section' => '',
    'section_class' => 'c-page-banner--blog-article',
]); ?>
<div class="c-blog-article__heading-inner l-container">
    <header class="c-blog-article__header"><h1><?php the_title(); ?></h1></header>
    <?php if (has_post_thumbnail()) : ?><div class="c-blog-article__hero"><?php the_post_thumbnail('full', ['loading' => false]); ?></div><?php endif; ?>
    <?php if ($article_date !== '') : ?><time class="c-blog-article__date" datetime="<?php echo esc_attr(get_post_time('c')); ?>"><?php echo esc_html($article_date); ?></time><?php endif; ?>
</div>
</section>
<section class="c-blog-article__body" data-factory-section="blog-article-content"><div class="l-container">
    <div class="c-blog-article__content"><?php the_content(); ?></div>
    <?php if ($return_label !== '') : ?><a class="c-blog-article__return" href="<?php echo esc_url(get_permalink((int) get_option('page_for_posts'))); ?>"><?php echo esc_html($return_label); ?></a><?php endif; ?>
</div></section>
<?php if ($related_heading !== '' && function_exists('have_rows') && have_rows('rudnikagro_blog_related_posts')) : ?>
<section class="c-blog-related mt-110 mb-150 pb-22" data-factory-section="blog-related-posts"><div class="l-container">
    <h2><?php echo esc_html($related_heading); ?></h2><div class="c-blog-grid gap-200 mt-23">
    <?php while (have_rows('rudnikagro_blog_related_posts')) : the_row(); $related_id = (int) get_sub_field('post'); if ($related_id) { get_template_part('partials/blog-card', null, ['post_id' => $related_id, 'heading_tag' => 'h3']); } endwhile; ?>
    </div>
</div></section>
<?php endif; endwhile; get_footer();
