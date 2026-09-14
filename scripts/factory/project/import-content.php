<?php
/**
 * RudnikAgro snapshot importer. Run only through the project's wp.js wrapper:
 * node scripts/factory/autopilot/wp.js eval-file scripts/factory/project/import-content.php
 *
 * It reads frozen snapshot bytes only, creates records tagged as RudnikAgro,
 * and never overwrites populated editor fields or an existing owned record.
 */
if (!defined('ABSPATH')) { fwrite(STDERR, "Run through WP-CLI.\n"); exit(1); }

$theme = get_template_directory();
$snapshot = $theme . '/.factory-cache/figma/latest';
$map_path = $snapshot . '/content-map.json';
if (!is_readable($map_path)) { throw new RuntimeException('Frozen content-map.json is unavailable.'); }
$content_map = json_decode((string) file_get_contents($map_path), true, 512, JSON_THROW_ON_ERROR);
$fields = $content_map['fields'] ?? [];
$by_name = [];
foreach ($fields as $field) { if (!empty($field['fieldName'])) { $by_name[$field['fieldName']] = $field; } }

$summary = ['options' => 0, 'attachments' => 0, 'pages' => 0, 'posts' => 0, 'menus' => 0];
function ra_source_field(array $by_name, string $name): ?array { return $by_name[$name] ?? null; }
function ra_section_values(array $by_name, string $section): array {
    $values = [];
    foreach ($by_name as $field) {
        if (($field['section'] ?? '') !== $section || !is_string($field['value'] ?? null)) { continue; }
        $value = ra_repair_source_encoding((string) $field['value']);
        if ($value !== '') { $values[] = ['name' => (string) ($field['fieldName'] ?? ''), 'value' => $value]; }
    }
    return $values;
}
function ra_first_matching_value(array $values, string $needle): string {
    foreach ($values as $item) { if (stripos($item['value'], $needle) !== false) { return $item['value']; } }
    return '';
}
function ra_update_empty_product_field(int $post_id, string $field, $value): void {
    if (!function_exists('get_field') || !function_exists('update_field') || $value === '' || $value === [] || $value === null) { return; }
    $existing = get_field($field, $post_id);
    if ($existing === null || $existing === '' || $existing === false || $existing === []) { update_field($field, $value, $post_id); }
}
function ra_source_rich_text(string $snapshot, string $section_snapshot, string $value): string {
    $source = $snapshot . '/' . ltrim($section_snapshot, '/');
    if ($value === '' || !is_readable($source)) { return wpautop(esc_html($value)); }
    $section = json_decode((string) file_get_contents($source), true);
    $styles = $section['typography']['styles'] ?? [];
    $runs = $section['typography']['runs'] ?? [];
    if (!$runs || !function_exists('mb_substr')) { return wpautop(esc_html($value)); }
    $html = ''; $offset = 0;
    foreach ($runs as $run) {
        $end = (int) ($run['end'] ?? $offset);
        if ($end <= $offset) { continue; }
        $text = mb_substr($value, $offset, $end - $offset, 'UTF-8');
        $weight = (int) ($styles[(int) ($run['styleIndex'] ?? -1)]['fontWeight'] ?? 400);
        $text = nl2br(esc_html($text));
        $html .= $weight >= 700 ? '<strong>' . $text . '</strong>' : $text;
        $offset = $end;
    }
    $remaining = mb_substr($value, $offset, null, 'UTF-8');
    if ($remaining !== '') { $html .= nl2br(esc_html($remaining)); }
    return wpautop($html);
}
function ra_update_legacy_imported_product_content(int $post_id, array $content, string $legacy_expanded, string $source_expanded): void {
    if (!function_exists('get_field') || !function_exists('update_field') || $source_expanded === '') { return; }
    $existing = (array) get_field('rudnikagro_product_content', $post_id);
    $current = (string) ($existing['expanded_description'] ?? '');
    $last = (string) get_post_meta($post_id, '_rudnikagro_last_imported_expanded_description', true);
    if ($current !== '' && $current !== $legacy_expanded && ($last === '' || $current !== $last)) { return; }
    $content['expanded_description'] = $source_expanded;
    update_field('field_ra_product_content', $content, $post_id);
    update_post_meta($post_id, '_rudnikagro_last_imported_expanded_description', $source_expanded);
}
function ra_is_populated_option(string $name): bool {
    $value = get_field($name, 'option');
    return !($value === null || $value === '' || $value === false || $value === []);
}
function ra_update_owned_option(string $field_key, string $field_name, $value): void {
    global $summary;
    if (!function_exists('get_field') || !function_exists('update_field') || $value === '' || $value === null) { return; }
    $current = get_field($field_name, 'option');
    $last_key = '_rudnikagro_last_imported_option_' . $field_name;
    $last = get_option($last_key, null);
    if ($current !== null && $current !== '' && $last !== null && (string) $current !== (string) $last) { return; }
    if ($current === null || $current === '' || (string) $current === (string) $last) {
        update_field($field_key, $value, 'option');
        update_option($last_key, $value, false);
        $summary['options']++;
    }
}
function ra_import_attachment(string $snapshot, string $source_relative, string $field_name): int {
    global $summary;
    $source = realpath($snapshot . '/' . ltrim($source_relative, '/'));
    $root = realpath($snapshot);
    if (!$source || !$root || strncmp($source, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) !== 0 || !is_file($source)) {
        throw new RuntimeException('Missing frozen media for ' . $field_name);
    }
    $existing = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_rudnikagro_source_field', 'meta_value' => $field_name, 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $bytes = (string) file_get_contents($source);
    if (strtolower(pathinfo($source, PATHINFO_EXTENSION)) === 'svg' && preg_match('/<script|<foreignObject|\son\w+\s*=|javascript\s*:/i', $bytes)) {
        throw new RuntimeException('Unsafe source SVG rejected for ' . $field_name);
    }
    $upload = wp_upload_bits(wp_unique_filename(wp_upload_dir()['path'], basename($source)), null, $bytes);
    if (!empty($upload['error'])) { throw new RuntimeException($upload['error']); }
    $filetype = wp_check_filetype($upload['file']);
    $id = wp_insert_attachment(['post_mime_type' => $filetype['type'] ?: 'image/svg+xml', 'post_title' => sanitize_file_name(pathinfo($source, PATHINFO_FILENAME)), 'post_status' => 'inherit'], $upload['file']);
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $metadata = wp_generate_attachment_metadata($id, $upload['file']);
    if ($metadata) { wp_update_attachment_metadata($id, $metadata); }
    update_post_meta($id, '_rudnikagro_source_field', $field_name);
    update_post_meta($id, '_rudnikagro_source_asset', $source_relative);
    $summary['attachments']++;
    return (int) $id;
}
function ra_import_home_active_navigation(string $snapshot): void {
    /* Exact values from the frozen shared-primary-navigation-active record.
     * This interaction state is not in the canonical navigation content map. */
    $values = [
        ['field_ra_primary_active_labels', 'rudnikagro_shared_primary_navigation_active_I574_5_93_29', "Środki ochrony roślin\nHandel równoległy – Zamienniki\nNawozy i dodatki\nBiostymulatory\nNasiona\nPromocje\nNowości\nPakiety"],
        ['field_ra_primary_active_categories', 'rudnikagro_shared_primary_navigation_active_250_754', "Herbicydy\nFungicydy\nInsektycydy\nRegulatory\nZaprawy\nAdiuwanty"],
        ['field_ra_primary_active_crops_1', 'rudnikagro_shared_primary_navigation_active_250_762', "Zboża\nRzepak\nKukurydza\nBuraki\nZiemniaki\nWarzywa"],
        ['field_ra_primary_active_crops_2', 'rudnikagro_shared_primary_navigation_active_250_763', "Strączkowe\nJagodniki\nSady\nOwoce miękkie"],
    ];
    foreach ($values as [$key, $name, $value]) {
        /* Earlier extraction stored an encoding-lossy question-mark form. It
         * cannot be an editorial override, so repair it before normal owned
         * baseline rules resume. */
        $current = (string) get_field($name, 'option');
        if ($current !== '' && str_contains($current, '?')) {
            update_field($key, $value, 'option');
            update_option('_rudnikagro_last_imported_option_' . $name, $value, false);
            $GLOBALS['summary']['options']++;
            continue;
        }
        ra_update_owned_option($key, $name, $value);
    }
    $assets = [
        ['field_ra_primary_active_logo', 'rudnikagro_shared_primary_navigation_active_media_250_729', 'assets/home/250-729-logo1.svg'],
        ['field_ra_primary_active_background', 'rudnikagro_shared_primary_navigation_active_media_250_752', 'assets/home/250-752-rectangle43.svg'],
        ['field_ra_primary_active_chevron', 'rudnikagro_shared_primary_navigation_active_media_250_755', 'assets/home/250-755-vector1.svg'],
        ['field_ra_primary_active_divider', 'rudnikagro_shared_primary_navigation_active_media_250_764', 'assets/home/250-764-line7.svg'],
        ['field_ra_primary_active_selected', 'rudnikagro_shared_primary_navigation_active_media_250_765', 'assets/home/250-765-rectangle31.svg'],
    ];
    foreach ($assets as [$key, $name, $asset]) { ra_update_owned_option($key, $name, ra_import_attachment($snapshot, $asset, $name)); }
}
function ra_import_reference_crop_attachment(string $snapshot, string $source_relative, array $crop, string $field_name): int {
    global $summary;
    $existing = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_rudnikagro_source_field', 'meta_value' => $field_name, 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $source = realpath($snapshot . '/' . ltrim($source_relative, '/'));
    $root = realpath($snapshot);
    if (!$source || !$root || strncmp($source, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) !== 0 || !is_file($source)) { throw new RuntimeException('Missing frozen reference for ' . $field_name); }
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $editor = wp_get_image_editor($source);
    if (is_wp_error($editor)) { throw new RuntimeException($editor->get_error_message()); }
    $editor->crop((int) $crop['x'], (int) $crop['y'], (int) $crop['width'], (int) $crop['height']);
    $uploads = wp_upload_dir();
    $target = trailingslashit($uploads['path']) . wp_unique_filename($uploads['path'], $field_name . '.png');
    $saved = $editor->save($target, 'image/png');
    if (is_wp_error($saved)) { throw new RuntimeException($saved->get_error_message()); }
    $id = wp_insert_attachment(['post_mime_type' => 'image/png', 'post_title' => sanitize_file_name($field_name), 'post_status' => 'inherit'], $saved['path']);
    $metadata = wp_generate_attachment_metadata($id, $saved['path']);
    if ($metadata) { wp_update_attachment_metadata($id, $metadata); }
    update_post_meta($id, '_rudnikagro_source_field', $field_name);
    update_post_meta($id, '_rudnikagro_source_asset', $source_relative);
    update_post_meta($id, '_rudnikagro_source_crop', wp_json_encode($crop));
    $summary['attachments']++;
    return (int) $id;
}
function ra_source_value_by_node(array $by_name, string $node_id): string {
    foreach ($by_name as $field) {
        if (($field['nodeId'] ?? '') === $node_id && is_string($field['value'] ?? null)) { return ra_repair_source_encoding($field['value']); }
    }
    return '';
}
function ra_source_price(string $value): ?float {
    if (!preg_match('/([0-9][0-9\p{Zs}\x{00A0}\x{202F}]*[,.]\d{2})/u', $value, $matches)) { return null; }
    $normalized = preg_replace('/[^0-9,.]/', '', $matches[1]);
    if ($normalized === null || $normalized === '') { return null; }
    $decimal = max((int) strrpos($normalized, ','), (int) strrpos($normalized, '.'));
    if ($decimal > 0) { $normalized = str_replace([',', '.'], '', substr($normalized, 0, $decimal)) . '.' . substr($normalized, $decimal + 1); }
    return is_numeric($normalized) ? (float) $normalized : null;
}
function ra_import_cart_options(array $by_name): void {
    $fields = [
        ['field_ra_cart_heading', 'rudnikagro_cart_heading', '482:5'],
        ['field_ra_cart_continue', 'rudnikagro_cart_continue_shopping_label', '502:10'],
        ['field_ra_cart_coupon_heading', 'rudnikagro_cart_coupon_heading', '487:122'],
        ['field_ra_cart_coupon_placeholder', 'rudnikagro_cart_coupon_placeholder', '487:135'],
        ['field_ra_cart_apply_coupon', 'rudnikagro_cart_apply_coupon_label', '487:128'],
        ['field_ra_cart_summary', 'rudnikagro_cart_summary_heading', '486:50'],
        ['field_ra_cart_products', 'rudnikagro_cart_products_label', '486:52'],
        ['field_ra_cart_shipping', 'rudnikagro_cart_shipping_label', '486:52'],
        ['field_ra_cart_discount', 'rudnikagro_cart_discount_label', '486:52'],
        ['field_ra_cart_total', 'rudnikagro_cart_total_label', '486:105'],
        ['field_ra_cart_checkout', 'rudnikagro_cart_checkout_label', '486:115'],
    ];
    foreach ($fields as [$key, $name, $node]) {
        // The cart-summary labels share one Figma text node but have individual
        // source-context records. Prefer that exact field record; falling back
        // to the node keeps older frozen snapshots importable.
        $source_field = ra_source_field($by_name, $name);
        $has_exact_source_field = is_array($source_field) && is_string($source_field['value'] ?? null);
        $value = $has_exact_source_field
            ? ra_repair_source_encoding($source_field['value'])
            : ra_source_value_by_node($by_name, $node);
        if (!$has_exact_source_field && in_array($name, ['rudnikagro_cart_products_label', 'rudnikagro_cart_shipping_label', 'rudnikagro_cart_discount_label'], true)) {
            $labels = preg_split('/\R/u', $value) ?: [];
            $positions = ['rudnikagro_cart_products_label' => 0, 'rudnikagro_cart_shipping_label' => 1, 'rudnikagro_cart_discount_label' => 2];
            $value = (string) ($labels[$positions[$name]] ?? '');
        }
        ra_update_owned_option($key, $name, $value);
    }
}
function ra_import_cart_commerce_configuration(): void {
    if (!class_exists('WooCommerce')) { return; }
    $coupon_id = wc_get_coupon_id_by_code('BLACKFRIDAY');
    if (!$coupon_id) {
        $coupon = new WC_Coupon();
        $coupon->set_code('BLACKFRIDAY');
        $coupon->set_discount_type('fixed_cart');
        $coupon->set_amount('50');
        $coupon->set_individual_use(false);
        $coupon->set_description('RudnikAgro source cart state');
        $coupon_id = $coupon->save();
        update_post_meta($coupon_id, '_rudnikagro_owned', '1');
        update_post_meta($coupon_id, '_rudnikagro_coupon_provenance', wp_json_encode(['sourceNode' => '486:54', 'code' => 'BLACKFRIDAY', 'displayedDiscount' => '50 zł', 'implementation' => 'fixed_cart'], JSON_UNESCAPED_UNICODE));
    }
    $zone = WC_Shipping_Zones::get_zone(0);
    $methods = $zone ? $zone->get_shipping_methods(true) : [];
    $instance_id = 0;
    foreach ($methods as $method) {
        if ($method->id === 'flat_rate' && get_option('_rudnikagro_cart_shipping_instance', '') === (string) $method->instance_id) { $instance_id = (int) $method->instance_id; break; }
    }
    if (!$instance_id && $zone) {
        $instance_id = (int) $zone->add_shipping_method('flat_rate');
        update_option('_rudnikagro_cart_shipping_instance', (string) $instance_id, false);
        update_option('woocommerce_flat_rate_' . $instance_id . '_settings', ['title' => 'Wysyłka', 'tax_status' => 'none', 'cost' => '22.90'], false);
        update_option('_rudnikagro_cart_shipping_provenance', wp_json_encode(['sourceNode' => '486:54', 'displayedAmount' => '22,90 zł', 'taxBasis' => 'including 23% VAT, source node 502:3'], JSON_UNESCAPED_UNICODE), false);
    }
}
function ra_import_account_options(array $by_name): void {
    $fields = [
        ['field_ra_account_login_title', 'rudnikagro_account_login_title', 'rudnikagro_account_login_524_197'],
        ['field_ra_account_login_remember', 'rudnikagro_account_login_remember_label', 'rudnikagro_account_login_524_198'],
        ['field_ra_account_login_reset', 'rudnikagro_account_login_reset_label', 'rudnikagro_account_login_524_202'],
        ['field_ra_account_login_submit', 'rudnikagro_account_login_submit_label', 'rudnikagro_account_login_524_205'],
        ['field_ra_account_login_email', 'rudnikagro_account_login_email_label', 'rudnikagro_account_login_524_207'],
        ['field_ra_account_login_password', 'rudnikagro_account_login_password_label', 'rudnikagro_account_login_524_209'],
        ['field_ra_account_registration_title', 'rudnikagro_account_registration_title', 'rudnikagro_account_registration_title'],
        ['field_ra_account_registration_benefits', 'rudnikagro_account_registration_benefits', 'rudnikagro_account_registration_benefits'],
        ['field_ra_account_registration_submit', 'rudnikagro_account_registration_submit_label', 'rudnikagro_account_registration_submit_label'],
    ];
    foreach ($fields as [$key, $name, $source]) {
        $value = ra_source_field($by_name, $source)['value'] ?? '';
        if (is_string($value) && $value !== '') { ra_update_owned_option($key, $name, ra_repair_source_encoding($value)); }
    }
    $breadcrumb = ra_source_field($by_name, 'rudnikagro_account_breadcrumb')['value'] ?? null;
    if (is_array($breadcrumb)) { ra_update_owned_option('field_ra_account_breadcrumb', 'rudnikagro_account_breadcrumb', $breadcrumb); }
}
function ra_import_checkout_options(array $by_name, string $snapshot): void {
    foreach ($by_name as $name => $field) {
        $is_checkout_content = str_starts_with($name, 'rudnikagro_checkout_');
        $is_registration_content = str_starts_with($name, 'rudnikagro_account_registration_dialog_');
        if ((!$is_checkout_content && !$is_registration_content) || !is_string($field['value'] ?? null)) { continue; }
        ra_update_owned_option($name, $name, ra_repair_source_encoding($field['value']));
    }
    $icons = [
        'rudnikagro_checkout_icon_payment_card' => 'assets/checkout/checkout-card.svg',
        'rudnikagro_checkout_icon_google_pay' => 'assets/checkout/checkout-google-pay.svg',
        'rudnikagro_checkout_icon_apple_pay' => 'assets/checkout/checkout-apple-pay.svg',
        'rudnikagro_checkout_icon_blik' => 'assets/checkout/checkout-blik-logo.png',
        'rudnikagro_checkout_icon_bank_transfer' => 'assets/checkout/checkout-bank-transfer.svg',
        'rudnikagro_checkout_icon_payment_radio' => 'assets/checkout/checkout-radio.svg',
        'rudnikagro_checkout_icon_payment_radio_active' => 'assets/checkout/checkout-radio-active.svg',
        'rudnikagro_checkout_icon_delivery_radio' => 'assets/checkout/checkout-delivery-radio.svg',
        'rudnikagro_checkout_icon_delivery_radio_active' => 'assets/checkout/checkout-delivery-radio-active.svg',
    ];
    foreach ($icons as $field => $asset) { ra_update_owned_option($field, $field, ra_import_attachment($snapshot, $asset, $field)); }
    ra_update_owned_option('field_ra_registration_background', 'rudnikagro_account_registration_dialog_background', ra_import_attachment($snapshot, 'assets/checkout/account-registration-dialog.svg', 'rudnikagro_account_registration_dialog_background'));
}
function ra_import_checkout_commerce_configuration(array $by_name): void {
    if (!class_exists('WooCommerce')) { return; }
    $bank_transfer = ra_source_value_by_node($by_name, '492:728');
    $bacs = get_option('woocommerce_bacs_settings', null);
    if ($bank_transfer !== '' && $bacs === null) {
        update_option('woocommerce_bacs_settings', ['enabled' => 'yes', 'title' => $bank_transfer, 'description' => '', 'instructions' => '', 'account_details' => []], false);
        update_option('_rudnikagro_checkout_bacs_provenance', wp_json_encode(['sourceNode' => '492:728', 'gateway' => 'bacs', 'configuration' => 'source-backed native manual bank transfer'], JSON_UNESCAPED_UNICODE), false);
    }
    $instance_id = (int) get_option('_rudnikagro_cart_shipping_instance', 0);
    $courier = ra_source_value_by_node($by_name, '492:746');
    if ($instance_id && $courier !== '') {
        $key = 'woocommerce_flat_rate_' . $instance_id . '_settings';
        $settings = get_option($key, []);
        if (is_array($settings) && (($settings['title'] ?? '') === 'Wysyłka' || ($settings['title'] ?? '') === '')) {
            $settings['title'] = $courier;
            update_option($key, $settings, false);
            update_option('_rudnikagro_checkout_shipping_provenance', wp_json_encode(['sourceNode' => '492:746', 'instanceId' => $instance_id], JSON_UNESCAPED_UNICODE), false);
        }
    }
    $default_country = get_option('woocommerce_default_country', '');
    $last_country = get_option('_rudnikagro_last_imported_checkout_country', '');
    if ($default_country === 'US:CA' || ($last_country !== '' && $default_country === $last_country) || $default_country === '') {
        update_option('woocommerce_default_country', 'PL', false);
        update_option('_rudnikagro_last_imported_checkout_country', 'PL', false);
    }
    $checkout_id = (int) wc_get_page_id('checkout');
    if ($checkout_id && get_post_meta($checkout_id, '_rudnikagro_route_id', true) === 'checkout') {
        $content = (string) get_post_field('post_content', $checkout_id);
        $last_content = (string) get_post_meta($checkout_id, '_rudnikagro_last_imported_checkout_content', true);
        if (($last_content !== '' && $content === $last_content) || ($last_content === '' && str_contains($content, 'wp:woocommerce/checkout'))) {
            wp_update_post(['ID' => $checkout_id, 'post_content' => '[woocommerce_checkout]']);
            update_post_meta($checkout_id, '_rudnikagro_last_imported_checkout_content', '[woocommerce_checkout]');
        }
    }
}
function ra_owned_meta_can_update(int $post_id, string $meta_key, string $value): bool {
    $current = (string) get_post_meta($post_id, $meta_key, true);
    $last = (string) get_post_meta($post_id, '_rudnikagro_last_imported_' . ltrim($meta_key, '_'), true);
    return $current === '' || ($last !== '' && hash_equals($last, $current));
}
function ra_set_owned_price(WC_Product $product, string $price, array $provenance): void {
    $id = $product->get_id();
    if (ra_owned_meta_can_update($id, '_regular_price', $price)) {
        $product->set_regular_price($price);
        $product->set_price($price);
        $product->save();
        update_post_meta($id, '_rudnikagro_last_imported_regular_price', $price);
    }
    update_post_meta($id, '_rudnikagro_price_provenance', wp_json_encode($provenance, JSON_UNESCAPED_UNICODE));
}
function ra_owned_variation(int $parent_id, string $source_node, string $option): WC_Product_Variation {
    $ids = get_posts(['post_type' => 'product_variation', 'post_parent' => $parent_id, 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $source_node, 'fields' => 'ids', 'numberposts' => 1]);
    $id = $ids ? (int) $ids[0] : wp_insert_post(['post_type' => 'product_variation', 'post_status' => 'publish', 'post_parent' => $parent_id]);
    if (is_wp_error($id) || !$id) { throw new RuntimeException('Cannot create RudnikAgro product variation.'); }
    update_post_meta($id, '_rudnikagro_source_node', $source_node);
    update_post_meta($id, '_rudnikagro_owned', '1');
    $variation = new WC_Product_Variation((int) $id);
    $variation->set_attributes(['pojemnosc' => $option]);
    $variation->save();
    return $variation;
}

