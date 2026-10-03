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
$scoped_product_keys = null;
$scoped_content_keys = null;
$product_demo_clones = [];
$scoped_product_keys_raw = getenv('FACTORY_RUDNIKAGRO_PRODUCT_KEYS');
if ($scoped_product_keys_raw !== false && trim($scoped_product_keys_raw) !== '') {
    $scoped_product_keys = json_decode($scoped_product_keys_raw, true);
    if (!is_array($scoped_product_keys) || !$scoped_product_keys || count($scoped_product_keys) !== count(array_unique(array_map('strval', $scoped_product_keys)))) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_PRODUCT_KEYS must be a non-empty unique JSON array.');
    }
    $scoped_product_keys = array_values(array_map('strval', $scoped_product_keys));
}
$product_demo_clones_raw = getenv('FACTORY_RUDNIKAGRO_PRODUCT_DEMO_CLONES');
if ($product_demo_clones_raw !== false && trim($product_demo_clones_raw) !== '') {
    $product_demo_clones = json_decode($product_demo_clones_raw, true);
    if (!is_array($product_demo_clones)) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_PRODUCT_DEMO_CLONES must be a JSON array.');
    }
}
$scoped_content_keys_raw = getenv('FACTORY_RUDNIKAGRO_CONTENT_KEYS');
if ($scoped_content_keys_raw !== false && trim($scoped_content_keys_raw) !== '') {
    if ($scoped_product_keys !== null) { throw new RuntimeException('Product and content scopes cannot be combined.'); }
    $scoped_content_keys = json_decode($scoped_content_keys_raw, true);
    if (!is_array($scoped_content_keys) || !$scoped_content_keys || count($scoped_content_keys) !== count(array_unique(array_map('strval', $scoped_content_keys)))) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_CONTENT_KEYS must be a non-empty unique JSON array.');
    }
    $scoped_content_keys = array_values(array_map('strval', $scoped_content_keys));
}
$scoped_content_records_raw = getenv('FACTORY_RUDNIKAGRO_CONTENT_RECORDS');
$scoped_content_records = [];
if ($scoped_content_records_raw !== false && trim($scoped_content_records_raw) !== '') {
    if ($scoped_content_keys === null) { throw new RuntimeException('Explicit content records require a content scope.'); }
    $scoped_content_records = json_decode($scoped_content_records_raw, true);
    if (!is_array($scoped_content_records) || count($scoped_content_records) !== count($scoped_content_keys)) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_CONTENT_RECORDS must match the content scope exactly.');
    }
    $explicit_keys = [];
    foreach ($scoped_content_records as $record) {
        if (!is_array($record) || empty($record['fieldName']) || empty($record['nodeId'])) {
            throw new RuntimeException('Explicit content records must contain fieldName and nodeId.');
        }
        $explicit_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) $record['nodeId'], (string) $record['fieldName']]);
        $explicit_keys[] = $explicit_key;
    }
    sort($explicit_keys);
    $scope_keys = $scoped_content_keys;
    sort($scope_keys);
    if ($explicit_keys !== $scope_keys || count(array_unique($explicit_keys)) !== count($explicit_keys)) {
        throw new RuntimeException('Explicit content records contain missing or out-of-scope keys.');
    }
}
$scoped_listing_keys_raw = getenv('FACTORY_RUDNIKAGRO_LISTING_KEYS');
$scoped_listing_keys = null;
if ($scoped_listing_keys_raw !== false && trim($scoped_listing_keys_raw) !== '') {
    if ($scoped_product_keys !== null || $scoped_content_keys !== null) { throw new RuntimeException('Listing and content scopes cannot be combined.'); }
    $scoped_listing_keys = json_decode($scoped_listing_keys_raw, true);
    if (!is_array($scoped_listing_keys) || !$scoped_listing_keys || count($scoped_listing_keys) !== count(array_unique(array_map('strval', $scoped_listing_keys)))) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_LISTING_KEYS must be a non-empty unique JSON array.');
    }
    $scoped_listing_keys = array_values(array_map('strval', $scoped_listing_keys));
}
$by_name = [];
foreach ($fields as $field) {
    if (empty($field['fieldName'])) { continue; }
    $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
    if ($scoped_product_keys !== null && !in_array($key, $scoped_product_keys, true)) { continue; }
    if ($scoped_content_keys !== null && !in_array($key, $scoped_content_keys, true)) { continue; }
    $by_name[$field['fieldName']] = $field;
}
foreach ($scoped_content_records as $field) {
    $by_name[$field['fieldName']] = $field;
}

$summary = ['options' => 0, 'attachments' => 0, 'pages' => 0, 'posts' => 0, 'menus' => 0, 'mediaGaps' => []];
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
function ra_has_populated_value($value): bool {
    if (is_array($value)) {
        foreach ($value as $item) {
            if (ra_has_populated_value($item)) { return true; }
        }
        return false;
    }
    return !($value === null || $value === '' || $value === false);
}
function ra_is_populated_option(string $name): bool {
    return ra_has_populated_value(get_field($name, 'option'));
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
        $summary['mediaGaps'][] = ['field' => $field_name, 'asset' => $source_relative];
        return 0;
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

function ra_import_product_list_filters_icon(string $snapshot): void {
    $field = 'emko_product_list_filters_button_icon_125_3007';
    $source_node = '125:3007';
    $attachment_id = ra_import_attachment($snapshot, 'assets/product-list-filters/search-arrow-125-3007.svg', $field);
    if (!$attachment_id) { return; }
    update_post_meta($attachment_id, '_rudnikagro_source_node', $source_node);
    update_post_meta($attachment_id, 'data-factory-source-node', $source_node);
    update_post_meta($attachment_id, 'data-factory-section', 'product-list-filters');
    $current = (int) get_option('options_' . $field, 0);
    if ($current === 0) {
        update_option('options_' . $field, $attachment_id, false);
        update_option('_rudnikagro_last_imported_option_' . $field, $attachment_id, false);
        $GLOBALS['summary']['options']++;
    }
    if (get_option('_rudnikagro_source_option_' . $field, '') === '') {
        update_option('_rudnikagro_source_option_' . $field, 'pl:' . $source_node . ':' . $field, false);
    }
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
function ra_update_owned_native_option(string $field_name, $value): void {
    global $summary;
    if ($value === '' || $value === null) { return; }
    $option_name = 'options_' . $field_name;
    $current = get_option($option_name, null);
    $last_key = '_rudnikagro_last_imported_option_' . $field_name;
    $last = get_option($last_key, null);
    if ($current === null || $current === '' || ($last !== null && (string) $current === (string) $last)) {
        update_option($option_name, $value, false);
        update_option($last_key, $value, false);
        $summary['options']++;
    }
}
function ra_import_product_detail_content(string $snapshot): void {
    $image_field = 'emko_product_detail_image_125_3212';
    $image_id = ra_import_attachment($snapshot, 'assets/product-detail/product-image-125-3212.png', $image_field);
    if ($image_id) {
        update_post_meta($image_id, '_rudnikagro_source_node', '125:3212');
        update_post_meta($image_id, 'data-factory-source-node', '125:3212');
        update_post_meta($image_id, 'data-factory-section', 'product-detail');
        ra_update_owned_native_option($image_field, $image_id);
    }

    ra_update_owned_native_option('emko_product_detail_title_125_3430', 'Cylindry 700bar - obniżone CMP');
    ra_update_owned_native_option('emko_product_detail_contact_label_125_3437', 'Zapytaj o ofertę');
    ra_update_owned_native_option('emko_product_detail_download_label_125_3433', 'Karta produktu do pobrania');
    ra_update_owned_native_option('emko_product_detail_benefits_heading_125_3439', 'Zalety serii');
    $download_icon_id = ra_import_attachment($snapshot, 'assets/catalogues-secondary/pdf-125-2563.png', 'emko_product_detail_download_icon_125_3434');
    if ($download_icon_id) {
        update_post_meta($download_icon_id, '_rudnikagro_source_node', '125:3434');
        update_post_meta($download_icon_id, 'data-factory-source-node', '125:3434');
        update_post_meta($download_icon_id, 'data-factory-section', 'product-detail');
        ra_update_owned_native_option('emko_product_detail_download_icon_125_3434', $download_icon_id);
    }

    // These two visible canvas text records were backfilled by the frozen
    // product-detail source record. Keep the copy native and editor-overridable
    // even though Figma did not emit them into content-map.json.
    ra_update_owned_native_option(
        'emko_product_detail_description_125_3431',
        'Cylindry hydrauliczne to elementy układów hydraulicznych, które zamieniają energię cieczy pod ciśnieniem na ruch liniowy i siłę mechaniczną. Wykorzystywane są m.in. w maszynach przemysłowych, budowlanych i rolniczych do podnoszenia, dociskania lub przesuwania ciężkich elementów. Składają się z tłoka, tłoczyska i korpusu, a ich parametry, takie jak siła i skok, dobiera się w zależności od zastosowania.'
    );
    ra_update_owned_native_option(
        'emko_product_detail_features_125_3440',
        'niski, kompaktowy profil korpusu, antyślizgowa końcówka tłoczyska tłoczysko cofane sprężyną - praca w dowolnej pozycji, szybkozłączka żeńska w standardzie. pierścień zbierający zanieczyszczenia z tłoczyska możliwość zastosowania nasadki wahliwej opcjonalna modyfikacja na życzenie: otwory montażowe w podstawie'
    );
}
function ra_import_product_gallery_content(string $snapshot): void {
    $assets = [
        ['field' => 'emko_product_gallery_image_1_125_3214', 'node' => '125:3214', 'path' => 'assets/product-gallery/gallery-image-125-3214.png'],
        ['field' => 'emko_product_gallery_image_2_125_3216', 'node' => '125:3216', 'path' => 'assets/product-gallery/gallery-image-125-3216.png'],
    ];
    foreach ($assets as $asset) {
        $attachment_id = ra_import_attachment($snapshot, $asset['path'], $asset['field']);
        if (!$attachment_id) { continue; }
        update_post_meta($attachment_id, '_rudnikagro_source_node', $asset['node']);
        update_post_meta($attachment_id, 'data-factory-source-node', $asset['node']);
        update_post_meta($attachment_id, 'data-factory-section', 'product-gallery');
        ra_update_owned_native_option($asset['field'], $attachment_id);
    }
}
function ra_import_home_blog_records(array $by_name, string $snapshot, int $home_id): void {
    $cards = [
        1 => ['node' => '125:1633', 'image' => 'assets/home-blog/card-image-125-1633.png'],
        2 => ['node' => '125:1638', 'image' => 'assets/home-blog/card-image-125-1638.png'],
        3 => ['node' => '125:1643', 'image' => 'assets/home-blog/card-image-125-1643.png'],
        4 => ['node' => '125:1648', 'image' => 'assets/home-blog/card-image-125-1648.png'],
    ];
    foreach (['heading' => 'emko_home_blog_heading_125_1652', 'intro' => 'emko_home_blog_intro_125_1653', 'all_label' => 'emko_home_blog_all_label_125_1655'] as $key => $field_name) {
        $value = ra_string_source($by_name, $field_name);
        if ($value !== '') { ra_update_owned_native_option($field_name, $value); }
    }
    $arrow_id = ra_import_attachment($snapshot, 'assets/home-blog/all-posts-arrow-125-1657.svg', 'emko_home_blog_all_arrow_125_1657');
    update_post_meta($arrow_id, '_rudnikagro_source_node', '125:1657');
    update_post_meta($arrow_id, 'data-factory-source-node', '125:1657');
    update_post_meta($arrow_id, 'data-factory-section', 'home-blog');
    ra_update_owned_native_option('emko_home_blog_all_arrow_125_1657', $arrow_id);

    $post_ids = [];
    foreach ($cards as $index => $card) {
        $title = ra_string_source($by_name, 'emko_home_blog_card_' . $index . '_title_125_' . ($index === 1 ? '1634' : ($index === 2 ? '1639' : ($index === 3 ? '1644' : '1649'))));
        $excerpt = ra_string_source($by_name, 'emko_home_blog_card_' . $index . '_excerpt_125_' . ($index === 1 ? '1635' : ($index === 2 ? '1640' : ($index === 3 ? '1645' : '1650'))));
        $date = ra_string_source($by_name, 'emko_home_blog_card_' . $index . '_date_125_' . ($index === 1 ? '1636' : ($index === 2 ? '1641' : ($index === 3 ? '1646' : '1651'))));
        if ($title === '' || $date === '') { continue; }
        $identity = 'home-blog-card-' . $index;
        $existing = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => $identity, 'fields' => 'ids', 'numberposts' => 1]);
        $post_id = $existing ? (int) $existing[0] : ra_owned_post([
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_title' => $title,
            'post_excerpt' => $excerpt,
            'post_name' => sanitize_title($title),
        ], $identity);
        $last_title = (string) get_post_meta($post_id, '_rudnikagro_last_imported_home_blog_title', true);
        $current_title = (string) get_the_title($post_id);
        if ($current_title === '' || ($last_title !== '' && $current_title === $last_title)) {
            if ($current_title !== $title) { wp_update_post(['ID' => $post_id, 'post_title' => $title]); }
            update_post_meta($post_id, '_rudnikagro_last_imported_home_blog_title', $title);
        }
        $last_excerpt = (string) get_post_meta($post_id, '_rudnikagro_last_imported_home_blog_excerpt', true);
        $current_excerpt = (string) get_post_field('post_excerpt', $post_id);
        if ($current_excerpt === '' || ($last_excerpt !== '' && $current_excerpt === $last_excerpt)) {
            if ($current_excerpt !== $excerpt) { wp_update_post(['ID' => $post_id, 'post_excerpt' => $excerpt]); }
            update_post_meta($post_id, '_rudnikagro_last_imported_home_blog_excerpt', $excerpt);
        }
        update_post_meta($post_id, '_rudnikagro_home_blog_source_order', $index);
        update_post_meta($post_id, '_rudnikagro_home_blog_source_node', $card['node']);
        update_post_meta($post_id, '_rudnikagro_source_section', 'home-blog');
        $date_current = function_exists('get_field') ? (string) get_field('rudnikagro_blog_card_date', $post_id) : '';
        $date_last = (string) get_post_meta($post_id, '_rudnikagro_last_imported_home_blog_date', true);
        if ($date_current === '' || ($date_last !== '' && $date_current === $date_last)) {
            if (function_exists('update_field')) { update_field('field_ra_blog_card_date', $date, $post_id); }
            update_post_meta($post_id, '_rudnikagro_last_imported_home_blog_date', $date);
        }
        $image_id = ra_import_attachment($snapshot, $card['image'], 'emko_home_blog_card_' . $index . '_image_' . str_replace(':', '_', $card['node']));
        update_post_meta($image_id, '_rudnikagro_source_node', $card['node']);
        update_post_meta($image_id, 'data-factory-source-node', $card['node']);
        update_post_meta($image_id, 'data-factory-section', 'home-blog');
        $current_image = function_exists('get_field') ? (int) get_field('rudnikagro_blog_card_image', $post_id) : 0;
        $last_image = (int) get_post_meta($post_id, '_rudnikagro_last_imported_home_blog_image', true);
        if ($current_image === 0 || ($last_image !== 0 && $current_image === $last_image)) {
            if (function_exists('update_field')) { update_field('field_ra_blog_card_image', $image_id, $post_id); }
            update_post_meta($post_id, '_rudnikagro_last_imported_home_blog_image', $image_id);
        }
        $post_ids[] = $post_id;
    }
    if ($home_id && $post_ids && function_exists('get_field') && function_exists('update_field')) {
        $home_blog = (array) get_field('rudnikagro_home_blog', $home_id);
        if (empty($home_blog['posts'])) {
            $home_blog['posts'] = $post_ids;
            update_field('field_ra_home_blog', $home_blog, $home_id);
        }
    }
}
function ra_import_shared_header_assets(string $snapshot): void {
    $assets = [
        ['field_ra_header_logo', 'rudnikagro_shared_primary_navigation_media_118_6', 'assets/shared-header/logo-125-17.png', '125:17'],
        ['field_ra_phone_icon', 'rudnikagro_shared_secondary_navigation_media_347_1077', 'assets/shared-header/telephone-icon-125-15.png', '125:15'],
        ['rudnikagro_shared_header_mobile_icon_125_14', 'rudnikagro_shared_header_mobile_icon_125_14', 'assets/shared-header/mobile-icon-125-14.png', '125:14'],
        ['field_ra_mail_icon', 'rudnikagro_shared_secondary_navigation_media_347_1078', 'assets/shared-header/email-icon-125-16.png', '125:16'],
    ];
    foreach ($assets as [$field_key, $field_name, $asset, $source_node]) {
        $attachment_id = ra_import_attachment($snapshot, $asset, $field_name);
        update_post_meta($attachment_id, '_rudnikagro_source_node', $source_node);
        update_post_meta($attachment_id, 'data-factory-source-node', $source_node);
        update_post_meta($attachment_id, 'data-factory-section', 'shared-header');
        if ($field_key === $field_name) {
            ra_update_owned_native_option($field_name, $attachment_id);
        } else {
            ra_update_owned_option($field_key, $field_name, $attachment_id);
        }
    }
}
function ra_import_shared_header_content(array $by_name): void {
    $targets = [
        'rudnikagro_shared_header_tagline_125_10' => 'rudnikagro_shared_header_tagline_125_10',
        'rudnikagro_shared_header_phone_125_11' => 'rudnikagro_shared_secondary_navigation_156_92',
        'rudnikagro_shared_header_mobile_125_12' => 'rudnikagro_shared_header_mobile_125_12',
        'rudnikagro_shared_header_email_125_13' => 'rudnikagro_shared_secondary_navigation_93_31',
        'rudnikagro_shared_header_primary_navigation_125_5' => 'rudnikagro_shared_primary_navigation_93_29',
    ];
    foreach ($targets as $source_name => $target_name) {
        $record = ra_source_field($by_name, $source_name);
        if (!is_array($record) || !array_key_exists('value', $record)) { continue; }
        $value = $record['value'];
        if (is_array($value)) { $value = implode("\n", array_map('strval', $value)); }
        if (!is_string($value) || $value === '') { continue; }
        $target = ra_scoped_content_target($source_name);
        $field_key = $target['key'] !== '' ? $target['key'] : $target['field'];
        ra_update_owned_option($field_key, $target['field'], ra_repair_source_encoding($value));
    }
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

function ra_import_scoped_product_list_items(array $by_name, string $snapshot, array $source_keys): array {
    global $summary;
    $selected = [];
    foreach ($by_name as $field) {
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
        if (in_array($key, $source_keys, true)) { $selected[$key] = $field; }
    }
    if (count($selected) !== count($source_keys)) { throw new RuntimeException('Scoped product batch has a missing source key.'); }
    if (!function_exists('wc_get_product')) { throw new RuntimeException('WooCommerce is required for native product import.'); }

    $arrow_id = ra_import_attachment($snapshot, 'assets/product-list-items/details-arrow-125-2895.svg', 'rudnikagro_product_list_item_cta_arrow_125_2895');
    if ($arrow_id) {
        update_post_meta($arrow_id, '_rudnikagro_source_node', '125:2895');
        update_post_meta($arrow_id, 'data-factory-source-node', '125:2895');
        update_post_meta($arrow_id, 'data-factory-section', 'product-list-items');
        ra_update_owned_native_option('rudnikagro_product_list_item_cta_arrow_125_2895', $arrow_id);
    }

    $result = [];
    foreach ($source_keys as $source_key) {
        $field = $selected[$source_key];
        if (($field['section'] ?? '') !== 'product-list-items' || ($field['type'] ?? '') !== 'product') {
            throw new RuntimeException('Unsupported scoped product section: ' . $source_key);
        }
        $source_node = (string) ($field['nodeId'] ?? '');
        $source = (array) ($field['value'] ?? []);
        $title = trim(ra_repair_source_encoding((string) ($source['title'] ?? '')));
        $description = trim(ra_repair_source_encoding((string) ($source['description'] ?? '')));
        $specifications = array_values(array_filter(array_map(static fn($value): string => trim(ra_repair_source_encoding((string) $value)), (array) ($source['specifications'] ?? []))));
        $cta = (array) ($source['cta'] ?? []);
        $cta_label = trim(ra_repair_source_encoding((string) ($cta['label'] ?? '')));
        $cta_source_node = (string) ($cta['sourceNodeId'] ?? '');
        $asset = (string) (($source['media']['path'] ?? ''));
        $media_source_node = (string) (($source['media']['sourceNodeId'] ?? ''));
        if ($source_node === '' || $title === '' || $asset === '' || $media_source_node === '') {
            throw new RuntimeException('Scoped product source record is incomplete: ' . $source_key);
        }

        $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_key', 'meta_value' => $source_key, 'fields' => 'ids', 'numberposts' => 1]);
        if (!$existing) { $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $source_node, 'fields' => 'ids', 'numberposts' => 1]); }
        $product_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title)], true);
        if (!$product_id || is_wp_error($product_id)) { throw new RuntimeException('Cannot create scoped product: ' . $source_key); }
        update_post_meta($product_id, '_rudnikagro_source_node', $source_node);
        update_post_meta($product_id, '_rudnikagro_source_key', $source_key);
        update_post_meta($product_id, '_rudnikagro_source_section', 'product-list-items');
        update_post_meta($product_id, '_rudnikagro_owned', '1');
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-list-items');

        $last_title = (string) get_post_meta($product_id, '_rudnikagro_last_imported_title', true);
        if ($last_title === '' || get_the_title($product_id) === $last_title) {
            wp_update_post(['ID' => $product_id, 'post_title' => $title]);
            update_post_meta($product_id, '_rudnikagro_last_imported_title', $title);
        }
        if ($description !== '' && ra_owned_meta_can_update($product_id, '_excerpt', $description)) {
            wp_update_post(['ID' => $product_id, 'post_excerpt' => $description]);
            update_post_meta($product_id, '_rudnikagro_last_imported_excerpt', $description);
        }

        if (function_exists('get_field') && function_exists('update_field')) {
            $content = (array) get_field('rudnikagro_product_content', $product_id);
            $last_content = json_decode((string) get_post_meta($product_id, '_rudnikagro_last_imported_product_list_content', true), true);
            $changed = false;
            $description_html = $description === '' ? '' : wpautop(esc_html($description));
            if ($description_html !== '' && (($content['description'] ?? '') === '' || (($last_content['description'] ?? null) !== null && ($content['description'] ?? '') === ($last_content['description'] ?? null)))) {
                $content['description'] = $description_html;
                $changed = true;
            }
            $technical = [];
            foreach ($specifications as $specification) {
                [$label, $value] = array_pad(explode(':', $specification, 2), 2, '');
                $technical[] = ['label' => trim($label), 'value' => trim($value) !== '' ? trim($value) : trim($label)];
            }
            if ($changed) {
                update_field('field_ra_product_content', $content, $product_id);
                update_post_meta($product_id, '_rudnikagro_last_imported_product_list_content', wp_json_encode(['description' => $content['description'] ?? ''], JSON_UNESCAPED_UNICODE));
            }
            if ($technical) {
                $current_technical = (array) get_field('rudnikagro_product_technical_data', $product_id);
                $last_technical = json_decode((string) get_post_meta($product_id, '_rudnikagro_last_imported_product_list_technical', true), true);
                if (!$current_technical || ($last_technical !== null && $current_technical === $last_technical)) {
                    update_field('field_ra_product_technical', $technical, $product_id);
                    update_post_meta($product_id, '_rudnikagro_last_imported_product_list_technical', wp_json_encode($technical, JSON_UNESCAPED_UNICODE));
                }
            }
        }
        if ($cta_label !== '' && ra_owned_meta_can_update($product_id, '_rudnikagro_source_cta_label', $cta_label)) {
            update_post_meta($product_id, '_rudnikagro_source_cta_label', $cta_label);
            update_post_meta($product_id, '_rudnikagro_last_imported_source_cta_label', $cta_label);
        }
        if ($cta_source_node !== '') { update_post_meta($product_id, '_rudnikagro_source_cta_node', $cta_source_node); }

        $image_field = 'rudnikagro_product_list_item_media_' . str_replace(':', '_', $source_node);
        $image_id = ra_import_attachment($snapshot, $asset, $image_field);
        update_post_meta($image_id, '_rudnikagro_source_node', $media_source_node);
        update_post_meta($image_id, 'data-factory-source-node', $media_source_node);
        update_post_meta($image_id, 'data-factory-section', 'product-list-items');
        $current_image = (int) get_post_thumbnail_id($product_id);
        $last_image = (int) get_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_image || ($last_image && $current_image === $last_image)) {
            set_post_thumbnail($product_id, $image_id);
            update_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', $image_id);
        }
        $summary['products'] = ($summary['products'] ?? 0) + 1;
        $result[] = ['key' => $source_key, 'id' => $product_id, 'sourceNode' => $source_node, 'mediaSourceNode' => $media_source_node, 'price' => null];
    }
    return $result;
}

