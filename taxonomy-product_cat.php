<?php
/**
 * Native WooCommerce product-category archive for the sourced Fungicydy view.
 * All category copy, filters and card records remain WordPress/ACF editable.
 */
defined('ABSPATH') || exit;

get_header();
$term = get_queried_object();
$term_id = $term instanceof WP_Term ? (int) $term->term_id : 0;
$intro = function_exists('get_field') ? (string) get_field('rudnikagro_archive_category_introduction_body', 'product_cat_' . $term_id) : '';
$description = function_exists('get_field') ? (string) get_field('rudnikagro_archive_category_description', 'product_cat_' . $term_id) : '';
$archive = function_exists('get_field') ? (array) get_field('rudnikagro_product_archive', 'option') : [];
$filter_groups = [
    'uprawa' => rudnikagro_lines((string) ($archive['filter_crops'] ?? '')),
    'substancje' => rudnikagro_lines((string) ($archive['filter_substances'] ?? '')),
];
$categories = rudnikagro_lines((string) ($archive['filter_categories'] ?? ''));
?>
<main class="c-product-archive" data-factory-route="product-archive">
  <div class="l-container c-product-archive__container">
    <nav class="c-product-archive__breadcrumbs" aria-label="Breadcrumb" data-factory-section="archive-breadcrumbs">
      <?php echo esc_html((string) ($archive['breadcrumbs'] ?? '')); ?>
    </nav>
    <div class="c-product-archive__layout">
      <aside class="c-product-archive__filters" data-factory-section="archive-filters">
        <section class="c-product-archive__filter-card">
          <h2><?php echo esc_html((string) ($archive['filter_category_label'] ?? '')); ?></h2>
          <ul class="c-product-archive__category-list">
            <?php foreach ($categories as $category) : ?><li<?php echo trim($category) === $term->name ? ' class="is-current"' : ''; ?>><?php echo esc_html(trim($category)); ?></li><?php endforeach; ?>
          </ul>
        </section>
        <?php foreach ($filter_groups as $key => $items) : ?>
          <section class="c-product-archive__filter-card">
            <h2><?php echo esc_html((string) ($key === 'uprawa' ? ($archive['filter_crops_label'] ?? '') : ($archive['filter_substances_label'] ?? ''))); ?></h2>
            <?php foreach ($items as $item) : ?><label><input type="checkbox" disabled> <span><?php echo esc_html($item); ?></span></label><?php endforeach; ?>
          </section>
        <?php endforeach; ?>
        <section class="c-product-archive__filter-card c-product-archive__filter-card--collapsed">
          <h2><?php echo esc_html((string) ($archive['filter_producer_label'] ?? '')); ?></h2>
        </section>
        <section class="c-product-archive__filter-card c-product-archive__price-filter">
          <h2><?php echo esc_html((string) ($archive['filter_price_label'] ?? '')); ?></h2>
          <label><input type="text" placeholder="<?php echo esc_attr((string) ($archive['price_from'] ?? '')); ?>" disabled></label>
          <label><input type="text" placeholder="<?php echo esc_attr((string) ($archive['price_to'] ?? '')); ?>" disabled></label>
        </section>
      </aside>
      <div class="c-product-archive__content">
        <section class="c-product-archive__introduction" data-factory-section="archive-category-introduction">
          <h1><?php echo esc_html($term->name ?? ''); ?></h1>
          <?php if ($intro !== '') : ?><div class="c-product-archive__intro-copy"><?php echo wp_kses_post($intro); ?></div><?php endif; ?>
          <button class="c-product-archive__expand" type="button" hidden><?php echo esc_html((string) ($archive['expand_label'] ?? '')); ?></button>
        </section>
        <div class="c-product-archive__sort" data-factory-section="archive-sort"><span><?php echo esc_html((string) ($archive['sort_label'] ?? '')); ?></span></div>
        <section class="c-product-archive__grid" data-factory-section="archive-product-grid">
          <?php if (woocommerce_product_loop()) : while (have_posts()) : the_post(); $product = wc_get_product(get_the_ID()); ?>
            <article <?php wc_product_class('c-product-archive__card', $product); ?>>
              <a class="c-product-archive__image" href="<?php the_permalink(); ?>"><?php echo wp_get_attachment_image(get_post_thumbnail_id(), 'full', false, ['loading' => 'eager']); ?></a>
              <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
              <p class="c-product-archive__price"><?php echo wp_kses_post($product ? $product->get_price_html() : ''); ?></p>
              <div class="c-product-archive__card-actions"><input aria-label="<?php echo esc_attr((string) ($archive['quantity_label'] ?? '')); ?>" type="number" min="1" value="1"><a class="c-product-archive__add" href="<?php echo esc_url($product ? $product->add_to_cart_url() : get_permalink()); ?>"><?php echo esc_html((string) ($archive['add_to_cart_label'] ?? '')); ?></a></div>
            </article>
          <?php endwhile; endif; ?>
        </section>
        <nav class="c-product-archive__pagination" aria-label="<?php echo esc_attr((string) ($archive['pagination_label'] ?? '')); ?>" data-factory-section="archive-pagination">
          <?php foreach (rudnikagro_lines((string) ($archive['pagination'] ?? '')) as $index => $label) : ?><span class="<?php echo $index === 0 ? 'is-active' : ''; ?>"><?php echo esc_html($label); ?></span><?php endforeach; ?>
          <?php if (!empty($archive['pagination_next_icon'])) : ?><img src="<?php echo esc_url(wp_get_attachment_url((int) $archive['pagination_next_icon'])); ?>" alt="" aria-hidden="true"><?php endif; ?>
        </nav>
        <section class="c-product-archive__description" data-factory-section="archive-category-description">
          <?php if ($description !== '') : ?>
            <div class="c-product-archive__description-copy"><?php echo wp_kses_post($description); ?></div>
            <button class="c-product-archive__description-expand" type="button" aria-expanded="false"><?php echo esc_html((string) ($archive['expand_label'] ?? '')); ?></button>
          <?php endif; ?>
        </section>
      </div>
    </div>
  </div>
</main>
<?php get_footer();