foreach ($by_name as $name => $field) {
    $is_shared = str_starts_with($name, 'rudnikagro_shared_') || $name === 'rudnikagro_topbar_promotion';
    if (!$is_shared || ra_is_populated_option($name)) { continue; }
    $value = $field['value'] ?? null;
    if (($field['type'] ?? '') === 'image' && is_string($value)) { $value = ra_import_attachment($snapshot, $value, $name); }
    if ($value !== null && function_exists('update_field')) { update_field($name, $value, 'option'); $summary['options']++; }
}
foreach ($by_name as $name => $field) {
    $is_shared = str_starts_with($name, 'rudnikagro_shared_') || $name === 'rudnikagro_topbar_promotion';
    $raw = is_string($field['value'] ?? null) ? $field['value'] : '';
    $fixed = ra_repair_source_encoding($raw);
    if ($is_shared && $raw !== '' && $fixed !== $raw && rudnikagro_option($name) === $raw && function_exists('update_field')) {
        update_field($name, $fixed, 'option');
        $summary['options']++;
    }
}

function ra_first_section_value(array $fields, string $section, string $pattern): string {
    foreach ($fields as $field) {
        if (($field['section'] ?? '') === $section && preg_match($pattern, (string) ($field['fieldName'] ?? '')) && is_string($field['value'] ?? null)) { return $field['value']; }
    }
    return '';
}
function ra_owned_post(array $args, string $route_id): int {
    global $summary;
    $existing = get_posts(['post_type' => $args['post_type'], 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => $route_id, 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $id = wp_insert_post($args, true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    update_post_meta($id, '_rudnikagro_route_id', $route_id);
    update_post_meta($id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
    $summary[$args['post_type'] === 'post' ? 'posts' : 'pages']++;
    return (int) $id;
}

$page_sources = [
    'home' => ['home-hero', ''], 'about' => ['about-heading', ''], 'contact' => ['contact-heading', ''],
    'careers' => ['careers-heading', ''], 'catalogues' => ['catalogues-heading', ''], 'blog' => ['blog-archive-heading', ''],
];
$page_paths = ['home' => '', 'about' => 'o-nas', 'contact' => 'kontakt', 'careers' => 'kariera', 'catalogues' => 'katalogi', 'blog' => 'blog'];
$page_title_fields = ['home' => 'rudnikagro_home_hero_96_96', 'catalogues' => 'rudnikagro_catalogues_347_1231', 'blog' => 'rudnikagro_blog_archive_heading_banner_label'];
$page_ids = [];
foreach ($page_sources as $route => [$section]) {
    $title = ra_first_section_value($fields, $section, '/(heading|title)$/');
    if ($title === '' && isset($page_title_fields[$route])) { $title = (string) (ra_source_field($by_name, $page_title_fields[$route])['value'] ?? ''); }
    if ($title === '') { continue; }
    $page_ids[$route] = ra_owned_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => wp_strip_all_tags($title), 'post_name' => $page_paths[$route]], $route);
}
if (!empty($page_ids['home'])) { update_option('show_on_front', 'page'); update_option('page_on_front', $page_ids['home']); }
if (!empty($page_ids['blog'])) { update_option('page_for_posts', $page_ids['blog']); }

// The front page is a source-owned ACF composition.  Keep editor changes: only
// hydrate the group when it has not been populated by an editor/import before.
if (!empty($page_ids['home']) && function_exists('update_field') && !get_post_meta((int) $page_ids['home'], '_rudnikagro_home_composition_imported', true)) {
    $home_id = (int) $page_ids['home'];
    $source_text = static function (string $section, string $needle) use ($by_name): string {
        return ra_first_matching_value(ra_section_values($by_name, $section), $needle);
    };
    $asset = static function (string $path, string $field) use ($snapshot): int {
        return ra_import_attachment($snapshot, $path, $field);
    };
    $crop = static function (string $title, string $asset_path, string $field) use ($source_text, $asset): array {
        return ['title' => $source_text('home-crop-selection', $title), 'icon' => $asset($asset_path, $field)];
    };
    $cereal = [
        $crop('pszenica', 'assets/home/105-188-pszenica1.svg', 'rudnikagro_home_crop_pszenica'),
        $crop('kukurydza', 'assets/home/105-191-kukurydza1.svg', 'rudnikagro_home_crop_kukurydza'),
        $crop('jęczmień', 'assets/home/105-194-jeczmien1.svg', 'rudnikagro_home_crop_jeczmien'),
        $crop('żyto', 'assets/home/105-204-zyto1.svg', 'rudnikagro_home_crop_zyto'),
        $crop('owies', 'assets/home/105-207-owies1.svg', 'rudnikagro_home_crop_owies'),
        $crop('rzepak', 'assets/home/106-215-rzepak1.svg', 'rudnikagro_home_crop_rzepak'),
        $crop('łubin', 'assets/home/105-210-lubin1.svg', 'rudnikagro_home_crop_lubin'),
    ];
    $vegetables = [
        $crop('brokuł', 'assets/home/106-234-brokul1.svg', 'rudnikagro_home_crop_brokul'), $crop('burak', 'assets/home/106-245-burak1.svg', 'rudnikagro_home_crop_burak'),
        $crop('cebula', 'assets/home/106-242-cebula1.svg', 'rudnikagro_home_crop_cebula'), $crop('fasola', 'assets/home/106-268-fasola1.svg', 'rudnikagro_home_crop_fasola'),
        $crop('kalafior', 'assets/home/106-284-kalafior1.svg', 'rudnikagro_home_crop_kalafior'), $crop('kapusta', 'assets/home/106-293-kapusta1.svg', 'rudnikagro_home_crop_kapusta'),
        $crop('pomidor', 'assets/home/106-377-pomidor1.svg', 'rudnikagro_home_crop_pomidor'), $crop('ziemniak', 'assets/home/106-433-ziemniak1.svg', 'rudnikagro_home_crop_ziemniak'),
    ];
    $fruits = [$crop('borówka', 'assets/home/107-459-borowka1.svg', 'rudnikagro_home_crop_borowka'), $crop('grusza', 'assets/home/107-472-grusza1.svg', 'rudnikagro_home_crop_grusza'), $crop('jabłoń', 'assets/home/107-475-jablon1.svg', 'rudnikagro_home_crop_jablon'), $crop('malina', 'assets/home/107-483-malina1.svg', 'rudnikagro_home_crop_malina'), $crop('śliwka', 'assets/home/108-491-sliwa1.svg', 'rudnikagro_home_crop_sliwka'), $crop('truskawka', 'assets/home/108-517-truskawka1.svg', 'rudnikagro_home_crop_truskawka'), $crop('winorośl', 'assets/home/108-538-winorosl1.svg', 'rudnikagro_home_crop_winorosl'), $crop('wiśnia', 'assets/home/108-541-wisnia1.svg', 'rudnikagro_home_crop_wisnia')];
    update_field('field_ra_home_hero', ['heading' => ra_string_source($by_name, 'rudnikagro_home_hero_96_96'), 'cta_label' => ra_string_source($by_name, 'rudnikagro_home_hero_135_158'), 'image' => $asset('assets/home/12-3-rectangle1.png', 'rudnikagro_home_hero_image')], $home_id);
    update_field('field_ra_home_benefits', [
        ['title' => ra_string_source($by_name, 'rudnikagro_home_benefits_102_112'), 'icon' => $asset('assets/home/161-174-oryginalneprodukty1.svg', 'rudnikagro_home_benefit_original')],
        ['title' => ra_string_source($by_name, 'rudnikagro_home_benefits_102_113'), 'icon' => $asset('assets/home/161-186-dostawa1.svg', 'rudnikagro_home_benefit_warranty')],
        ['title' => ra_string_source($by_name, 'rudnikagro_home_benefits_102_116'), 'icon' => $asset('assets/home/161-186-dostawa1.svg', 'rudnikagro_home_benefit_delivery')],
        ['title' => ra_string_source($by_name, 'rudnikagro_home_benefits_102_118'), 'icon' => $asset('assets/home/161-192-ceny1.svg', 'rudnikagro_home_benefit_prices')],
        ['title' => ra_string_source($by_name, 'rudnikagro_home_benefits_102_120'), 'icon' => $asset('assets/home/161-198-pakiety1.svg', 'rudnikagro_home_benefit_bundles')],
    ], $home_id);
    update_field('field_ra_home_crops', ['heading' => $source_text('home-crop-selection', 'Wybór uprawy'), 'subtitle' => $source_text('home-crop-selection', 'Wybierz produkt'), 'groups' => [
        ['title' => $source_text('home-crop-selection', 'Zboża'), 'colour' => '#f56635', 'items' => $cereal], ['title' => $source_text('home-crop-selection', 'Warzywa'), 'colour' => '#007d44', 'items' => $vegetables], ['title' => $source_text('home-crop-selection', 'Owoce'), 'colour' => '#94c11f', 'items' => $fruits],
    ]], $home_id);
    update_field('field_ra_home_sections', ['promotions_title' => $source_text('home-promotions', 'Promocje'), 'bundles_title' => $source_text('home-bundles', 'Pakiety'), 'recommended_title' => $source_text('home-recommended', 'Polecane produkty'), 'more_label' => $source_text('home-promotions', 'Zobacz więcej')], $home_id);
    update_field('field_ra_home_catalogues', ['heading' => ra_string_source($by_name, 'rudnikagro_home_catalogues_140_165'), 'background' => $asset('assets/home/116-57-rectangle24.png', 'rudnikagro_home_catalogues_background'), 'cover' => $asset('assets/home/138-164-katalogi1.png', 'rudnikagro_home_catalogues_cover'), 'items' => [
        ['title' => ra_string_source($by_name, 'rudnikagro_home_catalogues_153_72'), 'icon' => $asset('assets/home/169-296-download1.svg', 'rudnikagro_home_catalogues_download')], ['title' => ra_string_source($by_name, 'rudnikagro_home_catalogues_153_74'), 'icon' => $asset('assets/home/169-297-download.svg', 'rudnikagro_home_catalogues_download_orchard')],
    ]], $home_id);
    update_field('field_ra_home_about', ['heading' => $source_text('home-about', 'O nas'), 'lead' => wpautop($source_text('home-about', 'Rudnikagro Sp. z o.o. oferuje')), 'content' => wpautop($source_text('home-about', 'Dla firm dystrybucyjnych')), 'cta_label' => $source_text('home-about', 'Poznaj nas'), 'image' => $asset('assets/home/140-292-image2.png', 'rudnikagro_home_about_image')], $home_id);
    update_field('field_ra_home_blog', ['heading' => $source_text('home-blog', 'Blog'), 'cta_label' => $source_text('home-blog', 'Zobacz wszystkie wpisy')], $home_id);
    update_field('field_ra_home_knowledge', ['background' => $asset('assets/home/116-53-nawozenie1.png', 'rudnikagro_home_knowledge_background'), 'items' => [
        ['title' => ra_string_source($by_name, 'rudnikagro_home_knowledge_164_214'), 'content' => wpautop(ra_string_source($by_name, 'rudnikagro_home_knowledge_164_204')), 'open_icon' => $asset('assets/home/164-205-vector11.svg', 'rudnikagro_home_knowledge_open_icon'), 'closed_icon' => $asset('assets/home/164-208-vector12.svg', 'rudnikagro_home_knowledge_closed_icon')], ['title' => ra_string_source($by_name, 'rudnikagro_home_knowledge_164_202'), 'content' => '', 'open_icon' => $asset('assets/home/164-205-vector11.svg', 'rudnikagro_home_knowledge_open_icon'), 'closed_icon' => $asset('assets/home/164-208-vector12.svg', 'rudnikagro_home_knowledge_closed_icon')],
    ]], $home_id);
    update_post_meta($home_id, '_rudnikagro_home_composition_imported', '1');
}
if (!empty($page_ids['home']) && get_post_meta((int) $page_ids['home'], '_rudnikagro_home_composition_imported', true) !== '') {
    $home_id = (int) $page_ids['home'];
    $current_image = (int) get_post_meta($home_id, 'rudnikagro_home_about_image', true);
    if ($current_image && get_post_meta($current_image, '_rudnikagro_source_asset', true) === 'assets/home/140-292-image2.png') {
        $correct_image = ra_import_attachment($snapshot, 'assets/home/130-140-rectangle41.png', 'rudnikagro_home_about_image_v2');
        update_post_meta($home_id, 'rudnikagro_home_about_image', $correct_image);
        update_post_meta($home_id, '_rudnikagro_home_about_image', 'field_ra_home_about_image');
    }
    update_post_meta($home_id, '_rudnikagro_home_composition_imported', '2');
}

if (!empty($page_ids['home']) && get_post_meta((int) $page_ids['home'], '_rudnikagro_home_composition_imported', true) !== '') {
    $home_id = (int) $page_ids['home'];
    $knowledge_icons = [
        'open_icon' => ['field_ra_home_knowledge_item_open_icon', 'assets/home/164-205-vector11.svg', 'rudnikagro_home_knowledge_open_icon'],
        'closed_icon' => ['field_ra_home_knowledge_item_closed_icon', 'assets/home/164-208-vector12.svg', 'rudnikagro_home_knowledge_closed_icon'],
    ];
    foreach ($knowledge_icons as $name => [$field_key, $asset_path, $source_field]) {
        $attachment_id = ra_import_attachment($snapshot, $asset_path, $source_field);
        foreach ([0, 1] as $row) {
            $meta_key = 'rudnikagro_home_knowledge_items_' . $row . '_' . $name;
            if (get_post_meta($home_id, $meta_key, true) === '') {
                update_post_meta($home_id, $meta_key, $attachment_id);
                update_post_meta($home_id, '_' . $meta_key, $field_key);
            }
        }
    }
}

// Home merchandising cards are source-ordered native WooCommerce products. The
// cards may share one product (the package appears four times in the source),
// but never fall back to a generic catalogue query.
if (!empty($page_ids['home']) && function_exists('wc_get_product')) {
    $home_id = (int) $page_ids['home'];
    $home_collections = [
        'promoted' => [
            ['sourceNode' => '130:69', 'titleNode' => '126:58', 'priceNode' => '128:8', 'regularPriceNode' => '140:244', 'image' => 'assets/home/140-242-rzepak.png', 'badgeNode' => '140:289', 'lowestNode' => '222:104'],
            ['sourceNode' => '130:84', 'titleNode' => '130:65', 'priceNode' => '130:66', 'regularPriceNode' => '140:294', 'image' => 'assets/home/140-292-image2.png', 'badgeNode' => '150:42', 'lowestNode' => '222:107'],
            ['sourceNode' => '130:100', 'titleNode' => '130:80', 'priceNode' => '140:296', 'regularPriceNode' => '140:297', 'image' => 'assets/home/140-349-lg.png', 'badgeNode' => '140:306', 'lowestNode' => '222:109'],
            ['sourceNode' => '130:104', 'titleNode' => '130:95', 'priceNode' => '140:351', 'regularPriceNode' => '140:352', 'image' => 'assets/home/140-349-lg.png', 'badgeNode' => '140:355', 'lowestNode' => '222:111'],
        ],
        'recommended' => [
            ['sourceNode' => '140:216', 'titleNode' => '140:228', 'priceNode' => '140:229', 'image' => 'assets/home/140-231-modivo1.png', 'badgeNode' => '140:233'],
            ['sourceNode' => '140:200', 'titleNode' => '140:212', 'priceNode' => '140:213', 'image' => 'assets/home/140-215-vivero.png'],
            ['sourceNode' => '140:184', 'titleNode' => '140:196', 'priceNode' => '140:197', 'image' => 'assets/home/140-199-goliattrio1.png'],
            ['sourceNode' => '140:168', 'titleNode' => '140:180', 'priceNode' => '140:181', 'image' => 'assets/home/140-182-image1.png'],
        ],
    ];
    $home_ids = ['promoted' => [], 'recommended' => []];
    foreach ($home_collections as $collection => $cards) {
        foreach ($cards as $card) {
            $title = trim(ra_repair_source_encoding(ra_source_value_by_node($by_name, $card['titleNode'])));
            $price = ra_source_price(ra_repair_source_encoding(ra_source_value_by_node($by_name, $card['priceNode'])));
            if ($title === '' || $price === null) { continue; }
            $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $card['sourceNode'], 'fields' => 'ids', 'numberposts' => 1]);
            $product_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title)]);
            if (!$product_id || is_wp_error($product_id)) { continue; }
            update_post_meta($product_id, '_rudnikagro_source_node', $card['sourceNode']);
            update_post_meta($product_id, '_rudnikagro_owned', '1');
            update_post_meta($product_id, '_rudnikagro_route_id', 'home-' . $collection);
            $last_title = (string) get_post_meta($product_id, '_rudnikagro_last_imported_title', true);
            if ($last_title === '' || get_the_title($product_id) === $last_title) { wp_update_post(['ID' => $product_id, 'post_title' => $title]); update_post_meta($product_id, '_rudnikagro_last_imported_title', $title); }
            $product = wc_get_product($product_id);
            if (!$product) { continue; }
            $regular = isset($card['regularPriceNode']) ? ra_source_price(ra_repair_source_encoding(ra_source_value_by_node($by_name, $card['regularPriceNode']))) : $price;
            ra_set_owned_price($product, number_format((float) ($regular ?? $price), 2, '.', ''), ['sourceNode' => $card['regularPriceNode'] ?? $card['priceNode'], 'provenance' => 'figma-explicit']);
            if (isset($card['regularPriceNode']) && ra_owned_meta_can_update($product_id, '_sale_price', number_format($price, 2, '.', ''))) {
                $product->set_sale_price(number_format($price, 2, '.', ''));
                $product->set_price(number_format($price, 2, '.', ''));
                $product->save();
                update_post_meta($product_id, '_rudnikagro_last_imported_sale_price', number_format($price, 2, '.', ''));
            }
            update_post_meta($product_id, '_rudnikagro_price_provenance', wp_json_encode(['sourceNode' => $card['priceNode'], 'provenance' => 'figma-explicit'], JSON_UNESCAPED_UNICODE));
            $image_id = ra_import_attachment($snapshot, $card['image'], 'rudnikagro_home_card_' . str_replace(':', '_', $card['sourceNode']) . '_image');
            $current_image = (int) get_post_thumbnail_id($product_id);
            $last_image = (int) get_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', true);
            if (!$current_image || ($last_image && $current_image === $last_image)) { set_post_thumbnail($product_id, $image_id); update_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', $image_id); }
            $presentation = (array) get_field('rudnikagro_product_card_presentation', $product_id);
            $changed = false;
            foreach (['badgeNode' => 'badge', 'lowestNode' => 'lowest_price_note'] as $source_key => $field_key) {
                if (empty($card[$source_key]) || !empty($presentation[$field_key])) { continue; }
                $presentation[$field_key] = ra_repair_source_encoding(ra_source_value_by_node($by_name, $card[$source_key]));
                $changed = true;
            }
            if ($changed) { update_field('field_ra_product_card_presentation', $presentation, $product_id); }
            $home_ids[$collection][] = $product_id;
        }
    }
    $bundle_id = (int) (get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'product-bundle', 'fields' => 'ids', 'numberposts' => 1])[0] ?? 0);
    if ($bundle_id && ($bundle = wc_get_product($bundle_id))) {
        $bundle_price = ra_source_price(ra_repair_source_encoding(ra_source_value_by_node($by_name, '574:154')));
        $bundle_regular = ra_source_price(ra_repair_source_encoding(ra_source_value_by_node($by_name, '574:155')));
        if ($bundle_price !== null) { ra_set_owned_price($bundle, number_format((float) ($bundle_regular ?? $bundle_price), 2, '.', ''), ['sourceNode' => '574:155', 'provenance' => 'figma-explicit']); }
        if ($bundle_price !== null && ra_owned_meta_can_update($bundle_id, '_sale_price', number_format($bundle_price, 2, '.', ''))) { $bundle->set_sale_price(number_format($bundle_price, 2, '.', '')); $bundle->set_price(number_format($bundle_price, 2, '.', '')); $bundle->save(); update_post_meta($bundle_id, '_rudnikagro_last_imported_sale_price', number_format($bundle_price, 2, '.', '')); }
        $bundle_image = ra_import_attachment($snapshot, 'assets/home/574-174-rectangle175.png', 'rudnikagro_home_bundle_card_image');
        $current_image = (int) get_post_thumbnail_id($bundle_id);
        $last_image = (int) get_post_meta($bundle_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_image || ($last_image && $current_image === $last_image)) { set_post_thumbnail($bundle_id, $bundle_image); update_post_meta($bundle_id, '_rudnikagro_last_imported_thumbnail_id', $bundle_image); }
        $presentation = (array) get_field('rudnikagro_product_card_presentation', $bundle_id);
        if (empty($presentation['badge'])) { $presentation['badge'] = ra_repair_source_encoding(ra_source_value_by_node($by_name, '574:159')); update_field('field_ra_product_card_presentation', $presentation, $bundle_id); }
        $home_ids['bundle'] = [$bundle_id];
    }
    foreach (['promoted' => 'field_ra_home_promoted_products', 'bundle' => 'field_ra_home_bundle_products', 'recommended' => 'field_ra_home_recommended_products'] as $collection => $field_key) {
        $field_name = 'rudnikagro_home_' . ($collection === 'promoted' ? 'promoted' : $collection) . '_products';
        if (!empty($home_ids[$collection]) && !get_field($field_name, $home_id)) { update_field($field_key, $home_ids[$collection], $home_id); }
    }
    $labels = (array) get_field('rudnikagro_home_sections', $home_id);
    $labels_changed = false;
    if (empty($labels['cart_label'])) { $labels['cart_label'] = ra_repair_source_encoding(ra_source_value_by_node($by_name, '130:94')); $labels_changed = true; }
    if (empty($labels['cart_icon'])) { $labels['cart_icon'] = ra_import_attachment($snapshot, 'assets/home/130-90-koszyk4.svg', 'rudnikagro_home_card_cart_icon'); $labels_changed = true; }
    if ($labels_changed) { update_field('field_ra_home_sections', $labels, $home_id); }
}

