<?php get_header(); while (have_posts()) : the_post(); ?>
<article class="mwf-single l-container py-50">
    <header class="mb-40">
        <h1><?php echo esc_html(get_the_title()); ?></h1>
        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date('d.m.Y')); ?></time>
    </header>
    <?php if (has_post_thumbnail()) : ?><figure class="mb-40">
        <?php the_post_thumbnail('full'); ?>
        <?php $caption = wp_get_attachment_caption(get_post_thumbnail_id()); if ($caption) : ?><figcaption><?php echo wp_kses_post($caption); ?></figcaption><?php endif; ?>
    </figure><?php endif; ?>
    <div class="mwf-prose"><?php the_content(); ?></div>
    <?php wp_link_pages(['before' => '<nav aria-label="Strony artykułu">', 'after' => '</nav>']); ?>
    <?php the_post_navigation(['prev_text' => 'Poprzedni wpis: %title', 'next_text' => 'Następny wpis: %title']); ?>
</article>
<?php endwhile; get_footer(); ?>