function ra_import_scoped_product_list_demo_clones(array $plans): array {
    global $summary;
    if (!$plans || !function_exists('wc_get_product')) { return []; }
    $result = [];
    foreach ($plans as $index => $plan) {
        $import_key = trim((string) ($plan['importKey'] ?? ''));
        $clone_of = trim((string) ($plan['cloneOf'] ?? ''));
        $source_id = trim((string) ($plan['sourceId'] ?? ''));
        if ($import_key === '' || empty($plan['demo']) || ($plan['owner'] ?? '') !== 'product-list-items' || $clone_of === '' || $source_id === '') {
            throw new RuntimeException('Invalid policy-planned product demo clone.');
        }
        $source_ids = get_posts([
            'post_type' => 'product',
            'post_status' => 'any',
            'meta_key' => '_rudnikagro_source_node',
            'meta_value' => $clone_of,
            'fields' => 'ids',
            'numberposts' => 1,
            'orderby' => 'ID',
            'order' => 'ASC',
        ]);
        if (!$source_ids) { throw new RuntimeException('Product demo clone source is unavailable: ' . $clone_of); }
        $source_product_id = (int) $source_ids[0];
        $existing = get_posts([
            'post_type' => 'product',
            'post_status' => 'any',
            'meta_key' => '_rudnikagro_demo_import_key',
            'meta_value' => $import_key,
            'fields' => 'ids',
            'numberposts' => 1,
        ]);
        $clone_id = $existing ? (int) $existing[0] : (int) wp_insert_post([
            'post_type' => 'product',
            'post_status' => 'publish',
            'post_title' => get_the_title($source_product_id),
            'post_name' => sanitize_title(get_the_title($source_product_id) . '-' . ($index + 1)),
            'menu_order' => 4 + (int) $index,
        ], true);
        if (!$clone_id || is_wp_error($clone_id)) { throw new RuntimeException('Cannot create product demo clone: ' . $import_key); }
        if (!$existing) {
            wp_update_post([
                'ID' => $clone_id,
                'post_excerpt' => get_post_field('post_excerpt', $source_product_id),
                'menu_order' => 4 + (int) $index,
            ]);
            if (function_exists('get_field') && function_exists('update_field')) {
                $content = get_field('rudnikagro_product_content', $source_product_id);
                $technical = get_field('rudnikagro_product_technical_data', $source_product_id);
                if ($content !== null) { update_field('field_ra_product_content', $content, $clone_id); }
                if ($technical !== null) { update_field('field_ra_product_technical', $technical, $clone_id); }
            }
            $thumbnail_id = (int) get_post_thumbnail_id($source_product_id);
            if ($thumbnail_id) { set_post_thumbnail($clone_id, $thumbnail_id); }
            $summary['products'] = ($summary['products'] ?? 0) + 1;
        }
        foreach (['_rudnikagro_source_cta_label', '_rudnikagro_source_cta_node'] as $meta_key) {
            update_post_meta($clone_id, $meta_key, (string) get_post_meta($source_product_id, $meta_key, true));
        }
        update_post_meta($clone_id, '_rudnikagro_source_node', $clone_of);
        update_post_meta($clone_id, '_rudnikagro_source_section', 'product-list-items');
        update_post_meta($clone_id, '_rudnikagro_route_id', 'product-list-items');
        update_post_meta($clone_id, '_rudnikagro_owned', '1');
        update_post_meta($clone_id, '_rudnikagro_demo_import_key', $import_key);
        update_post_meta($clone_id, '_rudnikagro_demo_clone_of', $clone_of);
        update_post_meta($clone_id, '_rudnikagro_demo_source_node', $source_id);
        update_post_meta($clone_id, '_rudnikagro_demo_owner', 'product-list-items');
        update_post_meta($clone_id, '_rudnikagro_demo_clone', '1');
        $result[] = ['importKey' => $import_key, 'id' => $clone_id, 'cloneOf' => $clone_of, 'sourceId' => $source_id];
    }
    return $result;
}

function ra_import_scoped_products(array $by_name, string $snapshot, array $source_keys, array $demo_plans = []): array {
    $groups = [];
    foreach ($by_name as $field) {
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
        if (in_array($key, $source_keys, true)) { $groups[(string) ($field['section'] ?? '')][] = $key; }
    }
    if (count(array_unique(array_merge(...array_values($groups ?: [[]])))) !== count($source_keys)) {
        throw new RuntimeException('Scoped product batch has a missing source key.');
    }
    $result = [];
    foreach ($groups as $section => $keys) {
        if ($section === 'product-list-items') {
            $result = array_merge($result, ra_import_scoped_product_list_items($by_name, $snapshot, $keys));
            if ($demo_plans) {
                $GLOBALS['rudnikagro_product_demo_clone_result'] = ra_import_scoped_product_list_demo_clones($demo_plans);
            }
            continue;
        }
        if ($section === 'archive-product-grid') { $result = array_merge($result, ra_import_scoped_archive_products($by_name, $snapshot, $keys)); continue; }
        throw new RuntimeException('Unsupported scoped product section: ' . $section);
    }
    return $result;
}

