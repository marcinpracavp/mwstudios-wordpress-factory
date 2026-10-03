<?php
/** Project-owned shared behavior for RudnikAgro. */
function emko_register_options_page(): void {
    if (function_exists('acf_add_options_page')) {
        acf_add_options_page(['page_title' => 'Emko', 'menu_title' => 'Emko', 'menu_slug' => 'emko', 'redirect' => false]);
    }
}
add_action('acf/init', 'emko_register_options_page');

function emko_option(string $field) { return function_exists('get_field') ? get_field($field, 'option') : null; }

/**
 * Returns editable "O nas" content from its page first. The option fallback
 * preserves the rendered route while Local JSON is being synced or migrated.
 */
function emko_about_field(string $field, int $page_id = 0) {
    if (!function_exists('get_field')) {
        return null;
    }

    $page_id = $page_id ?: (int) get_queried_object_id();
    $value = $page_id > 0 ? get_field($field, $page_id) : null;

    if ($value !== null && $value !== '' && $value !== []) {
        return $value;
    }

    return get_field($field, 'option');
}

/** Hide obsolete per-post blog fields on installations that have not synced Local JSON yet. */
function emko_hide_legacy_blog_post_acf_fields($field) {
    if (!is_array($field)) {
        return $field;
    }

    $legacy_fields = [
        'emko_tab_blog_article_header', 'emko_blog_article_header',
        'emko_tab_blog_article_content', 'emko_blog_article_return_label',
        'emko_tab_blog_related', 'emko_blog_related_heading', 'emko_blog_related_posts',
        'emko_tab_blog_card', 'emko_blog_card_date', 'emko_blog_card_label', 'emko_blog_card_image',
        'rudnikagro_tab_blog_article_header', 'rudnikagro_blog_article_header',
        'rudnikagro_tab_blog_article_content', 'rudnikagro_blog_article_return_label',
        'rudnikagro_tab_blog_related', 'rudnikagro_blog_related_heading', 'rudnikagro_blog_related_posts',
        'rudnikagro_tab_blog_card', 'rudnikagro_blog_card_date', 'rudnikagro_blog_card_label', 'rudnikagro_blog_card_image',
    ];

    return in_array((string) ($field['name'] ?? ''), $legacy_fields, true) ? false : $field;
}
add_filter('acf/prepare_field', 'emko_hide_legacy_blog_post_acf_fields');

/**
 * Moves the previously imported single-article copy into WordPress's native
 * editor once. It only fills an empty post, so editorial changes are never
 * overwritten.
 */
function emko_migrate_legacy_blog_article_content(): void {
    if (!current_user_can('edit_posts') || get_option('emko_native_blog_article_content_migrated')) {
        return;
    }

    $legacy_content = (string) get_option('options_emko_blog_post_article_body_125_2163', '');
    if ($legacy_content === '' && function_exists('emko_option')) {
        $legacy_content = (string) emko_option('emko_blog_post_article_body_125_2163');
    }
    if (trim($legacy_content) === '') {
        return;
    }

    $article_ids = get_posts([
        'post_type' => 'post',
        'post_status' => 'any',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_query' => [
            'relation' => 'OR',
            ['key' => '_emko_blog_card_identity', 'value' => 'blog-post-related-card-2'],
            ['key' => '_rudnikagro_blog_card_identity', 'value' => 'blog-post-related-card-2'],
            ['key' => 'emko_blog_article_return_label', 'compare' => 'EXISTS'],
            ['key' => 'rudnikagro_blog_article_return_label', 'compare' => 'EXISTS'],
        ],
    ]);

    foreach ($article_ids as $article_id) {
        if (trim((string) get_post_field('post_content', $article_id)) !== '') {
            continue;
        }
        wp_update_post([
            'ID' => (int) $article_id,
            'post_content' => wpautop(wp_kses_post($legacy_content)),
        ]);
    }

    update_option('emko_native_blog_article_content_migrated', 1, false);
}
add_action('admin_init', 'emko_migrate_legacy_blog_article_content');
function emko_image(int $attachment_id, string $class = '', array $attributes = []): string {
    if (!$attachment_id) { return ''; }
    $attributes['class'] = trim($class);
    return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
}
function emko_lines($value): array {
    return !is_string($value) || $value === '' ? [] : array_values(array_filter(array_map('trim', preg_split('/(?:\R|<br\s*\/?\s*>)/iu', $value))));
}
function emko_render_text_column(string $field, string $class): void {
    $lines = emko_lines(emko_option($field));
    if (!$lines) { return; }
    echo '<section class="' . esc_attr($class) . '"><h2>' . esc_html(array_shift($lines)) . '</h2>';
    foreach ($lines as $line) { echo '<p>' . esc_html($line) . '</p>'; }
    echo '</section>';
}
function emko_setup_theme_support(): void { add_theme_support('woocommerce'); }
add_action('after_setup_theme', 'emko_setup_theme_support');

