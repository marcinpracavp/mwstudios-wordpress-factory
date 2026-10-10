<?php
if (cb_enabled()) { get_template_part('partials/cb/archive'); return; }
$query = $args['query'] ?? $GLOBALS['wp_query'];
$title = $args['title'] ?? (is_category() ? single_cat_title('', false) : (is_home() ? get_the_title(get_option('page_for_posts')) : get_the_archive_title()));
$title = $title ?: 'Wpisy';
if (is_search()) { $title = 'Wyniki wyszukiwania: ' . get_search_query(); }
?>
<header class="mwf-hero l-container py-50">
    <h1><?php echo esc_html($title); ?></h1>
    <?php if (has_nav_menu('archive')) : ?><nav aria-label="Kategorie wpisów"><?php wp_nav_menu(['theme_location' => 'archive', 'container' => false, 'fallback_cb' => false]); ?></nav><?php endif; ?>
    <?php if (get_the_archive_description()) : ?><div class="mwf-prose"><?php echo wp_kses_post(get_the_archive_description()); ?></div><?php endif; ?>
    <?php get_search_form(); ?>
</header>
<div class="l-container py-50">
    <?php if ($query->have_posts()) : ?>
    <div class="grid gap-200 gap-sm-0 row-gap-sm-200">
    <?php $i = 0; while ($query->have_posts()) : $query->the_post(); $col = 2 + ($i++ % 3) * 4;
        get_template_part('partials/blog-item', null, ['class' => 'gc-' . $col . '/' . ($col + 4) . ' gc-sm-2/14']);
    endwhile; ?>
    </div>
    <?php
    $links = paginate_links(['total' => $query->max_num_pages, 'current' => max(1, (int) get_query_var('paged'), (int) get_query_var('page')), 'mid_size' => 2, 'prev_text' => 'Poprzednia strona', 'next_text' => 'Następna strona', 'type' => 'list']);
    if ($links) : ?><nav class="navigation pagination" aria-label="Strony wpisów"><?php echo wp_kses_post($links); ?></nav><?php endif;
    wp_reset_postdata(); ?>
    <?php else : ?><p>Brak wpisów.</p><?php endif; ?>
</div>
