<?php
/** Read-only native-content evidence for source-owned commerce records. */
if (!defined('ABSPATH')) { exit(1); }

$source_map = get_template_directory() . '/.factory-cache/figma/latest/content-map.json';
$source_fields = is_readable($source_map) ? json_decode((string) file_get_contents($source_map), true) : [];
$content_keys_raw = getenv('FACTORY_RUDNIKAGRO_CONTENT_SOURCE_KEYS');
$content_keys = $content_keys_raw !== false && trim($content_keys_raw) !== ''
    ? array_values(array_unique(array_map('strval', (array) json_decode($content_keys_raw, true))))
    : [];
$listing_keys_raw = getenv('FACTORY_RUDNIKAGRO_LISTING_KEYS');
$listing_keys = $listing_keys_raw !== false && trim($listing_keys_raw) !== ''
    ? array_values(array_unique(array_map('strval', (array) json_decode($listing_keys_raw, true))))
    : [];
$front_page_id = (int) get_option('page_on_front');
$content_target = static function (string $source_name) use ($front_page_id): array {
    if (preg_match('/^emko_product_list_filters_(heading|strength_label|strength_unit|strength_min|strength_max|extension_label|extension_unit|extension_min|extension_max|button)_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => 'product-list-filters'];
    }
    if (preg_match('/^emko_product_list_menu_(category_(?:[1-9]|arrow)|heading)_\d+_\d+$/', $source_name)) {
        $suffix = preg_replace('/^emko_product_list_menu_/', '', $source_name);
        $suffix = preg_replace('/_\d+_\d+$/', '', (string) $suffix);
        return ['field' => $source_name, 'key' => 'field_ra_product_list_menu_' . $suffix, 'storage' => 'acf', 'identity' => 'product-list-menu'];
    }
    if (preg_match('/^emko_product_(detail_(title|image|description|features|contact_label|download_label|download_icon|benefits_heading)|gallery_image_[12]|specification_(tabs|table_header|row_[1-8])|contact_cta_(background|arrow|heading|button_label))_\d+_\d+$/', $source_name, $matches)) {
        $prefix = (string) $matches[1];
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => str_starts_with($prefix, 'detail_') ? 'product-detail' : (str_starts_with($prefix, 'gallery_') ? 'product-gallery' : (str_starts_with($prefix, 'specification_') ? 'product-specification' : 'product-contact-cta'))];
    }
    if (preg_match('/^emko_product_related_(heading|all_label|all_icon)_\d+_\d+$/', $source_name)) {
        $suffix = preg_replace('/^emko_product_related_/', '', $source_name);
        $suffix = preg_replace('/_\d+_\d+$/', '', (string) $suffix);
        return ['field' => $source_name, 'key' => 'field_ra_product_related_' . $suffix, 'storage' => 'acf', 'identity' => 'product-related'];
    }
    if (preg_match('/^emko_product_related_card_arrow_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => 'field_ra_product_related_card_arrow', 'storage' => 'acf', 'identity' => 'product-related-arrow-icon'];
    }
    if (preg_match('/^emko_product_related_card_(\d+)_(image|title|description)_\d+_\d+$/', $source_name, $matches)) {
        $field = (string) $matches[2];
        return ['field' => $field === 'title' ? 'post_title' : ($field === 'description' ? 'post_excerpt' : 'post_thumbnail'), 'key' => '', 'storage' => $field === 'image' ? 'product-media' : 'product', 'identity' => 'product-related-card-' . (int) $matches[1], 'card' => (int) $matches[1]];
    }
    if (preg_match('/^emko_about_hero_(background|pattern_a|pattern_b|body|image|title|button_label)_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => 'source-key'];
    }
    if (preg_match('/^emko_service_media_band_(image|mask)_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => $source_name];
    }
    if (preg_match('/^emko_blog_post_article_body_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => 'blog-post-article'];
    }
    if (preg_match('/^emko_blog_post_related_(heading|all_label|all_arrow)_\d+_\d+$/', $source_name)) {
        return ['field' => $source_name, 'key' => '', 'storage' => 'option', 'identity' => 'blog-post-related'];
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
    $targets = [
        'rudnikagro_shared_header_tagline_125_10' => ['field' => 'rudnikagro_shared_header_tagline_125_10', 'key' => '', 'storage' => 'option'],
        'rudnikagro_shared_header_phone_125_11' => ['field' => 'rudnikagro_shared_secondary_navigation_156_92', 'key' => 'field_ra_phone', 'storage' => 'acf'],
        'rudnikagro_shared_header_mobile_125_12' => ['field' => 'rudnikagro_shared_header_mobile_125_12', 'key' => '', 'storage' => 'option'],
        'rudnikagro_shared_header_email_125_13' => ['field' => 'rudnikagro_shared_secondary_navigation_93_31', 'key' => 'field_ra_email', 'storage' => 'acf'],
        'rudnikagro_shared_header_primary_navigation_125_5' => ['field' => 'rudnikagro_shared_primary_navigation_93_29', 'key' => 'field_ra_primary_source', 'storage' => 'acf'],
    ];
    return $targets[$source_name] ?? ['field' => $source_name, 'key' => '', 'storage' => 'option'];
};
$catalogues_page_id = static function (): int {
    $ids = get_posts(['post_type' => 'page', 'post_status' => 'any', 'meta_key' => '_rudnikagro_route_id', 'meta_value' => 'catalogues', 'fields' => 'ids', 'numberposts' => 1]);
    if ($ids) { return (int) $ids[0]; }
    $page = get_page_by_path('katalogi', OBJECT, 'page');
    return $page ? (int) $page->ID : 0;
};
$content_source_value = static function ($value): string {
    if (is_array($value)) { return implode("\n", array_map('strval', $value)); }
    return is_scalar($value) ? (string) $value : '';
};
$content_last_key = static function (array $target): string {
    return ($target['storage'] === 'option' ? 'rudnikagro_scoped_last_imported_' : '_rudnikagro_last_imported_option_') . $target['field'];
};
$content_source_by_key = [];
foreach (($source_fields['fields'] ?? []) as $field) {
    $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
    if ($content_keys && in_array($key, $content_keys, true)) { $content_source_by_key[$key] = $field; }
}
$content_records_raw = getenv('FACTORY_RUDNIKAGRO_CONTENT_RECORDS');
if ($content_records_raw !== false && trim($content_records_raw) !== '') {
    if (!$content_keys) { throw new RuntimeException('Explicit content records require content source keys.'); }
    $content_records = json_decode($content_records_raw, true);
    if (!is_array($content_records) || count($content_records) !== count($content_keys)) {
        throw new RuntimeException('FACTORY_RUDNIKAGRO_CONTENT_RECORDS must match content source keys exactly.');
    }
    $explicit_keys = [];
    foreach ($content_records as $field) {
        if (!is_array($field) || empty($field['fieldName']) || empty($field['nodeId'])) {
            throw new RuntimeException('Explicit content records must contain fieldName and nodeId.');
        }
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) $field['nodeId'], (string) $field['fieldName']]);
        $explicit_keys[] = $key;
        $content_source_by_key[$key] = $field;
    }
    sort($explicit_keys);
    $scope_keys = $content_keys;
    sort($scope_keys);
    if ($explicit_keys !== $scope_keys || count(array_unique($explicit_keys)) !== count($explicit_keys)) {
        throw new RuntimeException('Explicit content records contain missing or out-of-scope keys.');
    }
}
$owned_content = [];
foreach ($content_keys as $content_key) {
    $source = $content_source_by_key[$content_key] ?? [];
    $source_name = (string) ($source['fieldName'] ?? '');
    $target = $content_target($source_name);
    if (isset($target['identity']) && str_starts_with((string) $target['identity'], 'product-related-card-')) {
        $product_ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_product_related_identity', 'meta_value' => $target['identity'], 'fields' => 'ids', 'numberposts' => 1]);
        $product_id = $product_ids ? (int) $product_ids[0] : 0;
        $is_image = ($source['type'] ?? '') === 'image';
        $is_description = ($target['field'] ?? '') === 'post_excerpt';
        $current_value = $product_id ? ($is_image ? (string) (int) get_post_thumbnail_id($product_id) : (string) get_post_field($is_description ? 'post_excerpt' : 'post_title', $product_id)) : '';
        $last_key = $is_image ? '_rudnikagro_last_imported_thumbnail_id' : ($is_description ? '_rudnikagro_last_imported_excerpt' : '_rudnikagro_last_imported_title');
        $last_imported = $product_id ? get_post_meta($product_id, $last_key, true) : null;
        $field_suffix = $is_image ? 'image' : ($is_description ? 'description' : 'title');
        $source_identity = $product_id ? (string) get_post_meta($product_id, '_rudnikagro_source_content_' . $target['identity'] . '_' . $field_suffix, true) : '';
        $owned_content[] = [
            'sourceKey' => $content_key, 'sourceNode' => (string) ($source['nodeId'] ?? ''), 'sourceField' => $source_name,
            'sourceSection' => (string) ($source['section'] ?? ''), 'targetField' => $target['field'], 'targetFieldKey' => '',
            'sourceIdentity' => $source_identity, 'nativeIdentity' => $target['identity'],
            'lastImportedValue' => $last_imported === '' ? null : $last_imported, 'nativeId' => $product_id ? (string) $product_id : null,
            'targetStorage' => $target['storage'], 'preservedOverride' => $last_imported !== null && (string) $last_imported !== '' && (string) $current_value !== (string) $last_imported,
            'value' => $product_id ? $current_value : null,
        ];
        if ($is_image) {
            $owned_content[count($owned_content) - 1]['mediaId'] = $product_id && $current_value !== '' ? (int) $current_value : null;
            $media_id = $product_id && $current_value !== '' ? (int) $current_value : 0;
            $owned_content[count($owned_content) - 1]['mediaSourceNode'] = $media_id ? (string) get_post_meta($media_id, 'data-factory-source-node', true) : '';
            $owned_content[count($owned_content) - 1]['mediaSourceAsset'] = $media_id ? (string) get_post_meta($media_id, '_rudnikagro_source_asset', true) : '';
            $owned_content[count($owned_content) - 1]['mediaSourceSection'] = $media_id ? (string) get_post_meta($media_id, 'data-factory-section', true) : '';
        }
        continue;
    }
    if (($target['storage'] ?? '') === 'post-acf' && ($target['identity'] ?? '') !== '' && ($target['page_route'] ?? '') === 'catalogues') {
        $page_id = $catalogues_page_id();
        $cards = $page_id && function_exists('get_field') ? get_field('rudnikagro_catalogues', $page_id) : null;
        $cards = is_array($cards) ? array_values($cards) : [];
        $row = (int) ($target['row'] ?? -1);
        $subfield = (string) ($target['subfield'] ?? '');
        $current_value = $row >= 0 && isset($cards[$row]) ? (string) ($cards[$row][$subfield] ?? '') : '';
        $last_key = '_rudnikagro_last_imported_catalogue_card_' . ($row + 1) . '_' . $subfield;
        $source_identity = $page_id ? (string) get_post_meta($page_id, '_rudnikagro_source_content_catalogue_card_' . ($row + 1) . '_' . $subfield, true) : '';
        $last_imported = $page_id ? get_post_meta($page_id, $last_key, true) : null;
        $source_value = $content_source_value($source['value'] ?? null);
        $owned_content[] = [
            'sourceKey' => $content_key,
            'sourceNode' => (string) ($source['nodeId'] ?? ''),
            'sourceField' => $source_name,
            'sourceSection' => (string) ($source['section'] ?? ''),
            'targetField' => $target['field'],
            'targetFieldKey' => $target['key'],
            'sourceIdentity' => $source_identity,
            'nativeIdentity' => $target['identity'],
            'lastImportedValue' => $last_imported === '' ? null : $last_imported,
            'nativeId' => $page_id ? (string) $page_id : null,
            'targetStorage' => $target['storage'],
            'preservedOverride' => $last_imported !== null
                ? (string) $last_imported === $source_value && $current_value !== $source_value
                : $current_value !== '' && $current_value !== $source_value,
            'value' => $page_id ? $current_value : null,
        ];
        continue;
    }
    if (isset($target['identity']) && (str_starts_with((string) $target['identity'], 'blog-archive-card-') || str_starts_with((string) $target['identity'], 'blog-post-related-card-'))) {
        $post_ids = get_posts(['post_type' => 'post', 'post_status' => 'any', 'meta_key' => '_rudnikagro_blog_card_identity', 'meta_value' => $target['identity'], 'fields' => 'ids', 'numberposts' => 1]);
        $post_id = $post_ids ? (int) $post_ids[0] : 0;
        $current_value = '';
        $last_imported = null;
        $source_identity = '';
        $is_image = ($source['type'] ?? '') === 'image';
        if ($post_id) {
            $current_value = $target['field'] === 'post_title'
                ? (string) get_post_field('post_title', $post_id)
                : ($target['field'] === 'post_excerpt' ? (string) get_post_field('post_excerpt', $post_id) : ($is_image ? (string) (int) get_field($target['field'], $post_id) : (string) get_field($target['field'], $post_id)));
            $last_key = '_rudnikagro_last_imported_' . ($target['field'] === 'rudnikagro_blog_card_date' ? 'blog_card_date' : ltrim((string) $target['field'], '_'));
            $last_imported = get_post_meta($post_id, $last_key, true);
            $source_identity = (string) get_post_meta($post_id, '_rudnikagro_source_content_' . $target['field'], true);
        }
        $source_value = $is_image ? '' : $content_source_value($source['value'] ?? null);
        $media_id = $is_image && $post_id ? (int) $current_value : 0;
        $owned_content[] = [
            'sourceKey' => $content_key,
            'sourceNode' => (string) ($source['nodeId'] ?? ''),
            'sourceField' => $source_name,
            'sourceSection' => (string) ($source['section'] ?? ''),
            'targetField' => $target['field'],
            'targetFieldKey' => $target['key'],
            'sourceIdentity' => $source_identity,
            'nativeIdentity' => $target['identity'],
            'lastImportedValue' => $last_imported === '' ? null : $last_imported,
            'nativeId' => $post_id ? (string) $post_id : null,
            'targetStorage' => $target['storage'],
            'preservedOverride' => $last_imported !== null && (string) $last_imported === $source_value && $current_value !== $source_value,
            'value' => $post_id ? $current_value : null,
        ];
        if ($is_image) {
            $owned_content[count($owned_content) - 1]['mediaId'] = $media_id ?: null;
            $owned_content[count($owned_content) - 1]['mediaSourceNode'] = $media_id ? (string) get_post_meta($media_id, 'data-factory-source-node', true) : '';
            $owned_content[count($owned_content) - 1]['mediaSourceAsset'] = $media_id ? (string) get_post_meta($media_id, '_rudnikagro_source_asset', true) : '';
            $owned_content[count($owned_content) - 1]['mediaSourceSection'] = $media_id ? (string) get_post_meta($media_id, 'data-factory-section', true) : '';
            $owned_content[count($owned_content) - 1]['preservedOverride'] = $last_imported !== null && (string) $last_imported !== '' && (string) $current_value !== (string) $last_imported;
        }
        continue;
    }
    $value = null;
    $is_image = ($source['type'] ?? '') === 'image';
    $source_value = $is_image ? '' : $content_source_value($source['value'] ?? null);
    $value = function_exists('get_field') ? get_field($target['field'], 'option') : null;
    if (($value === null || $value === false || $value === '') && $target['storage'] === 'option') { $value = get_option('options_' . $target['field'], null); }
    if ($value === null && $target['storage'] === 'option') { $value = get_option($target['field'], null); }
    if (is_array($value)) { $value = implode("\n", array_map('strval', $value)); }
    $identity = (string) get_option('_rudnikagro_source_option_' . $target['field'], '');
    $last_imported = get_option($content_last_key($target), null);
    $current_value = $value === null ? '' : (string) $value;
    $media_id = $is_image && is_numeric($value) ? (int) $value : 0;
    $media_source_node = $media_id ? (string) get_post_meta($media_id, 'data-factory-source-node', true) : '';
    $media_source_asset = $media_id ? (string) get_post_meta($media_id, '_rudnikagro_source_asset', true) : '';
    $media_source_section = $media_id ? (string) get_post_meta($media_id, 'data-factory-section', true) : '';
    $media_matches_source = $is_image
        && $media_source_node === (string) ($source['value']['media']['sourceNodeId'] ?? '')
        && $media_source_asset === (string) ($source['value']['media']['path'] ?? '')
        && $media_source_section === (string) ($source['section'] ?? '');
    $owned_content[] = [
        'sourceKey' => $content_key,
        'sourceNode' => (string) ($source['nodeId'] ?? ''),
        'sourceField' => $source_name,
        'sourceSection' => (string) ($source['section'] ?? ''),
        'targetField' => $target['field'],
        'targetFieldKey' => $target['key'],
        'sourceIdentity' => $identity,
        'lastImportedValue' => $last_imported,
        'nativeId' => 'option',
        'nativeIdentity' => preg_match('/^emko_(service_media_band|about_hero)_/', $source_name) ? $content_key : ($target['identity'] ?? ''),
        'targetStorage' => $target['storage'],
        'preservedOverride' => $is_image
            ? ($media_id > 0 && !$media_matches_source && (preg_match('/^emko_about_hero_/', $source_name) || $identity !== '' && $identity !== $content_key || $last_imported !== null && (string) $media_id !== (string) $last_imported))
            : ($last_imported !== null
                ? (string) $last_imported === $source_value && $current_value !== $source_value
                : $current_value !== '' && $current_value !== $source_value),
        'value' => $value,
    ];
    if ($is_image) {
        $owned_content[count($owned_content) - 1]['mediaId'] = $media_id ?: null;
        $owned_content[count($owned_content) - 1]['mediaSourceNode'] = $media_source_node;
        $owned_content[count($owned_content) - 1]['mediaSourceAsset'] = $media_source_asset;
        $owned_content[count($owned_content) - 1]['mediaSourceSection'] = $media_source_section;
    }
}
$source_products = array_values(array_filter($source_fields['fields'] ?? [], static function ($field): bool {
    return ($field['type'] ?? '') === 'product';
}));
$scoped_source_keys_raw = getenv('FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_KEYS');
$scoped_source_keys = [];
if ($scoped_source_keys_raw !== false && trim($scoped_source_keys_raw) !== '') {
    $scoped_source_keys = array_values(array_unique(array_map('strval', (array) json_decode($scoped_source_keys_raw, true))));
    $source_products = array_values(array_filter($source_products, static function ($field) use ($scoped_source_keys): bool {
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
        return in_array($key, $scoped_source_keys, true);
    }));
}
$scoped_source_nodes_raw = getenv('FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_NODES');
$scoped_source_nodes = [];
if ($scoped_source_nodes_raw !== false && trim($scoped_source_nodes_raw) !== '') {
    $scoped_source_nodes = array_values(array_unique(array_map('strval', (array) json_decode($scoped_source_nodes_raw, true))));
    $source_products = array_values(array_filter($source_products, static fn($field): bool => in_array((string) ($field['nodeId'] ?? ''), $scoped_source_nodes, true)));
}
if ($listing_keys && !$scoped_source_keys) {
    $scoped_source_keys = $listing_keys;
    $source_products = array_values(array_filter($source_products, static function ($field) use ($scoped_source_keys): bool {
        $key = implode(':', [(string) ($field['language'] ?? 'pl'), (string) ($field['nodeId'] ?? ''), (string) ($field['fieldName'] ?? '')]);
        return in_array($key, $scoped_source_keys, true);
    }));
}

$term_payload = static function (string $taxonomy): array {
    return array_map(static function ($term): array {
        return [
            'id' => (int) $term->term_id,
            'name' => (string) $term->name,
            'slug' => (string) $term->slug,
            'parent' => (int) $term->parent,
            'count' => (int) $term->count,
            'sourceRoute' => (string) get_term_meta($term->term_id, '_rudnikagro_route_id', true),
        ];
    }, get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false, 'orderby' => 'term_id', 'order' => 'ASC']));
};