/**
 * Bind an explicit product batch to the native product listing relation.
 * Product records must already exist; this path never falls back to import.
 */
function ra_bind_scoped_product_listing(array $by_name, array $source_keys): array {
    $selected = [];
    foreach ($by_name as $field) {
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
        if (in_array($key, $source_keys, true)) { $selected[$key] = $field; }
    }
    if (count($selected) !== count($source_keys)) { throw new RuntimeException('Scoped listing batch has a missing source key.'); }

    $product_ids = get_posts([
        'post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_key',
        'meta_compare' => 'EXISTS', 'fields' => 'ids', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC',
    ]);
    $by_key = [];
    foreach ($product_ids as $product_id) {
        $key = (string) get_post_meta((int) $product_id, '_rudnikagro_source_key', true);
        if ($key !== '') { $by_key[$key] = (int) $product_id; }
    }

    $assigned_ids = [];
    foreach ($source_keys as $source_key) {
        $field = $selected[$source_key];
        if (($field['section'] ?? '') !== 'product-list-items' || ($field['type'] ?? '') !== 'product') {
            throw new RuntimeException('Unsupported scoped listing record: ' . $source_key);
        }
        if (empty($by_key[$source_key])) { throw new RuntimeException('Scoped listing product is not imported: ' . $source_key); }
        $assigned_ids[$source_key] = (int) $by_key[$source_key];
    }

    $siblings = get_posts([
        'post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id',
        'meta_value' => 'product-list-items', 'fields' => 'ids', 'numberposts' => -1,
        'orderby' => 'menu_order', 'order' => 'ASC',
    ]);
    $assigned_lookup = array_fill_keys(array_values($assigned_ids), true);
    $other_ids = array_values(array_filter(array_map('intval', $siblings), static fn(int $id): bool => !isset($assigned_lookup[$id])));
    $other_orders = array_map(static fn(int $id): int => (int) get_post_field('menu_order', $id), $other_ids);
    $next_order = $other_orders ? max(count($other_ids), max($other_orders) + 1) : 0;
    $reserved_orders = array_fill_keys($other_orders, true);
    $result = [];
    foreach ($source_keys as $source_key) {
        $product_id = $assigned_ids[$source_key];
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-list-items');
        $current_order = (int) get_post_field('menu_order', $product_id);
        $last_order = get_post_meta($product_id, '_rudnikagro_last_imported_listing_order', true);
        $preserved_override = ($last_order !== '' && (string) $current_order !== (string) $last_order)
            || ($last_order === '' && $current_order !== 0);
        $can_set_order = !$preserved_override;
        if ($can_set_order) {
            while (isset($reserved_orders[$next_order])) { $next_order++; }
            $current_order = $next_order++;
            wp_update_post(['ID' => $product_id, 'menu_order' => $current_order]);
            update_post_meta($product_id, '_rudnikagro_last_imported_listing_order', $current_order);
            $reserved_orders[$current_order] = true;
        }
        $result[] = [
            'key' => $source_key,
            'id' => $product_id,
            'route' => 'product-list-items',
            'menuOrder' => $current_order,
            'preservedOverride' => $preserved_override,
        ];
    }
    return $result;
}

if ($scoped_product_keys !== null) {
    $scoped_import = ra_import_scoped_products($by_name, $snapshot, $scoped_product_keys, $product_demo_clones);
    echo wp_json_encode([
        'rudnikagro_scoped_import' => $scoped_import,
        'productDemoClones' => $GLOBALS['rudnikagro_product_demo_clone_result'] ?? [],
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit;
}
if ($scoped_listing_keys !== null) {
    $scoped_listing = ra_bind_scoped_product_listing($by_name, $scoped_listing_keys);
    echo wp_json_encode(['rudnikagro_scoped_listing_bind' => $scoped_listing], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit;
}
$should_import_shared_header = $scoped_content_keys === null;
if (is_array($scoped_content_keys)) {
    foreach ($scoped_content_keys as $key) {
        if (str_contains((string) $key, ':rudnikagro_shared_header_')) {
            $should_import_shared_header = true;
            break;
        }
    }
}
if ($should_import_shared_header) {
    ra_import_shared_header_content($by_name);
    ra_import_shared_header_assets($snapshot);
}
if ($scoped_content_keys !== null) { ra_import_scoped_content($by_name, $scoped_content_keys, $snapshot); exit; }

/**
 * Import the five native products shown by the current product-related source.
 * The section has no price/category/variation facts, so only source-backed
 * title, short description and media are imported.
 */
function ra_import_product_related_cards(array $fields, string $snapshot): array {
    global $summary;
    if (!function_exists('wc_get_product')) { return []; }
    $cards = [
        ['titleNode' => '125:3287', 'descriptionNode' => '125:3293', 'imageNode' => '125:3274'],
        ['titleNode' => '125:3285', 'descriptionNode' => '125:3291', 'imageNode' => '125:3276'],
        ['titleNode' => '125:3286', 'descriptionNode' => '125:3292', 'imageNode' => '125:3273'],
        ['titleNode' => '125:3288', 'descriptionNode' => '125:3294', 'imageNode' => '125:3289'],
        ['titleNode' => '125:3290', 'descriptionNode' => '125:3295', 'imageNode' => '125:3275'],
    ];
    $by_node = [];
    foreach ($fields as $field) {
        $node = (string) ($field['nodeId'] ?? '');
        if ($node !== '') { $by_node[$node] = $field; }
    }
    $related_ids = [];
    foreach ($cards as $index => $card) {
        $title = trim(ra_repair_source_encoding((string) ($by_node[$card['titleNode']]['value'] ?? '')));
        $description = ra_repair_source_encoding((string) ($by_node[$card['descriptionNode']]['value'] ?? ''));
        $media = (array) (($by_node[$card['imageNode']]['value']['media'] ?? []));
        $asset = (string) ($media['path'] ?? '');
        $media_source_node = (string) ($media['sourceNodeId'] ?? '');
        if ($title === '' || $asset === '' || $media_source_node === '') { continue; }

        $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $card['titleNode'], 'fields' => 'ids', 'numberposts' => 1]);
        $product_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title . '-' . ($index + 1))], true);
        if (!$product_id || is_wp_error($product_id)) { continue; }
        update_post_meta($product_id, '_rudnikagro_source_node', $card['titleNode']);
        update_post_meta($product_id, '_rudnikagro_source_section', 'product-related');
        update_post_meta($product_id, '_rudnikagro_owned', '1');
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-related');

        $last_title = (string) get_post_meta($product_id, '_rudnikagro_last_imported_title', true);
        if ($last_title === '' || get_the_title($product_id) === $last_title) {
            wp_update_post(['ID' => $product_id, 'post_title' => $title]);
            update_post_meta($product_id, '_rudnikagro_last_imported_title', $title);
        }
        $last_description = (string) get_post_meta($product_id, '_rudnikagro_last_imported_excerpt', true);
        $current_description = (string) get_post_field('post_excerpt', $product_id);
        if ($description !== '' && ($current_description === '' || ($last_description !== '' && $current_description === $last_description))) {
            wp_update_post(['ID' => $product_id, 'post_excerpt' => $description]);
            update_post_meta($product_id, '_rudnikagro_last_imported_excerpt', $description);
        }

        $image_field = 'emko_product_related_image_' . str_replace(':', '_', $media_source_node);
        $image_id = ra_import_attachment($snapshot, $asset, $image_field);
        update_post_meta($image_id, '_rudnikagro_source_node', $media_source_node);
        update_post_meta($image_id, 'data-factory-source-node', $media_source_node);
        $current_image = (int) get_post_thumbnail_id($product_id);
        $last_image = (int) get_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_image || ($last_image && $current_image === $last_image)) {
            set_post_thumbnail($product_id, $image_id);
            update_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', $image_id);
        }
        $related_ids[] = $product_id;
        $summary['products'] = ($summary['products'] ?? 0) + 1;
    }

    if ($related_ids) {
        $targets = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'product', 'fields' => 'ids', 'numberposts' => 1]);
        foreach ($targets as $target_id) {
            $current_related = get_post_meta($target_id, '_upsell_ids', true);
            $last_related = get_post_meta($target_id, '_rudnikagro_last_imported_related_ids', true);
            if ($current_related === '' || $current_related === $last_related) {
                update_post_meta($target_id, '_upsell_ids', $related_ids);
                update_post_meta($target_id, '_rudnikagro_last_imported_related_ids', $related_ids);
            }
        }
    }
    return $related_ids;
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

/**
 * Import only the explicit archive-product keys supplied by the Factory batch.
 * The normal importer below remains available for the legacy full-site command,
 * but a scoped invocation exits before any unrelated source records are read.
 */
function ra_import_scoped_archive_products(array $by_name, string $snapshot, array $source_keys): array {
    global $summary;
    $wanted = array_fill_keys($source_keys, true);
    $selected = [];
    foreach ($by_name as $field) {
        $key = implode(':', [
            (string) ($field['language'] ?? 'pl'),
            (string) ($field['nodeId'] ?? ''),
            (string) ($field['fieldName'] ?? ''),
        ]);
        if (isset($wanted[$key])) { $selected[$key] = $field; }
    }
    if (count($selected) !== count($source_keys)) {
        throw new RuntimeException('Scoped product batch has a missing source key.');
    }

    $parent_term = term_exists('Środki ochrony roślin', 'product_cat');
    if (!$parent_term) { $parent_term = wp_insert_term('Środki ochrony roślin', 'product_cat'); }
    $parent_term_id = !is_wp_error($parent_term) ? (int) (is_array($parent_term) ? $parent_term['term_id'] : $parent_term) : 0;
    $fungicides = term_exists('Fungicydy', 'product_cat');
    if (!$fungicides) { $fungicides = wp_insert_term('Fungicydy', 'product_cat', ['parent' => $parent_term_id]); }
    $fungicides_id = !is_wp_error($fungicides) ? (int) (is_array($fungicides) ? $fungicides['term_id'] : $fungicides) : 0;
    if ($fungicides_id && $parent_term_id && (int) get_term($fungicides_id, 'product_cat')->parent === 0) {
        wp_update_term($fungicides_id, 'product_cat', ['parent' => $parent_term_id]);
    }

    $result = [];
    foreach ($source_keys as $source_key) {
        $field = $selected[$source_key];
        $source_node = (string) ($field['nodeId'] ?? '');
        $source = (array) ($field['value'] ?? []);
        $title = trim(ra_repair_source_encoding((string) ($source['title'] ?? '')));
        $raw_price = ra_repair_source_encoding((string) ($source['price'] ?? ''));
        $price_value = ra_source_price($raw_price);
        $price = $price_value === null ? null : number_format($price_value, 2, '.', '');
        $asset = (string) (($source['media']['path'] ?? ''));
        $media_source_node = (string) (($source['media']['sourceNodeId'] ?? ''));
        if ($source_node === '' || $title === '' || $price === null || $asset === '' || $media_source_node === '') {
            throw new RuntimeException('Scoped product source record is incomplete: ' . $source_key);
        }

        $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $source_node, 'fields' => 'ids', 'numberposts' => 1]);
        $product_id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => sanitize_title($title)], true);
        if (!$product_id || is_wp_error($product_id)) { throw new RuntimeException('Cannot create scoped product: ' . $source_key); }
        update_post_meta($product_id, '_rudnikagro_source_node', $source_node);
        update_post_meta($product_id, '_rudnikagro_source_key', $source_key);
        update_post_meta($product_id, '_rudnikagro_owned', '1');
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-archive');
        $last_title = (string) get_post_meta($product_id, '_rudnikagro_last_imported_title', true);
        if ($last_title === '' || get_the_title($product_id) === $last_title) {
            wp_update_post(['ID' => $product_id, 'post_title' => $title]);
            update_post_meta($product_id, '_rudnikagro_last_imported_title', $title);
        }
        $native = wc_get_product($product_id);
        if (!$native) { throw new RuntimeException('WooCommerce product unavailable: ' . $source_key); }
        ra_set_owned_price($native, $price, ['sourceNode' => $source_node, 'sourcePrice' => $raw_price, 'provenance' => 'figma-explicit']);

        $image_field = 'rudnikagro_archive_card_' . str_replace(':', '_', $source_node);
        $image_id = ra_import_attachment($snapshot, $asset, $image_field);
        update_post_meta($image_id, '_rudnikagro_source_node', $media_source_node);
        update_post_meta($image_id, 'data-factory-source-node', $media_source_node);
        $current_image = (int) get_post_thumbnail_id($product_id);
        $last_image = (int) get_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', true);
        if (!$current_image || ($last_image && $current_image === $last_image)) {
            set_post_thumbnail($product_id, $image_id);
            update_post_meta($product_id, '_rudnikagro_last_imported_thumbnail_id', $image_id);
        }

        if ($fungicides_id) {
            $current_terms = array_map('intval', (array) wp_get_object_terms($product_id, 'product_cat', ['fields' => 'ids']));
            $last_terms = json_decode((string) get_post_meta($product_id, '_rudnikagro_last_imported_product_cat', true), true);
            if (!$current_terms || ($last_terms !== null && $current_terms === array_map('intval', (array) $last_terms))) {
                wp_set_object_terms($product_id, [$fungicides_id], 'product_cat');
                update_post_meta($product_id, '_rudnikagro_last_imported_product_cat', wp_json_encode([$fungicides_id]));
            }
        }
        $summary['products'] = ($summary['products'] ?? 0) + 1;
        $result[] = ['key' => $source_key, 'id' => $product_id, 'sourceNode' => $source_node, 'mediaSourceNode' => $media_source_node];
    }
    return $result;
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
    $raw_title = ra_first_section_value($fields, $section, '/(heading|title)$/');
    if ($raw_title === '' && isset($page_title_fields[$route])) { $raw_title = (string) (ra_source_field($by_name, $page_title_fields[$route])['value'] ?? ''); }
    if ($raw_title === '') { continue; }
    $title = ra_repair_source_encoding($raw_title);
    $page_ids[$route] = ra_owned_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => wp_strip_all_tags($title), 'post_name' => $page_paths[$route]], $route);
    $current_title = (string) get_post_field('post_title', $page_ids[$route]);
    $raw_title = wp_strip_all_tags($raw_title);
    $fixed_title = wp_strip_all_tags($title);
    $last_title = (string) get_post_meta($page_ids[$route], '_rudnikagro_last_imported_page_title', true);
    if ($current_title === $raw_title || ($last_title !== '' && $current_title === $last_title)) {
        if ($current_title !== $fixed_title) { wp_update_post(['ID' => $page_ids[$route], 'post_title' => $fixed_title]); }
        update_post_meta($page_ids[$route], '_rudnikagro_last_imported_page_title', $fixed_title);
    }
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

