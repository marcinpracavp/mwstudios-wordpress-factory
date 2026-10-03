<?php
$option = static function (string $field) {
    $value = function_exists('emko_option') ? emko_option($field) : null;
    if ($value === null || $value === '') {
        $value = get_option('options_' . $field, '');
    }
    return $value;
};
$image = static function (int $attachment_id, string $alt = ''): string {
    if (!$attachment_id) {
        return '';
    }
    $attributes = [
        'alt' => $alt,
        'loading' => false,
    ];
    $source_node = (string) get_post_meta($attachment_id, 'data-factory-source-node', true);
    if ($source_node !== '') {
        $attributes['data-factory-source-node'] = $source_node;
    }
    if (function_exists('emko_image')) {
        return emko_image($attachment_id, '', $attributes);
    }
    return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
};

$logo_id = (int) $option('emko_shared_primary_navigation_media_118_6');
$phone_icon_id = (int) $option('emko_shared_secondary_navigation_media_347_1077');
$mobile_icon_id = (int) $option('emko_shared_header_mobile_icon_125_14');
$email_icon_id = (int) $option('emko_shared_secondary_navigation_media_347_1078');
$phone = trim((string) $option('emko_shared_secondary_navigation_156_92'));
$mobile = trim((string) $option('emko_shared_header_mobile_125_12'));
$email = trim((string) $option('emko_shared_secondary_navigation_93_31'));
$search_placeholder = trim((string) $option('emko_shared_header_search_placeholder'));
$header_menu_id = (int) $option('emko_shared_header_menu_id');
$menu_markup = wp_nav_menu([
    'menu' => $header_menu_id ?: 0,
    'theme_location' => $header_menu_id ? '' : 'header',
    'container' => false,
    'fallback_cb' => false,
    'echo' => false,
    'emko_header_menu' => true,
]);

$phone_href = preg_replace('/[^+0-9]/', '', $phone);
$mobile_href = preg_replace('/[^+0-9]/', '', $mobile);
$search_placeholder = $search_placeholder ?: 'Narzędzia warsztatowe - hydraulika siłowa';
?>
<header class="l-header" data-factory-section="shared-header" data-factory-component="site-header">
    <div class="l-header__utility">
        <div class="l-container l-header__utility-inner">
            <div class="l-header__brand">
                <a class="l-header__logo" href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name')); ?>">
                    <?php echo $image($logo_id, get_bloginfo('name')); ?>
                </a>
            </div>

            <?php get_template_part('partials/menu', 'mobile', [
                'logo_id' => $logo_id,
                'menu_id' => $header_menu_id,
                'phone_icon_id' => $phone_icon_id,
                'mobile_icon_id' => $mobile_icon_id,
                'email_icon_id' => $email_icon_id,
                'phone' => $phone,
                'mobile' => $mobile,
                'email' => $email,
                'search_placeholder' => $search_placeholder,
            ]); ?>

            <div class="l-header__search" data-product-search>
                <form class="l-header__search-form" action="<?php echo esc_url(home_url('/')); ?>" method="get" role="search" data-product-search-form data-endpoint="<?php echo esc_url(admin_url('admin-ajax.php')); ?>" data-nonce="<?php echo esc_attr(wp_create_nonce('emko_product_search')); ?>">
                    <label class="screen-reader-text" for="header-product-search">Szukaj produktów</label>
                    <input id="header-product-search" class="l-header__search-input" type="search" name="s" placeholder="<?php echo esc_attr($search_placeholder); ?>" autocomplete="off" aria-autocomplete="list" aria-controls="header-product-search-results" aria-expanded="false" data-product-search-input>
                    <input type="hidden" name="post_type" value="product">
                    <button class="l-header__search-submit" type="submit" aria-label="Szukaj produktów">
                        <i class="fas fa-search" aria-hidden="true"></i>
                    </button>
                </form>
                <div class="l-header__search-results" id="header-product-search-results" aria-live="polite" data-product-search-results hidden></div>
            </div>

            <div class="l-header__contacts" aria-label="Kontakt">
                <?php if ($phone !== '') : ?>
                    <a class="l-header__contact l-header__contact--phone" href="<?php echo esc_url('tel:' . $phone_href); ?>">
                        <?php echo $image($phone_icon_id); ?>
                        <span data-factory-source-node="125:11"><?php echo esc_html($phone); ?></span>
                    </a>
                <?php endif; ?>
                <?php if ($mobile !== '') : ?>
                    <a class="l-header__contact l-header__contact--mobile" href="<?php echo esc_url('tel:' . $mobile_href); ?>">
                        <?php echo $image($mobile_icon_id); ?>
                        <span data-factory-source-node="125:12"><?php echo esc_html($mobile); ?></span>
                    </a>
                <?php endif; ?>
                <?php if ($email !== '') : ?>
                    <a class="l-header__contact l-header__contact--email" href="<?php echo esc_url('mailto:' . $email); ?>">
                        <?php echo $image($email_icon_id); ?>
                        <span data-factory-source-node="125:13"><?php echo esc_html($email); ?></span>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="l-header__primary">
        <div class="l-container l-header__primary-inner">
            <nav class="l-header__primary-nav" aria-label="Nawigacja główna" data-factory-source-node="125:5">
                <?php if ($menu_markup) : ?>
                    <?php echo $menu_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_nav_menu returns theme markup. ?>
                <?php endif; ?>
            </nav>
            <div class="l-header__product-menu" id="site-product-category-menu" hidden>
                <?php get_template_part('partials/product-category-menu', null, ['context' => 'header', 'heading' => '', 'menu_id' => 'site-product-category']); ?>
            </div>
        </div>
    </div>
</header>