/**
 * Populate the Header settings with WordPress menus and items from the selected menu.
 * This keeps menu management in WordPress while giving the header a clear, editable
 * choice of which item opens the product-category panel.
 */
function emko_load_header_menu_choices(array $field): array {
    $field['choices'] = [];

    foreach (wp_get_nav_menus() as $menu) {
        $field['choices'][(string) $menu->term_id] = $menu->name;
    }

    return $field;
}
add_filter('acf/load_field/name=emko_shared_header_menu_id', 'emko_load_header_menu_choices');

/** Populate the footer menu picker from menus managed in WordPress. */
function emko_load_footer_menu_choices(array $field): array {
    $field['choices'] = [];

    foreach (wp_get_nav_menus() as $menu) {
        $field['choices'][(string) $menu->term_id] = $menu->name;
    }

    return $field;
}
add_filter('acf/load_field/name=emko_shared_footer_menu_id', 'emko_load_footer_menu_choices');

function emko_load_header_category_menu_item_choices(array $field): array {
    $field['choices'] = [];
    $menu_id = (int) get_option('options_emko_shared_header_menu_id', 0);

    if (!$menu_id) {
        $locations = get_nav_menu_locations();
        $menu_id = isset($locations['header']) ? (int) $locations['header'] : 0;
    }

    if (!$menu_id) {
        return $field;
    }

    foreach ((array) wp_get_nav_menu_items($menu_id) as $item) {
        $field['choices'][(string) $item->ID] = trim(wp_strip_all_tags($item->title));
    }

    return $field;
}
add_filter('acf/load_field/name=emko_shared_header_category_menu_item', 'emko_load_header_category_menu_item_choices');

/** Attach the dynamic product menu to the configured navigation item. */
function emko_product_menu_link_attributes(array $attributes, WP_Post $item, stdClass $args): array {
    if (empty($args->emko_header_menu)) {
        return $attributes;
    }

    $configured_item_id = (int) emko_option('emko_shared_header_category_menu_item');
    $is_product_item = $configured_item_id
        ? (int) $item->ID === $configured_item_id
        : sanitize_title($item->title) === 'produkty';

    if (!$is_product_item) {
        return $attributes;
    }

    $attributes['data-product-category-menu-toggle'] = 'site-product-category-menu';
    $attributes['aria-controls'] = 'site-product-category-menu';
    $attributes['aria-expanded'] = 'false';
    return $attributes;
}
add_filter('nav_menu_link_attributes', 'emko_product_menu_link_attributes', 10, 3);

