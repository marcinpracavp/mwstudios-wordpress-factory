<?php
/**
 * Editable static front page.
 *
 * The original implementation rendered the front-page template from ACF
 * options.  These helpers give that content a proper WordPress page owner,
 * while retaining the imported option values during the one-time migration.
 */

function emko_home_editor_field(string $name, string $label, string $type = 'text'): array {
    $field = [
        'key' => 'field_emko_home_editor_' . substr(md5($name), 0, 16),
        'label' => $label,
        'name' => $name,
        'type' => $type,
    ];

    if ($type === 'image') {
        $field += ['return_format' => 'id', 'library' => 'all'];
    } elseif ($type === 'textarea') {
        $field += ['rows' => 4, 'new_lines' => ''];
    } elseif ($type === 'wysiwyg') {
        $field += ['tabs' => 'all', 'toolbar' => 'full', 'media_upload' => 1];
    } elseif ($type === 'relationship') {
        $field += ['post_type' => ['post'], 'return_format' => 'id', 'filters' => ['search'], 'elements' => ['featured_image']];
    }

    return $field;
}

function emko_home_slider_repeater_field(): array {
    return [
        'key' => 'field_emko_home_slider_slides',
        'label' => 'Slajdy',
        'name' => 'emko_home_slider_slides',
        'type' => 'repeater',
        'layout' => 'block',
        'button_label' => 'Dodaj slajd',
        'min' => 1,
        'sub_fields' => [
            [
                'key' => 'field_emko_home_slider_slide_content',
                'label' => 'Treść',
                'name' => 'content',
                'type' => 'wysiwyg',
                'instructions' => 'Na pierwszym slajdzie przejdź do karty „Tekst” i wklej kod H1 podany w opisie wdrożenia. W kolejnych slajdach używaj H2 lub zwykłego tekstu.',
                'tabs' => 'all',
                'toolbar' => 'full',
                'media_upload' => 0,
            ],
            [
                'key' => 'field_emko_home_slider_slide_button',
                'label' => 'Przycisk',
                'name' => 'button',
                'type' => 'link',
                'return_format' => 'array',
            ],
            [
                'key' => 'field_emko_home_slider_slide_image',
                'label' => 'Grafika',
                'name' => 'image',
                'type' => 'image',
                'return_format' => 'id',
                'library' => 'all',
            ],
        ],
    ];
}

function emko_home_product_categories_repeater_field(): array {
    return [
        'key' => 'field_emko_home_product_categories',
        'label' => 'Pozycje kategorii',
        'name' => 'emko_home_product_categories',
        'type' => 'repeater',
        'layout' => 'block',
        'button_label' => 'Dodaj kategorię',
        'collapsed' => 'field_emko_home_product_categories_link',
        'sub_fields' => [
            [
                'key' => 'field_emko_home_product_categories_link',
                'label' => 'Nazwa kategorii i link',
                'name' => 'link',
                'type' => 'link',
                'return_format' => 'array',
            ],
            [
                'key' => 'field_emko_home_product_categories_image',
                'label' => 'Ikona / grafika',
                'name' => 'image',
                'type' => 'image',
                'return_format' => 'id',
                'library' => 'all',
            ],
            [
                'key' => 'field_emko_home_product_categories_background',
                'label' => 'Tło kafla',
                'name' => 'background',
                'type' => 'button_group',
                'choices' => [
                    'white' => 'Białe',
                    'gray' => 'Szare',
                ],
                'default_value' => 'white',
                'return_format' => 'value',
                'layout' => 'horizontal',
            ],
        ],
    ];
}

