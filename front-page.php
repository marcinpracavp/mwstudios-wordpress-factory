<?php
/** Native, ACF-backed RudnikAgro front page. */
get_header();

$field = static function (string $name): array { return function_exists('get_field') ? (array) get_field($name, get_the_ID()) : []; };
$hero = $field('rudnikagro_home_hero');
$benefits = function_exists('get_field') ? (array) get_field('rudnikagro_home_benefits', get_the_ID()) : [];
$crops = $field('rudnikagro_home_crops');
$sections = $field('rudnikagro_home_sections');
$catalogues = $field('rudnikagro_home_catalogues');
$about = $field('rudnikagro_home_about');
$blog = $field('rudnikagro_home_blog');
$knowledge = $field('rudnikagro_home_knowledge');
$shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : '';
$home_collections = [
    'home-promotions' => function_exists('get_field') ? (array) get_field('rudnikagro_home_promoted_products', get_the_ID()) : [],
    'home-bundles' => function_exists('get_field') ? (array) get_field('rudnikagro_home_bundle_products', get_the_ID()) : [],
    'home-recommended' => function_exists('get_field') ? (array) get_field('rudnikagro_home_recommended_products', get_the_ID()) : [],
];
$product_card = function ($item) use ($sections): void {
    $product_id = is_object($item) ? (int) $item->ID : (int) $item;
    $product = function_exists('wc_get_product') ? wc_get_product($product_id) : null;
    if (!$product) { return; }
    $image_id = $product->get_image_id();
    $presentation = function_exists('get_field') ? (array) get_field('rudnikagro_product_card_presentation', $product_id) : [];
    $price = $product->get_price();
    $regular_price = $product->get_regular_price();
    $is_sale = $regular_price !== '' && $price !== '' && (float) $regular_price > (float) $price;
    $cart_label = (string) ($sections['cart_label'] ?? '');
    $cart_icon = (int) ($sections['cart_icon'] ?? 0);
    ?>
    <article class="c-home-card">
        <?php if (!empty($presentation['badge'])) : ?><span class="c-home-card__badge"><?php echo esc_html((string) $presentation['badge']); ?></span><?php endif; ?>
        <a class="c-home-card__image" href="<?php echo esc_url(get_permalink($product_id)); ?>"><?php echo $image_id ? wp_get_attachment_image($image_id, 'medium', false, ['alt' => $product->get_name()]) : ''; ?></a>
        <h3><a href="<?php echo esc_url(get_permalink($product_id)); ?>"><?php echo esc_html($product->get_name()); ?></a></h3>
        <p class="c-home-card__price"><?php echo $price !== '' ? wp_kses_post(wc_price((float) $price)) : ''; ?><?php if ($is_sale) : ?><del><?php echo wp_kses_post(wc_price((float) $regular_price)); ?></del><?php endif; ?></p>
        <?php if (!empty($presentation['lowest_price_note'])) : ?><p class="c-home-card__lowest-price"><?php echo esc_html((string) $presentation['lowest_price_note']); ?></p><?php endif; ?>
        <div class="c-home-card__actions"><span class="c-home-card__quantity" aria-label="<?php echo esc_attr__('Ilość', 'rudnikagro'); ?>"><span aria-hidden="true">−</span><span>1</span><span aria-hidden="true">+</span></span><?php if ($cart_label) : ?><a class="c-home-card__cart" href="<?php echo esc_url($product->add_to_cart_url()); ?>"><?php echo $cart_icon ? rudnikagro_image($cart_icon, '', ['alt' => '']) : ''; ?><span><?php echo esc_html($cart_label); ?></span></a><?php endif; ?></div>
    </article>
    <?php
};
?>
<main class="c-home">
    <section class="c-home-hero" data-factory-section="home-hero"<?php if (!empty($hero['image'])) : ?> style="background-image:url('<?php echo esc_url(wp_get_attachment_image_url((int) $hero['image'], 'full')); ?>')"<?php endif; ?>>
        <div class="c-home-hero__content">
            <h1><?php echo nl2br(esc_html((string) ($hero['heading'] ?? ''))); ?></h1>
            <?php if (!empty($hero['cta_label']) && $shop_url) : ?><a class="c-home-button c-home-button--outline" href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($hero['cta_label']); ?><span aria-hidden="true">→</span></a><?php endif; ?>
        </div>
    </section>

    <section class="c-home-benefits l-container" data-factory-section="home-benefits">
        <?php foreach ($benefits as $benefit) : ?><article class="c-home-benefit"><?php echo !empty($benefit['icon']) ? rudnikagro_image((int) $benefit['icon'], '', ['alt' => '']) : ''; ?><p><?php echo nl2br(esc_html((string) ($benefit['title'] ?? ''))); ?></p></article><?php endforeach; ?>
    </section>

    <section class="c-home-crops" data-factory-section="home-crop-selection"><div class="l-container">
        <h2><?php echo esc_html((string) ($crops['heading'] ?? '')); ?></h2><p class="c-home-kicker"><?php echo esc_html((string) ($crops['subtitle'] ?? '')); ?></p>
        <?php foreach ((array) ($crops['groups'] ?? []) as $group) : ?><div class="c-home-crop-group"><h3 style="--crop-colour:<?php echo esc_attr((string) ($group['colour'] ?? '#007d44')); ?>"><?php echo esc_html((string) ($group['title'] ?? '')); ?></h3><div class="c-home-crop-grid"><?php foreach ((array) ($group['items'] ?? []) as $item) : ?><a href="<?php echo esc_url($shop_url); ?>" class="c-home-crop"><?php echo !empty($item['icon']) ? rudnikagro_image((int) $item['icon'], '', ['alt' => '']) : ''; ?><span><?php echo esc_html((string) ($item['title'] ?? '')); ?></span></a><?php endforeach; ?></div></div><?php endforeach; ?>
    </div></section>

    <?php $groups = [['home-promotions', 'promotions_title'], ['home-bundles', 'bundles_title']]; foreach ($groups as [$id, $label]) : $collection = (array) ($home_collections[$id] ?? []); if ($id === 'home-bundles' && count($collection) === 1) { $collection = array_fill(0, 4, $collection[0]); } ?><section class="c-home-products c-home-products--wide" data-factory-section="<?php echo esc_attr($id); ?>"><header><h2><?php echo esc_html((string) ($sections[$label] ?? '')); ?></h2><?php if ($shop_url && !empty($sections['more_label'])) : ?><a class="c-home-button" href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($sections['more_label']); ?><span aria-hidden="true">→</span></a><?php endif; ?></header><div class="c-home-product-grid"><?php foreach ($collection as $product_id) { $product_card($product_id); } ?></div></section><?php endforeach; ?>

    <section class="c-home-catalogues l-container" data-factory-section="home-catalogues"<?php if (!empty($catalogues['background'])) : ?> style="background-image:url('<?php echo esc_url(wp_get_attachment_image_url((int) $catalogues['background'], 'full')); ?>')"<?php endif; ?>><div><h2><?php echo esc_html((string) ($catalogues['heading'] ?? '')); ?></h2><?php foreach ((array) ($catalogues['items'] ?? []) as $item) : ?><p><?php echo !empty($item['icon']) ? rudnikagro_image((int) $item['icon'], '', ['alt' => '']) : ''; ?><span><?php echo esc_html((string) ($item['title'] ?? '')); ?></span></p><?php endforeach; ?></div><?php echo !empty($catalogues['cover']) ? rudnikagro_image((int) $catalogues['cover'], 'c-home-catalogues__cover', ['alt' => '']) : ''; ?></section>

    <section class="c-home-products c-home-products--wide c-home-products--recommended" data-factory-section="home-recommended"><header><h2><?php echo esc_html((string) ($sections['recommended_title'] ?? '')); ?></h2><?php if ($shop_url && !empty($sections['more_label'])) : ?><a class="c-home-button" href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($sections['more_label']); ?><span aria-hidden="true">→</span></a><?php endif; ?></header><div class="c-home-product-grid"><?php foreach ((array) ($home_collections['home-recommended'] ?? []) as $product_id) { $product_card($product_id); } ?></div></section>

    <section class="c-home-about" data-factory-section="home-about"><div class="l-container c-home-about__grid"><div><h2><?php echo esc_html((string) ($about['heading'] ?? '')); ?></h2><div class="c-home-about__lead"><?php echo wp_kses_post((string) ($about['lead'] ?? '')); ?></div><div><?php echo wp_kses_post((string) ($about['content'] ?? '')); ?></div><?php if ($shop_url && !empty($about['cta_label'])) : ?><a class="c-home-button" href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($about['cta_label']); ?><span aria-hidden="true">→</span></a><?php endif; ?></div><?php echo !empty($about['image']) ? rudnikagro_image((int) $about['image'], 'c-home-about__image', ['alt' => '']) : ''; ?></div></section>

    <section class="c-home-blog" data-factory-section="home-blog"><header><h2><?php echo esc_html((string) ($blog['heading'] ?? '')); ?></h2><?php if (!empty($blog['cta_label'])) : ?><a class="c-home-button" href="<?php echo esc_url(get_permalink((int) get_option('page_for_posts'))); ?>"><?php echo esc_html($blog['cta_label']); ?><span aria-hidden="true">→</span></a><?php endif; ?></header><div class="c-home-blog__grid"><?php $posts = !empty($blog['posts']) ? (array) $blog['posts'] : get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 3, 'meta_key' => '_rudnikagro_blog_source_order', 'orderby' => 'meta_value_num', 'order' => 'ASC']); foreach ($posts as $post_id) : $post_id = is_object($post_id) ? $post_id->ID : (int) $post_id; $image_id = function_exists('get_field') ? (int) get_field('rudnikagro_blog_card_image', $post_id) : 0; $date = function_exists('get_field') ? (string) get_field('rudnikagro_blog_card_date', $post_id) : ''; $image_id = $image_id ?: (int) get_post_thumbnail_id($post_id); ?><article><?php if ($image_id) : ?><a href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php echo wp_get_attachment_image($image_id, 'large', false, ['alt' => '']); ?></a><?php endif; ?><time datetime="<?php echo esc_attr(get_the_date('c', $post_id)); ?>"><?php echo esc_html($date ?: get_the_date('', $post_id)); ?></time><h3><a href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php echo esc_html(get_the_title($post_id)); ?></a></h3><a class="c-home-read" href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php esc_html_e('Czytaj całość', 'rudnikagro'); ?> <span aria-hidden="true">→</span></a></article><?php endforeach; ?></div></section>

    <section class="c-home-knowledge" data-factory-section="home-knowledge"<?php if (!empty($knowledge['background'])) : ?> style="background-image:url('<?php echo esc_url(wp_get_attachment_image_url((int) $knowledge['background'], 'full')); ?>')"<?php endif; ?>><div class="l-container c-home-knowledge__items"><?php foreach ((array) ($knowledge['items'] ?? []) as $index => $item) : $is_open = $index === 0; $icon = (int) ($item[$is_open ? 'open_icon' : 'closed_icon'] ?? 0); ?><details<?php echo $is_open ? ' open' : ''; ?>><summary><?php echo esc_html((string) ($item['title'] ?? '')); ?><?php if ($icon) : ?><?php echo rudnikagro_image($icon, 'c-home-knowledge__icon', ['alt' => '']); ?><?php endif; ?></summary><div><?php echo wp_kses_post((string) ($item['content'] ?? '')); ?></div></details><?php endforeach; ?></div></section>
</main>
<?php get_footer();
