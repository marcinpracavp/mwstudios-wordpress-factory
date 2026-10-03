<?php
/**
 * Source-shaped route shell used until a build group supplies its section
 * implementation. Each assigned section reads its source-backed native fields
 * and keeps the shell reusable across canonical routes.
 *
 * @var array $args
 */
$route_id = isset($args['route_id']) ? (string) $args['route_id'] : '';
$sections = isset($args['sections']) && is_array($args['sections']) ? $args['sections'] : [];
$is_product_list_route = $route_id === 'product-list';
$is_product_list_items_fragment = !empty($args['product_list_items_fragment']);
if ($is_product_list_route && !$is_product_list_items_fragment) {
    $product_list_sections = ['product-list-menu', 'product-list-filters', 'product-list-overview', 'product-list-items'];
    $sections = array_values(array_unique(array_merge(
        $product_list_sections,
        array_diff($sections, $product_list_sections)
    )));
}
$archive_header = isset($args['archive_header']) && is_array($args['archive_header']) ? $args['archive_header'] : [];
$archive_title = isset($args['archive_title']) ? trim((string) $args['archive_title']) : '';
$catalogues_banner = isset($args['catalogues_banner']) && is_array($args['catalogues_banner']) ? $args['catalogues_banner'] : [];
$option = static function (string $field) use ($route_id) {
    if ($route_id === 'home' && function_exists('emko_home_field')) {
        return emko_home_field($field);
    }

    if ($route_id === 'about' && function_exists('emko_about_field')) {
        return emko_about_field($field);
    }

    return function_exists('emko_option') ? emko_option($field) : null;
};
$product_list_overview_data = static function () use ($option): array {
    $term = function_exists('emko_current_product_category_term') ? emko_current_product_category_term() : null;
    $is_shop = function_exists('is_shop') && is_shop();
    $shop_page_id = $is_shop && function_exists('wc_get_page_id') ? (int) wc_get_page_id('shop') : 0;

    if ($term instanceof WP_Term) {
        return [
            'term' => $term,
            'title' => $term->name,
            'description' => term_description($term->term_id),
            'image_id' => (int) get_term_meta($term->term_id, 'thumbnail_id', true),
        ];
    }

    if ($shop_page_id > 0) {
        return [
            'term' => null,
            'title' => get_the_title($shop_page_id),
            'description' => (string) get_post_field('post_content', $shop_page_id),
            'image_id' => (int) get_post_thumbnail_id($shop_page_id),
        ];
    }

    return [
        'term' => null,
        'title' => trim((string) $option('emko_home_popular_products_category_1_125_632')),
        'description' => trim((string) $option('emko_product_detail_description_125_3431')),
        'image_id' => (int) $option('emko_product_detail_image_125_3212'),
    ];
};
$slider_image = static function (int $attachment_id, string $source_node, string $alt = ''): string {
    if (!$attachment_id) {
        return '';
    }

    $attributes = [
        'alt' => $alt,
        'loading' => false,
    ];
    if ($source_node !== '') {
        $attributes['data-factory-source-node'] = $source_node;
    }

    if (function_exists('emko_image')) {
        return emko_image($attachment_id, '', $attributes);
    }

    return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
};
?>
<div class="c-route-skeleton c-route-skeleton--<?php echo esc_attr($route_id); ?>" data-factory-component="route-skeleton" data-factory-route="<?php echo esc_attr($route_id); ?>">
    <?php foreach ($sections as $section_id) : ?>
        <?php if ($section_id === 'blog-archive') : ?>
            <?php
            // Do not use the core `paged` query variable here. This archive
            // has its own WP_Query; passing `paged` to the posts-page main
            // query can make WordPress return a 404 before this template runs.
            $archive_page = max(1, (int) get_query_var('blog_page'));
            $archive_page_id = (int) get_option('page_for_posts');
            $archive_base_url = $archive_page_id > 0 ? get_permalink($archive_page_id) : home_url('/');
            $archive_page_url = static function (int $page) use ($archive_base_url): string {
                $url = remove_query_arg('blog_page', $archive_base_url);
                return $page > 1 ? add_query_arg('blog_page', $page, $url) : $url;
            };
            $archive_query = new WP_Query([
                'post_type' => 'post',
                'post_status' => 'publish',
                'posts_per_page' => 9,
                'paged' => $archive_page,
                'ignore_sticky_posts' => true,
                // Technical metadata belongs only to imported demo cards.
                // Filtering by it excluded regular editorial posts and made
                // the archive appear to contain just nine entries.
                'orderby' => 'date',
                'order' => 'DESC',
            ]);
            $archive_source_nodes = [
                1 => ['image' => '125:1919', 'title' => '125:1920', 'excerpt' => '125:1921', 'date' => '125:1922'],
                2 => ['image' => '125:1924', 'title' => '125:1925', 'excerpt' => '125:1926', 'date' => '125:1927'],
                3 => ['image' => '125:1929', 'title' => '125:1930', 'excerpt' => '125:1931', 'date' => '125:1932'],
                4 => ['image' => '125:1935', 'title' => '125:1936', 'excerpt' => '125:1937', 'date' => '125:1938'],
                5 => ['image' => '125:1940', 'title' => '125:1941', 'excerpt' => '125:1942', 'date' => '125:1943'],
                6 => ['image' => '125:1945', 'title' => '125:1946', 'excerpt' => '125:1947', 'date' => '125:1948'],
                7 => ['image' => '125:1951', 'title' => '125:1952', 'excerpt' => '125:1953', 'date' => '125:1954'],
                8 => ['image' => '125:1956', 'title' => '125:1957', 'excerpt' => '125:1958', 'date' => '125:1959'],
                9 => ['image' => '125:1961', 'title' => '125:1962', 'excerpt' => '125:1963', 'date' => '125:1964'],
            ];
            ?>
            <section class="c-blog-archive l-container" data-factory-section="blog-archive" data-factory-component="route-section-shell">
                <?php get_template_part('partials/page-banner', null, [
                    'banner' => $archive_header,
                    'title' => $archive_title !== '' ? $archive_title : 'Blog',
                    'image_id' => (int) ($archive_header['banner'] ?? 0),
                    'variant' => 'blog-archive',
                    'title_tag' => 'h1',
                    'is_fragment' => true,
                ]); ?>
                <div class="c-blog-grid c-blog-grid--archive l-container">
                    <?php while ($archive_query->have_posts()) : $archive_query->the_post(); ?>
                        <?php
                        $identity = (string) get_post_meta(get_the_ID(), '_emko_blog_card_identity', true);
                        $card_index = 0;
                        if (preg_match('/^blog-archive-card-([1-9])(?:-|$)/', $identity, $matches)) {
                            $card_index = (int) $matches[1];
                        }
                        $source_nodes = $archive_source_nodes[$card_index] ?? [];
                        $image_source_node = (string) ($source_nodes['image'] ?? get_post_meta((int) get_field('emko_blog_card_image', get_the_ID()), 'data-factory-source-node', true));
                        get_template_part('partials/blog-card', null, [
                            'post_id' => get_the_ID(),
                            'heading_tag' => 'h2',
                            'variant' => 'archive',
                            'show_excerpt' => true,
                            'excerpt_from_content' => true,
                            'loading' => $archive_page === 1 && $archive_query->current_post < 3 ? 'eager' : 'lazy',
                            'source_node' => $image_source_node,
                            'source_nodes' => [
                                'title' => $source_nodes['title'] ?? '',
                                'excerpt' => $source_nodes['excerpt'] ?? '',
                                'date' => $source_nodes['date'] ?? '',
                            ],
                        ]);
                        ?>
                    <?php endwhile; ?>
                </div>
                <?php if ($archive_query->max_num_pages > 1) : ?>
                    <?php
                    $archive_total_pages = (int) $archive_query->max_num_pages;
                    $archive_pages = $archive_total_pages <= 5
                        ? range(1, $archive_total_pages)
                        : array_values(array_unique([1, 2, 3, 4, $archive_total_pages]));
                    ?>
                    <nav class="c-blog-archive__pagination l-container" aria-label="Blog pagination">
                        <ul class="page-numbers">
                            <li><?php if ($archive_page > 1) : ?><a class="page-numbers prev" href="<?php echo esc_url($archive_page_url($archive_page - 1)); ?>" aria-label="Previous page">‹</a><?php else : ?><span class="page-numbers prev" aria-disabled="true">‹</span><?php endif; ?></li>
                            <li><?php if ($archive_page > 1) : ?><a class="page-numbers first" href="<?php echo esc_url($archive_page_url(1)); ?>" aria-label="First page">«</a><?php else : ?><span class="page-numbers first" aria-disabled="true">«</span><?php endif; ?></li>
                            <?php $archive_previous_page = 0; ?>
                            <?php foreach ($archive_pages as $archive_page_number) : ?>
                                <?php if ($archive_previous_page && $archive_page_number > $archive_previous_page + 1) : ?><li><span class="page-numbers dots">…</span></li><?php endif; ?>
                                <li><?php if ($archive_page_number === $archive_page) : ?><span class="page-numbers current" aria-current="page"><?php echo esc_html((string) $archive_page_number); ?></span><?php else : ?><a class="page-numbers" href="<?php echo esc_url($archive_page_url($archive_page_number)); ?>"><?php echo esc_html((string) $archive_page_number); ?></a><?php endif; ?></li>
                                <?php $archive_previous_page = $archive_page_number; ?>
                            <?php endforeach; ?>
                            <li><?php if ($archive_page < $archive_total_pages) : ?><a class="page-numbers last" href="<?php echo esc_url($archive_page_url($archive_total_pages)); ?>" aria-label="Last page">»</a><?php else : ?><span class="page-numbers last" aria-disabled="true">»</span><?php endif; ?></li>
                            <li><?php if ($archive_page < $archive_total_pages) : ?><a class="page-numbers next" href="<?php echo esc_url($archive_page_url($archive_page + 1)); ?>" aria-label="Next page">›</a><?php else : ?><span class="page-numbers next" aria-disabled="true">›</span><?php endif; ?></li>
                        </ul>
                    </nav>
                <?php endif; ?>
            </section>
            <?php wp_reset_postdata(); ?>
        <?php elseif ($section_id === 'home-slider') : ?>
            <?php
            $slides = $option('emko_home_slider_slides');
            $slides = is_array($slides) ? array_values(array_filter($slides, static function ($slide): bool {
                return is_array($slide) && (!empty($slide['content']) || !empty($slide['image']) || !empty($slide['button']));
            })) : [];
            if (!$slides) {
                $legacy_heading = trim((string) $option('emko_home_slider_heading_125_625'));
                $legacy_image_id = (int) $option('emko_home_slider_product_composition_125_627');
                $legacy_button_label = trim((string) $option('emko_home_slider_button_label_125_623'));
                $legacy_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', str_replace(["\\r\\n", "\\n", "\\r"], "\n", $legacy_heading)))));

                if ($legacy_lines || $legacy_image_id || $legacy_button_label !== '') {
                    $legacy_first_line = $legacy_lines ? '<strong>' . esc_html(array_shift($legacy_lines)) . '</strong>' : '';
                    $product_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('product') : false;
                    $product_url = $product_url ?: home_url('/produkty/');
                    $slides[] = [
                        'content' => $legacy_first_line !== '' ? '<h1>' . $legacy_first_line . ($legacy_lines ? '<br><span>' . implode('<br>', array_map('esc_html', $legacy_lines)) . '</span>' : '') . '</h1>' : '',
                        'button' => $legacy_button_label !== '' ? [
                            'title' => $legacy_button_label,
                            'url' => $product_url,
                            'target' => '',
                        ] : null,
                        'image' => $legacy_image_id,
                    ];
                }
            }
            $arrow_id = (int) $option('emko_home_slider_button_arrow_125_624');
            ?>
            <?php if ($slides) : ?>
            <section class="c-home-slider" data-factory-section="home-slider" data-factory-component="route-section" data-home-slider aria-roledescription="carousel" aria-label="Slider">
                <div class="c-home-slider__background" aria-hidden="true">
                    <div class="c-home-slider__decoration c-home-slider__decoration--left"></div>
                    <div class="c-home-slider__decoration c-home-slider__decoration--right"></div>
                </div>
                <div class="c-home-slider__swiper swiper">
                    <div class="swiper-wrapper">
                        <?php foreach ($slides as $index => $slide) : ?>
                            <?php
                            $content = (string) ($slide['content'] ?? '');
                            $button = isset($slide['button']) && is_array($slide['button']) ? $slide['button'] : [];
                            $image_id = (int) ($slide['image'] ?? 0);
                            $button_url = !empty($button['url']) ? $button['url'] : '';
                            $button_title = trim((string) ($button['title'] ?? ''));
                            $button_target = !empty($button['target']) ? $button['target'] : '_self';
                            ?>
                            <article class="c-home-slider__slide swiper-slide" aria-label="Slajd <?php echo esc_attr((string) ($index + 1)); ?> z <?php echo esc_attr((string) count($slides)); ?>">
                                <div class="c-home-slider__inner l-container">
                                    <div class="c-home-slider__content" data-home-slider-content<?php echo $index === 0 ? ' data-factory-source-node="125:625"' : ''; ?>>
                                        <?php if ($content !== '') : ?>
                                            <div class="c-home-slider__content-wysiwyg"><?php echo wp_kses_post($content); ?></div>
                                        <?php endif; ?>
                                        <?php if ($button_url !== '' && $button_title !== '') : ?>
                                            <a class="c-home-slider__button" href="<?php echo esc_url($button_url); ?>" target="<?php echo esc_attr($button_target); ?>"<?php echo $button_target === '_blank' ? ' rel="noopener noreferrer"' : ''; ?>>
                                                <span<?php echo $index === 0 ? ' data-factory-source-node="125:623"' : ''; ?>><?php echo esc_html($button_title); ?></span>
                                                <?php echo $slider_image($arrow_id, '125:624'); ?>
                                            </a>
                                        <?php endif; ?>
                                    </div>
                                    <?php if ($image_id) : ?>
                                        <div class="c-home-slider__media" data-home-slider-media>
                                            <?php echo $slider_image($image_id, $index === 0 ? '125:627' : '', wp_strip_all_tags($content)); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="c-home-slider__transition" aria-hidden="true">
                    <?php foreach (range(0, 2) as $tile_row) : ?>
                        <?php foreach (range(0, 3) as $tile_column) : ?>
                            <div class="c-home-slider__transition-tile" style="--tile-column: <?php echo esc_attr((string) $tile_column); ?>; --tile-row: <?php echo esc_attr((string) $tile_row); ?>; --tile-delay: <?php echo esc_attr((string) (($tile_row + $tile_column) * 70)); ?>ms;">
                                <div class="c-home-slider__transition-snapshot"></div>
                            </div>
                        <?php endforeach; ?>
                    <?php endforeach; ?>
                </div>

                <?php if (count($slides) > 1) : ?>
                    <div class="c-home-slider__pagination" role="tablist" aria-label="Wybór slajdu">
                        <?php foreach ($slides as $index => $slide) : ?>
                            <button class="c-home-slider__pagination-button<?php echo $index === 0 ? ' is-active' : ''; ?>" type="button" role="tab" aria-label="Slajd <?php echo esc_attr((string) ($index + 1)); ?>" aria-selected="<?php echo $index === 0 ? 'true' : 'false'; ?>" data-home-slider-slide="<?php echo esc_attr((string) $index); ?>"></button>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>
            <?php endif; ?>
        <?php elseif ($section_id === 'home-product-categories') : ?>
            <?php
            $category_items = $option('emko_home_product_categories');
            $using_legacy_items = !is_array($category_items) || !$category_items;
            if ($using_legacy_items && function_exists('emko_home_legacy_product_category_items')) {
                $category_items = emko_home_legacy_product_category_items();
            }
            ?>
            <section class="c-home-product-categories l-container" data-factory-section="home-product-categories" data-factory-component="category-card-grid">
                <div class="c-home-product-categories__grid">
                    <?php foreach ($category_items as $category_index => $category_item) : ?>
                        <?php
                        $link = !$using_legacy_items && isset($category_item['link']) && is_array($category_item['link']) ? $category_item['link'] : [];
                        $legacy_label = $using_legacy_items && !empty($category_item['label_field']) ? trim((string) $option($category_item['label_field'])) : trim((string) ($category_item['label'] ?? ''));
                        $label = trim((string) ($link['title'] ?? '')) ?: $legacy_label;
                        $image_id = $using_legacy_items && !empty($category_item['image_field']) ? (int) $option($category_item['image_field']) : (int) ($category_item['image'] ?? 0);
                        $label_node = $using_legacy_items ? (string) ($category_item['label_node'] ?? '') : '';
                        $image_node = $using_legacy_items ? (string) ($category_item['image_node'] ?? '') : '';
                        $category_url = esc_url((string) ($link['url'] ?? ''));
                        $category_target = (string) ($link['target'] ?? '');
                        $background = in_array($category_item['background'] ?? '', ['white', 'gray'], true) ? $category_item['background'] : (function_exists('emko_home_product_category_background_for_index') ? emko_home_product_category_background_for_index((int) $category_index) : 'white');
                        ?>
                        <<?php echo $category_url !== '' ? 'a' : 'article'; ?> class="c-home-product-categories__card c-home-product-categories__card--<?php echo esc_attr($background); ?>" data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) (min($category_index, 8) * 45)); ?>"<?php echo $category_url !== '' ? ' href="' . $category_url . '"' : ''; ?><?php echo $category_url !== '' && $category_target !== '' ? ' target="' . esc_attr($category_target) . '"' : ''; ?><?php echo $category_url !== '' && $category_target === '_blank' ? ' rel="noopener noreferrer"' : ''; ?><?php echo $label_node !== '' ? ' data-factory-source-node="' . esc_attr($label_node) . '"' : ''; ?>>
                            <div class="c-home-product-categories__media">
                                <?php if ($image_id) : ?>
                                    <?php echo $slider_image($image_id, $image_node, $label); ?>
                                <?php endif; ?>
                            </div>
                            <?php if ($label !== '') : ?><p class="c-home-product-categories__label"><?php echo esc_html($label); ?></p><?php endif; ?>
                        </<?php echo $category_url !== '' ? 'a' : 'article'; ?>>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'home-popular-products') : ?>
            <?php
            $popular_option = static function (string $field) use ($option) {
                $value = $option($field);
                if ($value === null || $value === '') {
                    $value = get_option('options_' . $field, '');
                }
                return $value;
            };
            $popular_image = static function (int $attachment_id, string $source_node, string $alt = ''): string {
                if (!$attachment_id) {
                    return '';
                }

                $attributes = [
                    'alt' => $alt,
                    'loading' => false,
                    'data-factory-source-node' => $source_node,
                ];

                if (function_exists('emko_image')) {
                    return emko_image($attachment_id, '', $attributes);
                }

                return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
            };
            $product_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('product') : false;
            $product_url = $product_url ?: home_url('/produkty/');
            $card_arrow_id = (int) $popular_option('emko_home_popular_products_card_arrow_125_695');
            $category_arrow_id = (int) $popular_option('emko_home_popular_products_category_arrow_125_634');
            $all_arrow_id = (int) $popular_option('emko_home_popular_products_all_arrow_125_679');
            $popular_groups = [];
            foreach ((array) $popular_option('emko_home_popular_products') as $group) {
                if (!is_array($group)) {
                    continue;
                }

                $category = $group['category'] ?? null;
                if (!$category instanceof WP_Term) {
                    $category = is_numeric($category) ? get_term((int) $category, 'product_cat') : null;
                }
                if (!$category instanceof WP_Term || $category->taxonomy !== 'product_cat') {
                    continue;
                }

                $products = array_values(array_filter(array_map('intval', (array) ($group['products'] ?? [])), static function (int $product_id): bool {
                    return $product_id > 0 && get_post_type($product_id) === 'product' && get_post_status($product_id) === 'publish';
                }));
                if (!$products) {
                    continue;
                }

                $category_link = get_term_link($category);
                $popular_groups[] = [
                    'category' => $category,
                    'url' => is_wp_error($category_link) ? $product_url : $category_link,
                    'products' => array_slice($products, 0, 4),
                ];
            }
            ?>
            <section class="c-home-popular-products l-container" data-factory-section="home-popular-products" data-factory-component="route-section" data-active-category="2">
                <header class="c-home-popular-products__header" data-aos="fade-up">
                    <h2 class="c-home-popular-products__heading" data-factory-source-node="125:674"><?php echo emko_wysiwyg_heading($popular_option('emko_home_popular_products_heading_125_674')); ?></h2>
                    <div class="c-home-popular-products__intro c-wysiwyg" data-factory-source-node="125:675"><?php echo emko_wysiwyg_content($popular_option('emko_home_popular_products_intro_125_675')); ?></div>
                    <a class="c-home-popular-products__all" href="<?php echo esc_url($product_url); ?>" data-factory-source-node="125:676">
                        <span data-factory-source-node="125:677"><?php echo esc_html((string) $popular_option('emko_home_popular_products_all_label_125_677')); ?></span>
                        <?php echo $popular_image($all_arrow_id, '125:679'); ?>
                    </a>
                </header>

                <?php if ($popular_groups) : ?>
                    <div class="c-home-popular-products__panel">
                        <nav class="c-home-popular-products__categories" aria-label="Kategorie popularnych produktów" role="tablist" data-aos="fade-right" data-aos-delay="80">
                            <?php foreach ($popular_groups as $index => $group) : ?>
                                <?php $panel_id = 'home-popular-products-panel-' . $index; ?>
                                <button class="c-home-popular-products__category<?php echo $index === 0 ? ' is-active' : ''; ?>" type="button" role="tab" aria-controls="<?php echo esc_attr($panel_id); ?>" aria-selected="<?php echo $index === 0 ? 'true' : 'false'; ?>" tabindex="<?php echo $index === 0 ? '0' : '-1'; ?>" data-home-popular-category="<?php echo esc_attr((string) $index); ?>">
                                    <span><?php echo esc_html($group['category']->name); ?></span>
                                    <?php echo $popular_image($category_arrow_id, '125:634'); ?>
                                </button>
                            <?php endforeach; ?>
                        </nav>

                        <div class="c-home-popular-products__products">
                            <?php foreach ($popular_groups as $index => $group) : ?>
                                <?php $panel_id = 'home-popular-products-panel-' . $index; ?>
                                <section class="c-home-popular-products__grid" id="<?php echo esc_attr($panel_id); ?>" role="tabpanel" aria-label="<?php echo esc_attr($group['category']->name); ?>" data-home-popular-products-panel="<?php echo esc_attr((string) $index); ?>"<?php echo $index === 0 ? '' : ' hidden'; ?>>
                                    <?php foreach ($group['products'] as $product_index => $product_id) : ?>
                                        <?php
                                        $title = get_the_title($product_id);
                                        $permalink = get_permalink($product_id);
                                        $short_description = trim((string) get_post_field('post_excerpt', $product_id));
                                        if ($short_description === '' && function_exists('get_field')) {
                                            $short_description = (string) get_field('emko_product_description', $product_id);
                                        }
                                        $short_description_allowed_html = wp_kses_allowed_html('post');
                                        unset($short_description_allowed_html['a']);
                                        $short_description = $short_description !== '' ? wp_kses(wpautop($short_description), $short_description_allowed_html) : '';
                                        $image_id = (int) get_post_thumbnail_id($product_id);
                                        ?>
                                        <article class="c-home-popular-products__card c-home-popular-products__card--linked"<?php if ($index === 0) : ?> data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) ($product_index * 70)); ?>"<?php endif; ?>>
                                            <a class="c-home-popular-products__card-area" href="<?php echo esc_url($permalink); ?>" aria-label="<?php echo esc_attr(sprintf('Zobacz produkt: %s', $title)); ?>">
                                                <div class="c-home-popular-products__media">
                                                    <?php echo $popular_image($image_id, '', $title); ?>
                                                </div>
                                                <div class="c-home-popular-products__card-content">
                                                    <h3><?php echo esc_html($title); ?></h3>
                                                    <?php if ($short_description !== '') : ?><div class="c-home-popular-products__short-description"><?php echo $short_description; ?></div><?php endif; ?>
                                                </div>
                                                <?php if ($card_arrow_id) : ?><span class="c-home-popular-products__card-arrow" aria-hidden="true"><?php echo $popular_image($card_arrow_id, '125:695', ''); ?></span><?php endif; ?>
                                            </a>
                                        </article>
                                    <?php endforeach; ?>
                                </section>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php else : ?>
                    <?php
                    $categories = [
                        ['container_node' => '125:631', 'node' => '125:632', 'field' => 'emko_home_popular_products_category_1_125_632'],
                        ['container_node' => '125:636', 'node' => '125:638', 'field' => 'emko_home_popular_products_category_2_125_638'],
                        ['container_node' => '125:642', 'node' => '125:644', 'field' => 'emko_home_popular_products_category_3_125_644'],
                        ['container_node' => '125:648', 'node' => '125:650', 'field' => 'emko_home_popular_products_category_4_125_650'],
                        ['container_node' => '125:654', 'node' => '125:656', 'field' => 'emko_home_popular_products_category_5_125_656'],
                        ['container_node' => '125:660', 'node' => '125:662', 'field' => 'emko_home_popular_products_category_6_125_662'],
                        ['container_node' => '125:666', 'node' => '125:667', 'field' => 'emko_home_popular_products_category_7_125_667'],
                    ];
                    $cards = [
                        ['title' => 'emko_home_popular_products_card_1_title_125_683', 'title_node' => '125:683', 'details' => 'emko_home_popular_products_card_1_details_125_688', 'image' => 'emko_home_popular_products_card_1_image_125_673', 'image_node' => '125:673'],
                        ['title' => 'emko_home_popular_products_card_2_title_125_684', 'title_node' => '125:684', 'details' => 'emko_home_popular_products_card_2_details_125_689', 'image' => 'emko_home_popular_products_card_2_image_125_671', 'image_node' => '125:671'],
                        ['title' => 'emko_home_popular_products_card_3_title_125_685', 'title_node' => '125:685', 'details' => 'emko_home_popular_products_card_3_details_125_690', 'image' => 'emko_home_popular_products_card_3_image_125_686', 'image_node' => '125:686'],
                        ['title' => 'emko_home_popular_products_card_4_title_125_687', 'title_node' => '125:687', 'details' => 'emko_home_popular_products_card_4_details_125_691', 'image' => 'emko_home_popular_products_card_4_image_125_672', 'image_node' => '125:672'],
                    ];
                    ?>
                    <div class="c-home-popular-products__panel">
                        <nav class="c-home-popular-products__categories" aria-label="Kategorie popularnych produktów" data-aos="fade-right" data-aos-delay="80">
                            <?php foreach ($categories as $index => $category) : ?>
                                <?php $label = trim((string) $popular_option($category['field'])); ?>
                                <?php if ($label === '') { continue; } ?>
                                <button class="c-home-popular-products__category<?php echo $index === 2 ? ' is-active' : ''; ?>" type="button" aria-selected="<?php echo $index === 2 ? 'true' : 'false'; ?>" data-home-popular-category="<?php echo esc_attr((string) $index); ?>" data-factory-source-node="<?php echo esc_attr($category['container_node']); ?>">
                                    <span data-factory-source-node="<?php echo esc_attr($category['node']); ?>"><?php echo esc_html($label); ?></span>
                                    <?php echo $popular_image($category_arrow_id, '125:634'); ?>
                                </button>
                            <?php endforeach; ?>
                        </nav>
                        <div class="c-home-popular-products__grid">
                            <?php foreach ($cards as $card_index => $card) : ?>
                                <?php
                                $title = (string) $popular_option($card['title']);
                                $details = (string) $popular_option($card['details']);
                                $image_id = (int) $popular_option($card['image']);
                                $detail_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $details)), static fn ($line) => $line !== ''));
                                $description = array_shift($detail_lines) ?: '';
                                ?>
                                <article class="c-home-popular-products__card" data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) ($card_index * 70)); ?>">
                                    <div class="c-home-popular-products__media"><?php echo $popular_image($image_id, $card['image_node'], $title); ?></div>
                                    <div class="c-home-popular-products__card-content">
                                        <h3 data-factory-source-node="<?php echo esc_attr($card['title_node']); ?>"><?php echo esc_html($title); ?></h3>
                                        <p>
                                            <span class="c-home-popular-products__description"><?php echo esc_html($description); ?></span>
                                            <?php if ($detail_lines) : ?>
                                                <span class="c-home-popular-products__detail-break" aria-hidden="true"></span>
                                                <?php foreach ($detail_lines as $detail_line) : ?>
                                                    <?php $detail_parts = array_map('trim', explode(':', $detail_line, 2)); ?>
                                                    <span class="c-home-popular-products__detail-line">
                                                        <?php if (count($detail_parts) === 2) : ?><span class="c-home-popular-products__detail-label"><?php echo esc_html($detail_parts[0]); ?>:</span> <?php endif; ?><?php echo esc_html(count($detail_parts) === 2 ? $detail_parts[1] : $detail_parts[0]); ?>
                                                    </span>
                                                <?php endforeach; ?>
                                            <?php endif; ?>
                                        </p>
                                    </div>
                                    <?php echo $popular_image($card_arrow_id, '125:695', ''); ?>
                                </article>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </section>
        <?php elseif ($section_id === 'home-intro') : ?>
            <?php
            $intro_heading = trim((string) $option('emko_home_intro_heading_125_1310'));
            $intro_body = (string) $option('emko_home_intro_body_125_1309');
            $intro_body = preg_replace('/<p>[\s\p{Cf}]*<\/p>/u', '', $intro_body);
            $intro_image_id = (int) $option('emko_home_intro_service_photo_125_1307');
            $intro_mask_id = (int) $option('emko_home_intro_mask_125_714');
            $intro_left_id = (int) $option('emko_home_intro_decorative_left_125_716');
            $intro_right_id = (int) $option('emko_home_intro_decorative_right_125_1011');
            ?>
            <section class="c-home-intro" data-factory-section="home-intro" data-factory-component="route-section-shell">
                <div class="c-home-intro__inner l-container">
                    <div class="c-home-intro__content" data-aos="fade-right">
                        <?php if ($intro_heading !== '') : ?>
                            <h2 class="c-home-intro__heading" data-factory-source-node="125:1310"><?php echo emko_wysiwyg_heading($intro_heading); ?></h2>
                        <?php endif; ?>
                        <?php if ($intro_body !== '') : ?>
                            <div class="c-home-intro__body" data-factory-source-node="125:1309"><?php echo wp_kses_post($intro_body); ?></div>
                        <?php endif; ?>
                    </div>

                    <?php if ($intro_image_id || $intro_mask_id) : ?>
                        <div class="c-home-intro__media" data-aos="fade-left" data-aos-delay="100">
                            <?php echo $slider_image($intro_image_id, '125:1307', $intro_heading); ?>
                            <?php echo $slider_image($intro_mask_id, '125:714', ''); ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($intro_left_id) : ?>
                        <div class="c-home-intro__decoration c-home-intro__decoration--left" aria-hidden="true">
                            <?php echo $slider_image($intro_left_id, '125:716', ''); ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($intro_right_id) : ?>
                        <div class="c-home-intro__decoration c-home-intro__decoration--right" aria-hidden="true">
                            <?php echo $slider_image($intro_right_id, '125:1011', ''); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'home-benefits') : ?>
            <?php
            $benefits_heading = trim((string) $option('emko_home_benefits_heading_125_1624'));
            $benefits_heading = emko_wysiwyg_heading($benefits_heading);
            $benefits_heading = str_replace(["\\r\\n", "\\n", "\\r"], "\n", $benefits_heading);
            $benefits_heading_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $benefits_heading))));
            $benefits_body = (string) $option('emko_home_benefits_body_125_1612');
            $benefits_body = preg_replace('/<p>[\s\p{Cf}]*<\/p>/u', '<p class="c-home-benefits__spacer"></p>', $benefits_body);
            $benefits = is_array($option('emko_home_benefits_metrics')) ? $option('emko_home_benefits_metrics') : [];
            $benefits = array_values(array_filter(array_map(static function ($benefit): array {
                $benefit = is_array($benefit) ? $benefit : [];

                return [
                    'value' => trim((string) ($benefit['value'] ?? '')),
                    'prefix' => trim((string) ($benefit['prefix'] ?? '')),
                    'unit' => trim((string) ($benefit['unit'] ?? '')),
                    'label' => trim((string) ($benefit['label'] ?? '')),
                ];
            }, $benefits), static function (array $benefit): bool {
                return (bool) array_filter($benefit, static fn (string $value): bool => $value !== '');
            }));
            if (!$benefits) {
                $legacy_benefit_fields = [
                    ['value' => 'emko_home_benefits_metric_1_value_125_1625', 'prefix' => '', 'unit' => 'emko_home_benefits_metric_1_unit_125_1614', 'label' => 'emko_home_benefits_metric_1_label_125_1613'],
                    ['value' => 'emko_home_benefits_metric_2_value_125_1626', 'prefix' => 'emko_home_benefits_metric_2_prefix_125_1618', 'unit' => 'emko_home_benefits_metric_2_unit_125_1615', 'label' => 'emko_home_benefits_metric_2_label_125_1623'],
                    ['value' => 'emko_home_benefits_metric_3_value_125_1627', 'prefix' => 'emko_home_benefits_metric_3_prefix_125_1619', 'unit' => 'emko_home_benefits_metric_3_unit_125_1616', 'label' => 'emko_home_benefits_metric_3_label_125_1621'],
                    ['value' => 'emko_home_benefits_metric_4_value_125_1628', 'prefix' => 'emko_home_benefits_metric_4_prefix_125_1620', 'unit' => 'emko_home_benefits_metric_4_unit_125_1617', 'label' => 'emko_home_benefits_metric_4_label_125_1622'],
                ];
                foreach ($legacy_benefit_fields as $legacy_benefit) {
                    $benefit = [];
                    foreach ($legacy_benefit as $key => $field_name) {
                        $benefit[$key] = $field_name !== '' ? trim((string) $option($field_name)) : '';
                    }
                    if (array_filter($benefit, static fn (string $value): bool => $value !== '')) {
                        $benefits[] = $benefit;
                    }
                }
            }
            $benefits_decorative_id = (int) $option('emko_home_benefits_decorative_layer_125_1313');
            $legacy_benefit_circle_fields = [
                ['field' => 'emko_home_benefits_metric_ellipse_125_1608', 'source_node' => '125:1608'],
                ['field' => 'emko_home_benefits_metric_ellipse_125_1611', 'source_node' => '125:1611'],
                ['field' => 'emko_home_benefits_metric_ellipse_125_1609', 'source_node' => '125:1609'],
                ['field' => 'emko_home_benefits_metric_ellipse_125_1610', 'source_node' => '125:1610'],
            ];
            ?>
            <section class="c-home-benefits l-container" data-factory-section="home-benefits" data-factory-component="route-section-shell">
                <div class="c-home-benefits__inner">
                    <?php if ($benefits_heading_lines) : ?>
                        <h2 class="c-home-benefits__heading" data-aos="fade-up" data-factory-source-node="125:1624">
                            <?php foreach ($benefits_heading_lines as $index => $line) : ?>
                                <span class="c-home-benefits__heading-line<?php echo $index === 0 ? ' c-home-benefits__heading-line--emphasis' : ''; ?>"><?php echo wp_kses_post($line); ?></span>
                            <?php endforeach; ?>
                        </h2>
                    <?php endif; ?>

                    <div class="c-home-benefits__metrics">
                        <?php foreach ($benefits as $index => $benefit) : ?>
                            <?php
                            $has_prefix = $benefit['prefix'] !== '';
                            $has_value = $benefit['value'] !== '';
                            $has_unit = $benefit['unit'] !== '';
                            $circle_field = $legacy_benefit_circle_fields[$index] ?? [];
                            $circle_id = !empty($circle_field['field']) ? (int) $option($circle_field['field']) : 0;
                            ?>
                            <article class="c-home-benefits__metric" data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) ($index * 100)); ?>">
                                <div class="c-home-benefits__circle<?php echo $circle_id ? ' c-home-benefits__circle--has-media' : ''; ?>">
                                    <?php if ($circle_id) : ?>
                                        <?php echo $slider_image($circle_id, (string) ($circle_field['source_node'] ?? '')); ?>
                                    <?php endif; ?>
                                    <div class="c-home-benefits__stat<?php echo $has_value ? ' c-home-benefits__stat--has-value' : ''; ?><?php echo $has_prefix ? ' c-home-benefits__stat--has-prefix' : ''; ?><?php echo $has_unit ? ' c-home-benefits__stat--has-unit' : ''; ?>">
                                        <?php if ($has_prefix) : ?><span class="c-home-benefits__prefix"><?php echo esc_html($benefit['prefix']); ?></span><?php endif; ?>
                                        <?php if ($has_value) : ?><strong class="c-home-benefits__value"><?php echo esc_html($benefit['value']); ?></strong><?php endif; ?>
                                        <?php if ($has_unit) : ?><span class="c-home-benefits__unit"><?php echo esc_html($benefit['unit']); ?></span><?php endif; ?>
                                    </div>
                                </div>
                                <?php if ($benefit['label'] !== '') : ?><div class="c-home-benefits__label c-wysiwyg"><?php echo wp_kses_post($benefit['label']); ?></div><?php endif; ?>
                            </article>
                        <?php endforeach; ?>
                    </div>

                    <?php if ($benefits_decorative_id) : ?>
                        <div class="c-home-benefits__decoration" aria-hidden="true">
                            <?php echo $slider_image($benefits_decorative_id, '125:1313'); ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($benefits_body !== '') : ?>
                        <div class="c-home-benefits__body" data-aos="fade-up" data-aos-delay="120" data-factory-source-node="125:1612"><?php echo wp_kses_post($benefits_body); ?></div>
                    <?php endif; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'home-blog') : ?>
            <?php
            $blog_heading = trim((string) $option('emko_home_blog_heading_125_1652'));
            $blog_intro = trim((string) $option('emko_home_blog_intro_125_1653'));
            $blog_all_label = trim((string) $option('emko_home_blog_all_label_125_1655'));
            $blog_all_arrow_id = (int) $option('emko_home_blog_all_arrow_125_1657');
            $blog_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('post') : false;
            $blog_url = $blog_url ?: home_url('/blog/');
            $blog_posts = get_posts([
                'post_type' => 'post',
                'post_status' => 'publish',
                'posts_per_page' => 4,
                'ignore_sticky_posts' => true,
                'orderby' => 'date',
                'order' => 'DESC',
            ]);
            ?>
            <section class="c-home-blog l-container" data-factory-section="home-blog" data-factory-component="route-section-shell">
                <header class="c-home-blog__header" data-aos="fade-up">
                    <?php if ($blog_heading !== '') : ?><h2 class="c-home-blog__heading" data-factory-source-node="125:1652"><?php echo emko_wysiwyg_heading($blog_heading); ?></h2><?php endif; ?>
                    <?php if ($blog_intro !== '') : ?><div class="c-home-blog__intro c-wysiwyg" data-factory-source-node="125:1653"><?php echo emko_wysiwyg_content($blog_intro); ?></div><?php endif; ?>
                    <?php if ($blog_all_label !== '') : ?>
                        <a class="c-home-blog__all-link" href="<?php echo esc_url($blog_url); ?>">
                            <span data-factory-source-node="125:1655"><?php echo esc_html($blog_all_label); ?></span>
                            <?php echo $blog_all_arrow_id ? $slider_image($blog_all_arrow_id, '125:1657') : '<span aria-hidden="true">→</span>'; ?>
                        </a>
                    <?php endif; ?>
                </header>
                <div class="c-blog-grid c-blog-grid--home">
                    <?php foreach ($blog_posts as $post_index => $post_id) : ?>
                        <?php $post_id = is_object($post_id) ? (int) $post_id->ID : (int) $post_id; if (!$post_id) { continue; } ?>
                        <?php get_template_part('partials/blog-card', null, [
                            'post_id' => $post_id,
                            'heading_tag' => 'h3',
                            'variant' => 'home',
                            'show_excerpt' => true,
                            'excerpt_from_content' => true,
                            'loading' => 'eager',
                            'aos' => 'fade-up',
                            'aos_delay' => $post_index * 80,
                        ]); ?>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'home-faq') : ?>
            <?php
            $faq_value = static function (string $field, string $fallback) use ($option): string {
                $value = trim((string) $option($field));
                return $value !== '' ? $value : $fallback;
            };
            $faq_items = $option('emko_home_faq_items');
            if (!is_array($faq_items) || !$faq_items) {
                $faq_items = [
                [
                    'question' => $faq_value('emko_home_faq_item_1_question_125_1665', 'Nunc maximus lectus quis ligula ornare sagittis ?'),
                    'answer' => '',
                    'source_node' => '125:1665',
                ],
                [
                    'question' => $faq_value('emko_home_faq_item_2_question_125_1666', 'Mauris ante metus, posuere vitae porttitor non, dictum a ligula ?'),
                    'answer' => '',
                    'source_node' => '125:1666',
                ],
                [
                    'question' => $faq_value('emko_home_faq_item_3_question_125_1667', 'Nam in velit id sapien mattis fermentum et eget nulla ?'),
                    'answer' => $faq_value('emko_home_faq_item_3_answer_125_1667', 'Vivamus arcu erat, hendrerit non eleifend at, dictum eu nisl. Donec sodales tincidunt purus, vitae aliquam nibh venenatis eget. Ut vel pellentesque lacus. Mauris risus massa, tempor at ante sit amet, laoreet cursus sapien.Donec sodales tincidunt purus, vitae aliquam nibh venenatis eget.'),
                    'source_node' => '125:1667',
                ],
                [
                    'question' => $faq_value('emko_home_faq_item_4_question_125_1668', 'Donec et tortor vitae massa tincidunt eleifend ?'),
                    'source_node' => '125:1668',
                ],
                ];
            }
            $faq_items = array_values(array_filter($faq_items, static function ($item): bool {
                return is_array($item) && trim(wp_strip_all_tags((string) ($item['question'] ?? ''))) !== '';
            }));
            ?>
            <section class="c-home-faq l-container" data-factory-section="home-faq" data-factory-component="faq-list">
                <div class="c-home-faq__inner">
                    <div class="c-home-faq__heading-wrap" data-aos="fade-up">
                        <h2 class="c-home-faq__heading" data-factory-source-node="125:1659"><?php echo emko_wysiwyg_heading($faq_value('emko_home_faq_heading_125_1659', 'Najczęstsze pytania')); ?></h2>
                    </div>
                    <div class="c-home-faq__items">
                    <?php foreach ($faq_items as $index => $item) : ?>
                        <details class="c-home-faq__item" data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) ($index * 70)); ?>" data-factory-component="faq-item" name="home-faq"<?php echo $index === 0 ? ' open' : ''; ?>>
                            <summary class="c-home-faq__summary">
                                <span class="c-home-faq__question"<?php if (!empty($item['source_node'])) : ?> data-factory-source-node="<?php echo esc_attr($item['source_node']); ?>"<?php endif; ?>><?php echo esc_html(wp_strip_all_tags((string) $item['question'])); ?></span>
                                <span class="c-home-faq__arrow" aria-hidden="true" data-factory-source-gap="unresolved-arrow-export">→</span>
                            </summary>
                            <?php if (!empty($item['answer'])) : ?>
                                <div class="c-home-faq__answer c-wysiwyg"<?php if (!empty($item['source_node'])) : ?> data-factory-source-node="<?php echo esc_attr($item['source_node']); ?>"<?php endif; ?>><?php echo emko_wysiwyg_content($item['answer']); ?></div>
                            <?php endif; ?>
                        </details>
                    <?php endforeach; ?>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'contact-overview') : ?>
            <?php
            $contact_overview_option = static function (string $field) use ($option): string {
                return trim((string) $option($field));
            };
            $contact_overview_lines = static function ($value): array {
                if (function_exists('emko_lines')) {
                    return emko_lines($value);
                }

                return is_string($value) ? array_values(array_filter(array_map('trim', preg_split('/(?:\R|<br\s*\/?\s*>)/iu', $value)))) : [];
            };
            $contact_overview_labels = [
                'name' => $contact_overview_option('emko_contact_overview_name_placeholder_125_2358'),
                'company' => $contact_overview_option('emko_contact_overview_company_placeholder_125_2363'),
                'email' => $contact_overview_option('emko_contact_overview_email_placeholder_125_2365'),
                'phone' => $contact_overview_option('emko_contact_overview_phone_placeholder_125_2367'),
                'message' => $contact_overview_option('emko_contact_overview_message_placeholder_125_2361'),
                'privacy' => $contact_overview_option('emko_contact_overview_privacy_consent_125_2369'),
                'email_note' => $contact_overview_option('emko_contact_overview_email_usage_note_125_2368'),
                'submit' => $contact_overview_option('emko_contact_overview_submit_label_125_2372'),
            ];
            $contact_overview_arrow_id = (int) $contact_overview_option('emko_contact_overview_submit_arrow_125_2373');
            $contact_page_id = (int) get_queried_object_id();
            $contact_form_id = function_exists('get_field')
                ? (int) get_field('emko_contact_form', $contact_page_id)
                : 0;
            $contact_overview_heading = $contact_form_id > 0
                ? trim((string) get_the_title($contact_form_id))
                : 'Formularz kontaktowy';
            $contact_acf_blocks = function_exists('get_field')
                ? get_field('emko_contact_blocks', $contact_page_id)
                : [];
            $contact_acf_blocks = is_array($contact_acf_blocks) ? array_values(array_filter($contact_acf_blocks, static function ($block): bool {
                if (!is_array($block)) {
                    return false;
                }

                if (trim(wp_strip_all_tags((string) ($block['heading'] ?? ''))) !== '' || trim(wp_strip_all_tags((string) ($block['company'] ?? ''))) !== '' || trim(wp_strip_all_tags((string) ($block['content'] ?? ''))) !== '') {
                    return true;
                }

                foreach ((array) ($block['contacts'] ?? []) as $contact) {
                    if (is_array($contact) && (trim(wp_strip_all_tags((string) ($contact['heading'] ?? ''))) !== '' || trim(wp_strip_all_tags((string) ($contact['content'] ?? ''))) !== '')) {
                        return true;
                    }
                }

                return false;
            })) : [];
            $contact_overview_offices = [
                [
                    'class' => 'central',
                    'heading' => $contact_overview_option('emko_shared_footer_central_heading_125_1710'),
                    'source_node' => '125:1710',
                    'company' => $contact_overview_option('emko_shared_footer_company_contact_125_1692'),
                    'company_node' => '125:1692',
                    'address' => '',
                    'phone' => $contact_overview_lines($contact_overview_option('emko_shared_footer_central_phone_125_1698')),
                    'phone_node' => '125:1698',
                    'phone_label' => $contact_overview_option('emko_shared_footer_central_phone_label_125_1694'),
                    'phone_label_node' => '125:1694',
                    'email' => $contact_overview_option('emko_shared_footer_info_email_125_1750'),
                    'email_node' => '125:1750',
                    'email_label' => $contact_overview_option('emko_shared_footer_wroclaw_email_label_125_1746'),
                    'email_label_node' => '125:1746',
                    'phone_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1702'),
                    'phone_icon_node' => '125:1702',
                    'email_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1754'),
                    'email_icon_node' => '125:1754',
                ],
                [
                    'class' => 'service',
                    'heading' => $contact_overview_option('emko_shared_footer_service_heading_125_1713'),
                    'source_node' => '125:1713',
                    'company' => '',
                    'company_node' => '',
                    'address' => $contact_overview_option('emko_shared_footer_address_125_1693'),
                    'address_node' => '125:1693',
                    'phone' => [$contact_overview_option('emko_shared_footer_service_phone_125_1701')],
                    'phone_node' => '125:1701',
                    'phone_label' => $contact_overview_option('emko_shared_footer_service_phone_label_125_1697'),
                    'phone_label_node' => '125:1697',
                    'email' => $contact_overview_option('emko_shared_footer_technical_email_125_1753'),
                    'email_node' => '125:1753',
                    'email_label' => $contact_overview_option('emko_shared_footer_service_email_label_125_1749'),
                    'email_label_node' => '125:1749',
                    'phone_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1708'),
                    'phone_icon_node' => '125:1708',
                    'email_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1760'),
                    'email_icon_node' => '125:1760',
                ],
                [
                    'class' => 'wroclaw',
                    'heading' => $contact_overview_option('emko_shared_footer_wroclaw_heading_125_1711'),
                    'source_node' => '125:1711',
                    'company' => '',
                    'company_node' => '',
                    'address' => '',
                    'phone' => [$contact_overview_option('emko_shared_footer_wroclaw_phone_125_1699')],
                    'phone_node' => '125:1699',
                    'phone_label' => $contact_overview_option('emko_shared_footer_wroclaw_phone_label_125_1695'),
                    'phone_label_node' => '125:1695',
                    'email' => '',
                    'email_node' => '',
                    'email_label' => '',
                    'email_label_node' => '',
                    'phone_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1704'),
                    'phone_icon_node' => '125:1704',
                    'email_icon' => 0,
                    'email_icon_node' => '',
                ],
                [
                    'class' => 'warsaw',
                    'heading' => $contact_overview_option('emko_shared_footer_warsaw_heading_125_1712'),
                    'source_node' => '125:1712',
                    'company' => '',
                    'company_node' => '',
                    'address' => '',
                    'phone' => [$contact_overview_option('emko_shared_footer_warsaw_phone_125_1700')],
                    'phone_node' => '125:1700',
                    'phone_label' => $contact_overview_option('emko_shared_footer_warsaw_phone_label_125_1696'),
                    'phone_label_node' => '125:1696',
                    'email' => '',
                    'email_node' => '',
                    'email_label' => '',
                    'email_label_node' => '',
                    'phone_icon' => (int) $contact_overview_option('emko_shared_footer_media_125_1706'),
                    'phone_icon_node' => '125:1706',
                    'email_icon' => 0,
                    'email_icon_node' => '',
                ],
            ];
            ?>
            <section class="c-contact-overview l-container" data-factory-section="contact-overview" data-factory-component="route-section-shell" data-factory-source-node="125:2356">
                <div class="c-contact-overview__breadcrumb" data-factory-component="page-banner"><?php emko_render_breadcrumbs('', 'Breadcrumb'); ?></div>
                <div class="c-contact-overview__layout grid">
                    <div class="c-contact-overview__details gc-2/8" data-aos="fade-right" data-factory-component="contact-details">
                        <?php if ($contact_acf_blocks) : ?>
                            <?php
                            $contact_office_variants = ['central', 'service', 'wroclaw', 'warsaw'];
                            foreach ($contact_acf_blocks as $office_index => $office) :
                                $office_variant = $contact_office_variants[$office_index] ?? '';
                            ?>
                                <article class="c-contact-overview__office<?php echo $office_variant !== '' ? ' c-contact-overview__office--' . esc_attr($office_variant) : ''; ?>">
                                    <?php if (!empty($office['heading'])) : ?><h2><?php echo emko_wysiwyg_heading($office['heading']); ?></h2><?php endif; ?>
                                    <?php if (!empty($office['company'])) : ?><div class="c-contact-overview__company"><?php echo emko_wysiwyg_content($office['company']); ?></div><?php endif; ?>
                                    <?php if (!empty($office['content'])) : ?><div class="c-contact-overview__address c-wysiwyg"><?php echo emko_wysiwyg_content($office['content']); ?></div><?php endif; ?>
                                    <?php foreach ((array) ($office['contacts'] ?? []) as $contact) : ?>
                                        <?php if (!empty($contact['heading']) || !empty($contact['content'])) : ?>
                                            <div class="c-contact-overview__contact-row">
                                                <?php if (!empty($contact['icon'])) : ?><?php echo $slider_image((int) $contact['icon'], ''); ?><?php endif; ?>
                                                <div>
                                                    <?php if (!empty($contact['heading'])) : ?><span><?php echo emko_wysiwyg_heading($contact['heading']); ?></span><?php endif; ?>
                                                    <?php if (!empty($contact['content'])) : ?><div class="c-contact-overview__contact-value c-wysiwyg"><?php echo emko_wysiwyg_content($contact['content']); ?></div><?php endif; ?>
                                                </div>
                                            </div>
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                </article>
                            <?php endforeach; ?>
                        <?php else : ?>
                        <?php foreach ($contact_overview_offices as $office) : ?>
                            <article class="c-contact-overview__office c-contact-overview__office--<?php echo esc_attr($office['class']); ?>">
                                <?php if ($office['heading'] !== '') : ?><h2><?php echo esc_html($office['heading']); ?></h2><?php endif; ?>
                                <?php if ($office['company'] !== '') : ?><div class="c-contact-overview__company"><?php echo wp_kses_post($office['company']); ?></div><?php endif; ?>
                                <?php if ($office['address'] !== '') : ?><p class="c-contact-overview__address"><?php echo esc_html($office['address']); ?></p><?php endif; ?>
                                <?php if ($office['phone']) : ?>
                                    <div class="c-contact-overview__contact-row">
                                        <?php if ($office['phone_icon']) : ?><?php echo $slider_image($office['phone_icon'], ''); ?><?php endif; ?>
                                        <div><span><?php echo esc_html($office['phone_label']); ?></span><?php foreach ($office['phone'] as $phone) : ?><?php if ($phone !== '') : ?><a href="<?php echo esc_url('tel:' . preg_replace('/[^+0-9]/', '', $phone)); ?>"><?php echo esc_html($phone); ?></a><?php endif; ?><?php endforeach; ?></div>
                                    </div>
                                <?php endif; ?>
                                <?php if ($office['email'] !== '') : ?>
                                    <div class="c-contact-overview__contact-row">
                                        <?php if ($office['email_icon']) : ?><?php echo $slider_image($office['email_icon'], ''); ?><?php endif; ?>
                                        <div><span><?php echo esc_html($office['email_label']); ?></span><a href="<?php echo esc_url('mailto:' . $office['email']); ?>"><?php echo esc_html($office['email']); ?></a></div>
                                    </div>
                                <?php endif; ?>
                            </article>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                    <div class="c-contact-overview__form-panel gc-8/14" data-aos="fade-left" data-aos-delay="100">
                        <?php if ($contact_overview_heading !== '') : ?><h1 class="c-contact-overview__heading"><?php echo wp_kses_post($contact_overview_heading); ?></h1><?php endif; ?>
                        <?php
                        $contact_form_markup = $contact_form_id && shortcode_exists('contact-form-7') ? do_shortcode('[contact-form-7 id="' . $contact_form_id . '"]') : '';
                        if ($contact_form_markup !== '' && $contact_overview_arrow_id) {
                            $contact_submit_arrow = wp_get_attachment_image($contact_overview_arrow_id, 'full', false, [
                                'class' => 'c-contact-overview__cf7-arrow',
                                'alt' => '',
                                'loading' => false,
                                'aria-hidden' => 'true',
                            ]);
                            $contact_form_markup = preg_replace('/(<p class="c-contact-form__submit">.*?)(<\\/p>)/s', '$1' . $contact_submit_arrow . '$2', $contact_form_markup, 1);
                        }
                        ?>
                        <?php if ($contact_form_markup !== '') : ?>
                            <div class="c-contact-overview__form c-contact-overview__form--cf7">
                                <?php echo $contact_form_markup; ?>
                            </div>
                        <?php else : ?>
                        <form class="c-contact-overview__form" method="post" action="" aria-label="<?php echo esc_attr($contact_overview_labels['submit']); ?>">
                            <div class="c-contact-overview__fields">
                                <input type="text" name="contact-name" autocomplete="name" placeholder="<?php echo esc_attr($contact_overview_labels['name']); ?>" aria-label="<?php echo esc_attr($contact_overview_labels['name']); ?>" data-factory-source-node="125:2358">
                                <input type="text" name="contact-company" autocomplete="organization" placeholder="<?php echo esc_attr($contact_overview_labels['company']); ?>" aria-label="<?php echo esc_attr($contact_overview_labels['company']); ?>" data-factory-source-node="125:2363">
                                <input type="email" name="contact-email" autocomplete="email" placeholder="<?php echo esc_attr($contact_overview_labels['email']); ?>" aria-label="<?php echo esc_attr($contact_overview_labels['email']); ?>" data-factory-source-node="125:2365">
                                <input type="tel" name="contact-phone" autocomplete="tel" placeholder="<?php echo esc_attr($contact_overview_labels['phone']); ?>" aria-label="<?php echo esc_attr($contact_overview_labels['phone']); ?>" data-factory-source-node="125:2367">
                                <textarea name="contact-message" placeholder="<?php echo esc_attr($contact_overview_labels['message']); ?>" aria-label="<?php echo esc_attr($contact_overview_labels['message']); ?>" data-factory-source-node="125:2361"></textarea>
                            </div>
                            <label class="c-contact-overview__privacy c-privacy-consent">
                                <input type="checkbox" name="contact-privacy" value="1">
                                <span data-factory-source-node="125:2369"><?php echo esc_html($contact_overview_labels['privacy']); ?></span>
                            </label>
                            <div class="c-contact-overview__actions">
                                <button type="submit" data-factory-source-node="125:2372">
                                    <span><?php echo esc_html($contact_overview_labels['submit']); ?></span>
                                    <?php if ($contact_overview_arrow_id) : ?>
                                        <?php echo wp_get_attachment_image($contact_overview_arrow_id, 'full', false, ['alt' => '', 'loading' => false, 'data-factory-source-node' => '125:2373']); ?>
                                    <?php else : ?>
                                        <span class="c-contact-overview__arrow" data-factory-source-node="125:2373" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                    <?php endif; ?>
                                </button>
                                <p class="c-contact-overview__email-note" data-factory-source-node="125:2368"><?php echo esc_html($contact_overview_labels['email_note']); ?></p>
                            </div>
                        </form>
                        <?php endif; ?>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'contact-form') : ?>
            <?php
            $contact_page_id = (int) get_queried_object_id();
            $contact_map_address = function_exists('get_field')
                ? trim((string) get_field('emko_contact_map_address', $contact_page_id))
                : '';
            $contact_map_address = $contact_map_address ?: 'Kokosowa 26, 72-006 Mierzyn';
            $contact_map_embed_url = add_query_arg([
                'output' => 'embed',
                'q' => $contact_map_address,
                't' => 'm',
                'z' => 16,
            ], 'https://www.google.com/maps');
            ?>
            <?php
            $contact_faq_value = static function (string $field, string $fallback) use ($option): string {
                $value = trim((string) $option($field));
                return $value !== '' ? $value : $fallback;
            };
            $contact_faq_heading = function_exists('get_field')
                ? trim((string) get_field('emko_contact_faq_heading', $contact_page_id))
                : '';
            $contact_faq_heading = $contact_faq_heading !== ''
                ? $contact_faq_heading
                : $contact_faq_value('emko_home_faq_heading_125_1659', 'Najczęstsze pytania');
            $contact_faq_items = function_exists('get_field')
                ? get_field('emko_contact_faq_items', $contact_page_id)
                : [];
            $contact_faq_items = is_array($contact_faq_items) ? array_values(array_filter($contact_faq_items, static function ($item): bool {
                return is_array($item) && trim(wp_strip_all_tags((string) ($item['question'] ?? ''))) !== '';
            })) : [];
            if (!$contact_faq_items) {
                $contact_faq_items = [
                [
                    'question' => $contact_faq_value('emko_home_faq_item_1_question_125_1665', 'Nunc maximus lectus quis ligula ornare sagittis ?'),
                    'source_node' => '125:1665',
                ],
                [
                    'question' => $contact_faq_value('emko_home_faq_item_2_question_125_1666', 'Mauris ante metus, posuere vitae porttitor non, dictum a ligula ?'),
                    'source_node' => '125:1666',
                ],
                [
                    'question' => $contact_faq_value('emko_home_faq_item_3_question_125_1667', 'Nam in velit id sapien mattis fermentum et eget nulla ?'),
                    'answer' => $contact_faq_value('emko_home_faq_item_3_answer_125_1667', 'Vivamus arcu erat, hendrerit non eleifend at, dictum eu nisl. Donec sodales tincidunt purus, vitae aliquam nibh venenatis eget. Ut vel pellentesque lacus. Mauris risus massa, tempor at ante sit amet, laoreet cursus sapien.Donec sodales tincidunt purus, vitae aliquam nibh venenatis eget.'),
                    'source_node' => '125:1667',
                ],
                [
                    'question' => $contact_faq_value('emko_home_faq_item_4_question_125_1668', 'Donec et tortor vitae massa tincidunt eleifend ?'),
                    'source_node' => '125:1668',
                ],
                ];
            }
            ?>
            <section class="c-contact-form l-container" data-factory-section="contact-form" data-factory-component="route-section-shell" data-factory-source-node="125:2374">
                <div class="c-contact-form-map">
                    <div class="c-contact-form-map__viewport">
                        <iframe
                            src="<?php echo esc_url($contact_map_embed_url); ?>"
                            title="<?php echo esc_attr(sprintf('Mapa: %s', $contact_map_address)); ?>"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            allowfullscreen
                            data-factory-source-node="125:2374"
                        ></iframe>
                    </div>
                </div>
                <div class="c-contact-form__faq" data-factory-component="faq-list">
                    <h2 data-factory-source-node="125:1659"><?php echo emko_wysiwyg_heading($contact_faq_heading); ?></h2>
                    <div class="c-contact-form__faq-items">
                        <?php foreach ($contact_faq_items as $index => $item) : ?>
                            <details class="c-contact-form__faq-item" name="contact-faq"<?php echo $index === 0 ? ' open' : ''; ?>>
                                <summary><span<?php if (!empty($item['source_node'])) : ?> data-factory-source-node="<?php echo esc_attr($item['source_node']); ?>"<?php endif; ?>><?php echo esc_html(wp_strip_all_tags((string) ($item['question'] ?? ''))); ?></span><span class="c-contact-form__faq-arrow" aria-hidden="true">→</span></summary>
                                <?php if (!empty($item['answer'])) : ?><div<?php if (!empty($item['source_node'])) : ?> data-factory-source-node="<?php echo esc_attr($item['source_node']); ?>"<?php endif; ?>><?php echo emko_wysiwyg_content($item['answer']); ?></div><?php endif; ?>
                            </details>
                        <?php endforeach; ?>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'blog-archive') : ?>
            <?php
            $archive_card_nodes = [
                '125:1919',
                '125:1924',
                '125:1929',
                '125:1935',
                '125:1940',
                '125:1945',
                '125:1951',
                '125:1956',
                '125:1961',
            ];
            $archive_posts = [];
            foreach (range(1, 9) as $card_index) {
                $posts = get_posts([
                    'post_type' => 'post',
                    'post_status' => 'publish',
                    'posts_per_page' => 1,
                    'meta_key' => '_emko_blog_card_identity',
                    'meta_value' => 'blog-archive-card-' . $card_index,
                    'orderby' => 'ID',
                    'order' => 'ASC',
                ]);
                if ($posts) {
                    $archive_posts[] = [
                        'post_id' => (int) $posts[0]->ID,
                        'source_node' => $archive_card_nodes[$card_index - 1],
                    ];
                }
            }
            ?>
            <section class="c-blog-archive l-container" data-factory-section="blog-archive" data-factory-component="blog-card-grid">
                <div class="c-blog-grid c-blog-grid--archive">
                    <?php foreach ($archive_posts as $archive_post) : ?>
                        <?php get_template_part('partials/blog-card', null, [
                            'post_id' => $archive_post['post_id'],
                            'heading_tag' => 'h2',
                            'variant' => 'archive',
                            'show_excerpt' => true,
                            'excerpt_from_content' => true,
                            'source_node' => $archive_post['source_node'],
                        ]); ?>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'blog-post-article') : ?>
            <?php
            $article_post_id = (int) get_queried_object_id();
            $article_identity = $article_post_id ? (string) get_post_meta($article_post_id, '_emko_blog_card_identity', true) : '';
            if (!$article_post_id || !in_array($article_identity, ['blog-post-related-card-2', 'blog-archive-card-2'], true)) {
                $article_source_posts = get_posts([
                    'post_type' => 'post',
                    'post_status' => 'publish',
                    'posts_per_page' => 1,
                    'meta_key' => '_emko_blog_card_identity',
                    'meta_value' => 'blog-post-related-card-2',
                    'fields' => 'ids',
                ]);
                if (!$article_source_posts) {
                    $article_source_posts = get_posts([
                        'post_type' => 'post',
                        'post_status' => 'publish',
                        'posts_per_page' => 1,
                        'meta_key' => '_emko_blog_card_identity',
                        'meta_value' => 'blog-archive-card-2',
                        'fields' => 'ids',
                    ]);
                }
                if ($article_source_posts) { $article_post_id = (int) $article_source_posts[0]; }
            }
            $article_title = $article_post_id ? trim((string) get_the_title($article_post_id)) : '';
            $article_meta = $article_post_id && function_exists('get_field')
                ? trim((string) get_field('emko_blog_card_date', $article_post_id))
                : '';
            if ($article_meta !== '' && !str_contains($article_meta, '|')) {
                $article_archive_posts = get_posts([
                    'post_type' => 'post',
                    'post_status' => 'publish',
                    'posts_per_page' => 1,
                    'meta_key' => '_emko_blog_card_identity',
                    'meta_value' => 'blog-archive-card-2',
                    'fields' => 'ids',
                ]);
                if ($article_archive_posts && function_exists('get_field')) {
                    $article_archive_meta = trim((string) get_field('emko_blog_card_date', (int) $article_archive_posts[0]));
                    if ($article_archive_meta !== '') { $article_meta = $article_archive_meta; }
                }
            }
            $article_return_label = $article_post_id && function_exists('get_field')
                ? trim((string) get_field('emko_blog_article_return_label', $article_post_id))
                : '';
            if ($article_return_label === '') {
                $article_return_posts = get_posts([
                    'post_type' => 'post',
                    'post_status' => 'any',
                    'posts_per_page' => 1,
                    'meta_key' => 'emko_blog_article_return_label',
                    'meta_compare' => 'EXISTS',
                    'fields' => 'ids',
                ]);
                if ($article_return_posts && function_exists('get_field')) {
                    $article_return_label = trim((string) get_field('emko_blog_article_return_label', (int) $article_return_posts[0]));
                }
            }
            $article_body = trim((string) $option('emko_blog_post_article_body_125_2163'));
            $article_body = preg_replace('/\s+(?=Suspendisse vehicula)/u', "\n\n", $article_body, 1);
            $article_body = preg_replace('/(?<=risus\.)\s+(?=Pellentesque sodales)/u', "\n", $article_body, 1);
            $article_body = preg_replace('/(?<=dapibus\.)\s+(?=Praesent tempus)/u', "\n\n", $article_body, 1);
            $article_image_id = 0;
            // The article section has no source text fields. Resolve its
            // authoritative source-backed media before any post-card media;
            // card thumbnails are different source nodes and crops.
            if (!$article_image_id) {
                $article_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '125:2244',
                    'fields' => 'ids',
                ]);
                $article_image_id = !empty($article_images) ? (int) $article_images[0] : 0;
            }
            // The related-card export is byte-identical to the authoritative
            // article export and is retained as an idempotent native fallback
            // for databases imported before the article asset was registered.
            if (!$article_image_id) {
                $article_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '125:2258',
                    'fields' => 'ids',
                ]);
                $article_image_id = !empty($article_images) ? (int) $article_images[0] : 0;
            }
            ?>
            <?php if ($article_image_id) : ?>
                <section class="c-blog-post-article" data-factory-section="blog-post-article" data-factory-component="article-image-crop">
                    <header class="c-blog-post-article__header">
                        <?php if ($article_title !== '') : ?><h1 class="c-blog-post-article__title" data-factory-source-node="125:2162"><?php echo esc_html($article_title); ?></h1><?php endif; ?>
                        <?php if ($article_meta !== '') : ?><p class="c-blog-post-article__meta" data-factory-source-node="125:2242"><?php echo esc_html($article_meta); ?></p><?php endif; ?>
                    </header>
                    <div class="c-blog-post-article__media" data-factory-source-node="125:2243">
                        <?php echo wp_get_attachment_image($article_image_id, 'full', false, [
                            'alt' => '',
                            'loading' => false,
                            'data-factory-source-node' => '125:2244',
                        ]); ?>
                    </div>
                    <?php if ($article_body !== '') : ?>
                        <div class="c-blog-post-article__body" data-factory-source-node="125:2163"><?php echo wpautop(esc_html($article_body)); ?></div>
                    <?php endif; ?>
                    <?php if ($article_return_label !== '') : ?>
                        <a class="c-blog-post-article__return" href="<?php echo esc_url(get_post_type_archive_link('post') ?: home_url('/blog/')); ?>" data-factory-source-node="125:2273">
                            <span data-factory-source-node="125:2274"><?php echo esc_html($article_return_label); ?></span>
                            <span class="c-blog-post-article__return-icon" aria-hidden="true" data-factory-source-node="125:2275" data-factory-source-gap="missing-source-svg-export">←</span>
                        </a>
                    <?php endif; ?>
                </section>
            <?php endif; ?>
        <?php elseif ($section_id === 'blog-post-related') : ?>
            <?php
            $related_heading = trim((string) $option('emko_blog_post_related_heading_125_2267'));
            $related_all_label = trim((string) $option('emko_blog_post_related_all_label_125_2269'));
            $related_all_arrow_id = (int) $option('emko_blog_post_related_all_arrow_125_2271');
            $related_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('post') : false;
            $related_url = $related_url ?: home_url('/blog/');
            $related_card_nodes = [
                1 => '125:2248',
                2 => '125:2253',
                3 => '125:2258',
                4 => '125:2263',
            ];
            $related_posts = [];
            foreach ($related_card_nodes as $card_index => $source_node) {
                $posts = get_posts([
                    'post_type' => 'post',
                    'post_status' => 'publish',
                    'posts_per_page' => 1,
                    'meta_key' => '_emko_blog_card_identity',
                    'meta_value' => 'blog-post-related-card-' . $card_index,
                    'orderby' => 'ID',
                    'order' => 'ASC',
                ]);
                if ($posts) {
                    $related_posts[] = [
                        'post_id' => (int) $posts[0]->ID,
                        'source_node' => $source_node,
                    ];
                }
            }
            ?>
            <section class="c-blog-related l-container" data-factory-section="blog-post-related" data-factory-component="blog-card-grid">
                <header class="c-blog-related__header">
                    <?php if ($related_heading !== '') : ?>
                        <h2 class="c-blog-related__heading" data-factory-source-node="125:2267"><?php echo esc_html($related_heading); ?></h2>
                    <?php endif; ?>
                    <?php if ($related_all_label !== '') : ?>
                        <a class="c-blog-related__all-link" data-factory-component="all-posts-link" data-factory-source-node="125:2268" href="<?php echo esc_url($related_url); ?>">
                            <span data-factory-source-node="125:2269"><?php echo esc_html($related_all_label); ?></span>
                            <?php echo $related_all_arrow_id ? $slider_image($related_all_arrow_id, '125:2271') : ''; ?>
                        </a>
                    <?php endif; ?>
                </header>
                <div class="c-blog-grid c-blog-grid--related">
                    <?php foreach ($related_posts as $related_post) : ?>
                        <?php $related_card_index = (int) array_search($related_post['source_node'], $related_card_nodes, true); ?>
                        <?php get_template_part('partials/blog-card', null, [
                            'post_id' => $related_post['post_id'],
                            'heading_tag' => 'h3',
                            'variant' => 'related',
                            'show_excerpt' => true,
                            'excerpt_from_content' => true,
                            'source_node' => $related_post['source_node'],
                            'source_nodes' => [
                                'title' => '125:' . (2248 + (($related_card_index - 1) * 5) + 1),
                                'excerpt' => '125:' . (2248 + (($related_card_index - 1) * 5) + 2),
                                'date' => '125:' . (2248 + (($related_card_index - 1) * 5) + 3),
                            ],
                            'loading' => 'eager',
                        ]); ?>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php elseif ($section_id === 'service-overview') : ?>
            <?php
            $service_heading = trim((string) $option('emko_service_overview_heading_132_52'));
            $service_body = trim((string) $option('emko_service_overview_body_132_65'));
            $service_image_id = (int) $option('emko_service_overview_image_132_64');
            if (!$service_image_id) {
                $service_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '132:64',
                    'fields' => 'ids',
                ]);
                $service_image_id = !empty($service_images) ? (int) $service_images[0] : 0;
            }
            if ($service_heading === '') {
                $service_heading = 'Serwis hydrauliki siłowej';
            }
            $service_copy = preg_replace('/(?<=\.)\s+(?=Maecenas|Orci)/u', "\n\n", $service_body);
            ?>
            <section class="c-service-overview" data-factory-section="service-overview" data-factory-component="route-section-shell">
                <?php get_template_part('partials/page-banner', null, [
                    'variant' => 'service',
                    'breadcrumb_only' => true,
                    'is_fragment' => true,
                ]); ?>
                <?php get_template_part('partials/section-image', null, [
                    'image' => $service_image_id,
                    'title' => $service_heading,
                    'content' => $service_copy !== '' ? wpautop(esc_html($service_copy)) : '',
                    'section_class' => 'c-service-overview__layout',
                    'container_class' => 'l-container',
                    'image_class' => 'c-service-overview__image',
                    'content_class' => 'c-service-overview__content',
                    'factory_component' => 'image-content',
                    'image_source_node' => '132:64',
                    'title_source_node' => '132:52',
                    'title_tag' => 'h1',
                    'image_aos' => 'fade-left',
                    'content_aos' => 'fade-right',
                    'content_aos_delay' => 100,
                ]); ?>
            </section>
        <?php elseif ($section_id === 'service-contact') : ?>
            <?php
            $service_contact_base_id = (int) $option('emko_service_contact_image_base_132_61');
            $service_contact_overlay_id = (int) $option('emko_service_contact_image_overlay_132_62');
            if (!$service_contact_base_id) {
                $service_contact_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '132:61',
                    'fields' => 'ids',
                ]);
                $service_contact_base_id = !empty($service_contact_images) ? (int) $service_contact_images[0] : 0;
            }
            if (!$service_contact_overlay_id) {
                $service_contact_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '132:62',
                    'fields' => 'ids',
                ]);
                $service_contact_overlay_id = !empty($service_contact_images) ? (int) $service_contact_images[0] : 0;
            }
            ?>
            <?php
            $service_contact_heading = trim((string) $option('emko_service_contact_heading_132_54'));
            $service_contact_services = trim((string) $option('emko_service_contact_services_132_55'));
            $service_contact_support_heading = trim((string) $option('emko_service_contact_support_heading_132_53'));
            $service_contact_support_body = trim((string) $option('emko_service_contact_support_body_132_153'));
            $service_contact_button_label = trim((string) $option('emko_service_contact_button_label_132_58'));
            $service_contact_heading = $service_contact_heading !== '' ? $service_contact_heading : 'Zakres usług';
            $service_contact_services = $service_contact_services !== '' ? $service_contact_services : "serwis i regeneracja narzędzi hydraulicznych\nnaprawa pomp, cylindrów i zasilaczy\ndiagnostyka układów hydraulicznych\nprzeglądy i konserwacja\ndobór i wymiana części\nuruchomienia i testy urządzeń";
            $service_contact_support_heading = $service_contact_support_heading !== '' ? $service_contact_support_heading : 'Szybki serwis i wsparcie';
            $service_contact_support_body = $service_contact_support_body !== '' ? $service_contact_support_body : 'Minimalizujemy przestoje produkcyjne dzięki sprawnej diagnostyce, dostępności części oraz szybkim realizacjom napraw.';
            $service_contact_button_label = $service_contact_button_label !== '' ? $service_contact_button_label : 'Skontaktuj się';
            $service_contact_service_items = array_values(array_filter(array_map('trim', preg_split('/\R/u', $service_contact_services))));
            ?>
            <section class="c-service-contact" data-factory-section="service-contact" data-factory-component="route-section-shell">
                <div class="c-service-contact__media" data-aos="fade-right" data-factory-component="image-stack">
                    <div class="c-service-contact__base">
                        <?php if ($service_contact_base_id) : ?>
                            <?php echo wp_get_attachment_image($service_contact_base_id, 'full', false, ['alt' => '', 'loading' => false, 'data-factory-source-node' => '132:61']); ?>
                        <?php endif; ?>
                    </div>
                    <div class="c-service-contact__overlay">
                        <?php if ($service_contact_overlay_id) : ?>
                            <?php echo wp_get_attachment_image($service_contact_overlay_id, 'full', false, ['alt' => '', 'loading' => false, 'data-factory-source-node' => '132:62']); ?>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="c-service-contact__content" data-aos="fade-left" data-aos-delay="100">
                    <h2 data-factory-source-node="132:54"><?php echo esc_html($service_contact_heading); ?></h2>
                    <ul data-factory-source-node="132:55">
                        <?php foreach ($service_contact_service_items as $service_item) : ?>
                            <li><?php echo esc_html($service_item); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <a class="c-service-contact__button" href="#contact" data-factory-source-node="132:56">
                        <span data-factory-source-node="132:58"><?php echo esc_html($service_contact_button_label); ?></span>
                        <span class="c-service-contact__button-arrow" aria-hidden="true" data-factory-source-gap="unresolved-arrow-export">→</span>
                    </a>
                    <h2 data-factory-source-node="132:53"><?php echo esc_html($service_contact_support_heading); ?></h2>
                    <p data-factory-source-node="132:153"><?php echo esc_html($service_contact_support_body); ?></p>
                </div>
            </section>
        <?php elseif ($section_id === 'service-media-band') : ?>
            <?php
            $service_media_band_image_id = (int) $option('emko_service_media_band_image_132_69');
            $service_media_band_mask_id = (int) $option('emko_service_media_band_mask_132_67');
            if (!$service_media_band_image_id) {
                $service_media_band_images = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '132:69',
                    'fields' => 'ids',
                ]);
                $service_media_band_image_id = !empty($service_media_band_images) ? (int) $service_media_band_images[0] : 0;
            }
            if (!$service_media_band_mask_id) {
                $service_media_band_masks = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => '132:67',
                    'fields' => 'ids',
                ]);
                $service_media_band_mask_id = !empty($service_media_band_masks) ? (int) $service_media_band_masks[0] : 0;
            }
            $service_media_band_mask_url = $service_media_band_mask_id ? wp_get_attachment_url($service_media_band_mask_id) : '';
            $service_media_band_mask_style = $service_media_band_mask_url !== ''
                ? '--service-media-band-mask-image:url("' . esc_url_raw($service_media_band_mask_url) . '");'
                : '';
            $service_media_band_heading = trim((string) $option('emko_service_media_band_heading_132_66'));
            if ($service_media_band_heading === '') {
                $service_media_band_heading = "Potrzebujesz serwisu lub wsparcia technicznego?\nSkontaktuj się z nami — pomożemy dobrać najlepsze rozwiązanie i\nszybko usuniemy usterkę.";
            }
            $service_media_band_heading_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $service_media_band_heading))));
            $service_media_band_button_label = trim((string) $option('emko_service_media_band_button_label_132_66'));
            $service_media_band_button_label = $service_media_band_button_label !== '' ? $service_media_band_button_label : 'Skontaktuj się';
            $service_media_band_button_url = trim((string) $option('emko_service_media_band_button_url_132_66'));
            ?>
            <section class="c-service-media-band" data-aos="fade-up" data-factory-section="service-media-band" data-factory-component="route-section-shell" data-factory-source-node="132:66">
                <div class="c-service-media-band__clip" data-factory-source-node="132:67"<?php if ($service_media_band_mask_style !== '') : ?> style="<?php echo esc_attr($service_media_band_mask_style); ?>"<?php endif; ?>>
                    <div class="c-service-media-band__background" data-factory-source-node="132:68" aria-hidden="true"></div>
                    <?php if ($service_media_band_image_id) : ?>
                        <div class="c-service-media-band__image">
                            <?php echo wp_get_attachment_image($service_media_band_image_id, 'full', false, [
                                'alt' => '',
                                'loading' => false,
                                'data-factory-source-node' => '132:69',
                            ]); ?>
                        </div>
                    <?php endif; ?>
                    <div class="c-service-media-band__content" data-factory-source-gap="unresolved-copy-node">
                        <?php if (!empty($service_media_band_heading_lines)) : ?>
                            <h2 class="c-service-media-band__heading">
                                <span class="c-service-media-band__heading-primary" data-factory-source-gap="unresolved-heading-node"><?php echo esc_html($service_media_band_heading_lines[0]); ?></span>
                                <?php foreach (array_slice($service_media_band_heading_lines, 1) as $heading_line) : ?>
                                    <span class="c-service-media-band__heading-secondary" data-factory-source-gap="unresolved-heading-node"><?php echo esc_html($heading_line); ?></span>
                                <?php endforeach; ?>
                            </h2>
                        <?php endif; ?>
                        <a class="c-service-media-band__button" href="<?php echo esc_url($service_media_band_button_url !== '' ? $service_media_band_button_url : '#'); ?>"<?php if ($service_media_band_button_url === '') : ?> data-factory-source-gap="unresolved-button-destination"<?php endif; ?>>
                            <span data-factory-source-gap="unresolved-button-label-node"><?php echo esc_html($service_media_band_button_label); ?></span>
                            <span class="c-service-media-band__button-arrow" aria-hidden="true" data-factory-source-gap="unresolved-arrow-export">→</span>
                        </a>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'about-hero') : ?>
            <?php
            $about_hero_background_id = (int) $option('emko_about_hero_background_125_3739');
            $about_hero_pattern_a_id = (int) $option('emko_about_hero_pattern_a_125_3741');
            $about_hero_pattern_b_id = (int) $option('emko_about_hero_pattern_b_125_4036');
            $about_hero_image_id = (int) $option('emko_about_hero_image_125_4346');
            $about_hero_title = trim((string) $option('emko_about_hero_title_125_4331'));
            $about_hero_body = (string) $option('emko_about_hero_body_125_4334');
            $about_hero_body = preg_replace('/\x{2028}/u', "\n", $about_hero_body);
            $about_hero_body_html = nl2br(esc_html($about_hero_body));
            $about_hero_body_html = str_replace(
                ['Od początku', 'PowerTeam'],
                ['<br><br>Od początku', '<br><br>PowerTeam'],
                $about_hero_body_html
            );
            $about_hero_body_html = preg_replace(
                '/(PowerTeam \(USA\)|TorcUP Inc\. \(USA\)|EuropressPack \(Włochy\)|O\+P Srl\. \(Włochy\))/u',
                '<strong>$1</strong>',
                $about_hero_body_html
            );
            $about_hero_body_html = str_replace(
                ['Ruchu <strong>', 'hydrauliczne <strong>', 'siłowe <strong>', 'hydraulicznych Dzięki'],
                ['Ruchu<br><strong>', 'hydrauliczne<br><strong>', 'siłowe<br><strong>', 'hydraulicznych<br>Dzięki'],
                $about_hero_body_html
            );
            $about_hero_button_label = trim((string) $option('emko_about_hero_button_label_125_4336'));
            $about_hero_button_url = trim((string) $option('emko_about_hero_button_url_125_4336'));
            $about_hero_values = [
                [
                    'ellipse' => '125:4349',
                    'heading' => '125:4953',
                    'body' => '125:4950',
                    'heading_field' => 'emko_about_hero_value_1_heading_125_4953',
                    'body_field' => 'emko_about_hero_value_1_body_125_4950',
                ],
                [
                    'ellipse' => '125:4350',
                    'heading' => '125:4954',
                    'body' => '125:4951',
                    'heading_field' => 'emko_about_hero_value_2_heading_125_4954',
                    'body_field' => 'emko_about_hero_value_2_body_125_4951',
                ],
                [
                    'ellipse' => '125:4949',
                    'heading' => '125:4955',
                    'body' => '125:4952',
                    'heading_field' => 'emko_about_hero_value_3_heading_125_4955',
                    'body_field' => 'emko_about_hero_value_3_body_125_4952',
                ],
            ];
            foreach ($about_hero_values as &$about_hero_value) {
                $about_hero_value['heading_text'] = trim((string) $option($about_hero_value['heading_field']));
                $about_hero_value['body_text'] = trim((string) $option($about_hero_value['body_field']));
            }
            unset($about_hero_value);
            $about_hero_attachment = static function (int $attachment_id, string $source_node): string {
                if (!$attachment_id) {
                    return '';
                }

                return wp_get_attachment_image($attachment_id, 'full', false, [
                    'alt' => '',
                    'loading' => false,
                    'data-factory-source-node' => $source_node,
                ]);
            };
            ?>
            <section class="c-about-hero" data-factory-section="about-hero" data-factory-component="route-section-shell">
                <?php emko_render_breadcrumbs('c-about-hero__breadcrumb c-page-banner__breadcrumb', 'Breadcrumb'); ?>
                <?php echo $about_hero_attachment($about_hero_background_id, '125:3739'); ?>
                <div class="c-about-hero__pattern c-about-hero__pattern--a" aria-hidden="true">
                    <?php echo $about_hero_attachment($about_hero_pattern_a_id, '125:3741'); ?>
                </div>
                <div class="c-about-hero__pattern c-about-hero__pattern--b" aria-hidden="true">
                    <?php echo $about_hero_attachment($about_hero_pattern_b_id, '125:4036'); ?>
                </div>
                <?php if ($about_hero_image_id) : ?>
                    <div class="c-about-hero__media" data-aos="fade-right" data-factory-source-node="125:4344">
                        <?php echo $about_hero_attachment($about_hero_image_id, '125:4346'); ?>
                    </div>
                <?php endif; ?>
                <?php if ($about_hero_title !== '' || $about_hero_body !== '' || $about_hero_button_label !== '') : ?>
                    <div class="c-about-hero__content" data-aos="fade-left" data-aos-delay="100">
                        <?php if ($about_hero_title !== '') : ?>
                            <h1 class="c-about-hero__title" data-factory-source-node="125:4331"><?php echo emko_wysiwyg_heading($about_hero_title); ?></h1>
                        <?php endif; ?>
                        <div class="c-about-hero__body c-wysiwyg" data-factory-source-node="125:4334"><?php echo emko_wysiwyg_content($about_hero_body); ?></div>
                        <?php if ($about_hero_button_label !== '') : ?>
                            <a class="c-about-hero__button" href="<?php echo esc_url($about_hero_button_url !== '' ? $about_hero_button_url : '#'); ?>" data-factory-source-node="125:4336"<?php if ($about_hero_button_url === '') : ?> data-factory-source-gap="unresolved-button-destination"<?php endif; ?>>
                                <span><?php echo esc_html($about_hero_button_label); ?></span>
                                <span class="c-about-hero__button-arrow" aria-hidden="true" data-factory-source-node="125:4339" data-factory-source-gap="unresolved-arrow-export">→</span>
                            </a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <?php if (array_filter($about_hero_values, static fn ($value) => $value['heading_text'] !== '' || $value['body_text'] !== '')) : ?>
                    <div class="c-about-hero__values" aria-label="Wartości firmy">
                        <?php foreach ($about_hero_values as $about_hero_value_index => $about_hero_value) : ?>
                            <?php if ($about_hero_value['heading_text'] === '' && $about_hero_value['body_text'] === '') : continue; endif; ?>
                            <div class="c-about-hero__value" data-aos="fade-up" data-aos-delay="<?php echo esc_attr((string) ($about_hero_value_index * 100)); ?>" data-factory-source-node="<?php echo esc_attr($about_hero_value['ellipse']); ?>">
                                <?php if ($about_hero_value['heading_text'] !== '') : ?>
                                    <strong data-factory-source-node="<?php echo esc_attr($about_hero_value['heading']); ?>"><?php echo emko_wysiwyg_heading($about_hero_value['heading_text']); ?></strong>
                                <?php endif; ?>
                                <?php if ($about_hero_value['body_text'] !== '') : ?>
                                    <span data-factory-source-node="<?php echo esc_attr($about_hero_value['body']); ?>"><?php echo emko_wysiwyg_heading($about_hero_value['body_text']); ?></span>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>
        <?php elseif ($section_id === 'about-overview') : ?>
            <?php
            $about_overview_background_id = (int) $option('emko_about_overview_background_125_4345');
            $about_overview_image_id = (int) $option('emko_about_overview_image_125_4346');
            $about_overview_heading = trim((string) $option('emko_about_overview_heading_125_4332'));
            $about_overview_heading = str_replace(["\\r\\n", "\\n", "\\r"], "\n", $about_overview_heading);
            $about_overview_body = trim((string) $option('emko_about_overview_body_125_4335'));
            $about_overview_button_label = trim((string) $option('emko_about_overview_button_label_125_4340'));
            $about_overview_button_url = trim((string) $option('emko_about_overview_button_url_125_4340'));
            $about_overview_body_html = nl2br(esc_html($about_overview_body));
            if ($about_overview_body !== '' && !preg_match('/[\r\n\x{2028}]/u', $about_overview_body)) {
                $about_overview_body_html = preg_replace(
                    '/\s+(?=(?:cylindry i podnośniki|pompy hydrauliczne|ściągacze łożysk|prasy warsztatowe|klucze hydrauliczne|rozpieraki do|żurawiki warsztatowe|urządzenia do produkcji))/u',
                    '<br><span class="c-about-overview__bullet" aria-hidden="true">•</span> ',
                    $about_overview_body_html
                );
                $about_overview_body_html = preg_replace('/\s+(?=Współpracując bezpośrednio)/u', '<br><br>', $about_overview_body_html);
            }
            $about_overview_attachment = static function (int $attachment_id, string $source_node): string {
                if (!$attachment_id) {
                    return '';
                }

                return wp_get_attachment_image($attachment_id, 'full', false, [
                    'alt' => '',
                    'loading' => false,
                    'data-factory-source-node' => $source_node,
                ]);
            };
            ?>
            <section class="c-about-overview-section" data-factory-section="about-overview" data-factory-component="route-section-shell" data-factory-source-node="125:4344">
                <?php if ($about_overview_background_id || $about_overview_image_id) : ?>
                    <div class="c-about-overview__media" data-aos="fade-left" data-aos-delay="100" aria-hidden="true">
                        <?php echo $about_overview_attachment($about_overview_background_id, '125:4345'); ?>
                        <?php echo $about_overview_attachment($about_overview_image_id, '125:4346'); ?>
                    </div>
                <?php endif; ?>
                <div class="c-about-overview__copy" data-aos="fade-right">
                    <h2 class="c-about-overview__heading" data-factory-source-node="125:4332"><?php echo emko_wysiwyg_heading($about_overview_heading); ?></h2>
                    <div class="c-about-overview__body c-wysiwyg" data-factory-source-node="125:4335"><?php echo emko_wysiwyg_content($about_overview_body); ?></div>
                    <span data-factory-source-node="125:4333" data-factory-source-gap="missing-image-export" aria-hidden="true"></span>
                    <a class="c-about-overview__button" href="<?php echo esc_url($about_overview_button_url !== '' ? $about_overview_button_url : '#'); ?>" data-factory-source-node="125:4340"<?php if ($about_overview_button_url === '') : ?> data-factory-source-gap="unresolved-button-destination"<?php endif; ?>>
                        <span><?php echo esc_html($about_overview_button_label); ?></span>
                        <span class="c-about-overview__button-arrow" aria-hidden="true" data-factory-source-gap="unresolved-arrow-export">→</span>
                    </a>
                </div>
            </section>
        <?php elseif ($section_id === 'about-values') : ?>
            <?php
            $about_values_image_id = (int) $option('emko_about_values_image_125_4947');
            $about_values_pattern_mask_id = (int) $option('emko_about_values_pattern_mask_125_4354');
            $about_values_pattern_a_id = (int) $option('emko_about_values_pattern_a_125_4356');
            $about_values_pattern_b_id = (int) $option('emko_about_values_pattern_b_125_4651');
            $about_values_pattern_mask_url = $about_values_pattern_mask_id ? wp_get_attachment_url($about_values_pattern_mask_id) : '';
            $about_values_heading = trim((string) $option('emko_about_values_heading'));
            $about_values_body = trim((string) $option('emko_about_values_body_125_5052'));
            $about_values_body_html = nl2br(esc_html($about_values_body));
            if ($about_values_body !== '' && !preg_match('/[\r\n\x{2028}]/u', $about_values_body)) {
                $about_values_body_html = preg_replace(
                    '/\s+(?=(?:fachowy dobór|testy każdego|kontrolę kompletności|wsparcie serwisowe|asystę przy|szkolenia operatorów|profesjonalne szkolenia))/u',
                    '<br><span class="c-about-values__bullet" aria-hidden="true">•</span> ',
                    $about_values_body_html
                );
                $about_values_body_html = preg_replace('/\s+(?=Nasze podejście opieramy)/u', '<br><br>', $about_values_body_html);
            }
            $about_values_attachment = static function (int $attachment_id, string $source_node, string $alt = ''): string {
                if (!$attachment_id) {
                    return '';
                }

                return wp_get_attachment_image($attachment_id, 'full', false, [
                    'alt' => $alt,
                    'loading' => false,
                    'data-factory-source-node' => $source_node,
                ]);
            };
            ?>
            <section class="c-about-values" data-factory-section="about-values" data-factory-component="route-section-shell" data-factory-source-node="125:4351">
                <div class="c-about-values__patterns-mask" data-factory-source-node="125:4354"<?php if ($about_values_pattern_mask_url !== '') : ?> style="--about-values-pattern-mask-image: url('<?php echo esc_url($about_values_pattern_mask_url); ?>');"<?php else : ?> data-factory-source-gap="missing-native-attachment"<?php endif; ?> aria-hidden="true">
                    <div class="c-about-values__pattern c-about-values__pattern--a">
                        <?php echo $about_values_attachment($about_values_pattern_a_id, '125:4356'); ?>
                    </div>
                    <div class="c-about-values__pattern c-about-values__pattern--b">
                        <?php echo $about_values_attachment($about_values_pattern_b_id, '125:4651'); ?>
                    </div>
                </div>
                <div class="c-about-values__inner l-container">
                    <div class="c-about-values__media" data-aos="fade-right">
                        <?php if ($about_values_image_id) : ?>
                            <?php echo $about_values_attachment($about_values_image_id, '125:4947'); ?>
                        <?php else : ?>
                            <span data-factory-source-node="125:4947" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                        <?php endif; ?>
                    </div>
                    <div class="c-about-values__content" data-aos="fade-left" data-aos-delay="100">
                        <?php if ($about_values_heading !== '') : ?>
                            <h2 data-factory-source-node="125:5051"><?php echo emko_wysiwyg_heading($about_values_heading); ?></h2>
                        <?php endif; ?>
                        <div class="c-wysiwyg" data-factory-source-node="125:5052"><?php echo emko_wysiwyg_content($about_values_body); ?></div>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'about-media-band') : ?>
            <?php
            $about_media_band_image_id = (int) $option('emko_about_media_band_image_125_4967');
            $about_media_band_mask_id = (int) $option('emko_about_media_band_mask_125_4966');
            $about_media_band_find_attachment = static function (int $attachment_id, string $source_node): int {
                if ($attachment_id) {
                    return $attachment_id;
                }

                $attachments = get_posts([
                    'post_type' => 'attachment',
                    'post_status' => 'inherit',
                    'posts_per_page' => 1,
                    'meta_key' => 'data-factory-source-node',
                    'meta_value' => $source_node,
                    'fields' => 'ids',
                ]);

                return !empty($attachments) ? (int) $attachments[0] : 0;
            };
            $about_media_band_image_id = $about_media_band_find_attachment($about_media_band_image_id, '125:4967');
            $about_media_band_mask_id = $about_media_band_find_attachment($about_media_band_mask_id, '125:4966');
            $about_media_band_mask_url = $about_media_band_mask_id ? wp_get_attachment_url($about_media_band_mask_id) : '';
            $about_media_band_body = trim((string) $option('emko_about_media_band_body_125_4963'));
            $about_media_band_intro_heading = trim((string) $option('emko_about_media_band_intro_heading_125_4962'));
            $about_media_band_heading = emko_wysiwyg_heading($option('emko_about_media_band_heading_125_4968'));
            $about_media_band_heading_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', $about_media_band_heading))));
            $about_media_band_button_label = trim((string) $option('emko_about_media_band_button_label_125_5047'));
            $about_media_band_button_url = trim((string) $option('emko_about_media_band_button_url_125_5047'));
            $about_media_band_body_html = nl2br(esc_html($about_media_band_body));
            if ($about_media_band_body !== '' && !preg_match('/[\r\n\x{2028}]/u', $about_media_band_body)) {
                $about_media_band_body_html = preg_replace('/\s+(?=W codziennej pracy)/u', '<br><br>', $about_media_band_body_html);
            }
            ?>
            <section class="c-about-media-band-section" data-factory-section="about-media-band" data-factory-component="route-section-shell" data-factory-source-node="125:4964">
                <div class="c-about-media-band__intro" data-aos="fade-up">
                    <h2 data-factory-source-node="125:4962"><?php echo emko_wysiwyg_heading($about_media_band_intro_heading); ?></h2>
                    <div class="c-wysiwyg" data-factory-source-node="125:4963"><?php echo emko_wysiwyg_content($about_media_band_body); ?></div>
                </div>
                <div class="c-about-media-band" data-aos="fade-up" data-aos-delay="100">
                    <div class="c-about-media-band__clip" data-factory-source-node="125:4966"<?php if ($about_media_band_mask_url !== '') : ?> style="--about-media-band-mask-image: url('<?php echo esc_url($about_media_band_mask_url); ?>');"<?php else : ?> data-factory-source-gap="missing-native-attachment"<?php endif; ?> >
                        <div class="c-about-media-band__surface" data-factory-source-node="125:4965" aria-hidden="true"></div>
                        <?php if ($about_media_band_image_id) : ?>
                            <div class="c-about-media-band__image">
                                <?php echo wp_get_attachment_image($about_media_band_image_id, 'full', false, [
                                    'alt' => '',
                                    'loading' => false,
                                    'data-factory-source-node' => '125:4967',
                                ]); ?>
                            </div>
                        <?php else : ?>
                            <span class="c-about-media-band__image" data-factory-source-node="125:4967" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                        <?php endif; ?>
                        <div class="c-about-media-band__content" data-factory-source-node="125:4968">
                            <?php if (!empty($about_media_band_heading_lines)) : ?>
                                <h2 class="c-about-media-band__heading" data-factory-source-node="125:4968">
                                    <span class="c-about-media-band__heading-primary"><?php echo wp_kses_post($about_media_band_heading_lines[0]); ?></span>
                                    <?php foreach (array_slice($about_media_band_heading_lines, 1) as $heading_line) : ?>
                                        <span class="c-about-media-band__heading-secondary"><?php echo wp_kses_post($heading_line); ?></span>
                                    <?php endforeach; ?>
                                </h2>
                            <?php endif; ?>
                            <a class="c-about-media-band__button" href="<?php echo esc_url($about_media_band_button_url !== '' ? $about_media_band_button_url : '#'); ?>" data-factory-source-node="125:5047"<?php if ($about_media_band_button_url === '') : ?> data-factory-source-gap="unresolved-button-destination"<?php endif; ?> >
                                <span><?php echo esc_html($about_media_band_button_label); ?></span>
                                <span class="c-about-media-band__button-arrow" aria-hidden="true" data-factory-source-gap="unresolved-arrow-export">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        <?php elseif ($section_id === 'product-list-menu') : ?>
            <?php
            $product_menu_heading = trim((string) $option('emko_product_list_menu_heading_125_2809')) ?: 'Kategorie';
            $product_list_overview = $product_list_overview_data();
            $product_list_term = $product_list_overview['term'];
            $product_list_term_id = $product_list_term instanceof WP_Term ? (int) $product_list_term->term_id : 0;
            ?>
            <?php if ($is_product_list_route) : ?><aside class="c-product-list-sidebar" aria-label="Kategorie i filtry produktów"><?php endif; ?>
            <section class="c-product-list-menu c-product-list-menu--archive" data-factory-section="product-list-menu" data-factory-component="product-list-menu">
                <?php emko_render_breadcrumbs('c-product-list-menu__breadcrumb', 'Okruszki'); ?>
                <?php get_template_part('partials/product-category-menu', null, ['context' => 'archive', 'heading' => $product_menu_heading, 'menu_id' => 'product-archive-category-menu', 'active_term_id' => $product_list_term_id]); ?>
            </section>
        <?php elseif ($section_id === 'product-list-overview') : ?>
            <?php $product_list_overview = $product_list_overview_data(); ?>
            <?php if ($product_list_overview['title'] !== '' || $product_list_overview['description'] !== '' || $product_list_overview['image_id']) : ?>
                <section class="c-product-list-menu__overview" data-factory-component="product-list-overview">
                    <div class="c-product-list-menu__overview-copy">
                        <?php if ($product_list_overview['title'] !== '') : ?>
                            <h1 class="c-product-list-menu__overview-title" data-factory-source-node="125:632"><?php echo esc_html($product_list_overview['title']); ?></h1>
                        <?php endif; ?>
                        <?php if ($product_list_overview['description'] !== '') : ?>
                            <div class="c-product-list-menu__overview-description" data-factory-source-node="125:3431"><?php echo wp_kses_post($product_list_overview['description']); ?></div>
                        <?php endif; ?>
                    </div>
                    <?php if ($product_list_overview['image_id']) : ?>
                        <?php echo wp_get_attachment_image($product_list_overview['image_id'], 'full', false, [
                            'class' => 'c-product-list-menu__overview-image',
                            'alt' => $product_list_overview['title'],
                            'loading' => false,
                            'data-factory-source-node' => '125:3212',
                            'data-factory-source-asset' => 'assets/product-detail/product-image-125-3212.png',
                        ]); ?>
                    <?php endif; ?>
                </section>
            <?php endif; ?>
        <?php elseif ($section_id === 'product-list-items') : ?>
            <?php
            $product_list_requested_page = 1;
            if (isset($_GET['product_page']) && !is_array($_GET['product_page'])) {
                $product_list_requested_page = max(1, absint(wp_unslash($_GET['product_page'])));
            }
            $product_list_args = [
                'post_type' => 'product',
                'post_status' => 'publish',
                'posts_per_page' => 12,
                'paged' => $product_list_requested_page,
                'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
                'order' => 'ASC',
            ];
            $product_list_term = function_exists('emko_current_product_category_term') ? emko_current_product_category_term() : null;
            if ($product_list_term instanceof WP_Term) {
                $product_list_args['tax_query'] = [[
                    'taxonomy' => 'product_cat',
                    'field' => 'term_id',
                    'terms' => [(int) $product_list_term->term_id],
                ]];
            }
            $product_list_filter_strength = function_exists('emko_product_filter_request_value') ? emko_product_filter_request_value('strength') : null;
            $product_list_filter_extension = function_exists('emko_product_filter_request_value') ? emko_product_filter_request_value('extension') : null;
            $product_list_has_active_filters = ($product_list_filter_strength !== null && $product_list_filter_strength > 0)
                || ($product_list_filter_extension !== null && $product_list_filter_extension > 0);
            if ($product_list_has_active_filters && function_exists('emko_product_ids_matching_catalogue_filters')) {
                $product_list_args['post__in'] = emko_product_ids_matching_catalogue_filters(
                    $product_list_args,
                    $product_list_filter_strength,
                    $product_list_filter_extension
                ) ?: [0];
            }
            $product_list_query = new WP_Query($product_list_args);
            $product_list_arrow_id = (int) $option('emko_product_list_item_cta_arrow_125_2895');
            $product_list_posts = $product_list_query->posts;
            $product_list_live_count = (int) $product_list_query->found_posts;
            $product_list_image_nodes = [
                '125:2881', '125:2882', '125:2883', '125:2884',
                '125:2917', '125:2918', '125:2919', '125:2920',
                '125:2953', '125:2954', '125:2955', '125:2956',
            ];
            $product_list_image_assets = [
                'assets/product-list-items/product-image-125-2881.png',
                'assets/product-list-items/product-image-125-2882.png',
                'assets/product-list-items/product-image-125-2883.png',
                'assets/product-list-items/product-image-125-2884.png',
                'assets/product-list-items/product-image-125-2917.png',
                'assets/product-list-items/product-image-125-2918.png',
                'assets/product-list-items/product-image-125-2919.png',
                'assets/product-list-items/product-image-125-2920.png',
                'assets/product-list-items/product-image-125-2953.png',
                'assets/product-list-items/product-image-125-2954.png',
                'assets/product-list-items/product-image-125-2955.png',
                'assets/product-list-items/product-image-125-2956.png',
            ];
            $product_list_total_pages = max(1, (int) $product_list_query->max_num_pages);
            $product_list_current_page = min($product_list_total_pages, $product_list_requested_page);
            $product_list_page_url = static function (int $page) use ($product_list_term, $product_list_filter_strength, $product_list_filter_extension): string {
                // `paged` belongs to WordPress's main query. This listing uses a
                // separate product query, so its page number must not make the
                // root query resolve to a non-existent archive page.
                $url = remove_query_arg(['paged', 'product_page'], get_pagenum_link(1));
                $query_args = [];

                if ($product_list_term instanceof WP_Term && !is_tax('product_cat')) {
                    $query_args['product_cat'] = $product_list_term->slug;
                }
                if ($product_list_filter_strength !== null) {
                    $query_args['strength'] = $product_list_filter_strength;
                }
                if ($product_list_filter_extension !== null) {
                    $query_args['extension'] = $product_list_filter_extension;
                }
                if ($page > 1) {
                    $query_args['product_page'] = $page;
                }

                return $query_args ? add_query_arg($query_args, $url) : $url;
            };
            $product_list_page_links = paginate_links([
                'base' => str_replace(999999999, '%#%', esc_url_raw($product_list_page_url(999999999))),
                'format' => '',
                'current' => $product_list_current_page,
                'total' => $product_list_total_pages,
                'type' => 'array',
                'mid_size' => 1,
                'end_size' => 1,
                'prev_next' => false,
            ]);
            ?>
            <section class="c-product-list-items" data-factory-section="product-list-items" data-factory-component="product-card-grid" data-factory-source-node="125:2878">
                <?php if ($product_list_posts) : ?>
                    <?php foreach ($product_list_posts as $product_list_index => $product_list_post) : setup_postdata($product_list_post); ?>
                        <?php
                        $product_id = (int) $product_list_post->ID;
                        $product_title = get_the_title($product_id);
                        $product_description = (string) get_post_field('post_excerpt', $product_id);
                        $product_content = function_exists('get_field') ? (array) get_field('emko_product_content', $product_id) : [];
                        $product_description = trim((string) ($product_content['description'] ?? '')) ?: $product_description;
                        if ($product_description !== '' && $product_description === wp_strip_all_tags($product_description)) {
                            $product_description = wpautop($product_description);
                        }
                        $product_specs = function_exists('get_field') ? get_field('emko_product_technical_data', $product_id) : [];
                        $product_specs = is_array($product_specs) ? array_values($product_specs) : [];
                        $product_spec_source_nodes = [
                            '125:2887' => '125:2891',
                            '125:2888' => '125:2908',
                            '125:2889' => '125:2909',
                            '125:2890' => '125:2910',
                        ];
                        $product_source_node = (string) get_post_meta($product_id, '_emko_source_node', true);
                        $product_image_id = (int) get_post_thumbnail_id($product_id);
                        $product_image_source_node = $product_image_id ? (string) get_post_meta($product_image_id, 'data-factory-source-node', true) : '';
                        $product_image_source_node = $product_image_source_node ?: (string) get_post_meta($product_image_id, '_emko_source_node', true);
                        $product_image_source_asset = $product_image_id ? (string) get_post_meta($product_image_id, '_emko_source_asset', true) : '';
                        $product_is_demo_clone = get_post_meta($product_id, '_emko_demo_clone', true) === '1' || $product_list_index >= 4;
                        $product_clone_of = (string) get_post_meta($product_id, '_emko_demo_clone_of', true);
                        if ($product_clone_of === '' && $product_is_demo_clone) {
                            $product_clone_of = $product_source_node;
                        }
                        if ($product_list_index < count($product_list_image_nodes)) {
                            $product_image_source_node = $product_list_image_nodes[$product_list_index];
                            $product_image_source_asset = $product_list_image_assets[$product_list_index];
                        }
                        $product_cta_label = trim((string) get_post_meta($product_id, '_emko_source_cta_label', true)) ?: 'Sprawdź szczegóły';
                        $product_cta_node = (string) get_post_meta($product_id, '_emko_source_cta_node', true);
                        $product_url = get_permalink($product_id);
                        ?>
                        <article class="c-product-list-items__card" data-factory-component="product-card" data-factory-source-node="<?php echo esc_attr($product_source_node); ?>"<?php if ($product_is_demo_clone) : ?> data-factory-demo-clone="true" data-factory-clone-of="<?php echo esc_attr($product_clone_of); ?>"<?php endif; ?>>
                            <div class="c-product-list-items__media">
                                <a class="c-product-list-items__media-link" href="<?php echo esc_url($product_url); ?>" aria-label="<?php echo esc_attr(sprintf('Zobacz produkt: %s', $product_title)); ?>">
                                    <?php if ($product_image_id) : ?>
                                        <?php echo wp_get_attachment_image($product_image_id, 'full', false, [
                                            'class' => 'c-product-list-items__image',
                                            'alt' => $product_title,
                                            'loading' => false,
                                            'data-factory-source-node' => $product_image_source_node,
                                            'data-factory-source-asset' => $product_image_source_asset,
                                        ]); ?>
                                    <?php else : ?>
                                        <span class="c-product-list-items__image" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                    <?php endif; ?>
                                </a>
                            </div>
                            <h2 class="c-product-list-items__title" data-factory-source-node="<?php echo esc_attr($product_source_node); ?>"><a class="c-product-list-items__title-link" href="<?php echo esc_url($product_url); ?>"><?php echo esc_html($product_title); ?></a></h2>
                            <?php if ($product_description !== '') : ?>
                                <div class="c-product-list-items__description" data-factory-source-node="<?php echo esc_attr($product_source_node); ?>"><?php echo wp_kses_post($product_description); ?></div>
                            <?php endif; ?>
                            <?php if ($product_specs) : ?>
                                <dl class="c-product-list-items__specifications" data-factory-source-node="<?php echo esc_attr($product_spec_source_nodes[$product_source_node] ?? $product_source_node); ?>">
                                    <?php foreach ($product_specs as $product_spec) : ?>
                                        <?php
                                        $spec_label = trim((string) ($product_spec['label'] ?? ''));
                                        $spec_value = trim((string) ($product_spec['value'] ?? ''));
                                        if ($spec_label === '' && $spec_value === '') { continue; }
                                        $spec_label = rtrim($spec_label, ':') . ':';
                                        ?>
                                        <div class="c-product-list-items__specification">
                                            <dt><?php echo esc_html($spec_label); ?></dt>
                                            <dd><?php echo esc_html($spec_value); ?></dd>
                                        </div>
                                    <?php endforeach; ?>
                                </dl>
                            <?php endif; ?>
                            <a class="c-product-list-items__button" href="<?php echo esc_url($product_url); ?>" data-factory-source-node="<?php echo esc_attr($product_cta_node); ?>">
                                <span><?php echo esc_html($product_cta_label); ?></span>
                                <?php if ($product_list_arrow_id) : ?>
                                    <?php echo wp_get_attachment_image($product_list_arrow_id, 'full', false, [
                                        'class' => 'c-product-list-items__button-icon',
                                        'alt' => '',
                                        'aria-hidden' => 'true',
                                        'loading' => false,
                                        'data-factory-source-node' => '125:2895',
                                    ]); ?>
                                <?php else : ?>
                                    <span class="c-product-list-items__button-icon" data-factory-source-node="125:2895" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                <?php endif; ?>
                            </a>
                        </article>
                    <?php endforeach; wp_reset_postdata(); ?>
                <?php elseif ($product_list_has_active_filters) : ?>
                    <p class="c-product-list-items__empty" role="status">Nie znaleziono produktów spełniających wybrane parametry.</p>
                <?php endif; ?>
                <?php if ($product_list_live_count > 0 && $product_list_total_pages > 1 && $product_list_page_links) : ?>
                    <nav class="c-product-list-items__pagination" aria-label="<?php echo esc_attr__('Strony produktów', 'emko'); ?>" data-factory-component="product-pagination">
                        <?php if ($product_list_current_page > 1) : ?>
                            <a class="c-product-list-items__pagination-control c-product-list-items__pagination-control--first" href="<?php echo esc_url($product_list_page_url(1)); ?>" aria-label="<?php echo esc_attr__('Pierwsza strona', 'emko'); ?>">«</a>
                            <a class="c-product-list-items__pagination-control c-product-list-items__pagination-control--previous" href="<?php echo esc_url($product_list_page_url($product_list_current_page - 1)); ?>" aria-label="<?php echo esc_attr__('Poprzednia strona', 'emko'); ?>">‹</a>
                        <?php else : ?>
                            <span class="c-product-list-items__pagination-control is-disabled" aria-hidden="true">«</span>
                            <span class="c-product-list-items__pagination-control is-disabled" aria-hidden="true">‹</span>
                        <?php endif; ?>
                        <?php foreach ($product_list_page_links as $product_list_page_link) : ?>
                            <?php echo wp_kses_post($product_list_page_link); ?>
                        <?php endforeach; ?>
                        <?php if ($product_list_current_page < $product_list_total_pages) : ?>
                            <a class="c-product-list-items__pagination-control c-product-list-items__pagination-control--next" href="<?php echo esc_url($product_list_page_url($product_list_current_page + 1)); ?>" aria-label="<?php echo esc_attr__('Następna strona', 'emko'); ?>">›</a>
                            <a class="c-product-list-items__pagination-control c-product-list-items__pagination-control--last" href="<?php echo esc_url($product_list_page_url($product_list_total_pages)); ?>" aria-label="<?php echo esc_attr__('Ostatnia strona', 'emko'); ?>">»</a>
                        <?php else : ?>
                            <span class="c-product-list-items__pagination-control is-disabled" aria-hidden="true">›</span>
                            <span class="c-product-list-items__pagination-control is-disabled" aria-hidden="true">»</span>
                        <?php endif; ?>
                    </nav>
                <?php endif; ?>
            </section>
        <?php elseif ($section_id === 'product-list-filters') : ?>
            <?php
            $product_filters_heading = trim((string) $option('emko_product_list_filters_heading_125_2988'));
            $product_filters_strength_label = trim((string) $option('emko_product_list_filters_strength_label_125_2990'));
            $product_filters_strength_unit = trim((string) $option('emko_product_list_filters_strength_unit_125_2990'));
            $product_filters_strength_min = trim((string) $option('emko_product_list_filters_strength_min_125_2994'));
            $product_filters_strength_max = trim((string) $option('emko_product_list_filters_strength_max_125_2995'));
            $product_filters_extension_label = trim((string) $option('emko_product_list_filters_extension_label_125_2998'));
            $product_filters_extension_unit = trim((string) $option('emko_product_list_filters_extension_unit_125_2998'));
            $product_filters_extension_min = trim((string) $option('emko_product_list_filters_extension_min_125_3001'));
            $product_filters_extension_max = trim((string) $option('emko_product_list_filters_extension_max_125_3002'));
            $product_filters_button_label = trim((string) $option('emko_product_list_filters_button_125_3006'));
            $product_filters_icon_id = (int) $option('emko_product_list_filters_button_icon_125_3007');
            $product_filters_strength_requested = function_exists('emko_product_filter_request_value') ? emko_product_filter_request_value('strength') : null;
            $product_filters_extension_requested = function_exists('emko_product_filter_request_value') ? emko_product_filter_request_value('extension') : null;
            $product_filters_strength_value = $product_filters_strength_requested ?? 260;
            $product_filters_extension_value = $product_filters_extension_requested ?? 260;
            $product_filters_action = function_exists('emko_product_filter_form_action') ? emko_product_filter_form_action() : home_url('/produkty/');
            $product_filters_term = function_exists('emko_current_product_category_term') ? emko_current_product_category_term() : null;
            ?>
            <section class="c-product-list-filters" data-factory-section="product-list-filters" data-factory-component="product-list-filters" data-factory-source-node="125:2986">
                <form class="c-product-list-filters__form" method="get" action="<?php echo esc_url($product_filters_action); ?>"<?php if ($product_filters_term instanceof WP_Term) : ?> data-product-category="<?php echo esc_attr($product_filters_term->slug); ?>"<?php endif; ?>>
                    <?php if ($product_filters_heading !== '') : ?>
                        <h2 class="c-product-list-filters__heading" data-factory-source-node="125:2988"><?php echo esc_html($product_filters_heading); ?></h2>
                    <?php endif; ?>
                    <div class="c-product-list-filters__slider" data-factory-source-node="125:2989">
                        <label class="c-product-list-filters__label" for="product-filter-strength" data-factory-source-node="125:2990">
                            <span><?php echo esc_html($product_filters_strength_label); ?></span>
                            <?php if ($product_filters_strength_unit !== '') : ?><small><?php echo esc_html($product_filters_strength_unit); ?></small><?php endif; ?>
                        </label>
                        <div class="c-product-list-filters__range" data-factory-source-node="125:2991">
                            <span class="c-product-list-filters__track" data-factory-source-node="125:2991" aria-hidden="true"></span>
                            <span class="c-product-list-filters__value-track" data-factory-source-node="125:2992" aria-hidden="true"></span>
                            <output class="c-product-list-filters__range-value c-product-list-filters__range-value--min" data-factory-source-node="125:2994" for="product-filter-strength"><?php echo esc_html($product_filters_strength_min); ?></output>
                            <output class="c-product-list-filters__range-value c-product-list-filters__range-value--max" data-factory-source-node="125:2995" for="product-filter-strength"><?php echo esc_html($product_filters_strength_max); ?></output>
                            <input id="product-filter-strength" class="c-product-list-filters__input" type="range" name="strength" min="0" max="500" value="<?php echo esc_attr((string) $product_filters_strength_value); ?>" aria-label="<?php echo esc_attr($product_filters_strength_label); ?>" data-factory-source-node="125:2992">
                            <span class="c-product-list-filters__handle" data-factory-source-node="125:2996" aria-hidden="true"></span>
                        </div>
                        <span class="c-product-list-filters__separator" data-factory-source-node="125:2993" aria-hidden="true"></span>
                    </div>
                    <div class="c-product-list-filters__slider" data-factory-source-node="125:2997">
                        <label class="c-product-list-filters__label" for="product-filter-extension" data-factory-source-node="125:2998">
                            <span><?php echo esc_html($product_filters_extension_label); ?></span>
                            <?php if ($product_filters_extension_unit !== '') : ?><small><?php echo esc_html($product_filters_extension_unit); ?></small><?php endif; ?>
                        </label>
                        <div class="c-product-list-filters__range" data-factory-source-node="125:2999">
                            <span class="c-product-list-filters__track" data-factory-source-node="125:2999" aria-hidden="true"></span>
                            <span class="c-product-list-filters__value-track" data-factory-source-node="125:3000" aria-hidden="true"></span>
                            <output class="c-product-list-filters__range-value c-product-list-filters__range-value--min" data-factory-source-node="125:3001" for="product-filter-extension"><?php echo esc_html($product_filters_extension_min); ?></output>
                            <output class="c-product-list-filters__range-value c-product-list-filters__range-value--max" data-factory-source-node="125:3002" for="product-filter-extension"><?php echo esc_html($product_filters_extension_max); ?></output>
                            <input id="product-filter-extension" class="c-product-list-filters__input" type="range" name="extension" min="0" max="500" value="<?php echo esc_attr((string) $product_filters_extension_value); ?>" aria-label="<?php echo esc_attr($product_filters_extension_label); ?>" data-factory-source-node="125:3000">
                            <span class="c-product-list-filters__handle" data-factory-source-node="125:3003" aria-hidden="true"></span>
                        </div>
                    </div>
                    <button class="c-product-list-filters__button" type="submit" data-factory-source-node="125:3004">
                        <span data-factory-source-node="125:3006"><?php echo esc_html($product_filters_button_label); ?></span>
                        <?php if ($product_filters_icon_id) : ?>
                            <?php echo wp_get_attachment_image($product_filters_icon_id, 'full', false, ['class' => 'c-product-list-filters__button-icon', 'alt' => '', 'aria-hidden' => 'true', 'loading' => false, 'data-factory-source-node' => '125:3007']); ?>
                        <?php else : ?>
                            <span class="c-product-list-filters__button-icon" data-factory-source-node="125:3007" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                        <?php endif; ?>
                    </button>
                </form>
            </section>
            <?php if ($is_product_list_route) : ?></aside><?php endif; ?>
        <?php elseif ($section_id === 'product-detail') : ?>
            <?php
            $detail_queried_id = (int) get_queried_object_id();
            if (!$detail_queried_id && !empty($_GET['product'])) {
                $detail_product_path = sanitize_title(wp_unslash((string) $_GET['product']));
                $detail_product_post = get_page_by_path($detail_product_path, OBJECT, 'product');
                $detail_queried_id = $detail_product_post ? (int) $detail_product_post->ID : 0;
            }
            $detail_product = ($detail_queried_id && function_exists('wc_get_product') && get_post_type($detail_queried_id) === 'product')
                ? wc_get_product($detail_queried_id)
                : false;
            $detail_product_content = $detail_product ? (array) get_field('emko_product_content', $detail_queried_id) : [];
            $detail_product_description = $detail_product ? trim((string) get_field('emko_product_description', $detail_queried_id)) : '';
            $detail_product_benefits = $detail_product ? (array) get_field('emko_product_benefits', $detail_queried_id) : [];
            $detail_image_id = $detail_product ? (int) get_post_thumbnail_id($detail_queried_id) : 0;
            $detail_gallery_images = [];
            foreach ((array) ($detail_product ? get_field('emko_product_gallery', $detail_queried_id) : []) as $detail_gallery_image_id) {
                $detail_gallery_image_id = is_array($detail_gallery_image_id)
                    ? (int) ($detail_gallery_image_id['ID'] ?? $detail_gallery_image_id['id'] ?? 0)
                    : (int) $detail_gallery_image_id;
                if ($detail_gallery_image_id) {
                    $detail_gallery_images[] = $detail_gallery_image_id;
                }
            }
            $detail_description = $detail_product_description ?: trim((string) ($detail_product_content['description'] ?? ''));
            $detail_features = '';
            if (isset($detail_product_benefits['content'])) {
                $detail_features = (string) $detail_product_benefits['content'];
            } else {
                foreach ($detail_product_benefits as $detail_product_benefit) {
                    $detail_features .= trim((string) ($detail_product_benefit['label'] ?? '')) . "\n";
                }
            }
            $detail_contact = (array) ($detail_product ? get_field('emko_product_inquiry', $detail_queried_id) : []);
            $detail_downloads = (array) ($detail_product ? get_field('emko_product_downloads', $detail_queried_id) : []);
            $detail_contact_label = trim((string) ($detail_contact['heading'] ?? ''));
            $detail_product_sku = $detail_product ? trim((string) $detail_product->get_sku()) : '';
            $detail_inquiry_subject = $detail_product ? sprintf(
                'Zapytanie ofertowe: %s%s',
                $detail_product->get_name(),
                $detail_product_sku !== '' ? ' (SKU: ' . $detail_product_sku . ')' : ''
            ) : '';
            $detail_download_label = trim((string) ($detail_downloads[0]['label'] ?? ''));
            $detail_download_file_id = (int) ($detail_downloads[0]['file'] ?? 0);
            $detail_download_url = $detail_download_file_id ? wp_get_attachment_url($detail_download_file_id) : '';
            $detail_download_icon_id = (int) $option('emko_product_detail_download_icon_125_3434');
            $detail_title = $detail_product ? trim((string) $detail_product->get_name()) : '';
            $detail_menu_heading = trim((string) $option('emko_product_list_menu_heading_125_2809')) ?: 'Kategorie';
            $detail_menu_arrow_id = (int) $option('emko_product_list_menu_category_arrow_125_2762');
            $detail_menu_categories = [];
            $detail_menu_terms = get_terms([
                'taxonomy' => 'product_cat',
                'hide_empty' => true,
                'parent' => 0,
                'orderby' => 'menu_order',
                'order' => 'ASC',
            ]);
            if (!is_wp_error($detail_menu_terms)) {
                foreach ($detail_menu_terms as $detail_menu_term) {
                    $detail_menu_term_url = get_term_link($detail_menu_term);
                    if (is_wp_error($detail_menu_term_url)) {
                        continue;
                    }

                    $detail_menu_products = get_posts([
                        'post_type' => 'product',
                        'post_status' => 'publish',
                        'posts_per_page' => 6,
                        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
                        'order' => 'ASC',
                        'fields' => 'ids',
                        'tax_query' => [[
                            'taxonomy' => 'product_cat',
                            'field' => 'term_id',
                            'terms' => [(int) $detail_menu_term->term_id],
                        ]],
                    ]);

                    if (!$detail_menu_products) {
                        continue;
                    }

                    $detail_menu_categories[] = [
                        'term' => $detail_menu_term,
                        'url' => $detail_menu_term_url,
                        'products' => $detail_menu_products,
                    ];
                }
            }
            $detail_features_list = isset($detail_product_benefits['content'])
                ? []
                : ($detail_features !== ''
                ? preg_split('/(?=niski,|antyślizgowa|tłoczysko|szybkozłączka|pierścień|możliwość|opcjonalna)/u', $detail_features, -1, PREG_SPLIT_NO_EMPTY)
                : []);
            ?>
            <section class="c-product-detail l-container" data-factory-section="product-detail" data-factory-component="route-section-shell" data-factory-source-node="125:3211">
                <?php if ($detail_menu_categories) : ?>
                    <details class="c-product-detail__mobile-categories">
                        <summary><?php echo esc_html($detail_menu_heading); ?></summary>
                        <ul>
                            <?php foreach ($detail_menu_categories as $detail_menu_category) : ?>
                                <?php $detail_menu_term = $detail_menu_category['term']; ?>
                                <li>
                                    <a href="<?php echo esc_url($detail_menu_category['url']); ?>"><?php echo esc_html($detail_menu_term->name); ?></a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </details>
                <?php endif; ?>
                <?php emko_render_breadcrumbs('c-product-detail__breadcrumb c-page-banner__breadcrumb', 'Breadcrumb'); ?>
                <?php if ($detail_menu_categories) : ?>
                    <aside class="c-product-detail__menu c-product-list-menu" data-factory-component="product-list-menu">
                        <?php get_template_part('partials/product-category-menu', null, ['context' => 'sidebar', 'heading' => $detail_menu_heading, 'menu_id' => 'product-detail-category-menu']); ?>
                    </aside>
                <?php endif; ?>

                <div class="c-product-detail__content">
                    <?php if ($detail_title !== '') : ?>
                        <h1 class="c-product-detail__title" data-factory-source-node="125:3430"><?php echo esc_html($detail_title); ?></h1>
                    <?php else : ?>
                        <h1 class="c-product-detail__title" data-factory-source-gap="missing-native-product-title" aria-label="Produkt"></h1>
                    <?php endif; ?>
                    <?php if ($detail_description !== '') : ?>
                        <div class="c-product-detail__description" data-factory-source-node="125:3431"><?php echo wp_kses_post(wpautop($detail_description)); ?></div>
                    <?php endif; ?>
                    <?php if ($detail_contact_label !== '' || $detail_download_label !== '') : ?>
                        <div class="c-product-detail__actions" data-factory-component="product-detail-actions">
                            <?php if ($detail_contact_label !== '') : ?>
                                <a class="c-product-detail__action c-product-detail__action--contact" href="#footer-contact-form" data-product-inquiry-subject="<?php echo esc_attr($detail_inquiry_subject); ?>" data-factory-source-node="125:3435">
                                    <span data-factory-source-node="125:3437"><?php echo esc_html($detail_contact_label); ?></span>
                                    <span aria-hidden="true">→</span>
                            </a>
                            <?php endif; ?>
                            <?php if ($detail_download_label !== '') : ?>
                                <?php if ($detail_download_url) : ?>
                                    <a class="c-product-detail__action c-product-detail__action--download" href="<?php echo esc_url($detail_download_url); ?>" target="_blank" rel="noopener" data-factory-source-node="125:3432">
                                <?php else : ?>
                                    <span class="c-product-detail__action c-product-detail__action--download" aria-disabled="true" data-factory-source-node="125:3432" data-factory-source-gap="missing-source-url">
                                <?php endif; ?>
                                    <?php if ($detail_download_icon_id) : ?>
                                        <?php echo wp_get_attachment_image($detail_download_icon_id, 'full', false, ['class' => 'c-product-detail__download-icon', 'alt' => '', 'aria-hidden' => 'true', 'loading' => false, 'data-factory-source-node' => '125:3434']); ?>
                                    <?php endif; ?>
                                    <span data-factory-source-node="125:3433"><?php echo esc_html($detail_download_label); ?></span>
                                <?php echo $detail_download_url ? '</a>' : '</span>'; ?>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                    <?php if (isset($detail_product_benefits['title']) && trim((string) $detail_product_benefits['title']) !== '') : ?>
                        <div class="c-product-detail__benefits-heading"><?php echo wp_kses_post($detail_product_benefits['title']); ?></div>
                    <?php endif; ?>
                    <?php if (isset($detail_product_benefits['content']) && trim((string) $detail_product_benefits['content']) !== '') : ?>
                        <div class="c-product-detail__features c-wysiwyg"><?php echo wp_kses_post($detail_product_benefits['content']); ?></div>
                    <?php endif; ?>
                    <?php if ($detail_features_list) : ?>
                        <div class="c-product-detail__features c-wysiwyg" data-factory-source-node="125:3440">
                            <ul>
                                <?php foreach ($detail_features_list as $detail_feature) : ?>
                                    <li><?php echo esc_html(trim($detail_feature)); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </div>

                <figure class="c-product-detail__media viewer-js" data-factory-component="product-detail-media" data-factory-section="product-gallery"<?php if (!$detail_image_id) : ?> data-factory-source-gap="missing-native-attachment"<?php endif; ?>>
                    <?php if ($detail_image_id) : ?>
                        <?php echo wp_get_attachment_image($detail_image_id, 'full', false, ['class' => 'c-product-detail__image', 'alt' => $detail_title, 'role' => 'button', 'tabindex' => '0', 'aria-label' => sprintf('Powiększ obraz główny: %s', $detail_title), 'loading' => false, 'data-product-gallery-image' => '', 'data-factory-source-node' => '125:3212', 'data-factory-source-asset' => 'assets/product-detail/product-image-125-3212.png']); ?>
                    <?php endif; ?>
                    <?php if ($detail_gallery_images) : ?>
                        <div class="c-product-detail__gallery" data-factory-component="product-gallery">
                            <?php foreach ($detail_gallery_images as $detail_gallery_image_index => $detail_gallery_image_id) : ?>
                                <?php echo wp_get_attachment_image($detail_gallery_image_id, 'full', false, [
                                    'class' => 'c-product-detail__gallery-image',
                                    'alt' => $detail_title,
                                    'role' => 'button',
                                    'tabindex' => '0',
                                    'aria-label' => sprintf('Powiększ obraz %d: %s', $detail_gallery_image_index + 1, $detail_title),
                                    'loading' => false,
                                    'data-product-gallery-image' => '',
                                    'data-factory-source-node' => $detail_gallery_image_index === 0 ? '125:3214' : '125:3216',
                                ]); ?>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </figure>
            </section>
        <?php elseif ($section_id === 'product-specification') : ?>
            <?php
            $product_specification_product_id = (int) get_queried_object_id();
            if (!$product_specification_product_id && !empty($_GET['product'])) {
                $product_specification_post = get_page_by_path(sanitize_title(wp_unslash((string) $_GET['product'])), OBJECT, 'product');
                $product_specification_product_id = $product_specification_post ? (int) $product_specification_post->ID : 0;
            }
            $product_specification_headers = array_values(array_map('trim', explode('|', (string) get_field('emko_product_specification_headers', $product_specification_product_id))));
            $product_specification_rows = [];
            $product_specification_saved_rows = (array) get_field('emko_product_specification_rows', $product_specification_product_id);
            foreach ($product_specification_saved_rows as $product_specification_row_index => $product_specification_saved_row) {
                $product_specification_row = (string) ($product_specification_saved_row['cells'] ?? '');
                $product_specification_rows[] = [
                    'source_node' => 'product:' . ($product_specification_row_index + 1),
                    'cells' => array_values(array_map('trim', explode('|', $product_specification_row))),
                ];
            }
            $product_specification_table = (array) get_field('emko_product_specification_table', $product_specification_product_id);
            $product_specification_columns = array_values(array_filter(array_map(static fn ($column): string => trim((string) ($column['label'] ?? '')), (array) ($product_specification_table['columns'] ?? []))));
            $product_specification_dynamic_rows = (array) ($product_specification_table['rows'] ?? []);
            if ($product_specification_columns) {
                $product_specification_headers = $product_specification_columns;
                $product_specification_rows = [];
                foreach ($product_specification_dynamic_rows as $product_specification_row_index => $product_specification_dynamic_row) {
                    $product_specification_rows[] = [
                        'source_node' => 'product:' . ($product_specification_row_index + 1),
                        'cells' => array_values(array_map('trim', explode('|', (string) ($product_specification_dynamic_row['cells'] ?? '')))),
                    ];
                }
            }
            $product_specification_rows = array_values(array_filter($product_specification_rows, static function (array $row): bool {
                foreach ((array) ($row['cells'] ?? []) as $cell) {
                    if (trim((string) $cell) !== '') {
                        return true;
                    }
                }

                return false;
            }));
            $product_specification_use = (array) get_field('emko_product_specification_use', $product_specification_product_id);
            $product_specification_features = (array) get_field('emko_product_specification_features', $product_specification_product_id);
            $product_specification_tabs = [];
            if ($product_specification_headers && $product_specification_rows) {
                $product_specification_tabs[] = [
                    'key' => 'table',
                    'label' => trim(wp_strip_all_tags((string) ($product_specification_table['title'] ?? ''))) ?: 'Tabela',
                ];
            }
            if (trim(wp_strip_all_tags((string) ($product_specification_use['content'] ?? ''))) !== '') {
                $product_specification_tabs[] = [
                    'key' => 'use',
                    'label' => trim(wp_strip_all_tags((string) ($product_specification_use['title'] ?? ''))) ?: 'Zastosowanie cylindrów CMP',
                    'content' => (string) $product_specification_use['content'],
                ];
            }
            if (trim(wp_strip_all_tags((string) ($product_specification_features['content'] ?? ''))) !== '') {
                $product_specification_tabs[] = [
                    'key' => 'features',
                    'label' => trim(wp_strip_all_tags((string) ($product_specification_features['title'] ?? ''))) ?: 'Co nas wyróżnia ?',
                    'content' => (string) $product_specification_features['content'],
                ];
            }
            ?>
            <?php if ($product_specification_tabs) : ?>
            <section class="c-product-specification-section" data-factory-section="product-specification" data-factory-component="route-section-shell" data-factory-source-node="125:3320">
                <div class="c-product c-product-specification" data-factory-component="product-specification">
                <div class="c-product-specification__tabs" role="tablist" aria-label="Specyfikacja produktu" data-factory-source-node="125:3320">
                    <?php foreach ($product_specification_tabs as $product_specification_tab_index => $product_specification_tab) : ?>
                        <?php
                        $product_specification_tab_key = $product_specification_tab['key'];
                        $product_specification_tab_id = 'product-specification-tab-' . sanitize_title($product_specification_tab_key);
                        $product_specification_panel_id = 'product-specification-panel-' . sanitize_title($product_specification_tab_key);
                        ?>
                        <button class="c-product-specification__tab<?php echo $product_specification_tab_index === 0 ? ' is-active' : ''; ?>" type="button" id="<?php echo esc_attr($product_specification_tab_id); ?>" role="tab" aria-controls="<?php echo esc_attr($product_specification_panel_id); ?>" aria-selected="<?php echo $product_specification_tab_index === 0 ? 'true' : 'false'; ?>" data-product-tab="<?php echo esc_attr($product_specification_tab_key); ?>" data-factory-source-node="125:3321">
                            <?php echo esc_html($product_specification_tab['label']); ?>
                        </button>
                    <?php endforeach; ?>
                </div>
                <?php foreach ($product_specification_tabs as $product_specification_tab_index => $product_specification_tab) : ?>
                    <?php $product_specification_tab_key = $product_specification_tab['key']; ?>
                    <div class="c-product-specification__panel<?php echo $product_specification_tab_index === 0 ? ' is-active' : ''; ?>" id="product-specification-panel-<?php echo esc_attr(sanitize_title($product_specification_tab_key)); ?>" role="tabpanel" aria-labelledby="product-specification-tab-<?php echo esc_attr(sanitize_title($product_specification_tab_key)); ?>" aria-hidden="<?php echo $product_specification_tab_index === 0 ? 'false' : 'true'; ?>" data-product-panel="<?php echo esc_attr($product_specification_tab_key); ?>"<?php echo $product_specification_tab_key === 'table' ? ' data-factory-source-node="125:3411"' : ''; ?>>
                        <?php if ($product_specification_tab_key === 'table') : ?>
                            <div class="c-product-specification__table-wrap">
                                <table class="c-product-specification__table">
                                    <thead>
                                        <tr data-factory-source-node="125:3411">
                                            <?php foreach ($product_specification_headers as $product_specification_header) : ?>
                                                <th scope="col" data-factory-source-node="125:3420"><?php echo esc_html($product_specification_header); ?></th>
                                            <?php endforeach; ?>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($product_specification_rows as $product_specification_row) : ?>
                                            <tr data-factory-source-node="<?php echo esc_attr($product_specification_row['source_node']); ?>">
                                                <?php foreach ($product_specification_row['cells'] as $product_specification_cell) : ?>
                                                    <td><span class="c-product-specification__cell-content"><?php echo esc_html($product_specification_cell); ?></span></td>
                                                <?php endforeach; ?>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else : ?>
                            <div class="c-product-specification__content-body c-wysiwyg"><?php echo wp_kses_post($product_specification_tab['content']); ?></div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                </div>
            </section>
            <?php endif; ?>
        <?php elseif ($section_id === 'product-related') : ?>
            <?php
            $product_related_heading = trim((string) $option('emko_product_related_heading_125_3277'));
            $product_related_all_label = trim((string) $option('emko_product_related_all_label_125_3279'));
            $product_related_all_icon_id = (int) $option('emko_product_related_all_icon_125_3281');
            $product_related_card_arrow_id = (int) $option('emko_product_related_card_arrow_130_14');
            $product_related_card_nodes = [
                '125:3287' => ['card' => '125:3274', 'media' => '125:3273', 'description' => '125:3293', 'asset' => 'assets/product-related/product-image-125-3273.png'],
                '125:3285' => ['card' => '125:3276', 'media' => '125:3276', 'description' => '125:3291', 'asset' => 'assets/product-related/product-image-125-3276.png'],
                '125:3286' => ['card' => '125:3273', 'media' => '125:3273', 'description' => '125:3292', 'asset' => 'assets/product-related/product-image-125-3273.png'],
                '125:3288' => ['card' => '125:3289', 'media' => '125:3289', 'description' => '125:3294', 'asset' => 'assets/product-related/product-image-125-3289.png'],
                '125:3290' => ['card' => '125:3275', 'media' => '125:3275', 'description' => '125:3295', 'asset' => 'assets/product-related/product-image-125-3275.png'],
            ];
            $product_related_owner_id = (int) get_queried_object_id();
            if (!$product_related_owner_id && !empty($_GET['product'])) {
                $product_related_post = get_page_by_path(sanitize_title(wp_unslash((string) $_GET['product'])), OBJECT, 'product');
                $product_related_owner_id = $product_related_post ? (int) $product_related_post->ID : 0;
            }
            $product_related_ids = array_values(array_filter(array_map(static function ($product_related_item): int {
                return is_object($product_related_item) ? (int) $product_related_item->ID : (int) $product_related_item;
            }, (array) get_field('emko_product_related_products', $product_related_owner_id)), static function (int $product_related_id) use ($product_related_owner_id): bool {
                return $product_related_id > 0
                    && $product_related_id !== $product_related_owner_id
                    && get_post_type($product_related_id) === 'product'
                    && get_post_status($product_related_id) === 'publish';
            }));
            $product_related_ids = array_slice($product_related_ids, 0, 5);
            $product_related_archive_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('product') : false;
            $product_related_archive_url = $product_related_archive_url ?: home_url('/produkty/');
            ?>
            <?php if ($product_related_ids) : ?>
            <section class="c-product-related l-container" data-factory-section="product-related" data-factory-component="route-section-shell" data-factory-source-node="125:3270">
                <header class="c-product-related__header">
                    <?php if ($product_related_heading !== '') : ?>
                        <h2 class="c-product-related__heading" data-factory-source-node="125:3277"><?php echo emko_wysiwyg_heading($product_related_heading); ?></h2>
                    <?php endif; ?>
                    <?php if ($product_related_all_label !== '') : ?>
                        <a class="c-product-related__all" href="<?php echo esc_url($product_related_archive_url); ?>" data-factory-source-node="125:3279" data-factory-source-gap="missing-source-url">
                            <span><?php echo esc_html($product_related_all_label); ?></span>
                            <?php if ($product_related_all_icon_id) : ?>
                                <?php echo wp_get_attachment_image($product_related_all_icon_id, 'full', false, ['class' => 'c-product-related__all-icon', 'alt' => '', 'aria-hidden' => 'true', 'loading' => false, 'data-factory-source-node' => '125:3281']); ?>
                            <?php else : ?>
                                <span class="c-product-related__all-icon" data-factory-source-node="125:3281" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                            <?php endif; ?>
                        </a>
                    <?php endif; ?>
                </header>
                <div class="c-product-related__grid">
                    <?php foreach ($product_related_ids as $product_related_id) : ?>
                        <?php
                        $product_related_source_node = (string) get_post_meta($product_related_id, '_emko_source_node', true);
                        $product_related_source = $product_related_card_nodes[$product_related_source_node] ?? [
                            'card' => '',
                            'media' => '',
                            'description' => '',
                            'asset' => '',
                        ];
                        $product_related_title = trim((string) get_the_title($product_related_id));
                        $product_related_description = trim((string) get_post_field('post_excerpt', $product_related_id));
                        $product_related_lines = array_values(array_map('trim', preg_split('/\R/u', $product_related_description)));
                        $product_related_summary_lines = [];
                        $product_related_spec_lines = [];
                        $product_related_in_specs = false;
                        foreach ($product_related_lines as $product_related_line) {
                            if ($product_related_line === '') {
                                $product_related_in_specs = true;
                                continue;
                            }
                            if ($product_related_in_specs) {
                                $product_related_spec_lines[] = $product_related_line;
                            } else {
                                $product_related_summary_lines[] = $product_related_line;
                            }
                        }
                        if (!$product_related_spec_lines) {
                            $product_related_summary_lines = $product_related_lines;
                        }
                        $product_related_image_id = (int) get_post_thumbnail_id($product_related_id);
                        $product_related_image_source_node = $product_related_image_id ? (string) get_post_meta($product_related_image_id, 'data-factory-source-node', true) : '';
                        $product_related_image_source_node = $product_related_image_source_node ?: $product_related_source['media'];
                        $product_related_image_source_asset = $product_related_image_id ? (string) get_post_meta($product_related_image_id, '_emko_source_asset', true) : '';
                        $product_related_image_source_asset = $product_related_image_source_asset ?: $product_related_source['asset'];
                        ?>
                        <article class="c-product-related__card" data-factory-component="product-card"<?php if ($product_related_source['card'] !== '') : ?> data-factory-source-node="<?php echo esc_attr($product_related_source['card']); ?>"<?php endif; ?>>
                            <div class="c-product-related__media">
                                <?php if ($product_related_image_id) : ?>
                                    <a class="c-product-related__media-link" href="<?php echo esc_url(get_permalink($product_related_id)); ?>" aria-label="<?php echo esc_attr($product_related_title); ?>">
                                        <?php echo wp_get_attachment_image($product_related_image_id, 'full', false, [
                                            'class' => 'c-product-related__image',
                                            'alt' => $product_related_title,
                                            'loading' => false,
                                            'data-factory-source-node' => $product_related_image_source_node,
                                            'data-factory-source-asset' => $product_related_image_source_asset,
                                        ]); ?>
                                    </a>
                                <?php else : ?>
                                    <span class="c-product-related__image c-product-related__image--missing" data-factory-source-node="<?php echo esc_attr($product_related_source['media']); ?>" data-factory-source-asset="<?php echo esc_attr($product_related_source['asset']); ?>" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                <?php endif; ?>
                                <a class="c-product-related__card-link" href="<?php echo esc_url(get_permalink($product_related_id)); ?>" aria-label="<?php echo esc_attr($product_related_title); ?>" data-factory-source-node="130:14" data-factory-source-gap="missing-source-url">
                                    <?php if ($product_related_card_arrow_id) : ?>
                                        <?php echo wp_get_attachment_image($product_related_card_arrow_id, 'full', false, ['class' => 'c-product-related__card-arrow', 'alt' => '', 'aria-hidden' => 'true', 'loading' => false, 'data-factory-source-node' => '130:14']); ?>
                                    <?php else : ?>
                                        <span class="c-product-related__card-arrow" data-factory-source-node="130:14" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                    <?php endif; ?>
                                </a>
                            </div>
                            <h3 class="c-product-related__title"<?php if ($product_related_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($product_related_source_node); ?>"<?php endif; ?>><a class="c-product-related__title-link" href="<?php echo esc_url(get_permalink($product_related_id)); ?>"><?php echo esc_html($product_related_title); ?></a></h3>
                            <?php if ($product_related_summary_lines) : ?>
                                <p class="c-product-related__description" data-factory-source-node="<?php echo esc_attr($product_related_source['description']); ?>"><?php echo nl2br(esc_html(implode("\n", $product_related_summary_lines))); ?></p>
                            <?php endif; ?>
                            <?php if ($product_related_spec_lines) : ?>
                                <dl class="c-product-related__specifications" data-factory-source-node="<?php echo esc_attr($product_related_source['description']); ?>">
                                    <?php foreach ($product_related_spec_lines as $product_related_spec_line) : ?>
                                        <?php $product_related_spec_parts = array_map('trim', explode(':', $product_related_spec_line, 2)); ?>
                                        <div class="c-product-related__specification">
                                            <dt><?php echo esc_html(($product_related_spec_parts[0] ?? '') . ':'); ?></dt>
                                            <dd><?php echo esc_html($product_related_spec_parts[1] ?? ''); ?></dd>
                                        </div>
                                    <?php endforeach; ?>
                                </dl>
                            <?php endif; ?>
                        </article>
                    <?php endforeach; ?>
                </div>
            </section>
            <?php endif; ?>
        <?php elseif ($section_id === 'product-contact-cta') : ?>
            <?php
                $product_contact_cta_background_id = (int) $option('emko_product_contact_cta_background_125_3326');
                $product_contact_cta_arrow_id = (int) $option('emko_product_contact_cta_arrow_125_3409');
                $product_contact_cta_heading = trim((string) $option('emko_product_contact_cta_heading_125_3327'));
                $product_contact_cta_button_label = trim((string) $option('emko_product_contact_cta_button_label_125_3408'));
                $product_contact_cta_page = function_exists('get_page_by_path') ? get_page_by_path('kontakt') : null;
                $product_contact_cta_url = $product_contact_cta_page ? get_permalink($product_contact_cta_page) : home_url('/kontakt/');
            ?>
            <section class="c-product-contact-cta" data-factory-section="product-contact-cta" data-factory-component="contact-cta" data-factory-source-node="125:3323">
                    <div class="c-product-contact-cta__background" aria-hidden="true">
                        <?php if ($product_contact_cta_background_id) : ?>
                            <?php echo wp_get_attachment_image($product_contact_cta_background_id, 'full', false, [
                                'class' => 'c-product-contact-cta__image',
                                'alt' => '',
                                'aria-hidden' => 'true',
                                'loading' => false,
                                'data-factory-source-node' => '125:3326',
                            ]); ?>
                        <?php else : ?>
                            <span class="c-product-contact-cta__image c-product-contact-cta__image--missing" data-factory-source-node="125:3326" data-factory-source-gap="missing-native-attachment"></span>
                        <?php endif; ?>
                    </div>
                    <div class="c-product-contact-cta__content">
                        <?php if (trim(wp_strip_all_tags($product_contact_cta_heading)) !== '') : ?>
                            <div class="c-product-contact-cta__heading c-wysiwyg" data-factory-source-node="125:3327">
                                <?php echo wp_kses_post(wpautop($product_contact_cta_heading)); ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($product_contact_cta_button_label !== '') : ?>
                            <a class="c-product-contact-cta__button" href="<?php echo esc_url($product_contact_cta_url); ?>" data-factory-source-node="125:3406" data-factory-source-gap="missing-source-url">
                                <span data-factory-source-node="125:3408"><?php echo esc_html($product_contact_cta_button_label); ?></span>
                                <?php if ($product_contact_cta_arrow_id) : ?>
                                    <?php echo wp_get_attachment_image($product_contact_cta_arrow_id, 'full', false, [
                                        'class' => 'c-product-contact-cta__arrow',
                                        'alt' => '',
                                        'aria-hidden' => 'true',
                                        'loading' => false,
                                        'data-factory-source-node' => '125:3409',
                                    ]); ?>
                                <?php else : ?>
                                    <span class="c-product-contact-cta__arrow c-product-contact-cta__arrow--missing" data-factory-source-node="125:3409" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>
                                <?php endif; ?>
                            </a>
                        <?php endif; ?>
                    </div>
            </section>
        <?php elseif ($section_id === 'catalogues-primary') : ?>
            <?php
            $catalogues_page_id = (int) get_queried_object_id();
            $catalogue_cards = function_exists('get_field') ? get_field('emko_catalogues', $catalogues_page_id) : [];
            $catalogue_cards = is_array($catalogue_cards) ? array_values($catalogue_cards) : [];
            $catalogues_per_page = 8;
            $catalogues_current_page = max(1, (int) get_query_var('paged'), (int) get_query_var('page'));
            $catalogues_page_count = max(1, (int) ceil(count($catalogue_cards) / $catalogues_per_page));
            $catalogues_current_page = min($catalogues_page_count, $catalogues_current_page);
            $catalogues_page_cards = array_slice($catalogue_cards, ($catalogues_current_page - 1) * $catalogues_per_page, $catalogues_per_page);
            $catalogues_visible_pages = array_unique(array_filter([1, 2, 3, 4, $catalogues_page_count], static fn ($page) => $page >= 1 && $page <= $catalogues_page_count));
            $download_icon_id = function_exists('get_field') ? (int) get_field('emko_catalogues_download_icon', $catalogues_page_id) : 0;
            $catalogue_source_nodes = ['125:2509', '125:2513', '125:2517', '125:2539'];
            $catalogue_title_nodes = ['125:2522', '125:2523', '125:2524', '125:2525'];
            $catalogue_download_nodes = ['125:2527', '125:2530', '125:2533', '125:2536'];
            ?>
            <section class="c-catalogues-primary l-container" data-factory-section="catalogues-primary" data-factory-component="route-section-shell">
                <?php get_template_part('partials/page-banner', null, [
                    'title' => (string) ($catalogues_banner['title'] ?? ''),
                    'variant' => 'catalogues',
                    'title_tag' => 'h1',
                    'is_fragment' => true,
                ]); ?>
                <div class="c-catalogues-primary__grid">
                    <?php foreach ($catalogues_page_cards as $index => $catalogue_card) : ?>
                        <?php get_template_part('partials/catalogue-card', null, [
                            'card' => is_array($catalogue_card) ? $catalogue_card : [],
                            'index' => (($catalogues_current_page - 1) * $catalogues_per_page) + $index,
                            'image_source_node' => $catalogue_source_nodes[(($catalogues_current_page - 1) * $catalogues_per_page) + $index] ?? '',
                            'title_source_node' => $catalogue_title_nodes[(($catalogues_current_page - 1) * $catalogues_per_page) + $index] ?? '',
                            'download_source_node' => $catalogue_download_nodes[(($catalogues_current_page - 1) * $catalogues_per_page) + $index] ?? '',
                            'download_icon_id' => $download_icon_id,
                        ]); ?>
                    <?php endforeach; ?>
                </div>
                <?php if ($catalogues_page_count > 1) : ?>
                    <nav class="c-catalogues-pagination" aria-label="Paginacja katalogów" data-factory-component="catalogues-pagination">
                        <?php if ($catalogues_current_page > 1) : ?>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link(1)); ?>" aria-label="Pierwsza strona">«</a>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_current_page - 1)); ?>" aria-label="Poprzednia strona">‹</a>
                        <?php else : ?>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">«</span>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">‹</span>
                        <?php endif; ?>
                        <?php foreach ($catalogues_visible_pages as $page_index => $page) : ?>
                            <?php if ($page_index > 0 && $page > $catalogues_visible_pages[$page_index - 1] + 1) : ?><span class="c-catalogues-pagination__ellipsis" aria-hidden="true">…</span><?php endif; ?>
                            <?php if ($page === $catalogues_current_page) : ?>
                                <span class="c-catalogues-pagination__page is-current" aria-current="page"><?php echo esc_html((string) $page); ?></span>
                            <?php else : ?>
                                <a class="c-catalogues-pagination__page" href="<?php echo esc_url(get_pagenum_link($page)); ?>"><?php echo esc_html((string) $page); ?></a>
                            <?php endif; ?>
                        <?php endforeach; ?>
                        <?php if ($catalogues_current_page < $catalogues_page_count) : ?>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_current_page + 1)); ?>" aria-label="Następna strona">›</a>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_page_count)); ?>" aria-label="Ostatnia strona">»</a>
                        <?php else : ?>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">›</span>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">»</span>
                        <?php endif; ?>
                    </nav>
                <?php endif; ?>
            </section>
        <?php elseif ($section_id === 'catalogues-secondary') : ?>
            <?php
            $catalogues_per_page = 8;
            $catalogues_current_page = max(1, (int) get_query_var('paged'), (int) get_query_var('page'));
            $catalogues_query = new WP_Query([
                'post_type' => 'page',
                'post_parent' => (int) get_queried_object_id(),
                'post_status' => 'publish',
                'posts_per_page' => $catalogues_per_page,
                'paged' => $catalogues_current_page,
                'meta_key' => '_emko_catalogue_inventory',
                'meta_value' => '1',
                'orderby' => ['menu_order' => 'ASC', 'ID' => 'ASC'],
            ]);
            $catalogues_page_count = max(1, (int) $catalogues_query->max_num_pages);
            $catalogues_current_page = min($catalogues_page_count, $catalogues_current_page);
            if ((int) $catalogues_query->get('paged') !== $catalogues_current_page) {
                $catalogues_query = new WP_Query(array_merge($catalogues_query->query_vars, ['paged' => $catalogues_current_page]));
            }
            $catalogues_visible_pages = array_unique(array_filter([1, 2, 3, 4, $catalogues_page_count], static fn ($page) => $page >= 1 && $page <= $catalogues_page_count));
            ?>
            <section class="c-catalogues-secondary l-container" data-factory-section="catalogues-secondary" data-factory-component="route-section-shell">
                <div class="c-catalogues-secondary__grid">
                    <?php while ($catalogues_query->have_posts()) : $catalogues_query->the_post(); ?>
                        <?php
                        $catalogue_id = (int) get_the_ID();
                        $secondary_catalogue_card = [
                            'title' => (string) get_the_title($catalogue_id),
                            'pdf_label' => (string) get_post_meta($catalogue_id, '_emko_catalogue_download_label', true),
                            'cover' => (int) get_post_meta($catalogue_id, '_emko_catalogue_cover', true),
                            'pdf' => (int) get_post_meta($catalogue_id, '_emko_catalogue_pdf', true),
                        ];
                        ?>
                        <?php get_template_part('partials/catalogue-card', null, [
                            'card' => $secondary_catalogue_card,
                            'index' => (int) get_post_field('menu_order', $catalogue_id),
                            'image_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_cover_source_node', true),
                            'title_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_title_source_node', true),
                            'download_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_download_source_node', true),
                            'download_icon_id' => (int) get_post_meta($catalogue_id, '_emko_catalogue_download_icon', true),
                            'download_icon_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_download_icon_source_node', true),
                            'background_id' => (int) get_post_meta($catalogue_id, '_emko_catalogue_background', true),
                            'background_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_background_source_node', true),
                            'surface_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_surface_source_node', true),
                            'overlay_cover_id' => (int) get_post_meta($catalogue_id, '_emko_catalogue_overlay_cover', true),
                            'overlay_source_node' => (string) get_post_meta($catalogue_id, '_emko_catalogue_overlay_source_node', true),
                            'source_identity' => (string) get_post_meta($catalogue_id, '_emko_catalogue_source_identity', true),
                            'demo_clone' => get_post_meta($catalogue_id, '_emko_demo_clone', true) === '1',
                            'clone_of' => (string) get_post_meta($catalogue_id, '_emko_demo_clone_of', true),
                        ]); ?>
                    <?php endwhile; wp_reset_postdata(); ?>
                </div>
                <?php
                if ($catalogues_page_count > 1) :
                    ?>
                    <nav class="c-catalogues-pagination" aria-label="Paginacja katalogów" data-factory-component="catalogues-pagination">
                        <?php if ($catalogues_current_page > 1) : ?>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link(1)); ?>" aria-label="Pierwsza strona">«</a>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_current_page - 1)); ?>" aria-label="Poprzednia strona">‹</a>
                        <?php else : ?>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">«</span>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">‹</span>
                        <?php endif; ?>
                        <?php foreach ($catalogues_visible_pages as $page_index => $page) : ?>
                            <?php if ($page_index > 0 && $page > $catalogues_visible_pages[$page_index - 1] + 1) : ?><span class="c-catalogues-pagination__ellipsis" aria-hidden="true">…</span><?php endif; ?>
                            <?php if ($page === $catalogues_current_page) : ?>
                                <span class="c-catalogues-pagination__page is-current" aria-current="page"><?php echo esc_html((string) $page); ?></span>
                            <?php else : ?>
                                <a class="c-catalogues-pagination__page" href="<?php echo esc_url(get_pagenum_link($page)); ?>"><?php echo esc_html((string) $page); ?></a>
                            <?php endif; ?>
                        <?php endforeach; ?>
                        <?php if ($catalogues_current_page < $catalogues_page_count) : ?>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_current_page + 1)); ?>" aria-label="Następna strona">›</a>
                            <a class="c-catalogues-pagination__control" href="<?php echo esc_url(get_pagenum_link($catalogues_page_count)); ?>" aria-label="Ostatnia strona">»</a>
                        <?php else : ?>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">›</span>
                            <span class="c-catalogues-pagination__control is-disabled" aria-hidden="true">»</span>
                        <?php endif; ?>
                    </nav>
                <?php endif; ?>
            </section>
        <?php else : ?>
            <section data-factory-section="<?php echo esc_attr((string) $section_id); ?>" data-factory-component="route-section"></section>
        <?php endif; ?>
    <?php endforeach; ?>
</div>