function emko_home_benefits_metrics_repeater_field(): array {
    return [
        'key' => 'field_emko_home_benefits_metrics',
        'label' => 'Statystyki',
        'name' => 'emko_home_benefits_metrics',
        'type' => 'repeater',
        'layout' => 'table',
        'button_label' => 'Dodaj statystykę',
        'collapsed' => 'field_emko_home_benefits_metric_value',
        'sub_fields' => [
            [
                'key' => 'field_emko_home_benefits_metric_value',
                'label' => 'Wartość',
                'name' => 'value',
                'type' => 'text',
            ],
            [
                'key' => 'field_emko_home_benefits_metric_prefix',
                'label' => 'Prefiks',
                'name' => 'prefix',
                'type' => 'text',
            ],
            [
                'key' => 'field_emko_home_benefits_metric_unit',
                'label' => 'Jednostka',
                'name' => 'unit',
                'type' => 'text',
            ],
            [
                'key' => 'field_emko_home_benefits_metric_label',
                'label' => 'Opis',
                'name' => 'label',
                'type' => 'wysiwyg',
                'tabs' => 'all',
                'toolbar' => 'full',
                'media_upload' => 0,
            ],
        ],
    ];
}

function emko_home_faq_repeater_field(): array {
    return [
        'key' => 'field_emko_home_faq_items',
        'label' => 'Pytania i odpowiedzi',
        'name' => 'emko_home_faq_items',
        'type' => 'repeater',
        'layout' => 'block',
        'button_label' => 'Dodaj pytanie',
        'collapsed' => 'field_emko_home_faq_question',
        'sub_fields' => [
            [
                'key' => 'field_emko_home_faq_question',
                'label' => 'Pytanie',
                'name' => 'question',
                'type' => 'text',
            ],
            [
                'key' => 'field_emko_home_faq_answer',
                'label' => 'Odpowiedź',
                'name' => 'answer',
                'type' => 'wysiwyg',
                'tabs' => 'all',
                'toolbar' => 'full',
                'media_upload' => 0,
            ],
        ],
    ];
}

function emko_home_popular_products_repeater_field(): array {
    return [
        'key' => 'field_emko_home_popular_products',
        'label' => 'Kategorie i produkty',
        'name' => 'emko_home_popular_products',
        'type' => 'repeater',
        'layout' => 'block',
        'button_label' => 'Dodaj kategorię z produktami',
        'collapsed' => 'field_emko_home_popular_products_category',
        'sub_fields' => [
            [
                'key' => 'field_emko_home_popular_products_category',
                'label' => 'Kategoria',
                'name' => 'category',
                'type' => 'taxonomy',
                'taxonomy' => 'product_cat',
                'field_type' => 'select',
                'return_format' => 'object',
                'add_term' => 0,
                'save_terms' => 0,
                'load_terms' => 0,
                'allow_null' => 0,
            ],
            [
                'key' => 'field_emko_home_popular_products_products',
                'label' => 'Produkty',
                'name' => 'products',
                'type' => 'relationship',
                'instructions' => 'Wybierz od 1 do 4 produktów. Kolejność na liście odpowiada kolejności kart na stronie głównej.',
                'post_type' => ['product'],
                'return_format' => 'id',
                'filters' => ['search', 'taxonomy'],
                'elements' => ['featured_image'],
                'min' => 1,
                'max' => 4,
            ],
        ],
    ];
}

function emko_home_product_category_background_for_index(int $index): string {
    return in_array($index, [2, 3, 6, 7, 10], true) ? 'gray' : 'white';
}

