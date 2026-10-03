<?php

/**
 * Register user session
 */
function registerSession()
{
	if (!session_id()) {
		session_start();
	}
}
add_action('init', 'registerSession');

/**
 * Hide private pages from nav menu
 */
function wp_nav_menu_hide_private_pages ($items, $args) {
    foreach ($items as $ix => $obj) {
        if (!is_user_logged_in () && 'private' == get_post_status ($obj->object_id)) {
            unset ($items[$ix]);
        }
    }
    return $items;
}
add_filter ('wp_nav_menu_objects', 'wp_nav_menu_hide_private_pages', 10, 2); 



function customize_acf_wysiwyg_toolbar($toolbars) {
    // Przykład: modyfikacja istniejącej grupy narzędzi "Full"
    if (isset($toolbars['Full'])) {
        // Dodanie przycisku "formats" do grupy
        array_unshift($toolbars['Full'][2], 'styleselect');
    }

    return $toolbars;
}
add_filter('acf/fields/wysiwyg/toolbars', 'customize_acf_wysiwyg_toolbar');

function add_custom_styles_to_tinymce($settings) {
    $style_formats = [
        [
            'title' => 'Font Size',
            'items' => [
                ['title' => '24', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-24'],
                ['title' => '34', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-34'],
                ['title' => '60', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-60'],
                ['title' => '80', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-80'],
                ['title' => '100', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-100'],
            ],
        ],
        [
            'title' => 'Font Weight',
            'items' => [
                ['title' => 'Light', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-light'],
                ['title' => 'Regular', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-regular'],
                ['title' => 'Medium', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-medium'],
                ['title' => 'SemiBold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-semibold'],
                ['title' => 'Bold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-bold'],
                ['title' => 'ExtraBold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-extrabold'],
                ['title' => 'Black', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-black'],
            ],
        ],
        [
            'title' => 'Font Color',
            'items' => [
                ['title' => 'White', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-white'],
                ['title' => 'Black', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-black'],
                ['title' => 'Accent', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-accent'],
                
                
            ],
        ],
        [
            'title' => 'Font Family',
            'items' => [
                ['title' => 'Base font', 'selector' => '*', 'inline' => 'span', 'classes' => 'font-family-base'],
                ['title' => 'Heading font', 'selector' => '*', 'inline' => 'span', 'classes' => 'font-family-heading'],
            ],
        ],
        [
            'title' => 'Font Transform',
            'items' => [
                ['title' => 'Uppercase', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-uppercase'],
            ],
        ],
        [
            'title' => 'Margins',
            'items' => [
                ['title' => 'Top 30px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-30'],
                ['title' => 'Top 40px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-40'],
                ['title' => 'Top 60px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-60'],
                ['title' => 'Top 90px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-90'],
                ['title' => 'Top 120px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-120'],
                ['title' => 'Bottom 30px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-30'],
                ['title' => 'Bottom 40px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-40'],
                ['title' => 'Bottom 60px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-60'],
                ['title' => 'Bottom 90px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-90'],
                ['title' => 'Bottom 120px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-120'],
            ],
        ],
    ];

    $settings['style_formats'] = json_encode($style_formats);
    return $settings;
}
add_filter('tiny_mce_before_init', 'add_custom_styles_to_tinymce');


/**
 * Returns the current location as linked breadcrumb items.
 *
 * Breadcrumb labels are deliberately derived from WordPress and WooCommerce
 * objects, rather than from editor fields, so renamed pages/categories stay
 * in sync with their URLs.
 */
function emko_get_breadcrumb_items(): array {
    $items = [[
        'label' => __('Strona główna', 'slawinsky'),
        'url' => home_url('/'),
    ]];

    $append_page = static function (int $page_id) use (&$items): void {
        $title = trim((string) get_the_title($page_id));
        if ($title === '') {
            return;
        }

        $items[] = [
            'label' => $title,
            'url' => get_permalink($page_id),
        ];
    };

    $append_product_term = static function ($term) use (&$items): void {
        if (!$term instanceof WP_Term) {
            return;
        }

        $ancestor_ids = array_reverse(get_ancestors($term->term_id, 'product_cat', 'taxonomy'));
        foreach ($ancestor_ids as $ancestor_id) {
            $ancestor = get_term($ancestor_id, 'product_cat');
            if ($ancestor instanceof WP_Term) {
                $ancestor_url = get_term_link($ancestor);
                $items[] = [
                    'label' => $ancestor->name,
                    'url' => is_wp_error($ancestor_url) ? '' : $ancestor_url,
                ];
            }
        }

        $term_url = get_term_link($term);
        $items[] = [
            'label' => $term->name,
            'url' => is_wp_error($term_url) ? '' : $term_url,
        ];
    };

    if (is_front_page()) {
        return apply_filters('emko_breadcrumb_items', $items);
    }

    if (function_exists('is_shop') && is_shop()) {
        $shop_id = function_exists('wc_get_page_id') ? (int) wc_get_page_id('shop') : 0;
        $items[] = [
            'label' => $shop_id > 0 ? get_the_title($shop_id) : __('Sklep', 'slawinsky'),
            'url' => $shop_id > 0 ? get_permalink($shop_id) : '',
        ];
    } elseif (is_tax('product_cat')) {
        $shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : '';
        $items[] = [
            'label' => __('Sklep', 'slawinsky'),
            'url' => $shop_url ?: get_post_type_archive_link('product'),
        ];
        $append_product_term(get_queried_object());
    } elseif (is_singular('product')) {
        $shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : '';
        $items[] = [
            'label' => __('Sklep', 'slawinsky'),
            'url' => $shop_url ?: get_post_type_archive_link('product'),
        ];

        $terms = get_the_terms(get_queried_object_id(), 'product_cat');
        if (is_array($terms) && $terms) {
            usort($terms, static function (WP_Term $left, WP_Term $right): int {
                return count(get_ancestors($right->term_id, 'product_cat', 'taxonomy')) <=> count(get_ancestors($left->term_id, 'product_cat', 'taxonomy'));
            });
            $append_product_term($terms[0]);
        }

        $items[] = [
            'label' => get_the_title(get_queried_object_id()),
            'url' => '',
        ];
    } elseif (is_page()) {
        $page_id = (int) get_queried_object_id();
        foreach (array_reverse(get_post_ancestors($page_id)) as $ancestor_id) {
            $append_page((int) $ancestor_id);
        }
        $append_page($page_id);
    } elseif (is_home() || is_post_type_archive('post')) {
        $posts_page_id = (int) get_option('page_for_posts');
        $items[] = [
            'label' => $posts_page_id > 0 ? get_the_title($posts_page_id) : __('Blog', 'slawinsky'),
            'url' => $posts_page_id > 0 ? get_permalink($posts_page_id) : '',
        ];
    } elseif (is_singular('post')) {
        $posts_page_id = (int) get_option('page_for_posts');
        $items[] = [
            'label' => $posts_page_id > 0 ? get_the_title($posts_page_id) : __('Blog', 'slawinsky'),
            'url' => $posts_page_id > 0 ? get_permalink($posts_page_id) : '',
        ];
        $items[] = ['label' => get_the_title(get_queried_object_id()), 'url' => ''];
    } elseif (is_search()) {
        $items[] = ['label' => sprintf(__('Wyniki wyszukiwania: %s', 'slawinsky'), get_search_query()), 'url' => ''];
    } elseif (is_404()) {
        $items[] = ['label' => __('Nie znaleziono strony', 'slawinsky'), 'url' => ''];
    }

    return apply_filters('emko_breadcrumb_items', $items);
}

/** Render project breadcrumbs with links for every non-current item. */
function emko_render_breadcrumbs(string $class_name = '', string $aria_label = 'Breadcrumb'): void {
    $items = array_values(array_filter(emko_get_breadcrumb_items(), static function ($item): bool {
        return is_array($item) && trim((string) ($item['label'] ?? '')) !== '';
    }));

    if (!$items) {
        return;
    }

    $classes = trim('c-breadcrumbs ' . $class_name);
    echo '<nav class="' . esc_attr($classes) . '" aria-label="' . esc_attr__($aria_label, 'slawinsky') . '">';

    $last_index = count($items) - 1;
    foreach ($items as $index => $item) {
        if ($index > 0) {
            echo '<span class="c-breadcrumbs__separator" aria-hidden="true"></span>';
        }

        $label = (string) $item['label'];
        $url = (string) ($item['url'] ?? '');
        if ($index === $last_index || $url === '') {
            echo '<span class="c-breadcrumbs__current" aria-current="page">' . esc_html($label) . '</span>';
        } else {
            echo '<a class="c-breadcrumbs__link" href="' . esc_url($url) . '">' . esc_html($label) . '</a>';
        }
    }

    echo '</nav>';
}