function ra_raw_string_source(array $by_name, string $name): string {
    $field = ra_source_field($by_name, $name);
    return is_array($field) && is_string($field['value'] ?? null) ? $field['value'] : '';
}
function ra_repair_source_encoding(string $value): string {
    if ($value === '' || !function_exists('iconv')) { return $value; }
    for ($attempt = 0; $attempt < 3 && preg_match('/[ÃÅÄâ]/u', $value); $attempt++) {
        $bytes = iconv('UTF-8', 'Windows-1252//IGNORE', $value);
        $fixed = is_string($bytes) ? iconv('UTF-8', 'UTF-8//IGNORE', $bytes) : false;
        if (!is_string($fixed) || $fixed === '' || $fixed === $value) { break; }
        $value = $fixed;
    }
    return $value;
}
function ra_string_source(array $by_name, string $name): string { return ra_repair_source_encoding(ra_raw_string_source($by_name, $name)); }
function ra_structured_text_source(array $by_name, string $name): string {
    $field = ra_source_field($by_name, $name);
    if (!is_array($field) || !is_array($field['value'] ?? null)) { return ''; }
    $parts = [];
    foreach ($field['value'] as $segment) { if (is_array($segment) && is_string($segment['value'] ?? null)) { $parts[] = $segment['value']; } }
    return ra_repair_source_encoding(implode('', $parts));
}
function ra_breadcrumb_source(array $by_name, string $name): string {
    $field = ra_source_field($by_name, $name);
    if (!is_array($field) || !is_array($field['value'] ?? null)) { return ''; }
    $labels = [];
    foreach ($field['value'] as $segment) {
        if (is_array($segment) && is_string($segment['label'] ?? null) && $segment['label'] !== '') { $labels[] = $segment['label']; }
    }
    return ra_repair_source_encoding(implode(' / ', $labels));
}
/**
 * Refresh content only when the existing project-owned record still contains a
 * known factory baseline. This lets a deterministic source-encoding repair be
 * applied to legacy imports without replacing an editor's later revision.
 */
