<?php
get_header();
$archive_header = function_exists('rudnikagro_option') ? rudnikagro_option('rudnikagro_blog_archive_header') : [];
if (!is_array($archive_header)) { $archive_header = []; }
get_template_part('partials/page-banner', null, [
    'banner' => $archive_header,
    'title' => (string) ($archive_header['banner_label'] ?? ''),
    'breadcrumb' => (string) ($archive_header['breadcrumb'] ?? ''),
    'breadcrumb_current' => (string) ($archive_header['banner_label'] ?? ''),
    'image_id' => (int) ($archive_header['banner'] ?? 0),
    'factory_section' => 'blog-archive-heading',
    'section_class' => 'c-page-banner--blog-archive',
]);
?>
<section class="c-blog-archive__list mt-40" data-factory-section="blog-post-list">
    <?php if (have_posts()) : ?><div class="c-blog-grid l-container gap-200">
        <?php while (have_posts()) : the_post(); get_template_part('partials/blog-card', null, ['post_id' => get_the_ID()]); endwhile; ?>
    </div><?php endif; ?>
</section>
<?php global $wp_query; ?>
<?php $links = paginate_links(['type' => 'list', 'total' => max(7, (int) $wp_query->max_num_pages), 'prev_text' => '', 'next_text' => '<span aria-hidden="true">→</span>', 'mid_size' => 5, 'end_size' => 1]); ?>
<?php if ($links) : ?><nav class="c-blog-pagination mt-18 mb-140" data-factory-section="blog-pagination" aria-label="Paginacja wpisów"><?php echo wp_kses_post($links); ?></nav><?php endif; ?>
<?php get_footer();
