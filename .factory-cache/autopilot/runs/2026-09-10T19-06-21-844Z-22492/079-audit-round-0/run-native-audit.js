const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const policy = require('../../../../../scripts/factory/autopilot/commerce-policy');

const outputPath = path.join(__dirname, 'native-commerce-icons-audit.json');
const wpScript = path.resolve(__dirname, '../../../../../scripts/factory/autopilot/wp.js');
const php = String.raw`
$products = [];
foreach (wc_get_products(['limit' => -1, 'status' => ['publish','draft','private'], 'orderby' => 'ID', 'order' => 'ASC']) as $product) {
  $row = [
    'id' => $product->get_id(), 'name' => $product->get_name(), 'status' => $product->get_status(),
    'type' => $product->get_type(), 'price' => $product->get_price(),
    'regularPrice' => $product->get_regular_price(), 'salePrice' => $product->get_sale_price(),
    'imageId' => $product->get_image_id(), 'categoryIds' => $product->get_category_ids(),
    'owned' => get_post_meta($product->get_id(), '_rudnikagro_owned', true),
    'sourceNode' => get_post_meta($product->get_id(), '_rudnikagro_source_node', true),
    'priceProvenance' => get_post_meta($product->get_id(), '_rudnikagro_price_provenance', true),
    'lastImportedRegularPrice' => get_post_meta($product->get_id(), '_rudnikagro_last_imported_regular_price', true),
    'attributes' => []
  ];
  foreach ($product->get_attributes() as $attribute) {
    $row['attributes'][] = ['name' => $attribute->get_name(), 'options' => $attribute->get_options(), 'variation' => $attribute->get_variation()];
  }
  if ($product->is_type('variable')) {
    $row['variations'] = [];
    foreach ($product->get_children() as $variation_id) {
      $variation = wc_get_product($variation_id);
      if (!$variation) continue;
      $row['variations'][] = [
        'id' => $variation_id, 'attributes' => $variation->get_attributes(),
        'price' => $variation->get_price(), 'regularPrice' => $variation->get_regular_price(),
        'owned' => get_post_meta($variation_id, '_rudnikagro_owned', true),
        'priceProvenance' => get_post_meta($variation_id, '_rudnikagro_price_provenance', true),
        'lastImportedRegularPrice' => get_post_meta($variation_id, '_rudnikagro_last_imported_regular_price', true)
      ];
    }
  }
  $products[] = $row;
}
$categories = [];
foreach (get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]) as $term) {
  if (is_wp_error($term)) continue;
  $categories[] = ['id' => $term->term_id, 'name' => $term->name, 'parent' => $term->parent, 'count' => $term->count];
}
$reviews = [];
foreach (get_comments(['type' => 'review', 'status' => 'approve', 'number' => 0]) as $comment) {
  $reviews[] = [
    'id' => $comment->comment_ID, 'productId' => $comment->comment_post_ID,
    'rating' => get_comment_meta($comment->comment_ID, 'rating', true),
    'date' => $comment->comment_date, 'author' => $comment->comment_author,
    'body' => $comment->comment_content,
    'provenance' => get_comment_meta($comment->comment_ID, '_rudnikagro_review_provenance', true)
  ];
}
$svgs = [];
foreach (get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'post_mime_type' => 'image/svg+xml', 'posts_per_page' => -1, 'orderby' => 'ID', 'order' => 'ASC']) as $attachment) {
  $svgs[] = [
    'id' => $attachment->ID, 'title' => $attachment->post_title, 'url' => wp_get_attachment_url($attachment->ID),
    'owned' => get_post_meta($attachment->ID, '_rudnikagro_owned', true),
    'sourceNode' => get_post_meta($attachment->ID, '_rudnikagro_source_node', true)
  ];
}
$acfMappings = [];
$collect = function($value, $path = '') use (&$collect, &$acfMappings) {
  if (is_array($value)) {
    if (isset($value['ID']) && preg_match('/(media|icon|logo|chevron)/i', $path)) $acfMappings[] = ['path' => $path, 'attachmentId' => (int) $value['ID']];
    foreach ($value as $key => $child) $collect($child, $path === '' ? (string) $key : $path . '.' . $key);
  } elseif (is_numeric($value) && preg_match('/(media|icon|logo|chevron)/i', $path)) {
    $acfMappings[] = ['path' => $path, 'attachmentId' => (int) $value];
  }
};
if (function_exists('get_fields')) {
  $collect(get_fields('option') ?: [], 'option');
  foreach ([54,55] as $product_id) $collect(get_fields($product_id) ?: [], 'product.' . $product_id);
}
$gateways = [];
foreach (WC_Payment_Gateways::instance()->payment_gateways() as $gateway) {
  $gateways[] = ['id' => $gateway->id, 'title' => $gateway->get_title(), 'enabled' => $gateway->enabled];
}
$result = [
  'site' => home_url('/'), 'siteTitle' => get_bloginfo('name'),
  'plugins' => ['woocommerce' => is_plugin_active('woocommerce/woocommerce.php'), 'acfPro' => is_plugin_active('advanced-custom-fields-pro/acf.php'), 'contactForm7' => is_plugin_active('contact-form-7/wp-contact-form-7.php')],
  'products' => $products, 'categories' => $categories, 'reviews' => $reviews,
  'svgAttachments' => $svgs, 'acfAttachmentMappings' => $acfMappings,
  'paymentGateways' => $gateways
];
echo wp_json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
`;

const run = spawnSync(process.execPath, [wpScript, 'eval', php], {
  cwd: path.resolve(__dirname, '../../../../..'),
  encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024
});
if (run.status !== 0) {
  fs.writeFileSync(outputPath, `${JSON.stringify({ fatal: run.stderr || run.stdout, status: run.status }, null, 2)}\n`);
  console.error(run.stderr || run.stdout);
  process.exit(run.status || 1);
}
const native = JSON.parse(run.stdout.trim());
const aquatos = native.products.find((product) => product.id === 54);
const expected = {
  oneLitre: policy.price({ basePrice: 411, baseQuantity: '5 L', targetQuantity: '1 L' }),
  fiveLitres: policy.price({ basePrice: 411, baseQuantity: '5 L', targetQuantity: '5 L', sourcePrice: 411 }),
  twentyLitres: policy.price({ basePrice: 411, baseQuantity: '5 L', targetQuantity: '20 L' })
};
const variationPrices = Object.fromEntries((aquatos?.variations || []).map((variation) => [variation.attributes.pojemnosc, Number(variation.regularPrice)]));
const pricePolicyVerification = {
  expected,
  stored: variationPrices,
  passed: variationPrices['1 L'] === expected.oneLitre.price && variationPrices['5 L'] === expected.fiveLitres.price && variationPrices['20 L'] === expected.twentyLitres.price,
  manualOverrideRuleExamples: {
    unchangedOwned: policy.mayUpdate({ current: '411', lastImported: '411', owned: true }),
    editedOwned: policy.mayUpdate({ current: '399', lastImported: '411', owned: true }),
    unowned: policy.mayUpdate({ current: '411', lastImported: '411', owned: false })
  }
};
const audit = { generatedAt: new Date().toISOString(), native, pricePolicyVerification };
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({
  outputPath,
  products: native.products.length,
  categories: native.categories.length,
  reviews: native.reviews.length,
  svgs: native.svgAttachments.length,
  acfAttachmentMappings: native.acfAttachmentMappings.length,
  pricePolicyPassed: pricePolicyVerification.passed,
  enabledPaymentGateways: native.paymentGateways.filter((gateway) => gateway.enabled === 'yes').map((gateway) => gateway.id)
}));
