<?php
$s = (array) ($args['section'] ?? []);
$panels = [];
foreach ((array) ($s['categories'] ?? []) as $category) {
    $term = get_term(absint($category['term'] ?? 0), 'category');
    if (!$term || is_wp_error($term)) { continue; }
    $query = new WP_Query(['post_type' => 'post', 'cat' => $term->term_id, 'posts_per_page' => min(12, max(1, (int) ($s['count'] ?? 6))), 'no_found_rows' => true]);
    if (!$query->have_posts()) { continue; }
    ob_start(); ?>
    <div class="grid gap-200 gap-sm-0 row-gap-sm-200">
    <?php $i = 0; while ($query->have_posts()) : $query->the_post(); $col = 2 + ($i++ % 3) * 4;
        get_template_part('partials/blog-item', null, ['class' => 'gc-' . $col . '/' . ($col + 4) . ' gc-sm-2/14']);
    endwhile; ?>
    </div>
    <?php mwf_link($category['archive_link'] ?? null, 'mwf-button mt-30');
    $panels[] = ['title' => ($category['label'] ?? '') ?: $term->name, 'html' => ob_get_clean()];
    wp_reset_postdata();
}
get_template_part('partials/factory/tabs', null, ['panels' => $panels, 'label' => ($s['heading'] ?? '') ?: 'Wpisy']);
