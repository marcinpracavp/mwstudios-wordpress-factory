<?php
/** Read-only native-content evidence for the home card collections. */
if (!defined('ABSPATH')) { exit(1); }
$home_id = (int) get_option('page_on_front');
$collections = [];
foreach (['promoted', 'bundle', 'recommended'] as $name) {
    $ids = function_exists('get_field') ? (array) get_field('rudnikagro_home_' . $name . '_products', $home_id) : [];
    $collections[$name] = array_map(static function ($id): array {
        $id = is_object($id) ? (int) $id->ID : (int) $id;
        $product = function_exists('wc_get_product') ? wc_get_product($id) : null;
        $reviews = get_comments(['post_id' => $id, 'type' => 'review', 'status' => 'approve']);
        return [
            'id' => $id,
            'title' => get_the_title($id),
            'imageId' => (int) get_post_thumbnail_id($id),
            'regularPrice' => $product ? $product->get_regular_price() : null,
            'salePrice' => $product ? $product->get_sale_price() : null,
            'sourceNode' => get_post_meta($id, '_rudnikagro_source_node', true),
            'priceProvenance' => json_decode((string) get_post_meta($id, '_rudnikagro_price_provenance', true), true),
            'reviews' => array_map(static fn($review) => ['id' => (int) $review->comment_ID, 'rating' => get_comment_meta($review->comment_ID, 'rating', true), 'sourceNode' => get_comment_meta($review->comment_ID, '_rudnikagro_source_node', true)], $reviews),
        ];
    }, $ids);
}
$source_reviews = get_comments(['type' => 'review', 'status' => 'approve', 'meta_key' => '_rudnikagro_source_node']);
$review_evidence = array_map(static fn($review) => ['id' => (int) $review->comment_ID, 'productId' => (int) $review->comment_post_ID, 'rating' => get_comment_meta($review->comment_ID, 'rating', true), 'sourceNode' => get_comment_meta($review->comment_ID, '_rudnikagro_source_node', true)], $source_reviews);
echo wp_json_encode(['kind' => 'read-only-native-home-commerce-probe', 'homeId' => $home_id, 'collections' => $collections, 'sourceReviews' => $review_evidence], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
