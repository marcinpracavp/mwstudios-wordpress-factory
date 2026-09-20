<?php
/** Read-only native-content evidence for source-owned commerce records. */
if (!defined('ABSPATH')) { exit(1); }

$source_map = get_template_directory() . '/.factory-cache/figma/latest/content-map.json';
$source_fields = is_readable($source_map) ? json_decode((string) file_get_contents($source_map), true) : [];
$source_products = array_values(array_filter($source_fields['fields'] ?? [], static function ($field): bool {
    return ($field['section'] ?? '') === 'archive-product-grid' && ($field['type'] ?? '') === 'product';
}));
$scoped_source_nodes_raw = getenv('FACTORY_RUDNIKAGRO_PRODUCT_SOURCE_NODES');
$scoped_source_nodes = [];
if ($scoped_source_nodes_raw !== false && trim($scoped_source_nodes_raw) !== '') {
    $scoped_source_nodes = array_values(array_unique(array_map('strval', (array) json_decode($scoped_source_nodes_raw, true))));
    $source_products = array_values(array_filter($source_products, static fn($field): bool => in_array((string) ($field['nodeId'] ?? ''), $scoped_source_nodes, true)));
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
        'route' => (string) get_post_meta($product_id, '_rudnikagro_route_id', true),
        'source' => (string) get_post_meta($product_id, '_rudnikagro_source', true),
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
    'source' => ['project' => 'rudnikagro', 'sourceMap' => '.factory-cache/figma/latest/content-map.json', 'archiveProductRecords' => count($source_products), 'scopedSourceNodes' => $scoped_source_nodes],
    'ownedProducts' => $products,
    'taxonomies' => ['product_cat' => $term_payload('product_cat'), 'product_tag' => $term_payload('product_tag')],
    'attributes' => $attribute_payload,
    'svgAttachments' => $svg_attachments,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