function emko_home_legacy_product_category_items(): array {
    return [
        ['label_field' => 'emko_home_product_categories_item_1_label_125_1785', 'image_field' => 'emko_home_product_categories_image_1803_125_1803', 'label_node' => '125:1785', 'image_node' => '125:1803'],
        ['label_field' => 'emko_home_product_categories_item_3_label_125_1787', 'image_field' => 'emko_home_product_categories_image_1805_125_1805', 'label_node' => '125:1787', 'image_node' => '125:1805'],
        ['label_field' => '', 'image_field' => 'emko_home_product_categories_image_1807_125_1807', 'label_node' => '', 'image_node' => '125:1807'],
        ['label_field' => 'emko_home_product_categories_item_6_label_125_1791', 'image_field' => 'emko_home_product_categories_image_1809_125_1809', 'label_node' => '125:1791', 'image_node' => '125:1809'],
        ['label_field' => 'emko_home_product_categories_item_7_label_125_1792', 'image_field' => 'emko_home_product_categories_image_1810_125_1810', 'label_node' => '125:1792', 'image_node' => '125:1810'],
        ['label_field' => 'emko_home_product_categories_item_8_label_125_1794', 'image_field' => 'emko_home_product_categories_image_1812_125_1812', 'label_node' => '125:1794', 'image_node' => '125:1812'],
        ['label_field' => 'emko_home_product_categories_item_10_label_125_1796', 'image_field' => 'emko_home_product_categories_image_1814_125_1814', 'label_node' => '125:1796', 'image_node' => '125:1814'],
        ['label_field' => 'emko_home_product_categories_item_12_label_125_1798', 'image_field' => 'emko_home_product_categories_image_1816_125_1816', 'label_node' => '125:1798', 'image_node' => '125:1816'],
        ['label_field' => 'emko_home_product_categories_item_14_label_125_1800', 'image_field' => 'emko_home_product_categories_image_1818_125_1818', 'label_node' => '125:1800', 'image_node' => '125:1818'],
        ['label_field' => 'emko_home_product_categories_item_15_label_125_1801', 'image_field' => 'emko_home_product_categories_image_1804_125_1804', 'label_node' => '125:1801', 'image_node' => '125:1804'],
        ['label_field' => 'emko_home_product_categories_item_2_label_125_1786', 'image_field' => 'emko_home_product_categories_image_1806_125_1806', 'label_node' => '125:1786', 'image_node' => '125:1806'],
        ['label_field' => 'emko_home_product_categories_item_4_label_125_1788', 'image_field' => 'emko_home_product_categories_image_1808_125_1808', 'label_node' => '125:1788', 'image_node' => '125:1808'],
        ['label_field' => 'emko_home_product_categories_item_5_label_125_1790', 'image_field' => 'emko_home_product_categories_image_1811_125_1811', 'label_node' => '125:1790', 'image_node' => '125:1811'],
        ['label_field' => 'emko_home_product_categories_item_9_label_125_1795', 'image_field' => 'emko_home_product_categories_image_1813_125_1813', 'label_node' => '125:1795', 'image_node' => '125:1813'],
        ['label_field' => 'emko_home_product_categories_item_11_label_125_1797', 'image_field' => 'emko_home_product_categories_image_1815_125_1815', 'label_node' => '125:1797', 'image_node' => '125:1815'],
        ['label_field' => 'emko_home_product_categories_item_13_label_125_1799', 'image_field' => 'emko_home_product_categories_image_1817_125_1817', 'label_node' => '125:1799', 'image_node' => '125:1817'],
        ['label_field' => '', 'image_field' => 'emko_home_product_categories_image_1819_125_1819', 'label_node' => '', 'image_node' => '125:1819'],
        ['label_field' => 'emko_home_product_categories_item_16_label_125_1802', 'image_field' => 'emko_home_product_categories_image_1820_125_1820', 'label_node' => '125:1802', 'image_node' => '125:1820'],
    ];
}