/** Return header-search suggestions matching a WooCommerce product title or SKU. */
function emko_ajax_product_search(): void {
    $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';
    if (!wp_verify_nonce($nonce, 'emko_product_search')) {
        wp_send_json_error(['message' => __('Nie udało się zweryfikować wyszukiwania.', 'slawinsky')], 403);
    }

    $term = isset($_POST['term']) ? trim(sanitize_text_field(wp_unslash($_POST['term']))) : '';
    $term_length = function_exists('mb_strlen') ? mb_strlen($term) : strlen($term);
    if ($term_length < 2 || !post_type_exists('product')) {
        wp_send_json_success(['results' => []]);
    }

    $query_args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 8,
        'fields' => 'ids',
        'no_found_rows' => true,
        'orderby' => 'title',
        'order' => 'ASC',
    ];

    $title_ids = get_posts(array_merge($query_args, ['s' => $term]));
    $sku_ids = get_posts(array_merge($query_args, [
        'meta_query' => [[
            'key' => '_sku',
            'value' => $term,
            'compare' => 'LIKE',
        ]],
    ]));
    $product_ids = array_slice(array_values(array_unique(array_merge($title_ids, $sku_ids))), 0, 8);
    $results = [];

    foreach ($product_ids as $product_id) {
        $url = get_permalink($product_id);
        if (!$url) {
            continue;
        }

        $results[] = [
            'title' => html_entity_decode(get_the_title($product_id), ENT_QUOTES, get_bloginfo('charset')),
            'sku' => (string) get_post_meta($product_id, '_sku', true),
            'url' => $url,
        ];
    }

    wp_send_json_success(['results' => $results]);
}
add_action('wp_ajax_emko_product_search', 'emko_ajax_product_search');
add_action('wp_ajax_nopriv_emko_product_search', 'emko_ajax_product_search');

/**
 * Provides the stable product-preview route used by the catalogue design.
 *
 * This is deliberately separate from WooCommerce product permalinks: `/produkt/`
 * renders the shared product-detail composition, whereas individual products
 * continue to use their native single-product URLs.
 */
function emko_register_product_preview_route(): void {
    add_rewrite_rule('^produkt/?$', 'index.php?emko_product_preview=1', 'top');
}
add_action('init', 'emko_register_product_preview_route');

function emko_product_preview_query_vars(array $query_vars): array {
    $query_vars[] = 'emko_product_preview';
    return $query_vars;
}
add_filter('query_vars', 'emko_product_preview_query_vars');

function emko_product_preview_parse_request(WP $wp): void {
    if (trim($wp->request, '/') !== 'produkt') {
        return;
    }

    // Also serve the route when permalink rules have not yet been flushed.
    $wp->query_vars = ['emko_product_preview' => 1];
    $wp->matched_rule = 'emko-product-preview';
    $wp->matched_query = 'emko_product_preview=1';
}
add_action('parse_request', 'emko_product_preview_parse_request');

function emko_product_preview_template(string $template): string {
    $request_path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $is_product_preview_request = trim((string) $request_path, '/') === 'produkt';

    if ((int) get_query_var('emko_product_preview') !== 1 && !$is_product_preview_request) {
        return $template;
    }

    $product_template = locate_template('single-product.php');
    return $product_template ?: $template;
}
add_filter('template_include', 'emko_product_preview_template');

function emko_flush_rewrite_rules_on_theme_switch(): void {
    emko_register_product_preview_route();
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'emko_flush_rewrite_rules_on_theme_switch');

/**
 * Keeps the custom blog-card listing pagination independent from the main
 * WordPress posts query. The latter may have a different set of posts and
 * would otherwise return a 404 for valid listing pages.
 */
function emko_blog_pagination_query_vars(array $query_vars): array {
    $query_vars[] = 'blog_page';
    return $query_vars;
}
add_filter('query_vars', 'emko_blog_pagination_query_vars');

/** Redirect previously generated `paged` blog URLs to the custom listing page. */
function emko_redirect_legacy_blog_pagination(): void {
    $posts_page_id = (int) get_option('page_for_posts');
    $legacy_page = max(1, (int) get_query_var('paged'));
    $requested_page_id = isset($_GET['page_id']) && !is_array($_GET['page_id'])
        ? (int) wp_unslash($_GET['page_id'])
        : 0;

    if ($posts_page_id < 1 || $legacy_page < 2 || (!is_home() && $requested_page_id !== $posts_page_id)) {
        return;
    }

    $blog_url = get_permalink($posts_page_id);
    if (!$blog_url) {
        return;
    }

    wp_safe_redirect(add_query_arg('blog_page', $legacy_page, $blog_url), 301);
    exit;
}
add_action('template_redirect', 'emko_redirect_legacy_blog_pagination', 1);