function ra_update_owned_source_content(int $post_id, string $raw_source, string $source_content): void {
    if ($post_id <= 0 || $source_content === '') { return; }
    $current = (string) get_post_field('post_content', $post_id);
    $stored_hash = (string) get_post_meta($post_id, '_rudnikagro_source_content_hash', true);
    $current_hash = hash('sha256', $current);
    $can_refresh = $stored_hash !== ''
        ? hash_equals($stored_hash, $current_hash)
        : ($current_hash === hash('sha256', $raw_source) || $current_hash === hash('sha256', $source_content));
    if (!$can_refresh) { return; }
    if ($current !== $source_content) {
        wp_update_post(['ID' => $post_id, 'post_content' => $source_content]);
    }
    update_post_meta($post_id, '_rudnikagro_source_content_hash', hash('sha256', $source_content));
}
function ra_owned_cf7_form(): int {
    $existing = get_posts(['post_type' => 'wpcf7_contact_form', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'careers-application', 'fields' => 'ids', 'numberposts' => 1]);
    return $existing ? (int) $existing[0] : 0;
}
function ra_careers_form_markup(array $labels): string {
    return '<div class="c-careers-form__contact">'
        . '<p>[text* application-name autocomplete:name placeholder "' . esc_attr($labels['name']) . '"]</p>'
        . '<p>[email* application-email autocomplete:email placeholder "' . esc_attr($labels['email']) . '"]</p>'
        . '<p>[tel* application-phone autocomplete:tel placeholder "' . esc_attr($labels['phone']) . '"]</p>'
        . '</div><p class="c-careers-form__upload"><label><span>' . esc_html($labels['upload']) . '</span>[file* application-cv limit:10mb filetypes:pdf|doc|docx]</label></p>'
        . '<div class="c-careers-form__consents"><p>[acceptance application-current]' . esc_html($labels['current']) . '[/acceptance]</p><p>[acceptance application-future optional]' . esc_html($labels['future']) . '[/acceptance]</p></div>'
        . '<p class="c-careers-form__submit">[submit "' . esc_attr($labels['submit']) . '"]</p>';
}
function ra_create_careers_form(array $by_name): int {
    $form_id = ra_owned_cf7_form();
    $raw_labels = [
        'name' => ra_raw_string_source($by_name, 'rudnikagro_application_name_label'),
        'email' => ra_raw_string_source($by_name, 'rudnikagro_application_email_label'),
        'phone' => ra_raw_string_source($by_name, 'rudnikagro_application_phone_label'),
        'upload' => ra_raw_string_source($by_name, 'rudnikagro_application_upload_label'),
        'submit' => ra_raw_string_source($by_name, 'rudnikagro_application_submit_label'),
        'current' => ra_raw_string_source($by_name, 'rudnikagro_application_current_recruitment_consent'),
        'future' => ra_raw_string_source($by_name, 'rudnikagro_application_future_recruitment_consent'),
    ];
    $labels = [
        'name' => ra_string_source($by_name, 'rudnikagro_application_name_label'),
        'email' => ra_string_source($by_name, 'rudnikagro_application_email_label'),
        'phone' => ra_string_source($by_name, 'rudnikagro_application_phone_label'),
        'upload' => ra_string_source($by_name, 'rudnikagro_application_upload_label'),
        'submit' => ra_string_source($by_name, 'rudnikagro_application_submit_label'),
        'current' => ra_string_source($by_name, 'rudnikagro_application_current_recruitment_consent'),
        'future' => ra_string_source($by_name, 'rudnikagro_application_future_recruitment_consent'),
    ];
    if (in_array('', $labels, true)) { throw new RuntimeException('Careers application form source labels are incomplete.'); }
    if ($form_id) {
        $existing_form = (string) get_post_meta($form_id, '_form', true);
        if (str_contains($existing_form, '[acceptance* application-current]') || $existing_form === ra_careers_form_markup($raw_labels)) {
            update_post_meta($form_id, '_form', ra_careers_form_markup($labels));
            update_post_meta($form_id, '_rudnikagro_import_version', '2');
        }
        return $form_id;
    }
    $form_id = wp_insert_post(['post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'post_title' => 'RudnikAgro — Kariera']);
    if (is_wp_error($form_id)) { throw new RuntimeException($form_id->get_error_message()); }
    $form = ra_careers_form_markup($labels);
    update_post_meta($form_id, '_form', $form);
    update_post_meta($form_id, '_mail', ['subject' => '[_site_title] — application', 'sender' => '[_site_title] <wordpress@localhost>', 'body' => '[application-name]\n[application-email]\n[application-phone]', 'recipient' => '', 'additional_headers' => 'Reply-To: [application-email]', 'attachments' => '[application-cv]', 'use_html' => false, 'exclude_blank' => false]);
    update_post_meta($form_id, '_mail_2', ['active' => false]);
    update_post_meta($form_id, '_additional_settings', '');
    update_post_meta($form_id, '_locale', 'pl_PL');
    update_post_meta($form_id, '_rudnikagro_route_id', 'careers-application');
    update_post_meta($form_id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
    update_post_meta($form_id, '_rudnikagro_import_version', '2');
    $summary['posts']++;
    return (int) $form_id;
}

if (!empty($page_ids['about'])) {
    $about_id = (int) $page_ids['about'];
    if (get_post_meta($about_id, '_wp_page_template', true) === '') { update_post_meta($about_id, '_wp_page_template', 'page-about.php'); }
    if (get_post_meta($about_id, 'rudnikagro_about_banner_title', true) === '') {
        update_field('field_ra_about_banner', [
            'title' => ra_string_source($by_name, 'rudnikagro_about.banner.title'),
            'breadcrumb' => ra_breadcrumb_source($by_name, 'rudnikagro_about.breadcrumb'),
            'image' => ra_import_attachment($snapshot, 'assets/about/326-2977-about-banner.png', 'rudnikagro_about_banner_image'),
        ], $about_id);
    }
    if (get_post_meta($about_id, 'rudnikagro_about_introduction_heading', true) === '') {
        update_field('field_ra_about_intro', [
            'heading' => ra_string_source($by_name, 'rudnikagro_about.introduction.heading'),
            'content' => ra_string_source($by_name, 'rudnikagro_about.introduction.content'),
        ], $about_id);
    }
    if (get_post_meta($about_id, 'rudnikagro_about_supply_heading', true) === '') {
        update_field('field_ra_about_supply', [
            'heading' => ra_string_source($by_name, 'rudnikagro_about.supply.heading'),
            'introduction' => ra_string_source($by_name, 'rudnikagro_about.supply.introduction'),
            'items' => [
                ['title' => ra_string_source($by_name, 'rudnikagro_about.supply.items.0.title'), 'icon' => ra_import_attachment($snapshot, 'assets/about/520-364-crop-protection.svg', 'rudnikagro_about_supply_icon_crop_protection')],
                ['title' => ra_string_source($by_name, 'rudnikagro_about.supply.items.1.title'), 'icon' => ra_import_attachment($snapshot, 'assets/about/520-366-fertilizer.svg', 'rudnikagro_about_supply_icon_fertilizer')],
                ['title' => ra_string_source($by_name, 'rudnikagro_about.supply.items.2.title'), 'icon' => ra_import_attachment($snapshot, 'assets/about/520-374-seeds.svg', 'rudnikagro_about_supply_icon_seeds')],
            ],
            'image' => ra_import_attachment($snapshot, 'assets/about/519-348-supply-photo.png', 'rudnikagro_about_supply_image'),
            'surface' => ra_import_attachment($snapshot, 'assets/about/520-432-supply-card.svg', 'rudnikagro_about_supply_surface'),
        ], $about_id);
    }
    if (get_post_meta($about_id, 'rudnikagro_about_grain_trade_heading', true) === '') {
        update_field('field_ra_about_grain', [
            'heading' => ra_string_source($by_name, 'rudnikagro_about.grain_trade.heading'),
            'content' => ra_string_source($by_name, 'rudnikagro_about.grain_trade.content'),
            'image' => ra_import_attachment($snapshot, 'assets/about/519-350-grain-photo.png', 'rudnikagro_about_grain_image'),
            'surface' => ra_import_attachment($snapshot, 'assets/about/521-452-grain-card.svg', 'rudnikagro_about_grain_surface'),
        ], $about_id);
    }
    if (get_post_meta($about_id, 'rudnikagro_about_insurance_heading', true) === '') {
        $expert = ra_source_field($by_name, 'rudnikagro_about.insurance.expert');
        update_field('field_ra_about_insurance', [
            'heading' => ra_string_source($by_name, 'rudnikagro_about.insurance.heading'),
            'content' => ra_string_source($by_name, 'rudnikagro_about.insurance.content'),
            'expert' => is_array($expert['value'] ?? null) ? $expert['value'] : [],
            'image' => ra_import_attachment($snapshot, 'assets/about/521-434-insurance-photo.png', 'rudnikagro_about_insurance_image'),
            'surface' => ra_import_attachment($snapshot, 'assets/about/521-454-insurance-card.svg', 'rudnikagro_about_insurance_surface'),
        ], $about_id);
    }
    if (get_post_meta($about_id, 'rudnikagro_about_shop_cta_heading', true) === '') {
        // Exact strings are visible in the frozen assigned about frame 326:2764; the legacy shared-CTA record covers a different source variant.
        update_field('field_ra_about_cta', ['heading' => 'Odkryj szeroki wybór produktów w naszym sklepie', 'button_label' => 'Sprawdź ofertę'], $about_id);
    }
}

if (!empty($page_ids['careers'])) {
    $careers_id = (int) $page_ids['careers'];
    if (get_post_meta($careers_id, '_wp_page_template', true) === '') { update_post_meta($careers_id, '_wp_page_template', 'page-careers.php'); }
    $form_id = ra_create_careers_form($by_name);
    if (get_post_meta($careers_id, 'rudnikagro_page_banner_title', true) === '') {
        $banner_id = ra_import_attachment($snapshot, 'assets/careers/349-1377-heading.png', 'rudnikagro_page_banner_image_composition');
        update_field('field_ra_careers_banner', ['title' => ra_string_source($by_name, 'rudnikagro_page_banner_title'), 'breadcrumb' => ra_string_source($by_name, 'rudnikagro_careers_breadcrumb'), 'image' => $banner_id], $careers_id);
    }
    $current_banner_id = (int) get_post_meta($careers_id, 'rudnikagro_page_banner_image', true);
    if ($current_banner_id && get_post_meta($current_banner_id, '_rudnikagro_source_asset', true) === 'assets/careers/349-1377-heading-raw-1.png') {
        $banner_id = ra_import_attachment($snapshot, 'assets/careers/349-1377-heading.png', 'rudnikagro_page_banner_image_composition');
        update_post_meta($careers_id, 'rudnikagro_page_banner_image', $banner_id);
    }
    if (get_post_meta($careers_id, 'rudnikagro_page_banner_breadcrumb', true) === '') {
        update_post_meta($careers_id, 'rudnikagro_page_banner_breadcrumb', ra_string_source($by_name, 'rudnikagro_careers_breadcrumb'));
        update_post_meta($careers_id, '_rudnikagro_page_banner_breadcrumb', 'field_ra_careers_banner_breadcrumb');
    }
    $careers_text_fields = ['rudnikagro_page_banner_breadcrumb' => 'rudnikagro_careers_breadcrumb', 'rudnikagro_careers_cta_heading' => 'rudnikagro_careers_cta_heading', 'rudnikagro_careers_cta_button_label' => 'rudnikagro_careers_cta_button_label'];
    for ($i = 0; $i < 6; $i++) {
        $careers_text_fields['rudnikagro_vacancies_' . $i . '_title'] = 'rudnikagro_vacancies_' . $i . '_title';
        $careers_text_fields['rudnikagro_vacancies_' . $i . '_description'] = 'rudnikagro_vacancies_' . $i . '_description';
    }
    foreach ($careers_text_fields as $meta_key => $source_name) {
        $raw = ra_raw_string_source($by_name, $source_name);
        $fixed = ra_string_source($by_name, $source_name);
        if ($raw !== '' && $fixed !== $raw && get_post_meta($careers_id, $meta_key, true) === $raw) { update_post_meta($careers_id, $meta_key, $fixed); }
    }
    if (get_post_meta($careers_id, 'rudnikagro_vacancies', true) === '') {
        $vacancies = [];
        for ($i = 0; $i < 6; $i++) {
            $vacancies[] = [
                'title' => ra_string_source($by_name, 'rudnikagro_vacancies_' . $i . '_title'),
                'description' => ra_string_source($by_name, 'rudnikagro_vacancies_' . $i . '_description'),
                'application_form' => $i === 0 ? $form_id : 0,
            ];
        }
        update_field('field_ra_careers_vacancies', $vacancies, $careers_id);
    }
    if (get_post_meta($careers_id, 'rudnikagro_application_form', true) === '') { update_field('field_ra_careers_application', $form_id, $careers_id); }
    if (get_post_meta($careers_id, 'rudnikagro_careers_cta_heading', true) === '') {
        $background = ra_import_attachment($snapshot, 'assets/careers/548-24-background.svg', 'rudnikagro_careers_cta_background');
        update_field('field_ra_careers_cta', ['heading' => ra_string_source($by_name, 'rudnikagro_careers_cta_heading'), 'button_label' => ra_string_source($by_name, 'rudnikagro_careers_cta_button_label'), 'background' => $background], $careers_id);
    }
}

function ra_contact_form_markup(array $labels): string {
    return '<div class="c-contact-form__fields">'
        . '<p>[text* contact-name autocomplete:name placeholder "' . esc_attr($labels['name']) . '"]</p>'
        . '<p>[email* contact-email autocomplete:email placeholder "' . esc_attr($labels['email']) . '"]</p>'
        . '<p>[tel* contact-phone autocomplete:tel placeholder "' . esc_attr($labels['phone']) . '"]</p>'
        . '</div>'
        . '<p class="c-contact-form__message">[textarea* contact-message placeholder "' . esc_attr($labels['message']) . '"]</p>'
        . '<p class="c-contact-form__submit">[submit "' . esc_attr($labels['submit']) . '"]</p>'
        . '<p class="c-contact-form__privacy">' . esc_html($labels['privacy']) . '</p>';
}
function ra_create_contact_form(array $by_name): int {
    global $summary;
    if (!post_type_exists('wpcf7_contact_form')) { return 0; }
    $labels = [
        'name' => ra_string_source($by_name, 'rudnikagro_contact_form_name_label'),
        'email' => ra_string_source($by_name, 'rudnikagro_contact_form_email_label'),
        'phone' => ra_string_source($by_name, 'rudnikagro_contact_form_phone_label'),
        'message' => ra_string_source($by_name, 'rudnikagro_contact_form_message_label'),
        'submit' => ra_string_source($by_name, 'rudnikagro_contact_form_submit_label'),
        'privacy' => ra_string_source($by_name, 'rudnikagro_contact_form_privacy_notice'),
    ];
    if (in_array('', $labels, true)) { throw new RuntimeException('Contact form source labels are incomplete.'); }
    $existing = get_posts(['post_type' => 'wpcf7_contact_form', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'contact-form', 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $form_id = wp_insert_post(['post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'post_title' => 'RudnikAgro — Kontakt']);
    if (is_wp_error($form_id)) { throw new RuntimeException($form_id->get_error_message()); }
    update_post_meta($form_id, '_form', ra_contact_form_markup($labels));
    // Source supplies no recipient or delivery configuration. Keep the native form unconfigured.
    update_post_meta($form_id, '_mail', ['subject' => '[_site_title] — kontakt', 'sender' => '[_site_title] <wordpress@localhost>', 'body' => '[contact-name]\n[contact-email]\n[contact-phone]\n[contact-message]', 'recipient' => '', 'additional_headers' => 'Reply-To: [contact-email]', 'attachments' => '', 'use_html' => false, 'exclude_blank' => false]);
    update_post_meta($form_id, '_mail_2', ['active' => false]);
    update_post_meta($form_id, '_additional_settings', '');
    update_post_meta($form_id, '_locale', 'pl_PL');
    update_post_meta($form_id, '_rudnikagro_route_id', 'contact-form');
    update_post_meta($form_id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
    $summary['posts']++;
    return (int) $form_id;
}

function ra_create_product_inquiry_form(array $by_name): int {
    if (!post_type_exists('wpcf7_contact_form')) { return 0; }
    $labels = [
        'name' => ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_name_label_431_883'),
        'email' => ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_email_label_431_884'),
        'question' => ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_question_label_431_885'),
        'privacy' => ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_privacy_note_431_889'),
        'submit' => ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_submit_label_431_891'),
    ];
    if (in_array('', $labels, true)) { return 0; }
    $existing = get_posts(['post_type' => 'wpcf7_contact_form', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'product-inquiry', 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $form_id = wp_insert_post(['post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'post_title' => 'RudnikAgro — Zapytanie produktowe']);
    if (is_wp_error($form_id)) { return 0; }
    $form = '<div class="c-product-inquiry-form__fields"><p>[text* product-inquiry-name placeholder "' . esc_attr($labels['name']) . '"]</p><p>[email* product-inquiry-email placeholder "' . esc_attr($labels['email']) . '"]</p><p>[textarea* product-inquiry-question placeholder "' . esc_attr($labels['question']) . '"]</p><p class="c-product-inquiry-form__privacy">' . esc_html($labels['privacy']) . '</p><p>[submit "' . esc_attr($labels['submit']) . '"]</p></div>';
    update_post_meta($form_id, '_form', $form); update_post_meta($form_id, '_rudnikagro_route_id', 'product-inquiry'); update_post_meta($form_id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
    return (int) $form_id;
}

if (!empty($page_ids['contact'])) {
    $contact_id = (int) $page_ids['contact'];
    if (get_post_meta($contact_id, '_wp_page_template', true) === '') { update_post_meta($contact_id, '_wp_page_template', 'template-contact.php'); }
    $form_id = ra_create_contact_form($by_name);
    if (get_post_meta($contact_id, 'rudnikagro_contact_heading_title', true) === '') {
        update_field('field_ra_contact_heading', [
            'title' => ra_string_source($by_name, 'rudnikagro_contact_heading_title'),
            'breadcrumb' => ra_string_source($by_name, 'rudnikagro_contact_heading_breadcrumb'),
            'image' => ra_import_attachment($snapshot, 'assets/contact/contact-heading-335-702.png', 'rudnikagro_contact_heading_image'),
        ], $contact_id);
    }
    if (get_post_meta($contact_id, 'rudnikagro_contact_blocks', true) === '') {
        update_field('field_ra_contact_blocks', [
            ['heading' => ra_string_source($by_name, 'rudnikagro_contact_office_heading'), 'company' => ra_string_source($by_name, 'rudnikagro_contact_office_company'), 'content' => ra_string_source($by_name, 'rudnikagro_contact_office_details'), 'contacts' => []],
            ['heading' => ra_string_source($by_name, 'rudnikagro_contact_branch_heading'), 'company' => '', 'content' => ra_string_source($by_name, 'rudnikagro_contact_branch_details'), 'contacts' => []],
            ['heading' => '', 'company' => '', 'content' => '', 'contacts' => [
                ['heading' => ra_string_source($by_name, 'rudnikagro_contact_sales_heading'), 'content' => ra_string_source($by_name, 'rudnikagro_contact_sales_contact')],
                ['heading' => ra_string_source($by_name, 'rudnikagro_contact_insurance_heading'), 'content' => ra_string_source($by_name, 'rudnikagro_contact_insurance_contact')],
                ['heading' => ra_string_source($by_name, 'rudnikagro_contact_protection_heading'), 'content' => ra_string_source($by_name, 'rudnikagro_contact_protection_contact')],
            ]],
        ], $contact_id);
    }
    if (get_post_meta($contact_id, 'rudnikagro_contact_form_presentation_heading', true) === '') {
        update_field('field_ra_contact_form_presentation', [
            'heading' => ra_string_source($by_name, 'rudnikagro_contact_form_heading'),
            'name_label' => ra_string_source($by_name, 'rudnikagro_contact_form_name_label'),
            'email_label' => ra_string_source($by_name, 'rudnikagro_contact_form_email_label'),
            'phone_label' => ra_string_source($by_name, 'rudnikagro_contact_form_phone_label'),
            'message_label' => ra_string_source($by_name, 'rudnikagro_contact_form_message_label'),
            'submit_label' => ra_string_source($by_name, 'rudnikagro_contact_form_submit_label'),
            'privacy_notice' => ra_string_source($by_name, 'rudnikagro_contact_form_privacy_notice'),
        ], $contact_id);
    }
    if (get_post_meta($contact_id, 'rudnikagro_contact_form', true) === '' && $form_id) { update_field('field_ra_contact_form', $form_id, $contact_id); }
    if (get_post_meta($contact_id, 'rudnikagro_contact_map_image', true) === '') {
        update_field('field_ra_contact_map', ra_import_attachment($snapshot, 'assets/contact/contact-map-431-924.png', 'rudnikagro_contact_map_image'), $contact_id);
    }
}

if (!empty($page_ids['catalogues'])) {
    $catalogues_id = (int) $page_ids['catalogues'];
    if (get_post_meta($catalogues_id, '_wp_page_template', true) === '') { update_post_meta($catalogues_id, '_wp_page_template', 'page-catalogues.php'); }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues_banner_title', true) === '') {
        $banner_id = ra_import_attachment($snapshot, 'assets/catalogues/catalogues-heading-background.png', 'rudnikagro_catalogues_media_347_1230');
        update_field('field_ra_catalogues_banner', [
            'title' => ra_string_source($by_name, 'rudnikagro_catalogues_347_1231'),
            'breadcrumb' => ra_structured_text_source($by_name, 'rudnikagro_catalogues_347_1121'),
            'image' => $banner_id,
        ], $catalogues_id);
    }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues', true) === '') {
        $catalogues = [
            [
                'title' => ra_string_source($by_name, 'rudnikagro_catalogues_349_1240'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues/catalogue-agriculture-cover.png', 'rudnikagro_catalogues_media_349_1262'),
                'background' => ra_import_attachment($snapshot, 'assets/catalogues/catalogues-agriculture-background.png', 'rudnikagro_catalogues_media_347_1236'),
                'pdf_label' => ra_string_source($by_name, 'rudnikagro_catalogues_349_1253'),
                'pdf' => 0,
                'online_label' => ra_string_source($by_name, 'rudnikagro_catalogues_431_933'),
                'online_url' => '',
            ],
            [
                'title' => ra_string_source($by_name, 'rudnikagro_catalogues_349_1242'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues/catalogue-orchard-cover.png', 'rudnikagro_catalogues_media_349_1263'),
                'background' => ra_import_attachment($snapshot, 'assets/catalogues/catalogues-orchard-background.png', 'rudnikagro_catalogues_media_347_1237'),
                'pdf_label' => ra_string_source($by_name, 'rudnikagro_catalogues_349_1255'),
                'pdf' => 0,
                'online_label' => ra_string_source($by_name, 'rudnikagro_catalogues_431_938'),
                'online_url' => '',
            ],
        ];
        update_field('field_ra_catalogues_cards', $catalogues, $catalogues_id);
    }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues_shop_cta_heading', true) === '') {
        // Exact strings are visually captured in the assigned frozen catalogue frame 347:1120.
        update_field('field_ra_catalogues_cta', ['heading' => 'Odkryj szeroki wybór produktów w naszym sklepie', 'button_label' => 'Sprawdź ofertę'], $catalogues_id);
    }
}

function ra_blog_card_string(array $card, string $key): string {
    return isset($card[$key]) && is_string($card[$key]) ? ra_repair_source_encoding($card[$key]) : '';
}
function ra_blog_card_post_date(string $date): string {
    if (!preg_match('/^(\\d{1,2})\\s+([^\\s]+)\\s+(\\d{4})$/u', $date, $parts)) { return ''; }
    $months = ['stycznia' => '01', 'lutego' => '02', 'marca' => '03', 'kwietnia' => '04', 'maja' => '05', 'czerwca' => '06', 'lipca' => '07', 'sierpnia' => '08', 'września' => '09', 'października' => '10', 'listopada' => '11', 'grudnia' => '12'];
    return isset($months[$parts[2]]) ? sprintf('%04d-%02d-%02d 12:00:00', (int) $parts[3], (int) $months[$parts[2]], (int) $parts[1]) : '';
}

$article_title = ra_string_source($by_name, 'rudnikagro_blog_article_heading_title');
$article_content_raw = ra_raw_string_source($by_name, 'rudnikagro_blog_article_content');
$article_content = ra_repair_source_encoding($article_content_raw);
$blog_post_ids = [];
if ($article_title !== '') {
    $post_id = ra_owned_post(['post_type' => 'post', 'post_status' => 'publish', 'post_title' => $article_title, 'post_name' => 'popularne-nawozy-potasowe-i-ich-zastosowanie-w-uprawach', 'post_content' => $article_content, 'post_date' => '2025-07-10 12:00:00'], 'blog-article');
    ra_update_owned_source_content($post_id, $article_content_raw, $article_content);
    $hero = ra_source_field($by_name, 'rudnikagro_blog_article_heading_featured_image');
    if ($hero && !get_post_thumbnail_id($post_id)) { set_post_thumbnail($post_id, ra_import_attachment($snapshot, $hero['value'], 'rudnikagro_blog_article_heading_featured_image')); }
    if (get_post_meta($post_id, 'rudnikagro_blog_article_header', true) === '') {
        update_field('field_ra_blog_article_header', [
            'banner_label' => ra_string_source($by_name, 'rudnikagro_blog_article_heading_banner_label'),
            'breadcrumb' => ra_string_source($by_name, 'rudnikagro_blog_article_heading_breadcrumb'),
            'banner' => ra_import_attachment($snapshot, 'assets/blog/blog-article-banner-327-3287.png', 'rudnikagro_blog_article_heading_banner'),
        ], $post_id);
    }
    if (get_post_meta($post_id, 'rudnikagro_blog_article_return_label', true) === '') { update_field('field_ra_blog_return_label', ra_string_source($by_name, 'rudnikagro_blog_article_return_label'), $post_id); }
}

$blog_cards_field = ra_source_field($by_name, 'rudnikagro_blog_post_list_items');
$blog_cards = is_array($blog_cards_field['value'] ?? null) ? $blog_cards_field['value'] : [];
foreach ($blog_cards as $card_index => $card) {
    if (!is_array($card)) { continue; }
    $title = ra_blog_card_string($card, 'title');
    $date = ra_blog_card_string($card, 'date');
    $node_id = ra_blog_card_string($card, 'nodeId');
    $image = ra_blog_card_string($card, 'image');
    if ($title === '' || $node_id === '' || $image === '') { continue; }
    $card_post_id = $title === $article_title && isset($post_id) ? $post_id : ra_owned_post([
        'post_type' => 'post', 'post_status' => 'publish', 'post_title' => $title,
        'post_name' => sanitize_title($title), 'post_content' => '', 'post_date' => ra_blog_card_post_date($date),
    ], 'blog-card-' . str_replace(':', '-', $node_id));
    $blog_post_ids[$node_id] = $card_post_id;
    if (!metadata_exists('post', $card_post_id, '_rudnikagro_blog_source_order')) { update_post_meta($card_post_id, '_rudnikagro_blog_source_order', (int) $card_index + 1); }
    if (get_post_meta($card_post_id, 'rudnikagro_blog_card_date', true) === '') { update_field('field_ra_blog_card_date', $date, $card_post_id); }
    if (get_post_meta($card_post_id, 'rudnikagro_blog_card_label', true) === '') { update_field('field_ra_blog_card_label', ra_blog_card_string($card, 'label'), $card_post_id); }
    if (get_post_meta($card_post_id, 'rudnikagro_blog_card_image', true) === '') { update_field('field_ra_blog_card_image', ra_import_attachment($snapshot, $image, 'rudnikagro_blog_card_image_' . str_replace(':', '-', $node_id)), $card_post_id); }
}
if (isset($post_id) && get_post_meta($post_id, 'rudnikagro_blog_related_heading', true) === '') {
    $related = [];
    foreach (['327:3116', '327:3117', '327:3118'] as $node_id) { if (isset($blog_post_ids[$node_id])) { $related[] = ['post' => $blog_post_ids[$node_id]]; } }
    update_field('field_ra_blog_related_heading', ra_string_source($by_name, 'rudnikagro_blog_related_posts_heading'), $post_id);
    update_field('field_ra_blog_related_posts', $related, $post_id);
}
if (!ra_is_populated_option('rudnikagro_blog_archive_header')) {
    update_field('field_ra_blog_archive_header', [
        'banner_label' => ra_string_source($by_name, 'rudnikagro_blog_archive_heading_banner_label'),
        'breadcrumb' => ra_string_source($by_name, 'rudnikagro_blog_archive_heading_breadcrumb'),
        'banner' => ra_import_attachment($snapshot, 'assets/blog/blog-archive-banner-327-3097.png', 'rudnikagro_blog_archive_heading_banner'),
    ], 'option');
}

if (class_exists('WooCommerce')) {
    if (function_exists('wc_create_pages')) { wc_create_pages(); }
    $currency_settings = [
        'woocommerce_currency' => 'PLN',
        'woocommerce_currency_pos' => 'right_space',
        'woocommerce_price_thousand_sep' => '.',
        'woocommerce_price_decimal_sep' => ',',
        'woocommerce_price_num_decimals' => '2',
    ];
    $last_currency_settings = get_option('rudnikagro_last_imported_woocommerce_currency_settings', []);
    $currency_is_untracked = !is_array($last_currency_settings) || !$last_currency_settings;
    $currency_matches_import = !$currency_is_untracked;
    if (!$currency_is_untracked) {
        foreach ($currency_settings as $key => $value) {
            if ((string) get_option($key) !== (string) ($last_currency_settings[$key] ?? '')) { $currency_matches_import = false; break; }
        }
    }
    if ($currency_is_untracked || $currency_matches_import) {
        foreach ($currency_settings as $key => $value) { update_option($key, $value); }
        update_option('rudnikagro_last_imported_woocommerce_currency_settings', $currency_settings, false);
    }
    $woocommerce_routes = ['cart' => ['woocommerce_cart_page_id', 'koszyk'], 'checkout' => ['woocommerce_checkout_page_id', 'zamowienie'], 'account' => ['woocommerce_myaccount_page_id', 'moje-konto']];
    foreach ($woocommerce_routes as $route => [$option, $slug]) {
        $id = (int) get_option($option);
        if (!$id) { continue; }
        if (!get_post_meta($id, '_rudnikagro_route_id', true)) {
            update_post_meta($id, '_rudnikagro_route_id', $route);
            update_post_meta($id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
            wp_update_post(['ID' => $id, 'post_name' => $slug]);
        }
        if ($route === 'cart') {
            $cart_content = '[woocommerce_cart]';
            $current_content = (string) get_post_field('post_content', $id);
            $last_imported_content = (string) get_post_meta($id, '_rudnikagro_last_imported_cart_content', true);
            // The Woo setup wizard's block cart is not this project's source-owned
            // cart implementation. Migrate that untracked baseline once; later
            // modifications are compared with this recorded import value.
            $is_untracked_project_cart = $last_imported_content === '' && get_post_meta($id, '_rudnikagro_route_id', true) === 'cart';
            if ($is_untracked_project_cart || ($last_imported_content !== '' && $current_content === $last_imported_content)) {
                if ($current_content !== $cart_content) { wp_update_post(['ID' => $id, 'post_content' => $cart_content]); }
                update_post_meta($id, '_rudnikagro_last_imported_cart_content', $cart_content);
            }
        }
    }
    $category = term_exists('Fungicydy', 'product_cat');
    if (!$category) { $category = wp_insert_term('Fungicydy', 'product_cat'); }
    if (!is_wp_error($category)) { update_term_meta((int) (is_array($category) ? $category['term_id'] : $category), '_rudnikagro_route_id', 'product-archive'); }
    $product_titles = [
        'aquatos-5l' => (string) (ra_source_field($by_name, 'rudnikagro_product_overview_323_2084')['value'] ?? ''),
        'pakiet-ochronny-rzepaku-ozimego-12-ha' => (string) (ra_source_field($by_name, 'rudnikagro_product_bundle_overview_586_1245')['value'] ?? ''),
    ];
    foreach (['aquatos-5l' => 'product', 'pakiet-ochronny-rzepaku-ozimego-12-ha' => 'product-bundle'] as $slug => $route) {
        if (!get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => $route, 'fields' => 'ids', 'numberposts' => 1])) {
            $id = wp_insert_post(['post_type' => 'product', 'post_status' => 'draft', 'post_name' => $slug, 'post_title' => $product_titles[$slug]]);
            update_post_meta($id, '_rudnikagro_route_id', $route); update_post_meta($id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
        }
    }
    $product_imports = [
        'product' => ['slug' => 'aquatos-5l', 'overview' => 'product-overview', 'tabs' => 'product-tabs', 'benefits' => 'product-benefits', 'gallery' => 'assets/product-aquatos-5l.png', 'gallery_key' => 'rudnikagro_product_gallery_aquatos'],
        'product-bundle' => ['slug' => 'pakiet-ochronny-rzepaku-ozimego-12-ha', 'overview' => 'product-bundle-overview', 'tabs' => 'bundle-tabs', 'benefits' => 'bundle-benefits', 'gallery' => 'assets/product-bundle-rapeseed.png', 'gallery_key' => 'rudnikagro_product_gallery_bundle'],
    ];
    foreach ($product_imports as $route => $config) {
        $ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'name' => $config['slug'], 'fields' => 'ids', 'numberposts' => 1]);
        if (!$ids) { continue; }
        $id = (int) $ids[0]; $overview = ra_section_values($by_name, $config['overview']); $tab_values = ra_section_values($by_name, $config['tabs']);
        $title = $product_titles[$config['slug']] ?? '';
        if ($title !== '' && get_post_status($id) === 'draft') { wp_update_post(['ID' => $id, 'post_title' => ra_repair_source_encoding($title), 'post_status' => 'publish']); }
        $sku = $route === 'product' ? '98899' : '99299';
        $native = wc_get_product($id);
        if ($native) {
            if ($native->get_sku() === '') { $native->set_sku($sku); }
            $prices = [];
            foreach ($overview as $item) { if (preg_match_all('/(\d+[,.]\d{2})/', $item['value'], $matches)) { foreach ($matches[1] as $match) { $prices[] = (float) str_replace(',', '.', $match); } } }
            $prices = array_values(array_filter($prices)); sort($prices);
            if ($prices && $native->get_regular_price() === '') { $native->set_regular_price((string) end($prices)); if (count($prices) > 1) { $native->set_sale_price((string) $prices[0]); } }
            if ($route === 'product-bundle' && in_array($native->get_sale_price(), ['247.08', '965.00'], true)) {
                $bundle_sale = ra_repair_source_encoding((string) (ra_source_field($by_name, 'rudnikagro_product_bundle_overview_586_1244')['value'] ?? ''));
                if (preg_match('/([0-9\h]+),([0-9]{2})/u', $bundle_sale, $match)) { $native->set_sale_price(preg_replace('/\h/u', '', $match[1]) . '.' . $match[2]); }
            }
            $native->save();
        }
        $image_id = ra_import_attachment($snapshot, $config['gallery'], $config['gallery_key']);
        if (!get_post_thumbnail_id($id)) { set_post_thumbnail($id, $image_id); }
        ra_update_empty_product_field($id, 'rudnikagro_product_gallery', [$image_id]);
        $tab_labels = [];
        foreach ($tab_values as $item) { if (preg_match('/_tab_[1-5]_/', $item['name'])) { $tab_labels[] = $item['value']; } }
        ra_update_empty_product_field($id, 'rudnikagro_product_labels', ['breadcrumb' => $title, 'details' => ra_first_matching_value($overview, 'Kod produktu'), 'wholesale' => ra_first_matching_value($overview, 'hurtow'), 'favorite' => ra_first_matching_value($overview, 'ulubion'), 'tabs' => implode("\n", $tab_labels)]);
        $technical_source = array_values(array_filter($tab_values, static fn($item) => !preg_match('/_tab_[1-5]_/', $item['name'])));
        $technical = [];
        for ($index = 0; $index < count($technical_source); $index += 2) { $technical[] = ['label' => $technical_source[$index]['value'], 'value' => $technical_source[$index + 1]['value'] ?? '']; }
        ra_update_empty_product_field($id, 'rudnikagro_product_technical_data', $technical);
        $benefits = [];
        foreach (ra_section_values($by_name, $config['benefits']) as $item) { $benefits[] = ['label' => $item['value']]; }
        ra_update_empty_product_field($id, 'rudnikagro_product_benefits', $benefits);
        if ($route === 'product-bundle') {
            $bundle_value = static function (string $field) use ($by_name): string { return ra_repair_source_encoding((string) (ra_source_field($by_name, $field)['value'] ?? '')); };
            $bundle_price = static function (string $field) use ($bundle_value): array { return preg_split('/\R/u', $bundle_value($field)) ?: []; };
            $first_prices = $bundle_price('rudnikagro_product_bundle_overview_591_1283');
            $second_prices = $bundle_price('rudnikagro_product_bundle_overview_592_1292');
            ra_update_empty_product_field($id, 'rudnikagro_product_bundle', [
                'contains_heading' => $bundle_value('rudnikagro_product_bundle_overview_592_1322'),
                'savings' => $bundle_value('rudnikagro_product_bundle_overview_592_1319'),
                'single_products_price' => $bundle_value('rudnikagro_product_bundle_overview_592_1320'),
                'price_per_hectare' => $bundle_value('rudnikagro_product_bundle_overview_593_117'),
                'area_options' => [
                    ['label' => $bundle_value('rudnikagro_product_bundle_overview_586_1237'), 'active' => 0],
                    ['label' => $bundle_value('rudnikagro_product_bundle_overview_586_1240'), 'active' => 1],
                    ['label' => $bundle_value('rudnikagro_product_bundle_overview_586_1243'), 'active' => 0],
                ],
                'items' => [
                    ['quantity' => $bundle_value('rudnikagro_product_bundle_overview_592_1286'), 'description' => $bundle_value('rudnikagro_product_bundle_overview_592_1285'), 'current_price' => $first_prices[0] ?? '', 'previous_price' => $first_prices[1] ?? ''],
                    ['quantity' => $bundle_value('rudnikagro_product_bundle_overview_592_1288'), 'description' => $bundle_value('rudnikagro_product_bundle_overview_592_1290'), 'current_price' => $second_prices[0] ?? '', 'previous_price' => $second_prices[1] ?? ''],
                ],
            ]);
        }
        $expanded = ra_section_values($by_name, 'product-expanded-description');
        if ($route === 'product') {
            $expanded_value = (string) ($expanded[0]['value'] ?? '');
            $legacy_expanded = wpautop(esc_html($expanded_value));
            $source_expanded = ra_source_rich_text($snapshot, 'sections/11-product-expanded-description.json', $expanded_value);
            $existing_content = (array) get_field('rudnikagro_product_content', $id);
            if (!$existing_content) { ra_update_empty_product_field($id, 'rudnikagro_product_content', ['expanded_description' => $source_expanded]); }
            else { ra_update_legacy_imported_product_content($id, $existing_content, $legacy_expanded, $source_expanded); }
        }
        $notice_rows = []; foreach (ra_section_values($by_name, 'product-legal-notices') as $item) { $notice_rows[] = ['text' => wpautop(esc_html($item['value']))]; }
        ra_update_empty_product_field($id, 'rudnikagro_product_notices', $notice_rows);
        $download_rows = []; foreach (ra_section_values($by_name, 'product-files') as $item) { if (stripos($item['value'], 'pobierz') !== false) { $download_rows[] = ['label' => $item['value'], 'file' => 0]; } }
        ra_update_empty_product_field($id, 'rudnikagro_product_downloads', $download_rows);
        $inquiry_values = ra_section_values($by_name, 'product-inquiry-dialog');
        ra_update_empty_product_field($id, 'rudnikagro_product_inquiry', ['heading' => $inquiry_values[0]['value'] ?? '', 'field_labels' => implode("\n", array_column($inquiry_values, 'value'))]);
        if ($route === 'product') {
            $inquiry_form = ra_create_product_inquiry_form($by_name);
            $inquiry = (array) get_field('rudnikagro_product_inquiry', $id);
            if ($inquiry_form && empty($inquiry['form'])) { $inquiry['form'] = $inquiry_form; }
            if (empty($inquiry['privacy'])) { $inquiry['privacy'] = ra_string_source($by_name, 'rudnikagro_product_inquiry_dialog_privacy_note_431_889'); }
            update_field('field_ra_product_inquiry', $inquiry, $id);
        }
    }
}

/* Native commerce reconciliation. Values are source-node keyed so reruns only
 * refresh their own baseline; later editor price/content changes remain intact. */
ra_import_home_active_navigation($snapshot);
if (class_exists('WooCommerce')) {
    ra_import_cart_options($by_name);
    ra_import_account_options($by_name);
    $cart_remove_icon = ra_import_attachment($snapshot, 'assets/cart/cart-remove-item.svg', 'rudnikagro_cart_remove_icon_486_96');
    ra_update_owned_option('field_ra_cart_remove', 'rudnikagro_cart_remove_icon_486_96', $cart_remove_icon);
    ra_import_cart_commerce_configuration();
    ra_import_checkout_options($by_name, $snapshot);
    ra_import_checkout_commerce_configuration($by_name);
    $aquatos_ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'name' => 'aquatos-5l', 'fields' => 'ids', 'numberposts' => 1]);
    if ($aquatos_ids) {
        $aquatos_id = (int) $aquatos_ids[0];
        $cart_image_id = ra_import_attachment($snapshot, 'assets/product-aquatos-5l.png', 'rudnikagro_cart_product_image_483_27');
        $current_thumbnail = (int) get_post_thumbnail_id($aquatos_id);
        $last_thumbnail = (int) get_post_meta($aquatos_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_thumbnail || ($last_thumbnail && $current_thumbnail === $last_thumbnail)) {
            set_post_thumbnail($aquatos_id, $cart_image_id);
            update_post_meta($aquatos_id, '_rudnikagro_last_imported_thumbnail_id', $cart_image_id);
        }
        $base_price = ra_source_price(ra_source_value_by_node($by_name, '323:2087'));
        $sizes = ['496:1781', '496:1787', '496:1791'];
        $size_values = array_map(static fn(string $node): string => ra_source_value_by_node($by_name, $node), $sizes);
        if ($base_price !== null && !in_array('', $size_values, true)) {
            wp_set_object_terms($aquatos_id, 'variable', 'product_type');
            $parent = new WC_Product_Variable($aquatos_id);
            $attribute = new WC_Product_Attribute();
            $attribute->set_name('Pojemność');
            $attribute->set_options($size_values);
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            $parent->set_attributes(['pojemnosc' => $attribute]);
            $parent->save();
            foreach ($sizes as $index => $node) {
                $option = $size_values[$index];
                $calculated = $option !== '5 L';
                $price = $calculated ? round($base_price * ((float) str_replace(',', '.', $option)) / 5, 2) : $base_price;
                $variation = ra_owned_variation($aquatos_id, $node, $option);
                ra_set_owned_price($variation, number_format($price, 2, '.', ''), [
                    'sourceNode' => $node,
                    'sourcePriceNode' => '323:2087',
                    'provenance' => $calculated ? 'user-authorized-proportional' : 'figma-explicit',
                    'basePrice' => $base_price,
                    'baseQuantity' => '5 L',
                    'targetQuantity' => $option,
                    'formula' => $calculated ? 'base price * target quantity / base quantity' : null,
                    'taxBasis' => 'including 23% VAT, source node 502:3',
                ]);
            }
            WC_Product_Variable::sync($aquatos_id);
            wc_delete_product_transients($aquatos_id);
        }

        $parent_term = term_exists('Środki ochrony roślin', 'product_cat');
        if (!$parent_term) { $parent_term = wp_insert_term('Środki ochrony roślin', 'product_cat'); }
        $parent_term_id = !is_wp_error($parent_term) ? (int) (is_array($parent_term) ? $parent_term['term_id'] : $parent_term) : 0;
        $fungicides = term_exists('Fungicydy', 'product_cat');
        if (!$fungicides) { $fungicides = wp_insert_term('Fungicydy', 'product_cat', ['parent' => $parent_term_id]); }
        $fungicides_id = !is_wp_error($fungicides) ? (int) (is_array($fungicides) ? $fungicides['term_id'] : $fungicides) : 0;
        if ($fungicides_id && $parent_term_id && (int) get_term($fungicides_id, 'product_cat')->parent === 0) { wp_update_term($fungicides_id, 'product_cat', ['parent' => $parent_term_id]); }
        if ($fungicides_id) { wp_set_object_terms($aquatos_id, [$fungicides_id], 'product_cat'); }

        $related = [
            ['titleNode' => '326:2271', 'priceNode' => '326:2272', 'crop' => ['x' => 78, 'y' => 105, 'width' => 190, 'height' => 260]],
            ['titleNode' => '326:2289', 'priceNode' => '326:2290', 'crop' => ['x' => 426, 'y' => 105, 'width' => 210, 'height' => 260]],
        ];
        $related_ids = [];
        foreach ($related as $card) {
            $title = ra_source_value_by_node($by_name, $card['titleNode']);
            $price = ra_source_price(ra_source_value_by_node($by_name, $card['priceNode']));
            if ($title === '' || $price === null) { continue; }
            $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $card['titleNode'], 'fields' => 'ids', 'numberposts' => 1]);
            $related_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title)]);
            if (!$related_id || is_wp_error($related_id)) { continue; }
            update_post_meta($related_id, '_rudnikagro_source_node', $card['titleNode']);
            update_post_meta($related_id, '_rudnikagro_owned', '1');
            $related_product = wc_get_product($related_id);
            if ($related_product) { ra_set_owned_price($related_product, number_format($price, 2, '.', ''), ['sourceNode' => $card['priceNode'], 'provenance' => 'figma-explicit']); }
            $related_image = ra_import_reference_crop_attachment($snapshot, 'references/sections/product-related.png', $card['crop'], 'rudnikagro_product_card_' . str_replace(':', '_', $card['titleNode']) . '_image');
            $current_thumbnail = (int) get_post_thumbnail_id($related_id);
            $last_thumbnail = (int) get_post_meta($related_id, '_rudnikagro_last_imported_thumbnail_id', true);
            if (!$current_thumbnail || ($last_thumbnail && $current_thumbnail === $last_thumbnail)) {
                set_post_thumbnail($related_id, $related_image);
                update_post_meta($related_id, '_rudnikagro_last_imported_thumbnail_id', $related_image);
            }
            if ($fungicides_id) { wp_set_object_terms($related_id, [$fungicides_id], 'product_cat'); }
            $related_ids[] = $related_id;
        }
        $current_related = get_post_meta($aquatos_id, '_upsell_ids', true);
        $last_related = get_post_meta($aquatos_id, '_rudnikagro_last_imported_related_ids', true);
        if ($current_related === '' || $current_related === $last_related) { update_post_meta($aquatos_id, '_upsell_ids', $related_ids); update_post_meta($aquatos_id, '_rudnikagro_last_imported_related_ids', $related_ids); }

        $review_body = ra_source_value_by_node($by_name, '425:645');
        $review_date = ra_source_value_by_node($by_name, '429:842');
        if ($review_body !== '') {
            $existing_review = get_comments(['post_id' => $aquatos_id, 'status' => 'all', 'type' => 'review', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => '425:645', 'number' => 1]);
            $comment_id = $existing_review ? (int) $existing_review[0]->comment_ID : wp_insert_comment(['comment_post_ID' => $aquatos_id, 'comment_content' => $review_body, 'comment_approved' => 1, 'comment_type' => 'review', 'comment_date' => '2026-07-30 12:00:00', 'comment_date_gmt' => '2026-07-30 10:00:00']);
            if ($comment_id) {
                update_comment_meta($comment_id, '_rudnikagro_source_node', '425:645');
                update_comment_meta($comment_id, '_rudnikagro_review_provenance', wp_json_encode(['bodyNode' => '425:645', 'dateNode' => '429:842', 'ratingNodes' => ['429:836', '429:837', '429:838', '429:839', '429:840'], 'sourceDate' => $review_date, 'editorialNote' => 'Source placeholder body retained for editorial review.'], JSON_UNESCAPED_UNICODE));
                if (get_comment_meta($comment_id, '_rudnikagro_last_imported_rating', true) === '' || get_comment_meta($comment_id, 'rating', true) === get_comment_meta($comment_id, '_rudnikagro_last_imported_rating', true)) { update_comment_meta($comment_id, 'rating', 5); update_comment_meta($comment_id, '_rudnikagro_last_imported_rating', 5); }
            }
        }
        if (function_exists('wc_update_product_rating_counts')) { wc_update_product_rating_counts($aquatos_id); }
        if (function_exists('wc_update_product_review_count')) { wc_update_product_review_count($aquatos_id); }
        if (function_exists('wc_update_product_rating')) { wc_update_product_rating($aquatos_id); }
        $review_summary_value = ra_source_value_by_node($by_name, '428:835');
        if ($review_summary_value !== '' && function_exists('update_field') && !get_field('rudnikagro_product_review_summary', $aquatos_id)) {
            $parts = preg_split('/\R/u', $review_summary_value);
            update_field('field_ra_product_review_summary', ['average' => trim($parts[0] ?? ''), 'count' => trim($parts[1] ?? ''), 'distribution' => []], $aquatos_id);
        }
        if (function_exists('update_field') && !get_field('rudnikagro_product_icons', $aquatos_id)) {
            $favorite_icon = ra_import_attachment($snapshot, 'assets/home/I625-179;586-555-ulubione.svg', 'rudnikagro_product_icon_I625_179_586_555');
            update_field('field_ra_product_icons', ['favorite_icon' => $favorite_icon, 'download_icon' => 0], $aquatos_id);
        }
    }
}

/* Product archive: native category records, source-owned card products and editable UI. */
if (function_exists('wc_get_product') && function_exists('update_field')) {
    $parent = term_exists('Środki ochrony roślin', 'product_cat');
    if (!$parent) { $parent = wp_insert_term('Środki ochrony roślin', 'product_cat'); }
    $parent_id = !is_wp_error($parent) ? (int) (is_array($parent) ? $parent['term_id'] : $parent) : 0;
    $fungicides = term_exists('Fungicydy', 'product_cat');
    if (!$fungicides) { $fungicides = wp_insert_term('Fungicydy', 'product_cat', ['parent' => $parent_id]); }
    $fungicides_id = !is_wp_error($fungicides) ? (int) (is_array($fungicides) ? $fungicides['term_id'] : $fungicides) : 0;
    if ($fungicides_id && $parent_id && (int) get_term($fungicides_id, 'product_cat')->parent !== $parent_id) { wp_update_term($fungicides_id, 'product_cat', ['parent' => $parent_id]); }
    if ($fungicides_id) {
        update_term_meta($fungicides_id, '_rudnikagro_route_id', 'product-archive');
        $archive_title = ra_source_value_by_node($by_name, '295:740');
        if ($archive_title !== '' && (string) get_field('rudnikagro_archive_category_introduction_title', 'product_cat_' . $fungicides_id) === '') {
            update_field('field_ra_archive_intro_title', $archive_title, 'product_cat_' . $fungicides_id);
        }
        // Source node 303:1276 is absent from content-map.json, but its exact copy is
        // legible in the retained 1x reference crop (frame 294:3, x=605, y=3667).
        // Treat that crop as the source record and retain an editor override once changed.
        $archive_description = '<h2>Czym są preparaty grzybobójcze?</h2><p>Fungicydy to preparaty przeznaczone do zwalczania grzybów chorobotwórczych, które atakują rośliny uprawne. Wykorzystywane są zarówno w rolnictwie, jak i w ogrodnictwie, aby zapewnić zdrowie roślin i optymalny rozwój plonów. Ich działanie polega na niszczeniu zarodników grzybów oraz hamowaniu ich wzrostu i rozmnażania. Działają fungicydy poprzez różne mechanizmy, w tym inhibitory wzrostu, które hamują rozwój grzybów, oraz stymulację procesów odpornościowych roślin.<br>Fungicydy można podzielić na kilka rodzajów, w tym fungicydy kontaktowe, które działają na powierzchni rośliny, oraz fungicydy systemiczne, które przenikają do wnętrza rośliny. Ważnym typem są również fungicydy wgłębne, które zatrzymują biosyntezę białek i hamują rozwój grzybów wewnątrz rośliny. Wybór odpowiednich fungicydów oraz zasady ich stosowania są kluczowe dla osiągnięcia zdrowych i produktywnych upraw.</p><h2>Rodzaje fungicydów</h2><p>Fungicydy można podzielić na kilka rodzajów, w zależności od ich mechanizmu działania i składu. Jednym z podstawowych typów są fungicydy kontaktowe, które tworzą warstwę ochronną na powierzchni rośliny, zapobiegając wnikaniu patogenów grzybowych. Działają one na zasadzie bezpośredniego kontaktu z grzybem, co sprawia, że są skuteczne w zapobieganiu infekcjom.</p>';
        $archive_description_current = (string) get_field('rudnikagro_archive_category_description', 'product_cat_' . $fungicides_id);
        $archive_description_last = (string) get_term_meta($fungicides_id, '_rudnikagro_last_imported_archive_description', true);
        if ($archive_description_current === '' || ($archive_description_last !== '' && $archive_description_current === $archive_description_last)) {
            update_field('field_ra_archive_description', $archive_description, 'product_cat_' . $fungicides_id);
            update_term_meta($fungicides_id, '_rudnikagro_last_imported_archive_description', $archive_description);
            $summary['options']++;
        }
    }

    $archive_option_values = [
        ['field_ra_archive_breadcrumbs', 'breadcrumbs', ra_source_value_by_node($by_name, '295:700')],
        ['field_ra_archive_expand', 'expand_label', ra_source_value_by_node($by_name, '420:4')],
        ['field_ra_archive_sort', 'sort_label', ra_source_value_by_node($by_name, '295:744')],
        ['field_ra_archive_categories', 'filter_categories', ra_source_value_by_node($by_name, '304:1407')],
        ['field_ra_archive_crops', 'filter_crops', ra_source_value_by_node($by_name, '306:1505')],
        ['field_ra_archive_substances', 'filter_substances', ra_source_value_by_node($by_name, '574:530')],
        ['field_ra_archive_price_from', 'price_from', ra_source_value_by_node($by_name, '344:928')],
        ['field_ra_archive_price_to', 'price_to', ra_source_value_by_node($by_name, '344:951')],
        ['field_ra_archive_pagination', 'pagination', implode("\n", array_filter([ra_source_value_by_node($by_name, '303:1305'), ra_source_value_by_node($by_name, '303:1306'), ra_source_value_by_node($by_name, '303:1308'), ra_source_value_by_node($by_name, '303:1310'), ra_source_value_by_node($by_name, '303:1312'), ra_source_value_by_node($by_name, '303:1314'), ra_source_value_by_node($by_name, '303:1315')]))],
        // These labels are exact text in the archived Figma section snapshots; their source text nodes were not emitted in content-map.json.
        ['field_ra_archive_category_label', 'filter_category_label', 'Kategorie'],
        ['field_ra_archive_crops_label', 'filter_crops_label', 'Uprawa'],
        ['field_ra_archive_substances_label', 'filter_substances_label', 'Substancje czynne'],
        ['field_ra_archive_price_label', 'filter_price_label', 'Cena'],
        ['field_ra_archive_producer_label', 'filter_producer_label', 'Producent'],
        ['field_ra_archive_add', 'add_to_cart_label', 'Do koszyka'],
        ['field_ra_archive_quantity', 'quantity_label', 'Ilość'],
        ['field_ra_archive_pagination_label', 'pagination_label', 'Strony'],
    ];
    $pagination_icon = ra_import_attachment($snapshot, 'assets/product-archive/a910008d-459f-4404-bc5c-37a2f08170d2.svg', 'rudnikagro_archive_pagination_next_303_1318');
    $archive_source_values = [];
    foreach ($archive_option_values as [, $name, $value]) { $archive_source_values[$name] = $value; }
    $archive_source_values['pagination_next_icon'] = $pagination_icon;
    $archive_current = (array) get_field('rudnikagro_product_archive', 'option');
    $archive_changed = false;
    foreach ($archive_source_values as $name => $value) {
        if (!array_key_exists($name, $archive_current) || $archive_current[$name] === '' || $archive_current[$name] === null) {
            $archive_current[$name] = $value;
            $archive_changed = true;
        }
    }
    if ($archive_changed) { update_field('field_ra_archive_group', $archive_current, 'option'); update_option('_rudnikagro_last_imported_product_archive', $archive_source_values, false); $summary['options']++; }

    foreach ($fields as $field) {
        if (($field['section'] ?? '') !== 'archive-product-grid' || ($field['type'] ?? '') !== 'product' || !is_array($field['value'] ?? null)) { continue; }
        $source_node = (string) ($field['nodeId'] ?? '');
        $source = (array) $field['value'];
        $title = trim(ra_repair_source_encoding((string) ($source['title'] ?? '')));
        $raw_price = ra_repair_source_encoding((string) ($source['price'] ?? ''));
        $normalized_price = preg_replace('/[^0-9,]/u', '', $raw_price);
        $price = $normalized_price === '' ? null : number_format((float) str_replace(',', '.', $normalized_price), 2, '.', '');
        $asset = (string) (($source['media']['path'] ?? ''));
        if ($source_node === '' || $title === '' || $price === null || $asset === '') { continue; }
        $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $source_node, 'fields' => 'ids', 'numberposts' => 1]);
        $product_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title)]);
        if (!$product_id || is_wp_error($product_id)) { continue; }
        update_post_meta($product_id, '_rudnikagro_source_node', $source_node);
        update_post_meta($product_id, '_rudnikagro_owned', '1');
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-archive');
        update_post_meta($product_id, '_rudnikagro_archive_source_order', (int) count(get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'product-archive', 'fields' => 'ids', 'numberposts' => -1])));
        $last_title = (string) get_post_meta($product_id, '_rudnikagro_last_imported_title', true);
        if ($last_title === '' || get_the_title($product_id) === $last_title) { wp_update_post(['ID' => $product_id, 'post_title' => $title]); update_post_meta($product_id, '_rudnikagro_last_imported_title', $title); }
        $native = wc_get_product($product_id);
        if ($native) { ra_set_owned_price($native, $price, ['sourceNode' => $source_node, 'sourcePrice' => $raw_price, 'provenance' => 'figma-explicit']); }
        $image = ra_import_attachment($snapshot, $asset, 'rudnikagro_archive_card_' . str_replace(':', '_', $source_node));
        $current_image = (int) get_post_thumbnail_id($product_id);
        $last_image = (int) get_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_image || ($last_image && $current_image === $last_image)) { set_post_thumbnail($product_id, $image); update_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', $image); }
        if ($fungicides_id) { wp_set_object_terms($product_id, [$fungicides_id], 'product_cat'); }
    }
    $permalinks = (array) get_option('woocommerce_permalinks', []);
    if (empty($permalinks['category_base']) || $permalinks['category_base'] === 'product-category') {
        $permalinks['category_base'] = 'kategoria-produktu';
        update_option('woocommerce_permalinks', $permalinks, false);
        flush_rewrite_rules(false);
    }
}

function ra_create_menu(string $name, string $location, array $page_ids): void {
    global $summary;
    $menu = wp_get_nav_menu_object($name);
    $menu_id = $menu ? (int) $menu->term_id : (int) wp_create_nav_menu($name);
    if (!$menu_id || wp_get_nav_menu_items($menu_id)) { return; }
    foreach (['about', 'blog', 'careers', 'catalogues', 'contact'] as $route) {
        if (empty($page_ids[$route])) { continue; }
        wp_update_nav_menu_item($menu_id, 0, ['menu-item-object-id' => $page_ids[$route], 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish']);
    }
    $locations = get_theme_mod('nav_menu_locations', []); $locations[$location] = $menu_id; set_theme_mod('nav_menu_locations', $locations); $summary['menus']++;
}
ra_create_menu('RudnikAgro — dodatkowa', 'rudnikagro_secondary', $page_ids);
ra_create_menu('RudnikAgro — główna', 'rudnikagro_primary', $page_ids);
echo wp_json_encode(['rudnikagro_import' => $summary], JSON_UNESCAPED_UNICODE) . PHP_EOL;