function emko_home_editor_fields(): array {
    $fields = [];
    $add_tab = static function (string $label, string $slug) use (&$fields): void {
        $fields[] = [
            'key' => 'field_emko_home_editor_tab_' . $slug,
            'label' => $label,
            'name' => '',
            'type' => 'tab',
            'placement' => 'top',
        ];
    };
    $add = static function (string $name, string $label, string $type = 'text') use (&$fields): void {
        $fields[] = emko_home_editor_field($name, $label, $type);
    };

    $add_tab('Hero', 'hero');
    $fields[] = emko_home_slider_repeater_field();
    $add('emko_home_slider_layer_left_125_23', 'Dekoracja lewa', 'image');
    $add('emko_home_slider_layer_right_125_318', 'Dekoracja prawa', 'image');
    $add('emko_home_slider_mask_125_21', 'Tło z siatką', 'image');
    $add('emko_home_slider_button_arrow_125_624', 'Ikona przycisku', 'image');

    $add_tab('Kategorie produktów', 'categories');
    $fields[] = emko_home_product_categories_repeater_field();

    $add_tab('Popularne produkty', 'popular');
    $add('emko_home_popular_products_heading_125_674', 'Nagłówek', 'wysiwyg');
    $add('emko_home_popular_products_intro_125_675', 'Wprowadzenie', 'wysiwyg');
    $add('emko_home_popular_products_all_label_125_677', 'Etykieta linku „wszystkie”');
    $fields[] = emko_home_popular_products_repeater_field();
    $add('emko_home_popular_products_category_arrow_125_634', 'Ikona kategorii', 'image');
    $add('emko_home_popular_products_card_arrow_125_695', 'Ikona karty', 'image');
    $add('emko_home_popular_products_all_arrow_125_679', 'Ikona linku „wszystkie”', 'image');

    $add_tab('Sekcja wprowadzająca', 'intro');
    $add('emko_home_intro_heading_125_1310', 'Nagłówek', 'wysiwyg');
    $add('emko_home_intro_body_125_1309', 'Treść', 'wysiwyg');
    $add('emko_home_intro_service_photo_125_1307', 'Zdjęcie', 'image');
    $add('emko_home_intro_mask_125_714', 'Maska zdjęcia', 'image');
    $add('emko_home_intro_decorative_left_125_716', 'Dekoracja lewa', 'image');
    $add('emko_home_intro_decorative_right_125_1011', 'Dekoracja prawa', 'image');

    $add_tab('Korzyści', 'benefits');
    $add('emko_home_benefits_heading_125_1624', 'Nagłówek', 'wysiwyg');
    $add('emko_home_benefits_body_125_1612', 'Treść', 'wysiwyg');
    $fields[] = emko_home_benefits_metrics_repeater_field();
    $add('emko_home_benefits_decorative_layer_125_1313', 'Dekoracja sekcji', 'image');

    $add_tab('Blog', 'blog');
    $add('emko_home_blog_heading_125_1652', 'Nagłówek', 'wysiwyg');
    $add('emko_home_blog_intro_125_1653', 'Wprowadzenie', 'wysiwyg');
    $add('emko_home_blog_all_label_125_1655', 'Etykieta linku');
    $add('emko_home_blog_all_arrow_125_1657', 'Ikona linku', 'image');

    $add_tab('FAQ', 'faq');
    $add('emko_home_faq_heading_125_1659', 'Nagłówek', 'wysiwyg');
    $fields[] = emko_home_faq_repeater_field();

    return $fields;
}

add_action('acf/init', function (): void {
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    acf_add_local_field_group([
        'key' => 'group_emko_home_editor',
        'title' => 'Strona główna',
        'fields' => emko_home_editor_fields(),
        'location' => [[['param' => 'page_type', 'operator' => '==', 'value' => 'front_page']]],
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
        'active' => true,
    ]);
}, 20);

function emko_front_page_id(): int {
    $page_id = (int) get_option('page_on_front');
    if ($page_id && get_post_type($page_id) === 'page' && get_post_status($page_id) !== 'trash') {
        return $page_id;
    }

    $pages = get_posts([
        'post_type' => 'page',
        'post_status' => ['publish', 'draft', 'private'],
        'numberposts' => 1,
        'fields' => 'ids',
        'meta_key' => '_emko_route_id',
        'meta_value' => 'home',
    ]);
    if ($pages) {
        return (int) $pages[0];
    }

    $page_id = wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => 'Strona główna',
        'post_name' => 'strona-glowna',
    ], true);

    if (is_wp_error($page_id)) {
        return 0;
    }

    update_post_meta((int) $page_id, '_emko_route_id', 'home');
    return (int) $page_id;
}