function emko_blog_archive_query(WP_Query $query): void {
    if (!is_admin() && $query->is_main_query() && $query->is_home()) {
        $query->set('posts_per_page', 12);
        $query->set('meta_key', '_emko_blog_source_order');
        $query->set('orderby', 'meta_value_num');
        $query->set('order', 'ASC');
    }
}
add_action('pre_get_posts', 'emko_blog_archive_query');

function emko_product_archive_query(WP_Query $query): void {
    if (is_admin() || !$query->is_main_query() || !$query->is_tax('product_cat')) { return; }
    $query->set('posts_per_page', 18);
    $query->set('meta_key', '_emko_archive_source_order');
    $query->set('orderby', 'meta_value_num');
    $query->set('order', 'ASC');
}
add_action('pre_get_posts', 'emko_product_archive_query');

/**
 * Returns a validated catalogue filter value from the listing query string.
 * A zero value deliberately means "without a lower limit".
 */
function emko_product_filter_request_value(string $key): ?float {
    if (!isset($_GET[$key]) || is_array($_GET[$key])) {
        return null;
    }

    $value = str_replace(',', '.', (string) wp_unslash($_GET[$key]));
    if (!is_numeric($value)) {
        return null;
    }

    return max(0, min(500, (float) $value));
}

/**
 * Resolves a product category for both native taxonomy URLs and the legacy
 * query-string route used by the current product listing.
 */
function emko_current_product_category_term(): ?WP_Term {
    if (is_tax('product_cat')) {
        $term = get_queried_object();
        return $term instanceof WP_Term ? $term : null;
    }

    $requested_term = get_query_var('product_cat');
    if (!$requested_term && isset($_GET['product_cat']) && !is_array($_GET['product_cat'])) {
        $requested_term = (string) wp_unslash($_GET['product_cat']);
    }
    if (!is_scalar($requested_term) || $requested_term === '') {
        return null;
    }

    $term = get_term_by('slug', sanitize_title((string) $requested_term), 'product_cat');
    return $term instanceof WP_Term ? $term : null;
}

/** Keeps the query-string category route intact when a filter form is submitted. */
function emko_product_filter_form_action(): string {
    $term = emko_current_product_category_term();
    if ($term && !is_tax('product_cat')) {
        return add_query_arg('product_cat', $term->slug, home_url('/'));
    }
    if ($term) {
        $term_link = get_term_link($term);
        if (!is_wp_error($term_link)) {
            return $term_link;
        }
    }

    if (function_exists('is_post_type_archive') && is_post_type_archive('product')) {
        $archive_url = get_post_type_archive_link('product');
        if ($archive_url) {
            return $archive_url;
        }
    }

    if (function_exists('wc_get_page_permalink')) {
        $shop_url = wc_get_page_permalink('shop');
        if ($shop_url) {
            return $shop_url;
        }
    }

    return home_url('/produkty/');
}

/** Refreshes the visible catalogue grid without leaving the selected category. */
function emko_ajax_filter_products(): void {
    if (!check_ajax_referer('emko_product_filters', 'nonce', false)) {
        wp_send_json_error(['message' => __('Nie udało się zweryfikować filtrów.', 'emko')], 403);
    }

    $category = isset($_POST['product_cat']) && !is_array($_POST['product_cat'])
        ? sanitize_title((string) wp_unslash($_POST['product_cat']))
        : '';
    $term = $category !== '' ? get_term_by('slug', $category, 'product_cat') : false;
    if ($category !== '' && !($term instanceof WP_Term)) {
        wp_send_json_error(['message' => __('Nie znaleziono wybranej kategorii.', 'emko')], 400);
    }

    $request_value = static function (string $key): string {
        if (!isset($_POST[$key]) || is_array($_POST[$key])) {
            return '0';
        }

        $value = str_replace(',', '.', (string) wp_unslash($_POST[$key]));
        return is_numeric($value) ? (string) max(0, min(500, (float) $value)) : '0';
    };

    $original_get = $_GET;
    $_GET = [
        'strength' => $request_value('strength'),
        'extension' => $request_value('extension'),
    ];
    if ($term instanceof WP_Term) {
        $_GET['product_cat'] = $term->slug;
    }

    ob_start();
    get_template_part('partials/route-skeleton', null, [
        'route_id' => 'product-list',
        'sections' => ['product-list-items'],
        'product_list_items_fragment' => true,
    ]);
    $html = ob_get_clean();
    $_GET = $original_get;

    nocache_headers();
    wp_send_json_success(['html' => $html]);
}
add_action('wp_ajax_emko_filter_products', 'emko_ajax_filter_products');
add_action('wp_ajax_nopriv_emko_filter_products', 'emko_ajax_filter_products');

