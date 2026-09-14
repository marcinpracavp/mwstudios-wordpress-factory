<?php
defined('ABSPATH') || exit;
get_header();
while (have_posts()) : the_post();
global $product;
$product = function_exists('wc_get_product') ? wc_get_product(get_the_ID()) : null;
$labels = function_exists('get_field') ? (array) get_field('rudnikagro_product_labels') : [];
$content = function_exists('get_field') ? (array) get_field('rudnikagro_product_content') : [];
$inquiry = function_exists('get_field') ? (array) get_field('rudnikagro_product_inquiry') : [];
$gallery = function_exists('get_field') ? (array) get_field('rudnikagro_product_gallery') : [];
$benefits = function_exists('get_field') ? (array) get_field('rudnikagro_product_benefits') : [];
$technical = function_exists('get_field') ? (array) get_field('rudnikagro_product_technical_data') : [];
$downloads = function_exists('get_field') ? (array) get_field('rudnikagro_product_downloads') : [];
$notices = function_exists('get_field') ? (array) get_field('rudnikagro_product_notices') : [];
$bundle = function_exists('get_field') ? (array) get_field('rudnikagro_product_bundle') : [];
$icons = function_exists('get_field') ? (array) get_field('rudnikagro_product_icons') : [];
$review_summary = function_exists('get_field') ? (array) get_field('rudnikagro_product_review_summary') : [];
$is_bundle = get_post_meta(get_the_ID(), '_rudnikagro_route_id', true) === 'product-bundle';
$tabs = array_values(array_filter(array_map('trim', preg_split('/(?:\R|<br\s*\/?\s*>)/iu', (string) ($labels['tabs'] ?? '')))));
$primary_image = (int) ($gallery[0] ?? get_post_thumbnail_id());
?>
<article class="c-product<?php echo $is_bundle ? ' c-product--bundle' : ''; ?>">
  <div class="l-container">
    <nav class="c-product__breadcrumb" aria-label="Breadcrumb" data-factory-section="<?php echo esc_attr($is_bundle ? 'bundle-breadcrumbs' : 'product-breadcrumbs'); ?>"><a href="<?php echo esc_url(home_url('/')); ?>">Strona główna</a><span>/</span><a href="<?php echo esc_url(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : home_url('/')); ?>">Środki ochrony roślin</a><span>/</span><strong><?php echo esc_html($labels['breadcrumb'] ?? get_the_title()); ?></strong></nav>
    <div class="c-product__intro">
      <section class="c-product__gallery" data-factory-component="product-gallery" data-factory-section="<?php echo esc_attr($is_bundle ? 'bundle-gallery' : 'product-gallery'); ?>"><?php if ($primary_image) { echo wp_get_attachment_image($primary_image, 'full', false, ['loading' => false]); } ?></section>
      <section class="c-product__summary">
        <div class="c-product__summary-main" data-factory-section="<?php echo esc_attr($is_bundle ? 'product-bundle-overview' : 'product-overview'); ?>">
        <h1><?php the_title(); ?></h1>
        <?php if (!empty($labels['details'])) : ?><p class="c-product__meta"><?php echo wp_kses_post(nl2br(esc_html((string) $labels['details']))); ?></p><?php endif; ?>
        <?php if ($is_bundle) : ?>
          <?php if (!empty($bundle['contains_heading'])) : ?><h2 class="c-product__bundle-heading"><?php echo esc_html($bundle['contains_heading']); ?></h2><?php endif; ?>
          <?php if (!empty($bundle['items'])) : ?><div class="c-product__bundle-items"><?php foreach ($bundle['items'] as $item) : ?><div class="c-product__bundle-item"><span class="c-product__bundle-quantity"><?php echo esc_html($item['quantity'] ?? ''); ?></span><p><?php echo esc_html($item['description'] ?? ''); ?></p><span class="c-product__bundle-current"><?php echo esc_html($item['current_price'] ?? ''); ?></span><del><?php echo esc_html($item['previous_price'] ?? ''); ?></del></div><?php endforeach; ?></div><?php endif; ?>
          <?php if (!empty($bundle['savings'])) : ?><p class="c-product__bundle-savings"><?php echo esc_html($bundle['savings']); ?></p><?php endif; ?>
          <?php if (!empty($bundle['single_products_price'])) : ?><p class="c-product__bundle-single-price"><?php echo esc_html($bundle['single_products_price']); ?></p><?php endif; ?>
          <?php if (!empty($bundle['price_per_hectare'])) : ?><p class="c-product__bundle-hectare-price"><?php echo esc_html($bundle['price_per_hectare']); ?></p><?php endif; ?>
        <?php endif; ?>
        <?php if ($product) : ?><div class="c-product__price"><?php echo wp_kses_post($product->get_price_html()); ?></div><?php endif; ?>
        <?php if ($product && $product->is_type('variable') && function_exists('woocommerce_variable_add_to_cart')) : ?><?php woocommerce_variable_add_to_cart(); ?><?php elseif ($product && $product->is_purchasable()) : ?><form class="c-product__cart" method="post" action="<?php echo esc_url($product->add_to_cart_url()); ?>"><input type="number" name="quantity" value="1" min="1" aria-label="Ilość"><button type="submit" class="button-primary"><?php echo esc_html($product->add_to_cart_text()); ?></button></form><?php endif; ?>
        <?php if ($is_bundle && !empty($bundle['area_options'])) : ?><div class="c-product__bundle-areas"><?php foreach ($bundle['area_options'] as $area) : ?><span class="<?php echo !empty($area['active']) ? 'is-active' : ''; ?>"><?php echo esc_html($area['label'] ?? ''); ?></span><?php endforeach; ?></div><?php endif; ?>
        <?php if (!empty($labels['wholesale'])) : ?><button class="c-product__inquiry-open" type="button" data-product-inquiry-open><?php echo esc_html($labels['wholesale']); ?></button><?php endif; ?>
        </div>
        <?php if (!empty($icons['favorite_icon'])) : ?><img class="c-product__favorite-icon" src="<?php echo esc_url(wp_get_attachment_url((int) $icons['favorite_icon'])); ?>" alt="" aria-hidden="true"><?php endif; ?>
        <?php if ($benefits) : ?><ul class="c-product__benefits" data-factory-section="<?php echo esc_attr($is_bundle ? 'bundle-benefits' : 'product-benefits'); ?>"><?php foreach ($benefits as $benefit) : if (!empty($benefit['label'])) : ?><li><?php echo esc_html($benefit['label']); ?></li><?php endif; endforeach; ?></ul><?php endif; ?>
      </section>
    </div>
    <section class="c-product__tabs" data-factory-component="product-tabs" data-factory-section="<?php echo esc_attr($is_bundle ? 'bundle-tabs' : 'product-tabs'); ?>">
      <div class="c-product__tabs-content">
      <div class="c-product__tab-list" role="tablist"><?php foreach ($tabs as $index => $tab) : $key = ['technical','description','use','reviews','downloads'][$index] ?? 'description'; ?><button role="tab" aria-selected="<?php echo $index === 0 ? 'true' : 'false'; ?>" data-product-tab="<?php echo esc_attr($key); ?>"><?php echo esc_html($tab); ?></button><?php endforeach; ?></div>
      <div class="c-product__panel is-active" data-product-panel="technical"><?php foreach ($technical as $row) : ?><div class="c-product__technical-row"><b><?php echo esc_html($row['label'] ?? ''); ?></b><span><?php echo wp_kses_post(nl2br((string) ($row['value'] ?? ''))); ?></span></div><?php endforeach; ?></div>
      <div class="c-product__panel" data-product-panel="description"><?php echo wp_kses_post($content['description'] ?? ''); ?><button type="button" class="c-product__expand" data-product-expand>Rozwiń opis</button><div class="c-product__expanded" data-product-expanded><?php echo wp_kses_post($content['expanded_description'] ?? ''); ?></div></div>
      <div class="c-product__panel" data-product-panel="use"><div class="c-product__expanded is-open" data-factory-section="product-expanded-description"><?php echo wp_kses_post($content['expanded_description'] ?: ($content['use'] ?? '')); ?></div></div>
      <div class="c-product__panel c-product__reviews" data-product-panel="reviews"><?php $reviews = get_comments(['post_id' => get_the_ID(), 'status' => 'approve', 'type' => 'review']); ?><div class="c-product__review-summary"><?php if (!empty($review_summary['average'])) : ?><strong><?php echo esc_html($review_summary['average']); ?></strong><?php endif; ?><?php if (!empty($review_summary['count'])) : ?><span><?php echo esc_html($review_summary['count']); ?></span><?php endif; ?><?php foreach ((array) ($review_summary['distribution'] ?? []) as $row) : ?><div class="c-product__review-distribution"><span><?php echo esc_html($row['rating'] ?? ''); ?></span><i style="--review-count: <?php echo esc_attr((string) ($row['count'] ?? '0')); ?>"></i><em><?php echo esc_html($row['count'] ?? ''); ?></em></div><?php endforeach; ?></div><div class="c-product__review-list"><?php foreach ($reviews as $review) : $rating = (int) get_comment_meta($review->comment_ID, 'rating', true); ?><article class="c-product__review"><div class="c-product__review-stars" aria-label="<?php echo esc_attr(sprintf(__('Ocena %d na 5', 'slawinsky'), $rating)); ?>"><?php echo esc_html(str_repeat('★', max(0, min(5, $rating)))); ?></div><time datetime="<?php echo esc_attr(get_comment_date('c', $review)); ?>"><?php echo esc_html(get_comment_date('', $review)); ?></time><div><?php echo wp_kses_post(wpautop($review->comment_content)); ?></div></article><?php endforeach; ?></div></div>
      <div class="c-product__panel" data-product-panel="downloads"><?php foreach ($downloads as $download) : if (!empty($download['label'])) : ?><p class="c-product__download"><?php if (!empty($icons['download_icon'])) : ?><img src="<?php echo esc_url(wp_get_attachment_url((int) $icons['download_icon'])); ?>" alt="" aria-hidden="true"><?php endif; ?><?php if (!empty($download['file'])) : ?><a href="<?php echo esc_url(wp_get_attachment_url((int) $download['file'])); ?>"><?php endif; echo esc_html($download['label']); if (!empty($download['file'])) : ?></a><?php endif; ?></p><?php endif; endforeach; ?></div>
      </div>
    </section>
    <?php if (function_exists('woocommerce_related_products')) : ?><section class="c-product__related" data-factory-section="product-related"><h2>Produkty powiązane</h2><?php woocommerce_related_products(['posts_per_page' => 2, 'columns' => 2]); ?></section><?php endif; ?>
    <?php if ($notices) : ?><section class="c-product__notices" data-factory-section="product-legal-notices"><?php foreach ($notices as $notice) : ?><div><?php echo wp_kses_post($notice['text'] ?? ''); ?></div><?php endforeach; ?></section><?php endif; ?>
  </div>
  <section class="c-product__dialog" data-product-inquiry data-factory-section="product-inquiry-dialog" aria-hidden="true"><button type="button" aria-label="Zamknij" data-product-inquiry-close>×</button><h2><?php echo esc_html($inquiry['heading'] ?? ''); ?></h2><?php if (!empty($inquiry['form']) && function_exists('do_shortcode')) { echo do_shortcode('[contact-form-7 id="' . (int) $inquiry['form'] . '"]'); } ?></section>
</article>
<?php endwhile; get_footer();
