<?php
/** Project-owned shared behavior for RudnikAgro. */
function rudnikagro_register_options_page(): void {
    if (function_exists('acf_add_options_page')) {
        acf_add_options_page(['page_title' => 'RudnikAgro', 'menu_title' => 'RudnikAgro', 'menu_slug' => 'rudnikagro', 'redirect' => false]);
    }
}
add_action('acf/init', 'rudnikagro_register_options_page');

function rudnikagro_option(string $field) { return function_exists('get_field') ? get_field($field, 'option') : null; }
function rudnikagro_image(int $attachment_id, string $class = '', array $attributes = []): string {
    if (!$attachment_id) { return ''; }
    $attributes['class'] = trim($class);
    return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
}
function rudnikagro_lines($value): array {
    return !is_string($value) || $value === '' ? [] : array_values(array_filter(array_map('trim', preg_split('/(?:\R|<br\s*\/?\s*>)/iu', $value))));
}
function rudnikagro_render_text_column(string $field, string $class): void {
    $lines = rudnikagro_lines(rudnikagro_option($field));
    if (!$lines) { return; }
    echo '<section class="' . esc_attr($class) . '"><h2>' . esc_html(array_shift($lines)) . '</h2>';
    foreach ($lines as $line) { echo '<p>' . esc_html($line) . '</p>'; }
    echo '</section>';
}
function rudnikagro_setup_theme_support(): void { add_theme_support('woocommerce'); }
add_action('after_setup_theme', 'rudnikagro_setup_theme_support');

function rudnikagro_blog_archive_query(WP_Query $query): void {
    if (!is_admin() && $query->is_main_query() && $query->is_home()) {
        $query->set('posts_per_page', 12);
        $query->set('meta_key', '_rudnikagro_blog_source_order');
        $query->set('orderby', 'meta_value_num');
        $query->set('order', 'ASC');
    }
}
add_action('pre_get_posts', 'rudnikagro_blog_archive_query');

function rudnikagro_product_archive_query(WP_Query $query): void {
    if (is_admin() || !$query->is_main_query() || !$query->is_tax('product_cat')) { return; }
    $query->set('posts_per_page', 18);
    $query->set('meta_key', '_rudnikagro_archive_source_order');
    $query->set('orderby', 'meta_value_num');
    $query->set('order', 'ASC');
}
add_action('pre_get_posts', 'rudnikagro_product_archive_query');

function rudnikagro_checkout_source_fields(array $fields): array {
    $labels = [
        'billing_first_name' => 'rudnikagro_checkout_customer_details_509_264',
        'billing_last_name' => 'rudnikagro_checkout_customer_details_509_267',
        'billing_address_1' => 'rudnikagro_checkout_customer_details_491_668',
        'billing_postcode' => 'rudnikagro_checkout_customer_details_491_676',
        'billing_city' => 'rudnikagro_checkout_customer_details_491_677',
        'billing_phone' => 'rudnikagro_checkout_customer_details_491_681',
        'billing_email' => 'rudnikagro_checkout_customer_details_491_682',
    ];
    foreach ($labels as $field => $option) {
        if (isset($fields['billing'][$field]) && ($value = rudnikagro_option($option)) !== null && $value !== '') {
            $fields['billing'][$field]['label'] = (string) $value;
            $fields['billing'][$field]['placeholder'] = (string) $value;
        }
    }
    if (isset($fields['billing']['billing_country']) && ($country = rudnikagro_option('rudnikagro_checkout_customer_details_509_270')) !== null && $country !== '') {
        $fields['billing']['billing_country']['label'] = (string) $country;
        $fields['billing']['billing_country']['default'] = 'PL';
    }
    return $fields;
}
add_filter('woocommerce_checkout_fields', 'rudnikagro_checkout_source_fields', 20);

function rudnikagro_checkout_split_order_review(): void {
    remove_action('woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20);
    remove_action('woocommerce_before_checkout_form', 'woocommerce_checkout_coupon_form', 10);
}
add_action('wp', 'rudnikagro_checkout_split_order_review', 20);

function rudnikagro_allow_empty_checkout_entry(bool $redirect): bool {
    return is_checkout() && !is_user_logged_in() ? false : $redirect;
}
add_filter('woocommerce_checkout_redirect_empty_cart', 'rudnikagro_allow_empty_checkout_entry');

function rudnikagro_validate_registration_confirmation($errors, string $username, string $email): WP_Error {
    if (!isset($_POST['password_confirm'])) { return $errors; }
    $password = isset($_POST['password']) ? (string) wp_unslash($_POST['password']) : '';
    $confirmation = (string) wp_unslash($_POST['password_confirm']);
    if ($password !== $confirmation) { $errors->add('rudnikagro_password_confirmation', __('Passwords do not match.', 'rudnikagro')); }
    return $errors;
}
add_filter('woocommerce_registration_errors', 'rudnikagro_validate_registration_confirmation', 10, 3);

function rudnikagro_store_registration_names(int $customer_id): void {
    foreach (['first_name', 'last_name'] as $name) {
        if (!empty($_POST[$name])) { update_user_meta($customer_id, $name, sanitize_text_field(wp_unslash($_POST[$name]))); }
    }
}
add_action('woocommerce_created_customer', 'rudnikagro_store_registration_names');
