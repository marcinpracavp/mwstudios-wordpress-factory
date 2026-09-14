<?php
if (!defined('ABSPATH')) { exit(1); }
$product_ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'name' => 'aquatos-5l', 'fields' => 'ids', 'numberposts' => 1]);
$product_id = $product_ids ? (int) $product_ids[0] : 0;
$variation_ids = $product_id ? get_posts(['post_type' => 'product_variation', 'post_parent' => $product_id, 'post_status' => 'any', 'fields' => 'ids', 'numberposts' => -1]) : [];
$variations = [];
foreach ($variation_ids as $id) { $variations[] = ['id' => (int) $id, 'attributes' => get_post_meta($id, 'attribute_pojemnosc', true), 'price' => get_post_meta($id, '_price', true), 'provenance' => json_decode((string) get_post_meta($id, '_rudnikagro_price_provenance', true), true)]; }
$cards = [];
foreach (['326:2271', '326:2289'] as $node) {
    $ids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_rudnikagro_source_node', 'meta_value' => $node, 'fields' => 'ids', 'numberposts' => 1]);
    if ($ids) { $id = (int) $ids[0]; $cards[] = ['id' => $id, 'sourceNode' => $node, 'title' => get_the_title($id), 'thumbnailId' => (int) get_post_thumbnail_id($id), 'price' => get_post_meta($id, '_price', true)]; }
}
$reviews = [];
if ($product_id) foreach (get_comments(['post_id' => $product_id, 'type' => 'review', 'status' => 'all']) as $review) { $reviews[] = ['id' => (int) $review->comment_ID, 'sourceNode' => get_comment_meta($review->comment_ID, '_rudnikagro_source_node', true), 'rating' => get_comment_meta($review->comment_ID, 'rating', true), 'provenance' => json_decode((string) get_comment_meta($review->comment_ID, '_rudnikagro_review_provenance', true), true)]; }
$icons = [];
foreach (['rudnikagro_checkout_icon_payment_card', 'rudnikagro_checkout_icon_google_pay', 'rudnikagro_checkout_icon_apple_pay', 'rudnikagro_checkout_icon_blik', 'rudnikagro_checkout_icon_bank_transfer', 'rudnikagro_checkout_icon_payment_radio', 'rudnikagro_checkout_icon_payment_radio_active', 'rudnikagro_checkout_icon_delivery_radio', 'rudnikagro_checkout_icon_delivery_radio_active'] as $field) { $icons[$field] = (int) get_field($field, 'option'); }
$categories = $product_id ? wp_get_object_terms($product_id, 'product_cat', ['fields' => 'all']) : [];
$category_map = array_map(static function ($term) { return ['id' => (int) $term->term_id, 'name' => $term->name, 'parentId' => (int) $term->parent]; }, $categories);
$gateways = WC()->payment_gateways()->payment_gateways();
echo wp_json_encode(['kind' => 'read-only-native-commerce-probe', 'checkout' => ['pageId' => (int) wc_get_page_id('checkout'), 'content' => (string) get_post_field('post_content', wc_get_page_id('checkout')), 'defaultCountry' => get_option('woocommerce_default_country')], 'product' => ['id' => $product_id, 'type' => $product_id ? wc_get_product($product_id)->get_type() : null, 'variations' => $variations, 'cards' => $cards, 'categories' => $category_map, 'reviews' => $reviews], 'checkoutIcons' => $icons, 'paymentGateways' => array_map(static function ($gateway) { return ['id' => $gateway->id, 'enabled' => $gateway->enabled, 'title' => $gateway->title]; }, $gateways), 'editorOverrideProbe' => 'not fabricated; no real pre-existing editor override was supplied'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