/** Extracts the first numeric value from a technical-table cell. */
function emko_product_filter_number(string $value): ?float {
    $value = wp_strip_all_tags($value);
    if (!preg_match('/-?\d+(?:[\.,]\d+)?/', $value, $matches)) {
        return null;
    }

    return (float) str_replace(',', '.', $matches[0]);
}

/**
 * Reads the complete product specification table, rather than the compact
 * technical-data repeater which only represents one configuration.
 */
function emko_product_specification_filter_rows(int $product_id): array {
    $table = function_exists('get_field') ? (array) get_field('emko_product_specification_table', $product_id) : [];
    $columns = array_values(array_filter(array_map(static function ($column): string {
        return trim((string) ($column['label'] ?? ''));
    }, (array) ($table['columns'] ?? []))));
    $rows = (array) ($table['rows'] ?? []);

    if (!$columns) {
        $columns = array_values(array_filter(array_map('trim', explode('|', (string) get_post_meta($product_id, 'emko_product_specification_headers', true)))));
        $rows = [];
        $row_count = (int) get_post_meta($product_id, 'emko_product_specification_rows', true);
        for ($index = 0; $index < $row_count; $index++) {
            $rows[] = ['cells' => (string) get_post_meta($product_id, "emko_product_specification_rows_{$index}_cells", true)];
        }
    }

    if (!$columns || !$rows) {
        return [];
    }

    $filter_rows = [];
    foreach ($rows as $row) {
        $cells = array_map('trim', explode('|', (string) ($row['cells'] ?? '')));
        if (!$cells) {
            continue;
        }

        $filter_rows[] = array_combine(array_slice($columns, 0, count($cells)), array_slice($cells, 0, count($columns)));
    }

    return array_values(array_filter($filter_rows));
}

/**
 * Tests whether at least one purchasable configuration from a product table
 * meets both selected minimums. Table capacities are stored in tonnes; the
 * listing slider expresses the equivalent engineering value in kN (1 t ≈ 10 kN).
 */
function emko_product_matches_catalogue_filters(int $product_id, ?float $strength, ?float $extension): bool {
    $requires_strength = $strength !== null && $strength > 0;
    $requires_extension = $extension !== null && $extension > 0;
    if (!$requires_strength && !$requires_extension) {
        return true;
    }

    foreach (emko_product_specification_filter_rows($product_id) as $row) {
        $row_strength = null;
        $row_extension = null;

        foreach ($row as $label => $value) {
            $normalized_label = sanitize_title((string) $label);
            $number = emko_product_filter_number((string) $value);
            if ($number === null) {
                continue;
            }

            if (strpos($normalized_label, 'udzwig') !== false || strpos($normalized_label, 'sila') !== false || strpos($normalized_label, 'force') !== false || strpos($normalized_label, 'capacity') !== false) {
                $row_strength = strpos($normalized_label, 'kn') !== false ? $number : $number * 10;
            }
            if (strpos($normalized_label, 'wysuw') !== false || strpos($normalized_label, 'skok') !== false || strpos($normalized_label, 'stroke') !== false || strpos($normalized_label, 'extension') !== false) {
                $row_extension = $number;
            }
        }

        if ((!$requires_strength || ($row_strength !== null && $row_strength >= $strength))
            && (!$requires_extension || ($row_extension !== null && $row_extension >= $extension))) {
            return true;
        }
    }

    return false;
}