$attribute_payload = [];
if (function_exists('wc_get_attribute_taxonomies')) {
    foreach (wc_get_attribute_taxonomies() as $attribute) {
        $taxonomy = wc_attribute_taxonomy_name($attribute->attribute_name);
        $attribute_payload[] = [
            'id' => (int) $attribute->attribute_id,
            'name' => (string) $attribute->attribute_name,
            'label' => (string) $attribute->attribute_label,
            'taxonomy' => $taxonomy,
            'options' => $term_payload($taxonomy),
        ];
    }
}

$product_ids = get_posts([
    'post_type' => 'product',
    'post_status' => 'any',
    'meta_key' => '_rudnikagro_owned',
    'meta_value' => '1',
    'fields' => 'ids',
    'numberposts' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
]);
if ($scoped_source_nodes) {
    $product_ids = array_values(array_filter($product_ids, static fn($product_id): bool => in_array((string) get_post_meta($product_id, '_rudnikagro_source_node', true), $scoped_source_nodes, true)));
}
if ($scoped_source_keys) {
    $product_ids = array_values(array_filter($product_ids, static fn($product_id): bool => in_array((string) get_post_meta($product_id, '_rudnikagro_source_key', true), $scoped_source_keys, true)));
}
$products = [];
$svg_references = [];
$collect_svg = static function ($value, string $field, array &$references) use (&$collect_svg): void {
    if (is_array($value)) {
        foreach ($value as $key => $child) { $collect_svg($child, $field . '.' . (string) $key, $references); }
        return;
    }
    $attachment_id = is_object($value) ? (int) ($value->ID ?? 0) : (int) $value;
    if (!$attachment_id || get_post_type($attachment_id) !== 'attachment' || get_post_mime_type($attachment_id) !== 'image/svg+xml') { return; }
    $references[] = ['field' => $field, 'attachmentId' => $attachment_id, 'sourceField' => (string) get_post_meta($attachment_id, '_rudnikagro_source_field', true)];
};

