<?php
$args = isset($args) && is_array($args) ? $args : [];
$logo_id = isset($args['logo_id']) ? (int) $args['logo_id'] : 0;
$menu_id = isset($args['menu_id']) ? (int) $args['menu_id'] : 0;
$phone_icon_id = isset($args['phone_icon_id']) ? (int) $args['phone_icon_id'] : 0;
$mobile_icon_id = isset($args['mobile_icon_id']) ? (int) $args['mobile_icon_id'] : 0;
$email_icon_id = isset($args['email_icon_id']) ? (int) $args['email_icon_id'] : 0;
$phone = isset($args['phone']) ? trim((string) $args['phone']) : '';
$mobile = isset($args['mobile']) ? trim((string) $args['mobile']) : '';
$email = isset($args['email']) ? trim((string) $args['email']) : '';
$search_placeholder = isset($args['search_placeholder']) ? trim((string) $args['search_placeholder']) : '';
$phone_href = preg_replace('/[^+0-9]/', '', $phone);
$mobile_href = preg_replace('/[^+0-9]/', '', $mobile);
$menu = wp_nav_menu([
    'menu' => $menu_id ?: 0,
    'theme_location' => $menu_id ? '' : 'header',
    'container' => false,
    'fallback_cb' => false,
    'echo' => false,
]);
?>

<div class="c-menu-mobile js-menu-mobile" data-mobile-menu>
    <button class="c-menu-mobile__toggler" type="button" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Otwórz menu">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <div class="c-menu-mobile__menu" id="mobile-navigation" hidden>
        <div class="c-menu-mobile__wrapper">
            <div class="c-menu-mobile__logo">
                <?php if ($logo_id) : ?>
                    <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name')); ?>">
                        <?php echo wp_get_attachment_image($logo_id, 'full', false, ['alt' => get_bloginfo('name'), 'loading' => false]); ?>
                    </a>
                <?php endif; ?>
            </div>
            <div class="c-menu-mobile__search" data-product-search>
                <form class="c-menu-mobile__search-form" action="<?php echo esc_url(home_url('/')); ?>" method="get" role="search" data-product-search-form data-endpoint="<?php echo esc_url(admin_url('admin-ajax.php')); ?>" data-nonce="<?php echo esc_attr(wp_create_nonce('emko_product_search')); ?>">
                    <label class="screen-reader-text" for="mobile-product-search">Szukaj produktów</label>
                    <input id="mobile-product-search" class="c-menu-mobile__search-input" type="search" name="s" placeholder="<?php echo esc_attr($search_placeholder ?: 'Szukaj produktów'); ?>" autocomplete="off" aria-autocomplete="list" aria-controls="mobile-product-search-results" aria-expanded="false" data-product-search-input>
                    <input type="hidden" name="post_type" value="product">
                    <button class="c-menu-mobile__search-submit" type="submit" aria-label="Szukaj produktów">
                        <i class="fas fa-search" aria-hidden="true"></i>
                    </button>
                </form>
                <div class="c-menu-mobile__search-results" id="mobile-product-search-results" aria-live="polite" data-product-search-results hidden></div>
            </div>
            <nav class="c-menu-mobile__nav" aria-label="Nawigacja mobilna">
                <?php echo $menu; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_nav_menu returns theme markup. ?>
            </nav>
            <?php if ($phone !== '' || $mobile !== '' || $email !== '') : ?>
                <div class="c-menu-mobile__contacts" aria-label="Kontakt">
                    <?php if ($phone !== '') : ?>
                        <a href="<?php echo esc_url('tel:' . $phone_href); ?>">
                            <?php echo wp_get_attachment_image($phone_icon_id, 'full', false, ['alt' => '']); ?>
                            <span><?php echo esc_html($phone); ?></span>
                        </a>
                    <?php endif; ?>
                    <?php if ($mobile !== '') : ?>
                        <a href="<?php echo esc_url('tel:' . $mobile_href); ?>">
                            <?php echo wp_get_attachment_image($mobile_icon_id, 'full', false, ['alt' => '']); ?>
                            <span><?php echo esc_html($mobile); ?></span>
                        </a>
                    <?php endif; ?>
                    <?php if ($email !== '') : ?>
                        <a href="<?php echo esc_url('mailto:' . $email); ?>">
                            <?php echo wp_get_attachment_image($email_icon_id, 'full', false, ['alt' => '']); ?>
                            <span><?php echo esc_html($email); ?></span>
                        </a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