$home_record_id = !empty($page_ids['home']) ? (int) $page_ids['home'] : (int) get_option('page_on_front', 0);
ra_import_home_blog_records($by_name, $snapshot, $home_record_id);

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
function ra_scoped_content_target(string $source_name): array {
    if (preg_match('/^emko_product_list_filters_(heading|strength_label|strength_unit|strength_min|strength_max|extension_label|extension_unit|extension_min|extension_max|button)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => 'product-list-filters',
        ];
    }
    if (preg_match('/^emko_product_list_menu_(category_(?:[1-9]|arrow)|heading)_\d+_\d+$/', $source_name)) {
        $suffix = preg_replace('/^emko_product_list_menu_/', '', $source_name);
        $suffix = preg_replace('/_\d+_\d+$/', '', (string) $suffix);
        return [
            'field' => $source_name,
            'key' => 'field_ra_product_list_menu_' . $suffix,
            'storage' => 'acf',
            'identity' => 'product-list-menu',
        ];
    }
    if (preg_match('/^emko_product_(detail_(title|image|description|features|contact_label|download_label|download_icon|benefits_heading)|gallery_image_[12]|specification_(tabs|table_header|row_[1-8])|contact_cta_(background|arrow|heading|button_label))_\d+_\d+$/', $source_name, $matches)) {
        $prefix = (string) $matches[1];
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => str_starts_with($prefix, 'detail_') ? 'product-detail' : (str_starts_with($prefix, 'gallery_') ? 'product-gallery' : (str_starts_with($prefix, 'specification_') ? 'product-specification' : 'product-contact-cta')),
        ];
    }
    if (preg_match('/^emko_product_related_(heading|all_label|all_icon)_\d+_\d+$/', $source_name)) {
        $suffix = preg_replace('/^emko_product_related_/', '', $source_name);
        $suffix = preg_replace('/_\d+_\d+$/', '', (string) $suffix);
        return [
            'field' => $source_name,
            'key' => 'field_ra_product_related_' . $suffix,
            'storage' => 'acf',
            'identity' => 'product-related',
        ];
    }
    if (preg_match('/^emko_product_related_card_arrow_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => 'field_ra_product_related_card_arrow',
            'storage' => 'acf',
            'identity' => 'product-related-arrow-icon',
        ];
    }
    if (preg_match('/^emko_product_related_card_(\d+)_(image|title|description)_\d+_\d+$/', $source_name, $matches)) {
        $card = (int) $matches[1];
        $field = (string) $matches[2];
        return [
            'field' => $field === 'title' ? 'post_title' : ($field === 'description' ? 'post_excerpt' : 'post_thumbnail'),
            'key' => '',
            'storage' => $field === 'image' ? 'product-media' : 'product',
            'identity' => 'product-related-card-' . $card,
            'card' => $card,
        ];
    }
    if (preg_match('/^emko_about_hero_(background|pattern_a|pattern_b|body|image|title|button_label)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => 'source-key',
        ];
    }
    if (preg_match('/^emko_about_values_(image|pattern_a|pattern_b|pattern_mask)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => $source_name,
        ];
    }
    if (preg_match('/^emko_about_media_band_(intro_heading|body|heading|button_label)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => $source_name,
        ];
    }
    if (preg_match('/^emko_service_media_band_(image|mask)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => $source_name,
        ];
    }
    if (preg_match('/^emko_blog_post_article_body_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => 'blog-post-article',
        ];
    }
    if (preg_match('/^emko_blog_post_related_(heading|all_label|all_arrow)_\d+_\d+$/', $source_name)) {
        return [
            'field' => $source_name,
            'key' => '',
            'storage' => 'option',
            'identity' => 'blog-post-related',
        ];
    }
    if (preg_match('/^emko_blog_post_related_card_(\d+)_(image|title|excerpt|date)_\d+_\d+$/', $source_name, $matches)) {
        $field = (string) $matches[2];
        return [
            'field' => $field === 'title' ? 'post_title' : ($field === 'excerpt' ? 'post_excerpt' : ($field === 'date' ? 'rudnikagro_blog_card_date' : 'rudnikagro_blog_card_image')),
            'key' => $field === 'date' ? 'field_ra_blog_card_date' : ($field === 'image' ? 'field_ra_blog_card_image' : ''),
            'storage' => in_array($field, ['image', 'date'], true) ? 'post-acf' : 'post',
            'identity' => 'blog-post-related-card-' . (string) $matches[1],
        ];
    }
    if (preg_match('/^emko_catalogues_secondary_card_(\d+)_(title|download_label)_\d+_\d+$/', $source_name, $matches)) {
        $card = (int) $matches[1];
        $subfield = $matches[2] === 'download_label' ? 'download_label' : 'title';
        return [
            'field' => 'rudnikagro_catalogues_secondary_card_' . $card . '_' . $subfield,
            'key' => '',
            'storage' => 'option',
        ];
    }
    if (preg_match('/^emko_catalogues_primary_card_(\d+)_(title|download_label)_\d+_\d+$/', $source_name, $matches)) {
        $card = (int) $matches[1];
        $subfield = $matches[2] === 'download_label' ? 'pdf_label' : 'title';
        return [
            'field' => 'rudnikagro_catalogues[' . ($card - 1) . '].' . $subfield,
            'key' => 'field_ra_catalogues_cards',
            'storage' => 'post-acf',
            'identity' => 'catalogues-primary-card-' . $card,
            'page_route' => 'catalogues',
            'row' => $card - 1,
            'subfield' => $subfield,
        ];
    }
    if (preg_match('/^rudnikagro_blog_archive_card_(\d+)_(title|excerpt|meta)_\d+_\d+$/', $source_name, $matches)) {
        $field = (string) $matches[2];
        return [
            'field' => $field === 'title' ? 'post_title' : ($field === 'excerpt' ? 'post_excerpt' : 'rudnikagro_blog_card_date'),
            'key' => $field === 'meta' ? 'field_ra_blog_card_date' : '',
            'storage' => $field === 'meta' ? 'post-acf' : 'post',
            'identity' => 'blog-archive-card-' . (string) $matches[1],
        ];
    }
    if (str_starts_with($source_name, 'rudnikagro_shared_footer_')) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option'];
    }
    if (str_starts_with($source_name, 'emko_home_benefits_')) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option'];
    }
    if (str_starts_with($source_name, 'emko_home_popular_products_')) {
        $field_object = function_exists('get_field_object') ? get_field_object($source_name, 'option', false, false) : null;
        $key = is_array($field_object) ? (string) ($field_object['key'] ?? '') : '';
        return ['field' => $source_name, 'key' => $key, 'storage' => $key !== '' ? 'acf' : 'option'];
    }
    if (preg_match('/^emko_home_product_categories_item_[0-9]+_label_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => ''];
    }
    $targets = [
        'rudnikagro_shared_header_tagline_125_10' => ['field' => 'rudnikagro_shared_header_tagline_125_10', 'key' => '', 'storage' => 'option'],
        'rudnikagro_shared_header_phone_125_11' => ['field' => 'rudnikagro_shared_secondary_navigation_156_92', 'key' => 'field_ra_phone', 'storage' => 'acf'],
        'rudnikagro_shared_header_mobile_125_12' => ['field' => 'rudnikagro_shared_header_mobile_125_12', 'key' => '', 'storage' => 'option'],
        'rudnikagro_shared_header_email_125_13' => ['field' => 'rudnikagro_shared_secondary_navigation_93_31', 'key' => 'field_ra_email', 'storage' => 'acf'],
        'rudnikagro_shared_header_primary_navigation_125_5' => ['field' => 'rudnikagro_shared_primary_navigation_93_29', 'key' => 'field_ra_primary_source', 'storage' => 'acf'],
    ];
    return $targets[$source_name] ?? ['field' => $source_name, 'key' => '', 'storage' => 'option'];
}
function ra_scoped_catalogues_page_id(): int {
    $existing = get_posts(['post_type' => 'page', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'catalogues', 'fields' => 'ids', 'numberposts' => 1]);
    if ($existing) { return (int) $existing[0]; }
    $page = get_page_by_path('katalogi', OBJECT, 'page');
    if ($page) {
        update_post_meta($page->ID, '_rudnikagro_route_id', 'catalogues');
        update_post_meta($page->ID, '_rudnikagro_owned', '1');
        return (int) $page->ID;
    }
    $page_id = wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Katalogi', 'post_name' => 'katalogi'], true);
    if (is_wp_error($page_id) || !$page_id) { throw new RuntimeException('Cannot create the native catalogues page.'); }
    update_post_meta($page_id, '_rudnikagro_route_id', 'catalogues');
    update_post_meta($page_id, '_rudnikagro_owned', '1');
    return (int) $page_id;
}
function ra_scoped_content_value($value): string {
    if (is_array($value)) { $value = implode("\n", array_map('strval', $value)); }
    return ra_repair_source_encoding(is_scalar($value) ? (string) $value : '');
}
function ra_scoped_media_source(array $record): array {
    $media = is_array($record['value'] ?? null) && is_array($record['value']['media'] ?? null) ? $record['value']['media'] : [];
    $path = (string) ($media['path'] ?? '');
    $source_node = (string) ($media['sourceNodeId'] ?? '');
    if ($path === '' || $source_node === '') { throw new RuntimeException('Scoped image content is incomplete.'); }
    return ['path' => $path, 'sourceNode' => $source_node];
}
function ra_scoped_source_record(array $by_name, string $source_key): ?array {
    foreach ($by_name as $record) {
        $record_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), (string) ($record['fieldName'] ?? '')]);
        if ($record_key === $source_key) { return $record; }
    }
    return null;
}
function ra_scoped_option_value(array $target) {
    $value = function_exists('get_field') ? get_field($target['field'], 'option') : null;
    if ($value === null && $target['storage'] === 'option') { $value = get_option('options_' . $target['field'], null); }
    if ($value === null && $target['storage'] === 'option') { $value = get_option($target['field'], null); }
    return $value;
}
function ra_update_scoped_content_media_option(array $record, array $target, string $snapshot): array {
    global $summary;
    $source_name = (string) ($record['fieldName'] ?? '');
    $source_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), $source_name]);
    $media = ra_scoped_media_source($record);
    $attachment_id = ra_import_attachment($snapshot, $media['path'], $source_name);
    update_post_meta($attachment_id, '_rudnikagro_source_node', $media['sourceNode']);
    update_post_meta($attachment_id, 'data-factory-source-node', $media['sourceNode']);
    update_post_meta($attachment_id, 'data-factory-section', (string) ($record['section'] ?? ''));
    $current = ra_scoped_option_value($target);
    $current_id = is_numeric($current) ? (int) $current : 0;
    $last_key = ($target['storage'] === 'option' ? 'rudnikagro_scoped_last_imported_' : '_rudnikagro_last_imported_option_') . $target['field'];
    $last = (string) get_option($last_key, '');
    $is_empty = $current_id === 0;
    $is_owned_baseline = $last !== '' && (string) $current_id === $last;
    $updated = false;
    if ($is_empty || ($is_owned_baseline && $current_id !== $attachment_id)) {
        if ($target['storage'] === 'acf' && function_exists('update_field')) { update_field($target['key'], $attachment_id, 'option'); }
        else { update_option('options_' . $target['field'], $attachment_id, false); }
        update_option($last_key, (string) $attachment_id, false);
        $summary['options']++;
        $updated = true;
    }
    $source_meta = '_rudnikagro_source_option_' . $target['field'];
    $owned_source = (string) get_option($source_meta, '');
    if ($owned_source === '') { update_option($source_meta, $source_key, false); $owned_source = $source_key; }
    $observed_id = $updated ? $attachment_id : $current_id;
    return [
        'key' => $source_key,
        'sourceNode' => (string) ($record['nodeId'] ?? ''),
        'sourceField' => $source_name,
        'sourceSection' => (string) ($record['section'] ?? ''),
        'targetField' => $target['field'],
        'targetFieldKey' => $target['key'],
        'value' => $observed_id ? (string) $observed_id : null,
        'mediaId' => $observed_id ?: null,
        'mediaSourceNode' => $observed_id ? (string) get_post_meta($observed_id, 'data-factory-source-node', true) : '',
        'mediaSourceAsset' => $observed_id ? (string) get_post_meta($observed_id, '_rudnikagro_source_asset', true) : '',
        'mediaSourceSection' => $observed_id ? (string) get_post_meta($observed_id, 'data-factory-section', true) : '',
        'nativeId' => 'option',
        'targetStorage' => $target['storage'],
        'sourceIdentity' => $owned_source,
        'nativeIdentity' => preg_match('/^emko_(service_media_band|about_hero)_/', $source_name) ? $source_key : (string) ($target['identity'] ?? ''),
        'lastImportedValue' => $last === '' ? null : $last,
        'preservedOverride' => !$updated && !$is_empty && !$is_owned_baseline,
        'updated' => $updated,
    ];
}
function ra_import_about_values_media_options(string $snapshot): void {
    $media = [
        ['field' => 'emko_about_values_image_125_4947', 'node' => '125:4947', 'path' => 'assets/about-values/image-125-4947.png'],
        ['field' => 'emko_about_values_pattern_a_125_4356', 'node' => '125:4356', 'path' => 'assets/about-values/pattern-a-125-4356.svg'],
        ['field' => 'emko_about_values_pattern_b_125_4651', 'node' => '125:4651', 'path' => 'assets/about-values/pattern-b-125-4651.svg'],
        ['field' => 'emko_about_values_pattern_mask_125_4354', 'node' => '125:4354', 'path' => 'assets/about-values/pattern-mask-125-4354.svg'],
    ];
    foreach ($media as $item) {
        $record = [
            'fieldName' => $item['field'],
            'nodeId' => $item['node'],
            'language' => 'pl',
            'section' => 'about-values',
            'type' => 'image',
            'value' => [
                'media' => [
                    'path' => $item['path'],
                    'sourceNodeId' => $item['node'],
                ],
            ],
        ];
        ra_update_scoped_content_media_option($record, ra_scoped_content_target($item['field']), $snapshot);
    }
}
function ra_import_about_overview_media_options(string $snapshot): void {
    $media = [
        ['field' => 'emko_about_overview_background_125_4345', 'node' => '125:4345', 'path' => 'assets/about-overview/background-125-4345.png'],
        ['field' => 'emko_about_overview_image_125_4346', 'node' => '125:4346', 'path' => 'assets/about-overview/image-125-4346.png'],
    ];
    foreach ($media as $item) {
        $record = [
            'fieldName' => $item['field'],
            'nodeId' => $item['node'],
            'language' => 'pl',
            'section' => 'about-overview',
            'type' => 'image',
            'value' => [
                'media' => [
                    'path' => $item['path'],
                    'sourceNodeId' => $item['node'],
                ],
            ],
        ];
        ra_update_scoped_content_media_option($record, ra_scoped_content_target($item['field']), $snapshot);
    }
}
function ra_import_about_media_band_options(string $snapshot): void {
    $media = [
        ['field' => 'emko_about_media_band_mask_125_4966', 'node' => '125:4966', 'path' => 'assets/about-media-band/mask-125-4966.svg'],
        ['field' => 'emko_about_media_band_image_125_4967', 'node' => '125:4967', 'path' => 'assets/about-media-band/image-125-4967.jpeg'],
    ];
    foreach ($media as $item) {
        $record = [
            'fieldName' => $item['field'],
            'nodeId' => $item['node'],
            'language' => 'pl',
            'section' => 'about-media-band',
            'type' => 'image',
            'value' => [
                'media' => [
                    'path' => $item['path'],
                    'sourceNodeId' => $item['node'],
                ],
            ],
        ];
        ra_update_scoped_content_media_option($record, ra_scoped_content_target($item['field']), $snapshot);
    }
}
function ra_update_scoped_content_option(array $record, string $snapshot): array {
    global $summary;
    $source_name = (string) ($record['fieldName'] ?? '');
    $source_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), $source_name]);
    $target = ra_scoped_content_target($source_name);
    if (($record['type'] ?? '') === 'image') { return ra_update_scoped_content_media_option($record, $target, $snapshot); }
    $value = ra_scoped_content_value($record['value'] ?? '');
    if ($source_name === '' || $value === '') { throw new RuntimeException('Scoped shared-header content is incomplete.'); }
    if ($target['storage'] === 'acf' && !$target['key']) { throw new RuntimeException('No native ACF options target exists for scoped content: ' . $source_name); }
    $current = ra_scoped_option_value($target);
    $last_key = ($target['storage'] === 'option' ? 'rudnikagro_scoped_last_imported_' : '_rudnikagro_last_imported_option_') . $target['field'];
    $last = get_option($last_key, null);
    $source_meta = '_rudnikagro_source_option_' . $target['field'];
    $owned_source = (string) get_option($source_meta, '');
    $updated = false;
    $is_empty = $current === null || $current === '' || $current === false || $current === [];
    $is_owned_baseline = !$is_empty && $last !== null && (string) $current === (string) $last;
    $needs_write = $is_empty || ($is_owned_baseline && (string) $current !== $value);
    if ($needs_write) {
        if ($target['storage'] === 'acf' && function_exists('update_field')) { update_field($target['key'], $value, 'option'); }
        else { update_option('options_' . $target['field'], $value, false); }
        update_option($last_key, $value, false);
        $summary['options']++;
        $updated = true;
    }
    if ($owned_source === '') { update_option($source_meta, $source_key, false); }
    $observed = ra_scoped_option_value($target);
    if (is_array($observed)) { $observed = implode("\n", array_map('strval', $observed)); }
    return [
        'key' => $source_key,
        'sourceNode' => (string) ($record['nodeId'] ?? ''),
        'sourceField' => $source_name,
        'sourceSection' => (string) ($record['section'] ?? ''),
        'targetField' => $target['field'],
        'targetFieldKey' => $target['key'],
        'value' => $observed === null ? null : (string) $observed,
        'nativeId' => 'option',
        'targetStorage' => $target['storage'],
        'sourceIdentity' => $owned_source !== '' ? $owned_source : $source_key,
        'nativeIdentity' => (string) ($target['identity'] ?? ''),
        'lastImportedValue' => $last,
        'preservedOverride' => !$updated && !$is_empty && (string) $current !== $value,
        'updated' => $updated,
    ];
}
function ra_update_scoped_catalogue_content(array $record, array $target): array {
    global $summary;
    if (!function_exists('get_field') || !function_exists('update_field')) { throw new RuntimeException('ACF is required for scoped catalogue content.'); }
    $source_name = (string) ($record['fieldName'] ?? '');
    $source_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), $source_name]);
    $value = ra_scoped_content_value($record['value'] ?? '');
    if ($source_name === '' || $value === '') { throw new RuntimeException('Scoped catalogue content is incomplete.'); }
    $page_id = ra_scoped_catalogues_page_id();
    $cards = get_field('rudnikagro_catalogues', $page_id);
    $cards = is_array($cards) ? array_values($cards) : [];
    $row = (int) ($target['row'] ?? -1);
    $subfield = (string) ($target['subfield'] ?? '');
    if ($row < 0 || !in_array($subfield, ['title', 'pdf_label'], true)) { throw new RuntimeException('Invalid scoped catalogue target: ' . $source_name); }
    while (count($cards) <= $row) { $cards[] = []; }
    $current = ra_scoped_content_value($cards[$row][$subfield] ?? '');
    $last_key = '_rudnikagro_last_imported_catalogue_card_' . ($row + 1) . '_' . $subfield;
    $last = (string) get_post_meta($page_id, $last_key, true);
    $source_meta = '_rudnikagro_source_content_catalogue_card_' . ($row + 1) . '_' . $subfield;
    $owned_source = (string) get_post_meta($page_id, $source_meta, true);
    if ($last === '' && $current === $value) { $last = $value; update_post_meta($page_id, $last_key, $value); }
    $is_empty = $current === '';
    $is_owned_baseline = $last !== '' && hash_equals($last, $current);
    $updated = false;
    if ($is_empty || ($is_owned_baseline && $current !== $value)) {
        $cards[$row][$subfield] = $value;
        update_field('field_ra_catalogues_cards', $cards, $page_id);
        update_post_meta($page_id, $last_key, $value);
        $last = $value;
        $updated = true;
        $summary['pages'] = ($summary['pages'] ?? 0) + 0;
    }
    if ($owned_source === '') { update_post_meta($page_id, $source_meta, $source_key); $owned_source = $source_key; }
    return [
        'key' => $source_key,
        'sourceNode' => (string) ($record['nodeId'] ?? ''),
        'sourceField' => $source_name,
        'sourceSection' => (string) ($record['section'] ?? ''),
        'targetField' => $target['field'],
        'targetFieldKey' => $target['key'],
        'value' => $value,
        'nativeId' => (string) $page_id,
        'targetStorage' => $target['storage'],
        'sourceIdentity' => $owned_source,
        'nativeIdentity' => $target['identity'],
        'lastImportedValue' => $last === '' ? null : $last,
        'preservedOverride' => !$updated && !$is_empty && $current !== $value,
        'updated' => $updated,
    ];
}
function ra_scoped_blog_card_post_id(array $records, string $identity): int {
    $existing = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_rudnikagro_blog_card_identity', 'meta_value' => $identity, 'fields' => 'ids', 'numberposts' => 1]);
    if (!$existing) { $existing = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => $identity, 'fields' => 'ids', 'numberposts' => 1]); }
    if (!$existing) {
        foreach ($records as $record) {
            $source_name = (string) ($record['fieldName'] ?? '');
            if (!str_ends_with($source_name, '_title_' . str_replace(':', '_', (string) ($record['nodeId'] ?? '')))) { continue; }
            $legacy_route = 'blog-card-' . str_replace(':', '-', (string) ($record['nodeId'] ?? ''));
            $existing = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => $legacy_route, 'fields' => 'ids', 'numberposts' => 1]);
            break;
        }
    }
    $initial_title = '';
    foreach ($records as $record) {
        if (str_contains((string) ($record['fieldName'] ?? ''), '_title_')) { $initial_title = ra_scoped_content_value($record['value'] ?? ''); break; }
    }
    $created = !$existing;
    $post_id = $existing ? (int) $existing[0] : ra_owned_post(['post_type' => 'post', 'post_status' => 'publish', 'post_title' => $initial_title], $identity);
    if (!$post_id) { throw new RuntimeException('Cannot create scoped blog card: ' . $identity); }
    update_post_meta($post_id, '_rudnikagro_blog_card_identity', $identity);
    if (preg_match('/^blog-archive-card-([1-9])$/', $identity, $matches)) {
        update_post_meta($post_id, '_rudnikagro_blog_display_order', (string) (int) $matches[1]);
    }
    update_post_meta($post_id, '_rudnikagro_owned', '1');
    if ($created && $initial_title !== '') { update_post_meta($post_id, '_rudnikagro_last_imported_title', $initial_title); }
    return $post_id;
}
function ra_sync_scoped_blog_archive_image(string $identity, int $post_id, string $snapshot): void {
    global $summary;
    if (!preg_match('/^blog-archive-card-([1-9])$/', $identity, $matches)) { return; }
    $images = [
        1 => ['node' => '125:1919', 'path' => 'assets/blog-archive/card-image-125-1919.png'],
        2 => ['node' => '125:1924', 'path' => 'assets/blog-archive/card-image-125-1924.png'],
        3 => ['node' => '125:1929', 'path' => 'assets/blog-archive/card-image-125-1929.png'],
        4 => ['node' => '125:1935', 'path' => 'assets/blog-archive/card-image-125-1935.png'],
        5 => ['node' => '125:1940', 'path' => 'assets/blog-archive/card-image-125-1940.png'],
        6 => ['node' => '125:1945', 'path' => 'assets/blog-archive/card-image-125-1945.png'],
        7 => ['node' => '125:1951', 'path' => 'assets/blog-archive/card-image-125-1951.png'],
        8 => ['node' => '125:1956', 'path' => 'assets/blog-archive/card-image-125-1956.png'],
        9 => ['node' => '125:1961', 'path' => 'assets/blog-archive/card-image-125-1961.png'],
    ];
    $source = $images[(int) $matches[1]];
    $field_name = 'rudnikagro_blog_archive_card_' . $matches[1] . '_image_' . str_replace(':', '_', $source['node']);
    $attachment_id = ra_import_attachment($snapshot, $source['path'], $field_name);
    if (!$attachment_id) { return; }
    update_post_meta($attachment_id, '_rudnikagro_source_node', $source['node']);
    update_post_meta($attachment_id, 'data-factory-source-node', $source['node']);
    update_post_meta($attachment_id, 'data-factory-section', 'blog-archive');
    if (!get_post_thumbnail_id($post_id)) { set_post_thumbnail($post_id, $attachment_id); }
}
function ra_sync_scoped_blog_post_article_media(string $snapshot): void {
    $attachment_id = ra_import_attachment($snapshot, 'assets/blog-post-article/article-image-125-2244.png', 'emko_blog_post_article_image_125_2244');
    if (!$attachment_id) { return; }
    update_post_meta($attachment_id, '_rudnikagro_source_node', '125:2244');
    update_post_meta($attachment_id, 'data-factory-source-node', '125:2244');
    update_post_meta($attachment_id, 'data-factory-section', 'blog-post-article');
}
function ra_import_blog_archive_demo_clones(): array {
    $raw = getenv('FACTORY_RUDNIKAGRO_BLOG_DEMO_CLONES');
    if ($raw === false || trim($raw) === '' || trim($raw) === '[]') { return ['created' => 0, 'total' => 0]; }

    $plans = json_decode($raw, true);
    if (!is_array($plans) || count($plans) !== 270) {
        throw new RuntimeException('Blog demo pagination requires exactly 270 policy-planned clones.');
    }

    $source_nodes = [
        'blog-archive-card-1' => '125:1919',
        'blog-archive-card-2' => '125:1924',
        'blog-archive-card-3' => '125:1929',
        'blog-archive-card-4' => '125:1935',
        'blog-archive-card-5' => '125:1940',
        'blog-archive-card-6' => '125:1945',
        'blog-archive-card-7' => '125:1951',
        'blog-archive-card-8' => '125:1956',
        'blog-archive-card-9' => '125:1961',
    ];
    $created = 0;
    foreach ($plans as $index => $plan) {
        $import_key = (string) ($plan['importKey'] ?? '');
        $clone_of = (string) ($plan['cloneOf'] ?? '');
        $source_id = (string) ($plan['sourceId'] ?? '');
        $owner = (string) ($plan['owner'] ?? '');
        if ($import_key === '' || !isset($source_nodes[$clone_of]) || $source_nodes[$clone_of] !== $source_id
            || empty($plan['demo']) || !in_array($owner, ['blog-archive-primary', 'blog-archive-tail'], true)) {
            throw new RuntimeException('Invalid policy-planned blog demo clone.');
        }

        $source_posts = get_posts([
            'post_type' => 'post',
            'post_status' => 'publish',
            'meta_key' => '_rudnikagro_blog_card_identity',
            'meta_value' => $clone_of,
            'fields' => 'ids',
            'numberposts' => 1,
        ]);
        if (!$source_posts) { throw new RuntimeException('Blog demo clone source is unavailable: ' . $clone_of); }
        $source_post_id = (int) $source_posts[0];
        $existing = get_posts([
            'post_type' => 'post',
            'post_status' => 'any',
            'meta_key' => '_rudnikagro_demo_import_key',
            'meta_value' => $import_key,
            'fields' => 'ids',
            'numberposts' => 1,
        ]);
        $is_new = !$existing;
        $clone_id = $existing ? (int) $existing[0] : (int) ra_owned_post([
            'post_type' => 'post',
            'post_status' => 'publish',
            'post_title' => (string) get_the_title($source_post_id),
            'post_excerpt' => (string) get_post_field('post_excerpt', $source_post_id),
            'post_date' => (string) get_post_field('post_date', $source_post_id),
        ], $import_key);
        if (!$clone_id) { throw new RuntimeException('Cannot create blog demo clone: ' . $import_key); }

        if ($is_new && function_exists('update_field')) {
            update_field('field_ra_blog_card_date', get_field('rudnikagro_blog_card_date', $source_post_id), $clone_id);
            update_field('field_ra_blog_card_label', get_field('rudnikagro_blog_card_label', $source_post_id), $clone_id);
            update_field('field_ra_blog_card_image', get_field('rudnikagro_blog_card_image', $source_post_id), $clone_id);
            $created++;
        }
        update_post_meta($clone_id, '_rudnikagro_blog_card_identity', $clone_of . '-demo-' . ($index + 1));
        update_post_meta($clone_id, '_rudnikagro_blog_display_order', (string) ($index + 10));
        update_post_meta($clone_id, '_rudnikagro_demo_import_key', $import_key);
        update_post_meta($clone_id, '_rudnikagro_demo_clone_of', $clone_of);
        update_post_meta($clone_id, '_rudnikagro_demo_source_node', $source_id);
        update_post_meta($clone_id, '_rudnikagro_demo_owner', $owner);
        update_post_meta($clone_id, '_rudnikagro_demo_clone', '1');
        update_post_meta($clone_id, '_rudnikagro_owned', '1');
    }

    return ['created' => $created, 'total' => count($plans)];
}
function ra_import_catalogues_demo_clones(): array {
    $raw = getenv('FACTORY_RUDNIKAGRO_CATALOGUES_DEMO_CLONES');
    if ($raw === false || trim($raw) === '' || trim($raw) === '[]') { return ['created' => 0, 'total' => 0]; }

    $plans = json_decode($raw, true);
    if (!is_array($plans) || count($plans) !== 120) {
        throw new RuntimeException('Catalogue demo pagination requires exactly 120 policy-planned clones.');
    }

    $catalogues_page_id = ra_scoped_catalogues_page_id();
    if (!$catalogues_page_id) { throw new RuntimeException('Catalogue demo clone parent page is unavailable.'); }

    $sources = [
        ['identity' => 'catalogues-secondary-card-1', 'source' => '125:2544', 'title' => '125:2557', 'download' => '125:2562', 'icon' => '125:2563', 'cover' => 'assets/catalogues-secondary/catalogue-image-125-2544.png', 'overlay' => ''],
        ['identity' => 'catalogues-secondary-card-2', 'source' => '125:2548', 'title' => '125:2558', 'download' => '125:2565', 'icon' => '125:2566', 'cover' => 'assets/catalogues-secondary/catalogue-image-125-2548.png', 'overlay' => ''],
        ['identity' => 'catalogues-secondary-card-3', 'source' => '125:2552', 'title' => '125:2559', 'download' => '125:2568', 'icon' => '125:2569', 'cover' => 'assets/catalogues-secondary/catalogue-image-125-2552.png', 'overlay' => ''],
        ['identity' => 'catalogues-secondary-card-4', 'source' => '125:2556', 'title' => '125:2560', 'download' => '125:2571', 'icon' => '125:2572', 'cover' => 'assets/catalogues-secondary/catalogue-image-125-2552.png', 'overlay' => 'assets/catalogues-secondary/catalogue-image-125-2574.png'],
    ];
    $source_lookup = [];
    foreach ($sources as $source) { $source_lookup[$source['identity']] = $source; }

    $snapshot = get_template_directory() . '/.factory-cache/figma/latest';
    $background_id = ra_import_attachment($snapshot, 'assets/catalogues-secondary/background-125-2542.png', 'rudnikagro_catalogues_secondary_background_125_2542');
    $download_icon_id = ra_import_attachment($snapshot, 'assets/catalogues-secondary/pdf-125-2563.png', 'rudnikagro_catalogues_secondary_download_icon_125_2563');
    $originals = [];
    foreach ($sources as $index => $source) {
        $existing = get_posts([
            'post_type' => 'page',
            'post_status' => 'any',
            'post_parent' => $catalogues_page_id,
            'meta_key' => '_rudnikagro_catalogue_source_identity',
            'meta_value' => $source['identity'],
            'fields' => 'ids',
            'numberposts' => 1,
        ]);
        $is_new = !$existing;
        $title = trim((string) get_option('options_rudnikagro_catalogues_secondary_card_' . ($index + 1) . '_title', ''));
        $download_label = trim((string) get_option('options_rudnikagro_catalogues_secondary_card_' . ($index + 1) . '_download_label', ''));
        if ($title === '' || $download_label === '') { throw new RuntimeException('Catalogue source copy must be imported before its demo records.'); }
        $catalogue_id = $existing ? (int) $existing[0] : (int) wp_insert_post([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_parent' => $catalogues_page_id,
            'post_title' => $title,
            'menu_order' => $index,
        ], true);
        if (is_wp_error($catalogue_id) || !$catalogue_id) { throw new RuntimeException('Cannot create native catalogue source record.'); }

        $cover_id = ra_import_attachment($snapshot, $source['cover'], 'rudnikagro_' . $source['identity'] . '_cover');
        $overlay_id = $source['overlay'] !== '' ? ra_import_attachment($snapshot, $source['overlay'], 'rudnikagro_' . $source['identity'] . '_overlay') : 0;
        if ($is_new) {
            update_post_meta($catalogue_id, '_rudnikagro_catalogue_download_label', $download_label);
            update_post_meta($catalogue_id, '_rudnikagro_catalogue_cover', (string) $cover_id);
            update_post_meta($catalogue_id, '_rudnikagro_catalogue_overlay_cover', (string) $overlay_id);
            update_post_meta($catalogue_id, '_rudnikagro_catalogue_background', (string) $background_id);
            update_post_meta($catalogue_id, '_rudnikagro_catalogue_download_icon', (string) $download_icon_id);
        }
        foreach ([
            '_rudnikagro_catalogue_inventory' => '1',
            '_rudnikagro_catalogue_source_identity' => $source['identity'],
            '_rudnikagro_catalogue_cover_source_node' => $source['source'],
            '_rudnikagro_catalogue_title_source_node' => $source['title'],
            '_rudnikagro_catalogue_download_source_node' => $source['download'],
            '_rudnikagro_catalogue_download_icon_source_node' => $source['icon'],
            '_rudnikagro_catalogue_background_source_node' => '125:2542',
            '_rudnikagro_catalogue_surface_source_node' => '125:2543',
            '_rudnikagro_catalogue_overlay_source_node' => $source['overlay'] !== '' ? '125:2574' : '',
            '_rudnikagro_owned' => '1',
        ] as $meta_key => $meta_value) { update_post_meta($catalogue_id, $meta_key, $meta_value); }
        $originals[$source['identity']] = $catalogue_id;
    }

    $created = 0;
    foreach ($plans as $plan_index => $plan) {
        $import_key = (string) ($plan['importKey'] ?? '');
        $clone_of = (string) ($plan['cloneOf'] ?? '');
        $source_id = (string) ($plan['sourceId'] ?? '');
        if ($import_key === '' || empty($plan['demo']) || ($plan['owner'] ?? '') !== 'catalogues-secondary' || !isset($source_lookup[$clone_of]) || $source_lookup[$clone_of]['source'] !== $source_id || !isset($originals[$clone_of])) {
            throw new RuntimeException('Invalid policy-planned catalogue demo clone.');
        }
        $existing = get_posts([
            'post_type' => 'page',
            'post_status' => 'any',
            'post_parent' => $catalogues_page_id,
            'meta_key' => '_rudnikagro_demo_import_key',
            'meta_value' => $import_key,
            'fields' => 'ids',
            'numberposts' => 1,
        ]);
        $is_new = !$existing;
        $source_post_id = $originals[$clone_of];
        $catalogue_id = $existing ? (int) $existing[0] : (int) wp_insert_post([
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_parent' => $catalogues_page_id,
            'post_title' => (string) get_the_title($source_post_id),
            'menu_order' => $plan_index + count($sources),
        ], true);
        if (is_wp_error($catalogue_id) || !$catalogue_id) { throw new RuntimeException('Cannot create native catalogue demo clone.'); }
        if ($is_new) {
            foreach (['_rudnikagro_catalogue_download_label', '_rudnikagro_catalogue_cover', '_rudnikagro_catalogue_overlay_cover', '_rudnikagro_catalogue_background', '_rudnikagro_catalogue_download_icon'] as $meta_key) {
                update_post_meta($catalogue_id, $meta_key, (string) get_post_meta($source_post_id, $meta_key, true));
            }
            $created++;
        }
        foreach (['_rudnikagro_catalogue_inventory', '_rudnikagro_catalogue_source_identity', '_rudnikagro_catalogue_cover_source_node', '_rudnikagro_catalogue_title_source_node', '_rudnikagro_catalogue_download_source_node', '_rudnikagro_catalogue_download_icon_source_node', '_rudnikagro_catalogue_background_source_node', '_rudnikagro_catalogue_surface_source_node', '_rudnikagro_catalogue_overlay_source_node'] as $meta_key) {
            update_post_meta($catalogue_id, $meta_key, (string) get_post_meta($source_post_id, $meta_key, true));
        }
        update_post_meta($catalogue_id, '_rudnikagro_demo_import_key', $import_key);
        update_post_meta($catalogue_id, '_rudnikagro_demo_clone_of', $clone_of);
        update_post_meta($catalogue_id, '_rudnikagro_demo_source_node', $source_id);
        update_post_meta($catalogue_id, '_rudnikagro_demo_owner', 'catalogues-secondary');
        update_post_meta($catalogue_id, '_rudnikagro_demo_clone', '1');
        update_post_meta($catalogue_id, '_rudnikagro_owned', '1');
    }

    return ['created' => $created, 'total' => count($plans)];
}
function ra_update_scoped_content_post(array $record, int $post_id, array $target, string $snapshot): array {
    global $summary;
    $source_name = (string) ($record['fieldName'] ?? '');
    $source_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), $source_name]);
    if (($record['type'] ?? '') === 'image') {
        $media = ra_scoped_media_source($record);
        $attachment_id = ra_import_attachment($snapshot, $media['path'], $source_name);
        update_post_meta($attachment_id, '_rudnikagro_source_node', $media['sourceNode']);
        update_post_meta($attachment_id, 'data-factory-source-node', $media['sourceNode']);
        update_post_meta($attachment_id, 'data-factory-section', (string) ($record['section'] ?? ''));
        $current = function_exists('get_field') ? get_field($target['field'], $post_id) : null;
        $current_id = is_numeric($current) ? (int) $current : 0;
        $last_key = '_rudnikagro_last_imported_' . $target['field'];
        $last = (string) get_post_meta($post_id, $last_key, true);
        $is_empty = $current_id === 0;
        $is_owned_baseline = $last !== '' && (string) $current_id === $last;
        $updated = false;
        if ($is_empty || ($is_owned_baseline && $current_id !== $attachment_id)) {
            if (!function_exists('update_field')) { throw new RuntimeException('ACF is required for scoped blog-card media.'); }
            update_field($target['key'], $attachment_id, $post_id);
            update_post_meta($post_id, $last_key, (string) $attachment_id);
            $updated = true;
        }
        update_post_meta($post_id, '_rudnikagro_source_content_' . $target['field'], $source_key);
        $observed_id = $updated ? $attachment_id : $current_id;
        return [
            'key' => $source_key,
            'sourceNode' => (string) ($record['nodeId'] ?? ''),
            'sourceField' => $source_name,
            'sourceSection' => (string) ($record['section'] ?? ''),
            'targetField' => $target['field'],
            'targetFieldKey' => $target['key'],
            'value' => $observed_id ? (string) $observed_id : null,
            'mediaId' => $observed_id ?: null,
            'mediaSourceNode' => $observed_id ? (string) get_post_meta($observed_id, 'data-factory-source-node', true) : '',
            'mediaSourceAsset' => $observed_id ? (string) get_post_meta($observed_id, '_rudnikagro_source_asset', true) : '',
            'nativeId' => (string) $post_id,
            'targetStorage' => $target['storage'],
            'sourceIdentity' => $source_key,
            'nativeIdentity' => $target['identity'],
            'lastImportedValue' => $last === '' ? null : $last,
            'preservedOverride' => !$updated && !$is_empty && !$is_owned_baseline,
            'updated' => $updated,
        ];
    }
    $value = ra_scoped_content_value($record['value'] ?? '');
    if ($source_name === '' || $value === '') { throw new RuntimeException('Scoped blog-card content is incomplete.'); }
    $last_key = '_rudnikagro_last_imported_' . ($target['field'] === 'rudnikagro_blog_card_date' ? 'blog_card_date' : ltrim((string) $target['field'], '_'));
    $last = (string) get_post_meta($post_id, $last_key, true);
    $current = $target['field'] === 'post_title'
        ? (string) get_post_field('post_title', $post_id)
        : ($target['field'] === 'post_excerpt' ? (string) get_post_field('post_excerpt', $post_id) : (string) get_field($target['field'], $post_id));
    $is_empty = $current === '';
    if (!$is_empty && $last === '' && $current === $value) {
        update_post_meta($post_id, $last_key, $value);
        $last = $value;
    }
    $is_owned_baseline = $last !== '' && hash_equals($last, $current);
    $updated = false;
    if (($is_empty || $is_owned_baseline) && $current !== $value) {
        if ($target['field'] === 'post_title' || $target['field'] === 'post_excerpt') {
            wp_update_post(['ID' => $post_id, $target['field'] === 'post_title' ? 'post_title' : 'post_excerpt' => $value]);
        } elseif (function_exists('update_field')) {
            update_field($target['key'], $value, $post_id);
        } else {
            throw new RuntimeException('ACF is required for scoped blog-card meta.');
        }
        update_post_meta($post_id, $last_key, $value);
        $updated = true;
        $summary['posts'] = ($summary['posts'] ?? 0) + 0;
    }
    update_post_meta($post_id, '_rudnikagro_source_content_' . $target['field'], $source_key);
    return [
        'key' => $source_key,
        'sourceNode' => (string) ($record['nodeId'] ?? ''),
        'sourceField' => $source_name,
        'sourceSection' => (string) ($record['section'] ?? ''),
        'targetField' => $target['field'],
        'targetFieldKey' => $target['key'],
        'value' => $value,
        'nativeId' => (string) $post_id,
        'targetStorage' => $target['storage'],
        'sourceIdentity' => $source_key,
        'nativeIdentity' => $target['identity'],
        'lastImportedValue' => $last === '' ? null : $last,
        'preservedOverride' => !$updated && !$is_empty && $current !== $value,
        'updated' => $updated,
    ];
}
function ra_sync_scoped_catalogues_media(string $snapshot): void {
    if (!function_exists('get_field') || !function_exists('update_field')) { return; }
    $page_id = ra_scoped_catalogues_page_id();
    $cards = get_field('rudnikagro_catalogues', $page_id);
    $cards = is_array($cards) ? array_values($cards) : [];
    $background_id = ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2507.png', 'rudnikagro_catalogues_primary_background_125_2507');
    if ($background_id) {
        update_post_meta($background_id, '_rudnikagro_source_node', '125:2507');
        update_post_meta($background_id, 'data-factory-source-node', '125:2507');
        update_post_meta($background_id, 'data-factory-section', 'catalogues-primary');
    }
    $assets = [
        ['assets/catalogues-primary/asset-125-2509.png', 'rudnikagro_catalogues_primary_media_125_2509', '125:2509'],
        ['assets/catalogues-primary/asset-125-2513.png', 'rudnikagro_catalogues_primary_media_125_2513', '125:2513'],
        ['assets/catalogues-primary/asset-125-2517.png', 'rudnikagro_catalogues_primary_media_125_2517', '125:2517'],
        ['assets/catalogues-primary/asset-125-2539.png', 'rudnikagro_catalogues_primary_media_125_2539', '125:2539'],
    ];
    $changed = false;
    foreach ($assets as $index => [$asset, $field_name, $source_node]) {
        $media_id = ra_import_attachment($snapshot, $asset, $field_name);
        if ($media_id) {
            update_post_meta($media_id, '_rudnikagro_source_node', $source_node);
            update_post_meta($media_id, 'data-factory-source-node', $source_node);
            update_post_meta($media_id, 'data-factory-section', 'catalogues-primary');
        }
        if (!isset($cards[$index])) { $cards[$index] = []; }
        if (empty($cards[$index]['cover']) && $media_id) { $cards[$index]['cover'] = $media_id; $changed = true; }
        if (empty($cards[$index]['background']) && $background_id) { $cards[$index]['background'] = $background_id; $changed = true; }
    }
    if ($changed) { update_field('field_ra_catalogues_cards', $cards, $page_id); }
    $icon_id = ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2528.png', 'rudnikagro_catalogues_primary_download_icon_125_2528');
    if ($icon_id) {
        update_post_meta($icon_id, '_rudnikagro_source_node', '125:2528');
        update_post_meta($icon_id, 'data-factory-source-node', '125:2528');
        update_post_meta($icon_id, 'data-factory-section', 'catalogues-primary');
        if (!get_field('rudnikagro_catalogues_download_icon', $page_id)) { update_field('field_ra_catalogues_download_icon', $icon_id, $page_id); }
    }
}
function ra_scoped_product_related_id(array $target, array $records): int {
    $identity = (string) ($target['identity'] ?? '');
    $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_product_related_identity', 'meta_value' => $identity, 'fields' => 'ids', 'numberposts' => 1]);
    if (!$existing) {
        foreach ($records as $record) {
            $source_name = (string) ($record['fieldName'] ?? '');
            if (!str_contains($source_name, '_title_')) { continue; }
            $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => (string) ($record['nodeId'] ?? ''), 'fields' => 'ids', 'numberposts' => 1]);
            if ($existing) { break; }
        }
    }
    if (!$existing && preg_match('/^product-related-card-(\d+)$/', $identity, $matches)) {
        $title_nodes = [1 => '125:3287', 2 => '125:3285', 3 => '125:3286', 4 => '125:3288', 5 => '125:3290'];
        $title_node = $title_nodes[(int) $matches[1]] ?? '';
        if ($title_node !== '') {
            $existing = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $title_node, 'fields' => 'ids', 'numberposts' => 1]);
        }
    }
    if (!$existing && !array_filter($records, static fn($record): bool => str_contains((string) ($record['fieldName'] ?? ''), '_title_'))) {
        throw new RuntimeException('Native related product is missing for ' . $identity . '; title/media batch must run first.');
    }
    if ($existing) {
        $product_id = (int) $existing[0];
        update_post_meta($product_id, '_rudnikagro_product_related_identity', $identity);
        update_post_meta($product_id, '_rudnikagro_source_section', 'product-related');
        update_post_meta($product_id, '_rudnikagro_route_id', 'product-related');
        update_post_meta($product_id, '_rudnikagro_owned', '1');
        return $product_id;
    }
    $title = '';
    foreach ($records as $record) {
        if (str_contains((string) ($record['fieldName'] ?? ''), '_title_')) { $title = ra_scoped_content_value($record['value'] ?? ''); break; }
    }
    $product_id = wp_insert_post(['post_type' => 'product', 'post_status' => 'publish', 'post_title' => $title], true);
    if (is_wp_error($product_id) || !$product_id) { throw new RuntimeException('Cannot create scoped related product: ' . $identity); }
    update_post_meta($product_id, '_rudnikagro_product_related_identity', $identity);
    foreach ($records as $record) {
        if (str_contains((string) ($record['fieldName'] ?? ''), '_title_')) { update_post_meta($product_id, '_rudnikagro_source_node', (string) ($record['nodeId'] ?? '')); break; }
    }
    update_post_meta($product_id, '_rudnikagro_source_section', 'product-related');
    update_post_meta($product_id, '_rudnikagro_route_id', 'product-related');
    update_post_meta($product_id, '_rudnikagro_owned', '1');
    return (int) $product_id;
}
function ra_update_scoped_product_related(array $record, int $product_id, array $target, string $snapshot): array {
    global $summary;
    $source_name = (string) ($record['fieldName'] ?? '');
    $source_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), $source_name]);
    $identity = (string) $target['identity'];
    if (($record['type'] ?? '') === 'image') {
        $media = ra_scoped_media_source($record);
        $image_field = 'emko_product_related_media_' . str_replace(':', '_', $media['sourceNode']);
        $attachment_id = ra_import_attachment($snapshot, $media['path'], $image_field);
        update_post_meta($attachment_id, '_rudnikagro_source_node', $media['sourceNode']);
        update_post_meta($attachment_id, 'data-factory-source-node', $media['sourceNode']);
        update_post_meta($attachment_id, 'data-factory-section', 'product-related');
        $current = (int) get_post_thumbnail_id($product_id);
        $last_key = '_rudnikagro_last_imported_thumbnail_id';
        $last = (string) get_post_meta($product_id, $last_key, true);
        $is_empty = $current === 0;
        if ($last === '' && $current === $attachment_id) { $last = (string) $attachment_id; update_post_meta($product_id, $last_key, $last); }
        $is_owned_baseline = $last !== '' && (string) $current === $last;
        $updated = false;
        if ($is_empty || ($is_owned_baseline && $current !== $attachment_id)) {
            set_post_thumbnail($product_id, $attachment_id);
            update_post_meta($product_id, $last_key, (string) $attachment_id);
            $updated = true;
        }
        update_post_meta($product_id, '_rudnikagro_source_content_' . $identity . '_image', $source_key);
        $observed_id = $updated ? $attachment_id : $current;
        return [
            'key' => $source_key, 'sourceNode' => (string) ($record['nodeId'] ?? ''), 'sourceField' => $source_name,
            'sourceSection' => (string) ($record['section'] ?? ''), 'targetField' => 'post_thumbnail', 'targetFieldKey' => '',
            'value' => $observed_id ? (string) $observed_id : null, 'mediaId' => $observed_id ?: null,
            'mediaSourceNode' => $observed_id ? (string) get_post_meta($observed_id, 'data-factory-source-node', true) : '',
            'mediaSourceAsset' => $observed_id ? (string) get_post_meta($observed_id, '_rudnikagro_source_asset', true) : '',
            'mediaSourceSection' => $observed_id ? (string) get_post_meta($observed_id, 'data-factory-section', true) : '',
            'nativeId' => (string) $product_id, 'targetStorage' => 'product-media', 'sourceIdentity' => $source_key,
            'nativeIdentity' => $identity, 'lastImportedValue' => $last === '' ? null : $last,
            'preservedOverride' => !$updated && !$is_empty && !$is_owned_baseline,
        ];
    }
    $value = ra_scoped_content_value($record['value'] ?? '');
    if ($value === '') { throw new RuntimeException('Scoped related product content is incomplete.'); }
    $current = (string) get_post_field('post_title', $product_id);
    $is_description = ($target['field'] ?? '') === 'post_excerpt';
    if ($is_description) {
        $current = (string) get_post_field('post_excerpt', $product_id);
    }
    $last_key = $is_description ? '_rudnikagro_last_imported_excerpt' : '_rudnikagro_last_imported_title';
    $last = (string) get_post_meta($product_id, $last_key, true);
    $is_empty = $current === '';
    if ($last === '' && $current === $value) { $last = $value; update_post_meta($product_id, $last_key, $last); }
    $is_owned_baseline = $last !== '' && $current === $last;
    $updated = false;
    if ($is_empty || ($is_owned_baseline && $current !== $value)) {
        wp_update_post(['ID' => $product_id, $is_description ? 'post_excerpt' : 'post_title' => $value]);
        update_post_meta($product_id, $last_key, $value);
        $updated = true;
    }
    update_post_meta($product_id, '_rudnikagro_source_content_' . $identity . '_' . ($is_description ? 'description' : 'title'), $source_key);
    return [
        'key' => $source_key, 'sourceNode' => (string) ($record['nodeId'] ?? ''), 'sourceField' => $source_name,
        'sourceSection' => (string) ($record['section'] ?? ''), 'targetField' => $is_description ? 'post_excerpt' : 'post_title', 'targetFieldKey' => '',
        'value' => (string) get_post_field($is_description ? 'post_excerpt' : 'post_title', $product_id), 'nativeId' => (string) $product_id,
        'targetStorage' => 'product', 'sourceIdentity' => $source_key, 'nativeIdentity' => $identity,
        'lastImportedValue' => $last === '' ? null : $last, 'preservedOverride' => !$updated && !$is_empty && !$is_owned_baseline,
    ];
}
/**
 * Resolve the canonical product used as the owner of related-product content.
 *
 * Scoped content batches can run before the full commerce reconciliation. In
 * that case the related cards are imported correctly, but there is no product
 * with route `product` to own the native WooCommerce upsell relation. Keep
 * this fallback aligned with the canonical product created by the full
 * importer so the batch remains order-independent and idempotent.
 */