foreach ($product_ids as $product_id) {
    $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
    if (!$product) { continue; }
    $attributes = [];
    foreach ($product->get_attributes() as $name => $attribute) {
        $attributes[] = [
            'name' => (string) $name,
            'taxonomy' => $attribute->is_taxonomy() ? (string) $attribute->get_name() : null,
            'options' => array_values(array_map('strval', $attribute->get_options())),
            'visible' => (bool) $attribute->get_visible(),
            'variation' => (bool) $attribute->get_variation(),
        ];
    }
    $variations = [];
    if ($product->is_type('variable')) {
        foreach ($product->get_children() as $variation_id) {
            $variation = wc_get_product($variation_id);
            if (!$variation) { continue; }
            $variations[] = [
                'id' => (int) $variation_id,
                'sourceNode' => (string) get_post_meta($variation_id, '_rudnikagro_source_node', true),
                'regularPrice' => $variation->get_regular_price(),
                'salePrice' => $variation->get_sale_price(),
                'attributes' => $variation->get_attributes(),
                'priceProvenance' => json_decode((string) get_post_meta($variation_id, '_rudnikagro_price_provenance', true), true),
            ];
        }
    }
    $terms = [];
    foreach (get_object_taxonomies('product', 'names') as $taxonomy) {
        $terms[$taxonomy] = wp_get_object_terms($product_id, $taxonomy, ['fields' => 'ids']);
    }
    $reviews = get_comments(['post_id' => $product_id, 'type' => 'review', 'status' => 'all']);
    $field_values = function_exists('get_fields') ? (array) get_fields($product_id) : [];
    $collect_svg($field_values, 'product', $svg_references);
    $image_id = (int) get_post_thumbnail_id($product_id);
    $products[] = [
        'id' => (int) $product_id,
        'title' => get_the_title($product_id),
        'status' => get_post_status($product_id),
        'sourceNode' => (string) get_post_meta($product_id, '_rudnikagro_source_node', true),
        'sourceKey' => (string) get_post_meta($product_id, '_rudnikagro_source_key', true),
        'sourceSection' => (string) get_post_meta($product_id, '_rudnikagro_source_section', true),
        'route' => (string) get_post_meta($product_id, '_rudnikagro_route_id', true),
        'listingRelation' => [
            'route' => (string) get_post_meta($product_id, '_rudnikagro_route_id', true),
            'menuOrder' => (int) get_post_field('menu_order', $product_id),
            'lastImportedOrder' => ($last_listing_order = get_post_meta($product_id, '_rudnikagro_last_imported_listing_order', true)) === ''
                ? null : (int) $last_listing_order,
            'preservedOverride' => ($last_listing_order !== '' && (int) get_post_field('menu_order', $product_id) !== (int) $last_listing_order)
                || ($last_listing_order === '' && (int) get_post_field('menu_order', $product_id) !== 0),
        ],
        'source' => (string) get_post_meta($product_id, '_rudnikagro_source', true),
        'description' => (string) get_post_field('post_excerpt', $product_id),
        'ctaLabel' => (string) get_post_meta($product_id, '_rudnikagro_source_cta_label', true),
        'ctaSourceNode' => (string) get_post_meta($product_id, '_rudnikagro_source_cta_node', true),
        'imageId' => $image_id,
        'imageSourceNode' => (string) get_post_meta($image_id, 'data-factory-source-node', true),
        'imageSourceAsset' => (string) get_post_meta($image_id, '_rudnikagro_source_asset', true),
        'regularPrice' => $product->get_regular_price(),
        'salePrice' => $product->get_sale_price(),
        'priceProvenance' => json_decode((string) get_post_meta($product_id, '_rudnikagro_price_provenance', true), true),
        'terms' => $terms,
        'attributes' => $attributes,
        'variations' => $variations,
        'reviews' => array_map(static function ($review): array {
            return [
                'id' => (int) $review->comment_ID,
                'rating' => get_comment_meta($review->comment_ID, 'rating', true),
                'sourceNode' => get_comment_meta($review->comment_ID, '_rudnikagro_source_node', true),
                'provenance' => json_decode((string) get_comment_meta($review->comment_ID, '_rudnikagro_review_provenance', true), true),
            ];
        }, $reviews),
        'acf' => $field_values,
    ];
}

