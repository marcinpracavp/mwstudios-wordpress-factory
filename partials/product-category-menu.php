<?php
/**
 * Dynamiczne menu kategorii produktów używane w nagłówku i sidebarach.
 *
 * @var array $args
 */

$args = isset($args) && is_array($args) ? $args : [];
$context = isset($args['context']) ? sanitize_key((string) $args['context']) : 'sidebar';
$heading = isset($args['heading']) ? trim((string) $args['heading']) : 'Kategorie';
$menu_id = isset($args['menu_id']) ? sanitize_html_class((string) $args['menu_id']) : 'product-category-menu';
$active_term_id = isset($args['active_term_id']) ? (int) $args['active_term_id'] : 0;

if (!$active_term_id && function_exists('is_tax') && is_tax('product_cat')) {
    $active_term_id = (int) get_queried_object_id();
}

$category_terms = get_terms([
    'taxonomy' => 'product_cat',
    'hide_empty' => false,
    'parent' => 0,
    'orderby' => 'menu_order',
    'order' => 'ASC',
]);

if (is_wp_error($category_terms) || !$category_terms) {
    return;
}

$categories = [];
foreach ($category_terms as $category_term) {
    $category_url = get_term_link($category_term);
    if (is_wp_error($category_url)) {
        continue;
    }

    $category_products = get_posts([
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 6,
        'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'],
        'order' => 'ASC',
        'fields' => 'ids',
        'tax_query' => [[
            'taxonomy' => 'product_cat',
            'field' => 'term_id',
            'terms' => [(int) $category_term->term_id],
        ]],
    ]);

    // Puste kategorie nie mają sensownej podstrony ani panelu produktów.
    if (!$category_products) {
        continue;
    }

    $categories[] = [
        'term' => $category_term,
        'url' => $category_url,
        'products' => $category_products,
    ];
}

if (!$categories) {
    return;
}
?>
<nav class="c-product-list-menu__nav c-product-category-menu c-product-category-menu--<?php echo esc_attr($context); ?>" aria-label="<?php echo esc_attr($heading); ?>" data-product-category-menu>
    <?php if ($heading !== '') : ?>
        <h2 class="c-product-list-menu__heading"><?php echo emko_wysiwyg_heading($heading); ?></h2>
    <?php endif; ?>
    <ul class="c-product-list-menu__list">
        <?php foreach ($categories as $category) : ?>
            <?php
            $category_term = $category['term'];
            $category_panel_id = $menu_id . '-' . (int) $category_term->term_id;
            $is_active = $active_term_id === (int) $category_term->term_id;
            ?>
            <li class="c-product-list-menu__item<?php echo $is_active ? ' is-current' : ''; ?>">
                <a class="c-product-list-menu__link" href="<?php echo esc_url($category['url']); ?>" data-product-category-trigger="<?php echo esc_attr((string) $category_term->term_id); ?>" aria-controls="<?php echo esc_attr($category_panel_id); ?>" aria-expanded="false"<?php if ($is_active) : ?> aria-current="page"<?php endif; ?>>
                    <span class="c-product-list-menu__label"><?php echo esc_html($category_term->name); ?></span>
                    <span class="c-product-list-menu__arrow" aria-hidden="true">›</span>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>

    <div class="c-product-list-menu__mega-panels">
        <?php foreach ($categories as $category) : ?>
            <?php $category_term = $category['term']; ?>
            <section class="c-product-list-menu__mega" id="<?php echo esc_attr($menu_id . '-' . (int) $category_term->term_id); ?>" aria-label="<?php echo esc_attr($category_term->name); ?>" aria-hidden="true" data-product-category-panel="<?php echo esc_attr((string) $category_term->term_id); ?>" hidden>
                <header class="c-product-list-menu__mega-header">
                    <h3 class="c-product-list-menu__mega-title"><?php echo esc_html($category_term->name); ?></h3>
                    <a class="c-product-list-menu__mega-all" href="<?php echo esc_url($category['url']); ?>">Zobacz wszystkie <span aria-hidden="true">→</span></a>
                </header>
                <?php if ($category['products']) : ?>
                    <ul class="c-product-list-menu__mega-products">
                        <?php foreach ($category['products'] as $product_id) : ?>
                            <?php
                            $product_title = get_the_title($product_id);
                            $product_image_id = (int) get_post_thumbnail_id($product_id);
                            ?>
                            <li class="c-product-list-menu__mega-product">
                                <a href="<?php echo esc_url(get_permalink($product_id)); ?>">
                                    <?php if ($product_image_id) : ?>
                                        <?php echo wp_get_attachment_image($product_image_id, 'thumbnail', false, ['class' => 'c-product-list-menu__mega-product-image', 'alt' => $product_title, 'loading' => 'lazy']); ?>
                                    <?php endif; ?>
                                    <span class="c-product-list-menu__mega-product-title"><?php echo esc_html($product_title); ?></span>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php else : ?>
                    <p class="c-product-list-menu__mega-empty">Brak produktów w tej kategorii.</p>
                <?php endif; ?>
            </section>
        <?php endforeach; ?>
    </div>
</nav>