function ra_scoped_product_parent_id(array $by_name): int {
    $targets = get_posts([
        'post_type' => 'product',
        'post_status' => 'any',
        'meta_key' => '_rudnikagro_route_id',
        'meta_value' => 'product',
        'fields' => 'ids',
        'numberposts' => 1,
    ]);
    if ($targets) { return (int) $targets[0]; }

    $existing = get_posts([
        'post_type' => 'product',
        'post_status' => 'any',
        'name' => 'aquatos-5l',
        'fields' => 'ids',
        'numberposts' => 1,
    ]);
    if ($existing) {
        $product_id = (int) $existing[0];
        update_post_meta($product_id, '_rudnikagro_route_id', 'product');
        return $product_id;
    }

    $source = ra_source_field($by_name, 'rudnikagro_product_overview_323_2084');
    $title = is_array($source) ? trim(ra_repair_source_encoding((string) ($source['value'] ?? ''))) : '';
    // The canonical product overview is not part of a scoped content batch;
    // use the same stable identity as the full importer when that source field
    // is unavailable in the filtered map.
    if ($title === '') { $title = 'Aquatos 5 L'; }

    $product_id = wp_insert_post([
        'post_type' => 'product',
        'post_status' => 'publish',
        'post_name' => 'aquatos-5l',
        'post_title' => $title,
    ], true);
    if (is_wp_error($product_id) || !$product_id) { return 0; }

    update_post_meta($product_id, '_rudnikagro_route_id', 'product');
    update_post_meta($product_id, '_rudnikagro_source_node', '323:2084');
    update_post_meta($product_id, '_rudnikagro_source', 'figma:OwiDXrKMVcaHKB9ryYF6mY');
    update_post_meta($product_id, '_rudnikagro_owned', '1');
    return (int) $product_id;
}

