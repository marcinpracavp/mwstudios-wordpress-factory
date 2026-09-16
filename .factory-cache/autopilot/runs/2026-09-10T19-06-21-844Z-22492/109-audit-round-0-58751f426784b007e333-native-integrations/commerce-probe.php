<?php
/** Read-only native WooCommerce audit probe. */
if (!defined('ABSPATH')) {
    exit(1);
}

$products = [];
foreach (wc_get_products([
    'limit' => -1,
    'status' => ['publish', 'draft', 'private'],
    'orderby' => 'ID',
    'order' => 'ASC',
]) as $product) {
    $row = [
        'id' => $product->get_id(),
        'title' => $product->get_name(),
        'status' => $product->get_status(),
        'type' => $product->get_type(),
        'price' => $product->get_price(),
        'regularPrice' => $product->get_regular_price(),
        'salePrice' => $product->get_sale_price(),
        'imageId' => $product->get_image_id(),
        'categoryIds' => $product->get_category_ids(),
        'owned' => get_post_meta($product->get_id(), '_rudnikagro_owned', true),
        'sourceNode' => get_post_meta($product->get_id(), '_rudnikagro_source_node', true),
        'priceProvenance' => json_decode((string) get_post_meta($product->get_id(), '_rudnikagro_price_provenance', true), true),
        'lastImportedRegularPrice' => get_post_meta($product->get_id(), '_rudnikagro_last_imported_regular_price', true),
        'attributes' => [],
    ];

    foreach ($product->get_attributes() as $attribute) {
        $row['attributes'][] = [
            'name' => $attribute->get_name(),
            'options' => $attribute->get_options(),
            'variation' => $attribute->get_variation(),
        ];
    }

    if ($product->is_type('variable')) {
        $row['variations'] = [];
        foreach ($product->get_children() as $variation_id) {
            $variation = wc_get_product($variation_id);
            if (!$variation) {
                continue;
            }
            $row['variations'][] = [
                'id' => $variation_id,
                'attributes' => $variation->get_attributes(),
                'price' => $variation->get_price(),
                'regularPrice' => $variation->get_regular_price(),
                'owned' => get_post_meta($variation_id, '_rudnikagro_owned', true),
                'priceProvenance' => json_decode((string) get_post_meta($variation_id, '_rudnikagro_price_provenance', true), true),
                'lastImportedRegularPrice' => get_post_meta($variation_id, '_rudnikagro_last_imported_regular_price', true),
            ];
        }
    }

    $products[] = $row;
}

$categories = [];
foreach (get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]) as $term) {
    if (is_wp_error($term)) {
        continue;
    }
    $categories[] = [
        'id' => $term->term_id,
        'name' => $term->name,
        'parent' => $term->parent,
        'count' => $term->count,
    ];
}

$reviews = [];
foreach (get_comments(['type' => 'review', 'status' => 'approve', 'number' => 0]) as $comment) {
    $reviews[] = [
        'id' => $comment->comment_ID,
        'productId' => $comment->comment_post_ID,
        'rating' => get_comment_meta($comment->comment_ID, 'rating', true),
        'date' => $comment->comment_date,
        'author' => $comment->comment_author,
        'body' => $comment->comment_content,
        'sourceNode' => get_comment_meta($comment->comment_ID, '_rudnikagro_source_node', true),
        'provenance' => json_decode((string) get_comment_meta($comment->comment_ID, '_rudnikagro_review_provenance', true), true),
    ];
}

$home_id = (int) get_option('page_on_front');
$collections = [];
foreach (['promoted', 'bundle', 'recommended'] as $name) {
    $value = function_exists('get_field') ? (array) get_field('rudnikagro_home_' . $name . '_products', $home_id) : [];
    $collections[$name] = array_map(static function ($item): int {
        return is_object($item) ? (int) $item->ID : (int) $item;
    }, $value);
}

echo wp_json_encode([
    'kind' => 'read-only-native-commerce-audit',
    'generatedAt' => gmdate('c'),
    'site' => home_url('/'),
    'siteTitle' => get_bloginfo('name'),
    'plugins' => [
        'woocommerce' => is_plugin_active('woocommerce/woocommerce.php'),
        'acfPro' => is_plugin_active('advanced-custom-fields-pro/acf.php'),
        'contactForm7' => is_plugin_active('contact-form-7/wp-contact-form-7.php'),
    ],
    'products' => $products,
    'categories' => $categories,
    'reviews' => $reviews,
    'homeId' => $home_id,
    'homeCollections' => $collections,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