function emko_setup_editable_front_page(): void {
    $page_id = emko_front_page_id();
    if (!$page_id) {
        return;
    }

    if ((int) get_option('page_on_front') !== $page_id || get_option('show_on_front') !== 'page') {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $page_id);
    }

    if (!(int) get_option('page_for_posts')) {
        $blog_page = get_page_by_path('blog');
        if ($blog_page instanceof WP_Post) {
            update_option('page_for_posts', $blog_page->ID);
        }
    }

    if (!function_exists('update_field')) {
        return;
    }

    foreach (emko_home_editor_fields() as $field) {
        if (($field['type'] ?? '') === 'tab' || empty($field['name'])) {
            continue;
        }
        if (metadata_exists('post', $page_id, $field['name'])) {
            continue;
        }

        $value = get_option('options_' . $field['name'], null);
        if ($value !== null) {
            update_field($field['key'], $value, $page_id);
        }
    }

    emko_migrate_home_slider_to_repeater($page_id);
    emko_migrate_home_product_categories_to_repeater($page_id);
    emko_migrate_home_product_categories_link_field($page_id);
    emko_migrate_home_product_categories_background_field($page_id);
    emko_migrate_home_benefits_metrics_to_repeater($page_id);
    emko_migrate_home_faq_to_repeater($page_id);
}
add_action('admin_init', 'emko_setup_editable_front_page', 20);
add_action('after_switch_theme', 'emko_setup_editable_front_page');

function emko_migrate_home_slider_to_repeater(int $page_id): void {
    if (!function_exists('update_field') || get_post_meta($page_id, '_emko_home_slider_repeater_migrated', true)) {
        return;
    }

    if ((int) get_post_meta($page_id, 'emko_home_slider_slides', true) > 0) {
        update_post_meta($page_id, '_emko_home_slider_repeater_migrated', '1');
        return;
    }

    $heading = trim((string) get_post_meta($page_id, 'emko_home_slider_heading_125_625', true));
    $image_id = (int) get_post_meta($page_id, 'emko_home_slider_product_composition_125_627', true);
    $button_label = trim((string) get_post_meta($page_id, 'emko_home_slider_button_label_125_623', true));
    if ($heading === '' && !$image_id && $button_label === '') {
        return;
    }

    $heading_lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', str_replace(["\\r\\n", "\\n", "\\r"], "\n", $heading)))));
    $content = '';
    if ($heading_lines) {
        $first_line = '<strong>' . esc_html(array_shift($heading_lines)) . '</strong>';
        $content = '<h1>' . $first_line . ($heading_lines ? '<br><span>' . implode('<br>', array_map('esc_html', $heading_lines)) . '</span>' : '') . '</h1>';
    }

    $product_url = function_exists('get_post_type_archive_link') ? get_post_type_archive_link('product') : false;
    $product_url = $product_url ?: home_url('/produkty/');
    $saved = update_field('field_emko_home_slider_slides', [[
        'content' => $content,
        'button' => $button_label !== '' ? [
            'title' => $button_label,
            'url' => $product_url,
            'target' => '',
        ] : null,
        'image' => $image_id,
    ]], $page_id);

    if ($saved !== false) {
        update_post_meta($page_id, '_emko_home_slider_repeater_migrated', '1');
    }
}