function ra_bind_scoped_product_related(array $product_ids, array $by_name): void {
    $product_ids = array_values(array_unique(array_map('intval', $product_ids)));
    if (!$product_ids) { return; }
    $target_id = ra_scoped_product_parent_id($by_name);
    if (!$target_id) { return; }
    $current = get_post_meta($target_id, '_upsell_ids', true);
    $last = get_post_meta($target_id, '_rudnikagro_last_imported_related_ids', true);
    if ($current === '' || $current === $last) {
        update_post_meta($target_id, '_upsell_ids', $product_ids);
        update_post_meta($target_id, '_rudnikagro_last_imported_related_ids', $product_ids);
    }
}
function ra_import_scoped_content(array $by_name, array $keys, string $snapshot): void {
    global $summary;
    if (!isset($GLOBALS['summary']) || !is_array($GLOBALS['summary'])) {
        $GLOBALS['summary'] = ['options' => 0, 'attachments' => 0, 'pages' => 0, 'posts' => 0, 'menus' => 0, 'mediaGaps' => []];
    }
    $summary =& $GLOBALS['summary'];
    $source_records = [];
    $blog_groups = [];
    $related_groups = [];
    foreach ($keys as $key) {
        $record = ra_scoped_source_record($by_name, $key);
        if (!$record) { throw new RuntimeException('Scoped content source record is unavailable: ' . $key); }
        $record_key = implode(':', [(string) ($record['language'] ?? 'pl'), (string) ($record['nodeId'] ?? ''), (string) ($record['fieldName'] ?? '')]);
        if ($record_key !== $key) { throw new RuntimeException('Scoped content source identity mismatch: ' . $key); }
        $target = ra_scoped_content_target((string) ($record['fieldName'] ?? ''));
        $source_records[$key] = [$record, $target];
        if (isset($target['identity']) && (str_starts_with((string) $target['identity'], 'blog-archive-card-') || str_starts_with((string) $target['identity'], 'blog-post-related-card-'))) { $blog_groups[$target['identity']][] = $record; }
        if (isset($target['identity']) && str_starts_with((string) $target['identity'], 'product-related-card-')) { $related_groups[$target['identity']][] = $record; }
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'catalogues-primary')) {
        ra_sync_scoped_catalogues_media($snapshot);
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'about-values')) {
        ra_import_about_values_media_options($snapshot);
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'about-overview')) {
        ra_import_about_overview_media_options($snapshot);
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'about-media-band')) {
        ra_import_about_media_band_options($snapshot);
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'blog-post-article')) {
        ra_sync_scoped_blog_post_article_media($snapshot);
    }
    if (array_filter($source_records, static fn($source): bool => ($source[0]['section'] ?? '') === 'product-detail')) {
        // The product-detail source group owns action labels/icon and benefits
        // heading. Import the complete
        // source-backed native group so scoped builds do not leave those
        // editor-owned fields empty when only the three mapped records are
        // passed through the batch.
        ra_import_product_detail_content($snapshot);
    }
    $blog_post_ids = [];
    foreach ($blog_groups as $identity => $group) { $blog_post_ids[$identity] = ra_scoped_blog_card_post_id($group, $identity); }
    foreach ($blog_post_ids as $identity => $post_id) {
        ra_sync_scoped_blog_archive_image((string) $identity, (int) $post_id, $snapshot);
    }
    $related_product_ids = [];
    foreach ($related_groups as $identity => $group) {
        $target = ra_scoped_content_target((string) ($group[0]['fieldName'] ?? ''));
        $related_product_ids[$identity] = ra_scoped_product_related_id($target, $group);
    }
    $records = [];
    foreach ($keys as $key) {
        [$record, $target] = $source_records[$key];
        $records[] = isset($target['identity'], $related_product_ids[$target['identity']])
            ? ra_update_scoped_product_related($record, $related_product_ids[$target['identity']], $target, $snapshot)
            : ($target['storage'] === 'post-acf' && ($target['page_route'] ?? '') === 'catalogues'
            ? ra_update_scoped_catalogue_content($record, $target)
            : (isset($target['identity']) && isset($blog_post_ids[$target['identity']])
            ? ra_update_scoped_content_post($record, $blog_post_ids[$target['identity']], $target, $snapshot)
            : ra_update_scoped_content_option($record, $snapshot)));
    }
    $demo_clones = [
        'blog' => ra_import_blog_archive_demo_clones(),
        'catalogues' => ra_import_catalogues_demo_clones(),
    ];
    $related_has_native_copy = array_filter($related_groups, static function (array $group): bool {
        foreach ($group as $record) {
            if (str_contains((string) ($record['fieldName'] ?? ''), '_title_') || str_contains((string) ($record['fieldName'] ?? ''), '_description_')) {
                return true;
            }
        }
        return false;
    });
    if ($related_has_native_copy) { ra_bind_scoped_product_related($related_product_ids, $by_name); }
    $summary = $GLOBALS['summary'];
    echo wp_json_encode(['rudnikagro_scoped_content' => $records, 'demoClones' => $demo_clones, 'summary' => $summary], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit;
}
function ra_structured_text_source(array $by_name, string $name): string {
    $field = ra_source_field($by_name, $name);
    if (!is_array($field) || !is_array($field['value'] ?? null)) { return ''; }
    $parts = [];
    foreach ($field['value'] as $segment) { if (is_array($segment) && is_string($segment['value'] ?? null)) { $parts[] = $segment['value']; } }
    return ra_repair_source_encoding(implode('', $parts));
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
        update_field('field_ra_careers_banner', ['title' => ra_string_source($by_name, 'rudnikagro_page_banner_title'), 'image' => $banner_id], $careers_id);
    }
    $current_banner_id = (int) get_post_meta($careers_id, 'rudnikagro_page_banner_image', true);
    if ($current_banner_id && get_post_meta($current_banner_id, '_rudnikagro_source_asset', true) === 'assets/careers/349-1377-heading-raw-1.png') {
        $banner_id = ra_import_attachment($snapshot, 'assets/careers/349-1377-heading.png', 'rudnikagro_page_banner_image_composition');
        update_post_meta($careers_id, 'rudnikagro_page_banner_image', $banner_id);
    }
    $careers_text_fields = ['rudnikagro_careers_cta_heading' => 'rudnikagro_careers_cta_heading', 'rudnikagro_careers_cta_button_label' => 'rudnikagro_careers_cta_button_label'];
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
        . '<p>[text contact-company autocomplete:organization placeholder "' . esc_attr($labels['company']) . '"]</p>'
        . '<p>[email* contact-email autocomplete:email placeholder "' . esc_attr($labels['email']) . '"]</p>'
        . '<p>[tel* contact-phone autocomplete:tel placeholder "' . esc_attr($labels['phone']) . '"]</p>'
        . '</div>'
        . '<p class="c-contact-form__message">[textarea* contact-message placeholder "' . esc_attr($labels['message']) . '"]</p>'
        . '<p class="c-contact-form__privacy">[acceptance contact-privacy]' . esc_html($labels['privacy']) . '[/acceptance]</p>'
        . '<p class="c-contact-form__submit">[submit "' . esc_attr($labels['submit']) . '"]</p>'
        . '<p class="c-contact-form__email-note">' . esc_html($labels['email_note']) . '</p>';
}
function ra_create_contact_form(array $by_name): int {
    global $summary;
    if (!post_type_exists('wpcf7_contact_form')) { return 0; }
    $labels = [
        'name' => ra_string_source($by_name, 'emko_contact_overview_name_placeholder_125_2358'),
        'company' => ra_string_source($by_name, 'emko_contact_overview_company_placeholder_125_2363'),
        'email' => ra_string_source($by_name, 'emko_contact_overview_email_placeholder_125_2365'),
        'phone' => ra_string_source($by_name, 'emko_contact_overview_phone_placeholder_125_2367'),
        'message' => ra_string_source($by_name, 'emko_contact_overview_message_placeholder_125_2361'),
        'submit' => ra_string_source($by_name, 'emko_contact_overview_submit_label_125_2372'),
        'privacy' => ra_string_source($by_name, 'emko_contact_overview_privacy_consent_125_2369'),
        'email_note' => ra_string_source($by_name, 'emko_contact_overview_email_usage_note_125_2368'),
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
    update_post_meta($form_id, '_rudnikagro_source', 'figma:XBiSgFXDfm5YsZSm4lWBUq');
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

if (empty($page_ids['contact'])) {
    $existing_contact_page = get_page_by_path('kontakt', OBJECT, 'page');
    if ($existing_contact_page) { $page_ids['contact'] = (int) $existing_contact_page->ID; }
}
if (!empty($page_ids['contact'])) {
    $contact_id = (int) $page_ids['contact'];
    if (get_post_meta($contact_id, '_wp_page_template', true) === '' && is_file($theme . '/template-contact.php')) {
        update_post_meta($contact_id, '_wp_page_template', 'template-contact.php');
    }
    $form_id = ra_create_contact_form($by_name);
    if (get_post_meta($contact_id, 'rudnikagro_contact_heading_title', true) === '') {
        update_field('field_ra_contact_heading', [
            'title' => ra_string_source($by_name, 'rudnikagro_contact_heading_title'),
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
            'name_label' => ra_string_source($by_name, 'emko_contact_overview_name_placeholder_125_2358'),
            'email_label' => ra_string_source($by_name, 'emko_contact_overview_email_placeholder_125_2365'),
            'phone_label' => ra_string_source($by_name, 'emko_contact_overview_phone_placeholder_125_2367'),
            'message_label' => ra_string_source($by_name, 'emko_contact_overview_message_placeholder_125_2361'),
            'submit_label' => ra_string_source($by_name, 'emko_contact_overview_submit_label_125_2372'),
            'privacy_notice' => ra_string_source($by_name, 'emko_contact_overview_privacy_consent_125_2369'),
        ], $contact_id);
    }
    if (get_post_meta($contact_id, 'rudnikagro_contact_form', true) === '' && $form_id) { update_field('field_ra_contact_form', $form_id, $contact_id); }
    if (get_post_meta($contact_id, 'rudnikagro_contact_map_image', true) === '') {
        $map_id = ra_import_attachment($snapshot, 'assets/contact-form/form-input-125-2374.png', 'rudnikagro_contact_map_image');
        if ($map_id) {
            update_post_meta($map_id, '_rudnikagro_source_node', '125:2374');
            update_post_meta($map_id, 'data-factory-source-node', '125:2374');
            update_post_meta($map_id, 'data-factory-section', 'contact-form');
            update_field('field_ra_contact_map', $map_id, $contact_id);
        }
    }
    if (get_post_meta($contact_id, 'rudnikagro_contact_map_marker', true) === '') {
        $marker_id = ra_import_attachment($snapshot, 'assets/contact-form/objects-125-2375.svg', 'emko_contact_form_map_marker_125_2375');
        if ($marker_id) {
            update_post_meta($marker_id, '_rudnikagro_source_node', '125:2375');
            update_post_meta($marker_id, 'data-factory-source-node', '125:2375');
            update_post_meta($marker_id, 'data-factory-section', 'contact-form');
            update_post_meta($contact_id, 'rudnikagro_contact_map_marker', $marker_id);
        }
    }
}

if (!empty($page_ids['catalogues']) || get_page_by_path('katalogi', OBJECT, 'page')) {
    $catalogues_id = !empty($page_ids['catalogues']) ? (int) $page_ids['catalogues'] : ra_scoped_catalogues_page_id();
    if (get_post_meta($catalogues_id, '_wp_page_template', true) === '') { update_post_meta($catalogues_id, '_wp_page_template', 'page-catalogues.php'); }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues_banner_title', true) === '') {
        update_field('field_ra_catalogues_banner', [
            'title' => ra_string_source($by_name, 'rudnikagro_catalogues_347_1231') ?: 'Foldery i katalogi fabryczne do pobrania w formacie PDF',
            'image' => 0,
        ], $catalogues_id);
    }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues', true) === '') {
        $catalogues = [
            [
                'title' => ra_string_source($by_name, 'emko_catalogues_primary_card_1_title_125_2522'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2509.png', 'rudnikagro_catalogues_primary_media_125_2509'),
                'pdf_label' => ra_string_source($by_name, 'emko_catalogues_primary_card_1_download_label_125_2527'),
                'pdf' => 0,
            ],
            [
                'title' => ra_string_source($by_name, 'emko_catalogues_primary_card_2_title_125_2523'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2513.png', 'rudnikagro_catalogues_primary_media_125_2513'),
                'pdf_label' => ra_string_source($by_name, 'emko_catalogues_primary_card_2_download_label_125_2530'),
                'pdf' => 0,
            ],
            [
                'title' => ra_string_source($by_name, 'emko_catalogues_primary_card_3_title_125_2524'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2517.png', 'rudnikagro_catalogues_primary_media_125_2517'),
                'pdf_label' => ra_string_source($by_name, 'emko_catalogues_primary_card_3_download_label_125_2533'),
                'pdf' => 0,
            ],
            [
                'title' => ra_string_source($by_name, 'emko_catalogues_primary_card_4_title_125_2525'),
                'cover' => ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2539.png', 'rudnikagro_catalogues_primary_media_125_2539'),
                'pdf_label' => ra_string_source($by_name, 'emko_catalogues_primary_card_4_download_label_125_2536'),
                'pdf' => 0,
            ],
        ];
        update_field('field_ra_catalogues_cards', $catalogues, $catalogues_id);
    }
    $catalogues_cards = function_exists('get_field') ? get_field('rudnikagro_catalogues', $catalogues_id) : [];
    if (is_array($catalogues_cards)) {
        $catalogue_media = [
            ['assets/catalogues-primary/asset-125-2509.png', 'rudnikagro_catalogues_primary_media_125_2509'],
            ['assets/catalogues-primary/asset-125-2513.png', 'rudnikagro_catalogues_primary_media_125_2513'],
            ['assets/catalogues-primary/asset-125-2517.png', 'rudnikagro_catalogues_primary_media_125_2517'],
            ['assets/catalogues-primary/asset-125-2539.png', 'rudnikagro_catalogues_primary_media_125_2539'],
        ];
        $catalogues_changed = false;
        foreach ($catalogue_media as $index => [$asset, $field_name]) {
            if (!isset($catalogues_cards[$index]) || !empty($catalogues_cards[$index]['cover'])) { continue; }
            $catalogues_cards[$index]['cover'] = ra_import_attachment($snapshot, $asset, $field_name);
            $catalogues_changed = true;
        }
        if ($catalogues_changed) { update_field('field_ra_catalogues_cards', $catalogues_cards, $catalogues_id); }
    }
    if (get_post_meta($catalogues_id, 'rudnikagro_catalogues_download_icon', true) === '') {
        update_field('field_ra_catalogues_download_icon', ra_import_attachment($snapshot, 'assets/catalogues-primary/asset-125-2528.png', 'rudnikagro_catalogues_primary_download_icon_125_2528'), $catalogues_id);
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
    if (!get_post_thumbnail_id($card_post_id)) { set_post_thumbnail($card_post_id, ra_import_attachment($snapshot, $image, 'rudnikagro_blog_card_image_' . str_replace(':', '-', $node_id))); }
}
if (!ra_is_populated_option('rudnikagro_blog_archive_header')) {
    // The current frozen archive-section record starts at the cards. Its
    // source reference still supplies the compact heading copy, but contains
    // no separately exported heading fields or banner asset.
    $archive_banner_label = ra_string_source($by_name, 'rudnikagro_blog_archive_heading_banner_label');
    update_field('field_ra_blog_archive_header', [
        'banner_label' => $archive_banner_label !== '' ? $archive_banner_label : 'Blog',
        // Keep this editor field empty until an actual source export is
        // available; the source variant uses its neutral CSS surface.
        'banner' => 0,
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
            $cart_title = ra_repair_source_encoding((string) (ra_source_field($by_name, 'rudnikagro_cart_heading')['value'] ?? ''));
            $current_title = (string) get_post_field('post_title', $id);
            $last_imported_title = (string) get_post_meta($id, '_rudnikagro_last_imported_cart_title', true);
            // "Cart" is WooCommerce's setup-wizard baseline. Thereafter, only
            // refresh the title when it still equals this importer's last value.
            $is_untracked_wizard_title = $last_imported_title === '' && $current_title === 'Cart';
            if ($cart_title !== '' && ($is_untracked_wizard_title || ($last_imported_title !== '' && $current_title === $last_imported_title))) {
                if ($current_title !== $cart_title) { wp_update_post(['ID' => $id, 'post_title' => $cart_title]); }
                update_post_meta($id, '_rudnikagro_last_imported_cart_title', $cart_title);
            }
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
        'product' => ['slug' => 'aquatos-5l', 'source_node' => '323:2084', 'overview' => 'product-overview', 'tabs' => 'product-tabs', 'benefits' => 'product-benefits', 'gallery' => 'assets/product-aquatos-5l.png', 'gallery_key' => 'rudnikagro_product_gallery_aquatos'],
        'product-bundle' => ['slug' => 'pakiet-ochronny-rzepaku-ozimego-12-ha', 'source_node' => '586:1245', 'overview' => 'product-bundle-overview', 'tabs' => 'bundle-tabs', 'benefits' => 'bundle-benefits', 'gallery' => 'assets/product-bundle-rapeseed.png', 'gallery_key' => 'rudnikagro_product_gallery_bundle'],
    ];
    foreach ($product_imports as $route => $config) {
        $ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'name' => $config['slug'], 'fields' => 'ids', 'numberposts' => 1]);
        if (!$ids) { continue; }
        $id = (int) $ids[0];
        update_post_meta($id, '_rudnikagro_owned', '1');
        if ((string) get_post_meta($id, '_rudnikagro_source_node', true) === '') { update_post_meta($id, '_rudnikagro_source_node', $config['source_node']); }
        $overview = ra_section_values($by_name, $config['overview']); $tab_values = ra_section_values($by_name, $config['tabs']);
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

        // The frozen bundle state repeats these two explicitly sourced related
        // products. Keep the WooCommerce relationship native and preserve any
        // later editor override using the same owned-value rule as Aquatos.
        $bundle_ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'name' => 'pakiet-ochronny-rzepaku-ozimego-12-ha', 'fields' => 'ids', 'numberposts' => 1]);
        if ($bundle_ids) {
            $bundle_id = (int) $bundle_ids[0];
            $current_related = get_post_meta($bundle_id, '_upsell_ids', true);
            $last_related = get_post_meta($bundle_id, '_rudnikagro_last_imported_related_ids', true);
            if ($current_related === '' || $current_related === $last_related) {
                update_post_meta($bundle_id, '_upsell_ids', $related_ids);
                update_post_meta($bundle_id, '_rudnikagro_last_imported_related_ids', $related_ids);
            }
        }

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
    ra_import_product_related_cards($fields, $snapshot);
}

ra_import_product_detail_content($snapshot);
ra_import_product_gallery_content($snapshot);

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