/** Returns IDs eligible for the current category after applying table-based filters. */
function emko_product_ids_matching_catalogue_filters(array $query_args, ?float $strength, ?float $extension): array {
    $candidate_args = $query_args;
    unset($candidate_args['paged'], $candidate_args['post__in']);
    $candidate_args['posts_per_page'] = -1;
    $candidate_args['fields'] = 'ids';
    $candidate_args['no_found_rows'] = true;

    $product_ids = get_posts($candidate_args);
    return array_values(array_filter(array_map('intval', $product_ids), static function (int $product_id) use ($strength, $extension): bool {
        return emko_product_matches_catalogue_filters($product_id, $strength, $extension);
    }));
}

function emko_checkout_source_fields(array $fields): array {
    $labels = [
        'billing_first_name' => 'emko_checkout_customer_details_509_264',
        'billing_last_name' => 'emko_checkout_customer_details_509_267',
        'billing_address_1' => 'emko_checkout_customer_details_491_668',
        'billing_postcode' => 'emko_checkout_customer_details_491_676',
        'billing_city' => 'emko_checkout_customer_details_491_677',
        'billing_phone' => 'emko_checkout_customer_details_491_681',
        'billing_email' => 'emko_checkout_customer_details_491_682',
    ];
    foreach ($labels as $field => $option) {
        if (isset($fields['billing'][$field]) && ($value = emko_option($option)) !== null && $value !== '') {
            $fields['billing'][$field]['label'] = (string) $value;
            $fields['billing'][$field]['placeholder'] = (string) $value;
        }
    }
    if (isset($fields['billing']['billing_country']) && ($country = emko_option('emko_checkout_customer_details_509_270')) !== null && $country !== '') {
        $fields['billing']['billing_country']['label'] = (string) $country;
        $fields['billing']['billing_country']['default'] = 'PL';
    }
    return $fields;
}
add_filter('woocommerce_checkout_fields', 'emko_checkout_source_fields', 20);