function emko_migrate_home_product_categories_to_repeater(int $page_id): void {
    if (!function_exists('update_field') || get_post_meta($page_id, '_emko_home_product_categories_repeater_migrated', true)) {
        return;
    }

    if ((int) get_post_meta($page_id, 'emko_home_product_categories', true) > 0) {
        update_post_meta($page_id, '_emko_home_product_categories_repeater_migrated', '1');
        return;
    }

    $items = [];
    foreach (emko_home_legacy_product_category_items() as $index => $legacy_item) {
        $label_field = $legacy_item['label_field'];
        $image_field = $legacy_item['image_field'];
        $label = $label_field !== '' ? get_post_meta($page_id, $label_field, true) : '';
        $image_id = (int) get_post_meta($page_id, $image_field, true);

        if ($label_field !== '' && !metadata_exists('post', $page_id, $label_field)) {
            $label = get_option('options_' . $label_field, '');
        }
        if (!metadata_exists('post', $page_id, $image_field)) {
            $image_id = (int) get_option('options_' . $image_field, 0);
        }

        $items[] = [
            'link' => trim((string) $label) !== '' ? [
                'title' => trim((string) $label),
                'url' => '',
                'target' => '',
            ] : null,
            'image' => $image_id,
            'background' => emko_home_product_category_background_for_index($index),
        ];
    }

    if (!array_filter($items, static fn (array $item): bool => !empty($item['link']['title']) || (int) $item['image'] > 0)) {
        return;
    }

    if (update_field('field_emko_home_product_categories', $items, $page_id) !== false) {
        update_post_meta($page_id, '_emko_home_product_categories_repeater_migrated', '1');
    }
}

function emko_migrate_home_product_categories_link_field(int $page_id): void {
    if (!function_exists('get_field') || !function_exists('update_field') || get_post_meta($page_id, '_emko_home_product_categories_link_field_migrated', true)) {
        return;
    }

    $items = get_field('emko_home_product_categories', $page_id);
    if (!is_array($items) || !$items) {
        return;
    }

    $needs_update = false;
    foreach ($items as $index => &$item) {
        $legacy_label = trim((string) get_post_meta($page_id, 'emko_home_product_categories_' . $index . '_label', true));
        if (!is_array($item) || !empty($item['link']) || $legacy_label === '') {
            continue;
        }

        $item['link'] = [
            'title' => $legacy_label,
            'url' => '',
            'target' => '',
        ];
        $needs_update = true;
    }
    unset($item);

    if (!$needs_update || update_field('field_emko_home_product_categories', $items, $page_id) !== false) {
        update_post_meta($page_id, '_emko_home_product_categories_link_field_migrated', '1');
    }
}

function emko_migrate_home_product_categories_background_field(int $page_id): void {
    if (!function_exists('get_field') || !function_exists('update_field') || get_post_meta($page_id, '_emko_home_product_categories_background_field_migrated', true)) {
        return;
    }

    $items = get_field('emko_home_product_categories', $page_id);
    if (!is_array($items) || !$items) {
        return;
    }

    $needs_update = false;
    foreach ($items as $index => &$item) {
        if (!is_array($item) || in_array($item['background'] ?? '', ['white', 'gray'], true)) {
            continue;
        }

        $item['background'] = emko_home_product_category_background_for_index($index);
        $needs_update = true;
    }
    unset($item);

    if (!$needs_update || update_field('field_emko_home_product_categories', $items, $page_id) !== false) {
        update_post_meta($page_id, '_emko_home_product_categories_background_field_migrated', '1');
    }
}