$option_values = function_exists('get_fields') ? (array) get_fields('option') : [];
$collect_svg($option_values, 'option', $svg_references);
$source_svg = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'post_mime_type' => 'image/svg+xml', 'meta_key' => '_rudnikagro_source_field', 'fields' => 'ids', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC']);
$svg_attachments = array_map(static function ($attachment_id) use ($svg_references): array {
    return [
        'id' => (int) $attachment_id,
        'sourceField' => (string) get_post_meta($attachment_id, '_rudnikagro_source_field', true),
        'sourceAsset' => (string) get_post_meta($attachment_id, '_rudnikagro_source_asset', true),
        'acfReferences' => array_values(array_filter($svg_references, static fn($reference) => (int) $reference['attachmentId'] === (int) $attachment_id)),
    ];
}, $source_svg);

echo wp_json_encode([
    'kind' => 'read-only-native-commerce-probe',
    'source' => ['project' => 'rudnikagro', 'sourceMap' => '.factory-cache/figma/latest/content-map.json', 'productRecords' => count($source_products), 'scopedSourceKeys' => $scoped_source_keys, 'scopedSourceNodes' => $scoped_source_nodes, 'listingKeys' => $listing_keys],
    'ownedProducts' => $products,
    'ownedContent' => $owned_content,
    'taxonomies' => ['product_cat' => $term_payload('product_cat'), 'product_tag' => $term_payload('product_tag')],
    'attributes' => $attribute_payload,
    'svgAttachments' => $svg_attachments,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