function emko_checkout_split_order_review(): void {
    remove_action('woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20);
    remove_action('woocommerce_before_checkout_form', 'woocommerce_checkout_coupon_form', 10);
}
add_action('wp', 'emko_checkout_split_order_review', 20);

function emko_allow_empty_checkout_entry(bool $redirect): bool {
    return is_checkout() && !is_user_logged_in() ? false : $redirect;
}
add_filter('woocommerce_checkout_redirect_empty_cart', 'emko_allow_empty_checkout_entry');

function emko_validate_registration_confirmation($errors, string $username, string $email): WP_Error {
    if (!isset($_POST['password_confirm'])) { return $errors; }
    $password = isset($_POST['password']) ? (string) wp_unslash($_POST['password']) : '';
    $confirmation = (string) wp_unslash($_POST['password_confirm']);
    if ($password !== $confirmation) { $errors->add('emko_password_confirmation', __('Passwords do not match.', 'emko')); }
    return $errors;
}
add_filter('woocommerce_registration_errors', 'emko_validate_registration_confirmation', 10, 3);

function emko_store_registration_names(int $customer_id): void {
    foreach (['first_name', 'last_name'] as $name) {
        if (!empty($_POST[$name])) { update_user_meta($customer_id, $name, sanitize_text_field(wp_unslash($_POST[$name]))); }
    }
}
add_action('woocommerce_created_customer', 'emko_store_registration_names');

/**
 * Migrate the legacy project prefix once after the template was renamed.
 * Existing content remains available under the new Emko field/meta names.
 */
function emko_migrate_legacy_data(): void {
    if (get_option('emko_legacy_prefix_migrated', '') === '1' || !function_exists('get_option')) {
        return;
    }

    global $wpdb;

    $legacy_options = $wpdb->get_results(
        "SELECT option_name, option_value, autoload FROM {$wpdb->options} WHERE option_name LIKE 'options_rudnikagro%' OR option_name LIKE 'rudnikagro_scoped_%'",
        ARRAY_A
    );
    foreach ($legacy_options as $option) {
        $new_name = str_replace('rudnikagro', 'emko', (string) $option['option_name']);
        if (get_option($new_name, null) === null) {
            update_option($new_name, maybe_unserialize($option['option_value']), $option['autoload'] === 'yes');
        }
        delete_option($option['option_name']);
    }

    $legacy_meta = $wpdb->get_results(
        "SELECT meta_id, post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE meta_key LIKE '%rudnikagro%'",
        ARRAY_A
    );
    foreach ($legacy_meta as $meta) {
        $new_key = str_replace('rudnikagro', 'emko', (string) $meta['meta_key']);
        if (get_post_meta((int) $meta['post_id'], $new_key, true) === '') {
            update_post_meta((int) $meta['post_id'], $new_key, maybe_unserialize($meta['meta_value']));
        }
        delete_post_meta((int) $meta['post_id'], (string) $meta['meta_key']);
    }

    update_option('emko_legacy_prefix_migrated', '1', false);
}
add_action('init', 'emko_migrate_legacy_data', 5);

/** Populate the source-backed product fields once when the demo product exists. */
function emko_populate_general_purpose_cylinders(): void {
    if (!function_exists('get_field') || !function_exists('update_field')) {
        return;
    }

    $current_product_id = is_singular('product') ? (int) get_queried_object_id() : 0;
    $products = $current_product_id ? [$current_product_id] : get_posts([
        'post_type' => 'product',
        'post_status' => 'any',
        'name' => 'general-purpose-cylinders',
        'posts_per_page' => 1,
        'fields' => 'ids',
    ]);
    if (!$products) {
        $products = get_posts([
            'post_type' => 'product',
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ]);
        $products = array_values(array_filter($products, static function ($id): bool {
            $title = strtolower(trim((string) get_the_title((int) $id)));
            return in_array($title, ['general purpose cylinders', 'cylindry 700bar - obniżone cmp'], true);
        }));
    }
    if (!$products) {
        return;
    }

    $product_id = (int) $products[0];
    if (get_the_title($product_id) === 'General Purpose Cylinders') {
        wp_update_post(['ID' => $product_id, 'post_title' => 'Cylindry 700bar - obniżone CMP']);
    }
    $content = (array) get_field('emko_product_content', $product_id);
    if (empty($content['description'])) {
        $content['description'] = '<p>Cylindry hydrauliczne to elementy układów hydraulicznych, które zamieniają energię cieczy pod ciśnieniem na ruch liniowy i siłę mechaniczną. Wykorzystywane są m.in. w maszynach przemysłowych, budowlanych i rolniczych do podnoszenia, dociskania lub przesuwania ciężkich elementów. Składają się z tłoka, tłoczyska i korpusu, a ich parametry, takie jak siła i skok, dobiera się w zależności od zastosowania.</p>';
    }
    update_field('field_ra_product_content', $content, $product_id);

    if (!get_field('emko_product_description', $product_id) && !empty($content['description'])) {
        update_field('field_emko_product_description', $content['description'], $product_id);
    }
    if (!get_field('emko_product_gallery', $product_id)) {
        $gallery_ids = [];
        foreach (['125:3214', '125:3216'] as $gallery_source_node) {
            $gallery_attachment = get_posts([
                'post_type' => 'attachment',
                'post_status' => 'inherit',
                'posts_per_page' => 1,
                'meta_key' => 'data-factory-source-node',
                'meta_value' => $gallery_source_node,
                'fields' => 'ids',
            ]);
            if (!empty($gallery_attachment)) {
                $gallery_ids[] = (int) $gallery_attachment[0];
            }
        }
        if ($gallery_ids) {
            update_field('field_ra_product_gallery', $gallery_ids, $product_id);
        }
    }

    $benefit_rows = [
        'niski, kompaktowy profil korpusu',
        'antyślizgowa końcówka tłoczyska',
        'tłoczysko cofane sprężyną - praca w dowolnej pozycji',
        'szybkozłączka żeńska w standardzie',
        'pierścień zbierający zanieczyszczenia z tłoczyska',
        'możliwość zastosowania nasadki wahliwej',
        'opcjonalna modyfikacja na życzenie: otwory montażowe w podstawie',
    ];
    $existing_benefits = (array) get_field('emko_product_benefits', $product_id);
    if (empty($existing_benefits['title']) && empty($existing_benefits['content'])) {
        update_field('field_emko_product_benefits', [
            'title' => '<p>Zalety serii</p>',
            'content' => '<ul><li>' . implode('</li><li>', array_map('esc_html', $benefit_rows)) . '</li></ul>',
        ], $product_id);
    }

    $technical = (array) get_field('emko_product_technical_data', $product_id);
    $technical_labels = implode('|', array_map(static fn($row): string => (string) ($row['label'] ?? ''), $technical));
    if (!$technical || stripos($technical_labels, 'Capacity') !== false || stripos($technical_labels, 'Stroke') !== false) {
        $rows = [];
        $technical_values = [
            'Udźwig [ton]' => '10',
            'Model' => 'CMP10 NP25',
            'Wysuw [mm]' => '24',
            'Wysokość początkowa [mm]' => '25',
            'Średnica zewnętrzna [mm]' => '36',
            'Średnica tłoczyska [mm]' => '36',
            'Wymagana ilość oleju [cm3]' => '26',
            'Masa [kg]' => '2.5',
        ];
        foreach ($technical_values as $label => $value) {
            $rows[] = ['label' => $label, 'value' => $value];
        }
        update_field('field_ra_product_technical', $rows, $product_id);
    }

    if (!get_field('emko_product_inquiry', $product_id)) {
        update_field('field_ra_product_inquiry', ['heading' => 'Zapytaj o ofertę'], $product_id);
    }
    if (!get_field('emko_product_downloads', $product_id)) {
        update_field('field_ra_product_downloads', [['label' => 'Karta produktu do pobrania', 'file' => 0]], $product_id);
    }
    if (!get_field('emko_product_specification_rows', $product_id)) {
        $specification_rows = [];
        for ($index = 0; $index < 8; $index++) {
            $specification_rows[] = ['cells' => '10|CMP10 NP25|24|25|36|36|26|2.5'];
        }
        update_field('field_ra_product_specification_tabs', 'Tabela|Zastosowanie cylindrów CMP|Co nas wyróżnia ?', $product_id);
        update_field('field_ra_product_specification_headers', 'Udźwig [ton]|Model|Wysuw [mm]|Wysokość początkowa [mm]|Średnica zewnętrzna [mm]|Średnica tłoczyska [mm]|Wymagana ilość oleju [cm3]|Masa [kg]', $product_id);
        update_field('field_ra_product_specification_rows', $specification_rows, $product_id);
    }

    if (!get_field('emko_product_specification_table', $product_id)) {
        $legacy_headers = array_values(array_filter(array_map('trim', explode('|', (string) get_field('emko_product_specification_headers', $product_id)))));
        $legacy_rows = [];
        foreach ((array) get_field('emko_product_specification_rows', $product_id) as $legacy_row) {
            $legacy_rows[] = ['cells' => (string) ($legacy_row['cells'] ?? '')];
        }
        update_field('field_emko_product_specification_table', [
            'title' => '<p>Tabela</p>',
            'columns' => array_map(static fn ($label): array => ['label' => $label], $legacy_headers),
            'rows' => $legacy_rows,
        ], $product_id);
    }
    if (!get_field('emko_product_specification_use', $product_id)) {
        update_field('field_emko_product_specification_use', ['title' => '<p>Zastosowanie cylindrów CMP</p>', 'content' => (string) ($content['use'] ?? '')], $product_id);
    }
    if (!get_field('emko_product_specification_features', $product_id)) {
        update_field('field_emko_product_specification_features', ['title' => '<p>Co nas wyróżnia ?</p>', 'content' => (string) ($content['expanded_description'] ?? '')], $product_id);
    }
}
add_action('init', 'emko_populate_general_purpose_cylinders', 6);
add_action('acf/save_post', static function ($post_id): void {
    if (get_post_type((int) $post_id) === 'product') {
        emko_populate_general_purpose_cylinders();
    }
}, 20);