function emko_migrate_home_benefits_metrics_to_repeater(int $page_id): void {
    if (!function_exists('update_field') || get_post_meta($page_id, '_emko_home_benefits_metrics_repeater_migrated', true)) {
        return;
    }

    if ((int) get_post_meta($page_id, 'emko_home_benefits_metrics', true) > 0) {
        update_post_meta($page_id, '_emko_home_benefits_metrics_repeater_migrated', '1');
        return;
    }

    $legacy_metrics = [
        ['value' => 'emko_home_benefits_metric_1_value_125_1625', 'prefix' => '', 'unit' => 'emko_home_benefits_metric_1_unit_125_1614', 'label' => 'emko_home_benefits_metric_1_label_125_1613'],
        ['value' => 'emko_home_benefits_metric_2_value_125_1626', 'prefix' => 'emko_home_benefits_metric_2_prefix_125_1618', 'unit' => 'emko_home_benefits_metric_2_unit_125_1615', 'label' => 'emko_home_benefits_metric_2_label_125_1623'],
        ['value' => 'emko_home_benefits_metric_3_value_125_1627', 'prefix' => 'emko_home_benefits_metric_3_prefix_125_1619', 'unit' => 'emko_home_benefits_metric_3_unit_125_1616', 'label' => 'emko_home_benefits_metric_3_label_125_1621'],
        ['value' => 'emko_home_benefits_metric_4_value_125_1628', 'prefix' => 'emko_home_benefits_metric_4_prefix_125_1620', 'unit' => 'emko_home_benefits_metric_4_unit_125_1617', 'label' => 'emko_home_benefits_metric_4_label_125_1622'],
    ];
    $metrics = [];

    foreach ($legacy_metrics as $legacy_metric) {
        $metric = [];
        foreach ($legacy_metric as $key => $field_name) {
            $value = $field_name !== '' ? get_post_meta($page_id, $field_name, true) : '';
            if ($field_name !== '' && !metadata_exists('post', $page_id, $field_name)) {
                $value = get_option('options_' . $field_name, '');
            }
            $metric[$key] = trim((string) $value);
        }

        if (array_filter($metric, static fn (string $value): bool => $value !== '')) {
            $metrics[] = $metric;
        }
    }

    if ($metrics && update_field('field_emko_home_benefits_metrics', $metrics, $page_id) !== false) {
        update_post_meta($page_id, '_emko_home_benefits_metrics_repeater_migrated', '1');
    }
}

function emko_migrate_home_faq_to_repeater(int $page_id): void {
    if (!function_exists('get_field') || !function_exists('update_field') || get_post_meta($page_id, '_emko_home_faq_repeater_migrated', true)) {
        return;
    }

    $current_items = get_field('emko_home_faq_items', $page_id);
    if (is_array($current_items) && $current_items) {
        update_post_meta($page_id, '_emko_home_faq_repeater_migrated', '1');
        return;
    }

    $legacy_items = [
        ['question' => 'emko_home_faq_item_1_question_125_1665', 'answer' => ''],
        ['question' => 'emko_home_faq_item_2_question_125_1666', 'answer' => ''],
        ['question' => 'emko_home_faq_item_3_question_125_1667', 'answer' => 'emko_home_faq_item_3_answer_125_1667'],
        ['question' => 'emko_home_faq_item_4_question_125_1668', 'answer' => ''],
    ];
    $items = [];

    foreach ($legacy_items as $legacy_item) {
        $question = get_post_meta($page_id, $legacy_item['question'], true);
        if (!metadata_exists('post', $page_id, $legacy_item['question'])) {
            $question = get_option('options_' . $legacy_item['question'], '');
        }
        $question = trim(wp_strip_all_tags((string) $question));

        if ($question === '') {
            continue;
        }

        $answer = '';
        if ($legacy_item['answer'] !== '') {
            $answer = get_post_meta($page_id, $legacy_item['answer'], true);
            if (!metadata_exists('post', $page_id, $legacy_item['answer'])) {
                $answer = get_option('options_' . $legacy_item['answer'], '');
            }
        }

        $items[] = [
            'question' => $question,
            'answer' => (string) $answer,
        ];
    }

    if ($items && update_field('field_emko_home_faq_items', $items, $page_id) !== false) {
        update_post_meta($page_id, '_emko_home_faq_repeater_migrated', '1');
    }
}

function emko_home_field(string $field, $fallback = null) {
    $page_id = is_front_page() ? (int) get_queried_object_id() : 0;
    if ($page_id && metadata_exists('post', $page_id, $field)) {
        return function_exists('get_field') ? get_field($field, $page_id) : get_post_meta($page_id, $field, true);
    }

    $option_value = get_option('options_' . $field, null);
    if ($option_value !== null) {
        return $option_value;
    }

    return $fallback;
}
