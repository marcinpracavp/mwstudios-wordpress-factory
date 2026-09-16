<?php
if (function_exists('rudnikagro_option')) :
    $promotion = rudnikagro_option('rudnikagro_topbar_promotion');
    $topbar_close_icon = (int) rudnikagro_option('rudnikagro_shared_topbar_media_169_282');
    $topbar_next_background = (int) rudnikagro_option('rudnikagro_shared_topbar_media_169_287');
    $topbar_next_icon = (int) rudnikagro_option('rudnikagro_shared_topbar_media_169_284');
    $topbar_previous_background = (int) rudnikagro_option('rudnikagro_shared_topbar_media_169_288');
    $topbar_previous_icon = (int) rudnikagro_option('rudnikagro_shared_topbar_media_169_289');
    $ra_logo = (int) rudnikagro_option('rudnikagro_shared_primary_navigation_media_118_6');
    $phone = rudnikagro_option('rudnikagro_shared_secondary_navigation_156_92');
    $email = rudnikagro_option('rudnikagro_shared_secondary_navigation_93_31');
    $phone_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_347_1077');
    $email_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_347_1078');
    $search = rudnikagro_option('rudnikagro_shared_secondary_navigation_153_76');
    $search_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_153_63');
    $favourite_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_I625_179;586_555');
    $favourite_badge = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_I625_179;586_587');
    $favourite_count = rudnikagro_option('rudnikagro_shared_secondary_navigation_222_3');
    $cart_count = rudnikagro_option('rudnikagro_shared_secondary_navigation_I625_179;586_588');
    $account_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_347_961');
    $cart_icon = (int) rudnikagro_option('rudnikagro_shared_secondary_navigation_media_347_972');
    $secondary_labels = preg_split('/\s{2,}/u', trim((string) rudnikagro_option('rudnikagro_shared_secondary_navigation_93_28'))) ?: [];
    $secondary_labels = array_values(array_filter(array_map('trim', $secondary_labels)));
    // The frozen text extractor lost the Polish character in this one source label;
    // the retained source reference establishes its rendered form.
    $secondary_labels = array_map(static fn($label) => str_replace('Aktualno?ci', 'Aktualności', $label), $secondary_labels);
    $secondary_menu_items = wp_get_nav_menu_items('RudnikAgro — dodatkowa') ?: [];
    $secondary_menu_urls = [];
    foreach ($secondary_menu_items as $menu_item) {
        $secondary_menu_urls[wp_strip_all_tags((string) $menu_item->title)] = (string) $menu_item->url;
    }
    $active_menu_labels = preg_split('/\R/u', (string) rudnikagro_option('rudnikagro_shared_primary_navigation_active_I574_5_93_29')) ?: [];
    $active_categories = preg_split('/\R/u', (string) rudnikagro_option('rudnikagro_shared_primary_navigation_active_250_754')) ?: [];
    $active_crops_one = preg_split('/\R/u', (string) rudnikagro_option('rudnikagro_shared_primary_navigation_active_250_762')) ?: [];
    $active_crops_two = preg_split('/\R/u', (string) rudnikagro_option('rudnikagro_shared_primary_navigation_active_250_763')) ?: [];
    $active_logo = (int) rudnikagro_option('rudnikagro_shared_primary_navigation_active_media_250_729');
    $active_chevron = (int) rudnikagro_option('rudnikagro_shared_primary_navigation_active_media_250_755');
    $active_menu_labels = array_values(array_filter(array_map('trim', $active_menu_labels)));
    $active_categories = array_values(array_filter(array_map('trim', $active_categories)));
    $active_crops_one = array_values(array_filter(array_map('trim', $active_crops_one)));
    $active_crops_two = array_values(array_filter(array_map('trim', $active_crops_two)));
?>
    <?php if ($promotion) : ?>
        <div class="c-promotion-bar" data-factory-section="shared-topbar">
            <div class="l-container c-promotion-bar__inner">
                <button class="c-promotion-bar__control c-promotion-bar__control--previous" type="button" aria-label="<?php echo esc_attr__('Poprzednia promocja', 'rudnikagro'); ?>">
                    <?php echo rudnikagro_image($topbar_previous_background, '', ['alt' => '']); ?>
                    <?php echo rudnikagro_image($topbar_previous_icon, '', ['alt' => '']); ?>
                </button>
                <span class="c-promotion-bar__label"><?php echo esc_html($promotion); ?></span>
                <button class="c-promotion-bar__control c-promotion-bar__control--next" type="button" aria-label="<?php echo esc_attr__('Następna promocja', 'rudnikagro'); ?>">
                    <?php echo rudnikagro_image($topbar_next_background, '', ['alt' => '']); ?>
                    <?php echo rudnikagro_image($topbar_next_icon, '', ['alt' => '']); ?>
                </button>
                <button class="c-promotion-bar__close" type="button" aria-label="<?php echo esc_attr__('Zamknij promocję', 'rudnikagro'); ?>">
                    <?php echo rudnikagro_image($topbar_close_icon, '', ['alt' => '']); ?>
                </button>
            </div>
        </div>
    <?php endif; ?>
    <header class="l-header">
        <div class="l-container l-header__utility" data-factory-section="shared-secondary-navigation">
            <div class="l-header__contact">
                <?php if ($phone) : ?><a href="tel:<?php echo esc_attr(preg_replace('/[^+0-9]/', '', (string) $phone)); ?>"><?php echo rudnikagro_image($phone_icon, '', ['alt' => '']); ?><span><?php echo esc_html($phone); ?></span></a><?php endif; ?>
                <?php if ($email) : ?><a href="mailto:<?php echo esc_attr($email); ?>"><?php echo rudnikagro_image($email_icon, '', ['alt' => '']); ?><span><?php echo esc_html($email); ?></span></a><?php endif; ?>
            </div>
            <form class="l-header__search" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>"><label class="screen-reader-text" for="rudnikagro-search">Szukaj</label><input id="rudnikagro-search" type="search" name="s" value="" placeholder="<?php echo esc_attr($search); ?>"><?php if ($search_icon) : ?><button type="submit" aria-label="Szukaj"><?php echo rudnikagro_image($search_icon, '', ['alt' => '']); ?></button><?php endif; ?></form>
            <?php if ($secondary_labels) : ?>
                <nav class="l-header__secondary-nav" aria-label="<?php echo esc_attr__('Nawigacja dodatkowa', 'rudnikagro'); ?>"><ul>
                    <?php foreach ($secondary_labels as $secondary_label) : ?><li><?php if (!empty($secondary_menu_urls[$secondary_label])) : ?><a href="<?php echo esc_url($secondary_menu_urls[$secondary_label]); ?>"><?php echo esc_html($secondary_label); ?></a><?php else : ?><span><?php echo esc_html($secondary_label); ?></span><?php endif; ?></li><?php endforeach; ?>
                </ul></nav>
            <?php else : ?><?php wp_nav_menu(['theme_location' => 'rudnikagro_secondary', 'container' => 'nav', 'container_class' => 'l-header__secondary-nav', 'fallback_cb' => false]); ?><?php endif; ?>
            <div class="l-header__actions">
                <?php if ($favourite_icon) : ?><span class="l-header__action l-header__action--favourite"><?php echo rudnikagro_image($favourite_icon, '', ['alt' => '']); ?><?php if ($favourite_badge && $favourite_count !== null && $favourite_count !== '') : ?><span class="l-header__count" aria-label="<?php echo esc_attr(sprintf(__('Ulubione: %s', 'rudnikagro'), $favourite_count)); ?>"><?php echo rudnikagro_image($favourite_badge, '', ['alt' => '']); ?><span><?php echo esc_html($favourite_count); ?></span></span><?php endif; ?></span><?php endif; ?>
                <?php if ($account_icon) : ?><a class="l-header__action" href="<?php echo esc_url(get_permalink((int) get_option('woocommerce_myaccount_page_id'))); ?>"><?php echo rudnikagro_image($account_icon, '', ['alt' => '']); ?></a><?php endif; ?>
                <?php if ($cart_icon) : ?><a class="l-header__action l-header__action--cart" href="<?php echo esc_url(wc_get_cart_url()); ?>"><?php echo rudnikagro_image($cart_icon, '', ['alt' => '']); ?><?php if ($favourite_badge && $cart_count !== null && $cart_count !== '') : ?><span class="l-header__count" aria-label="<?php echo esc_attr(sprintf(__('Koszyk: %s', 'rudnikagro'), $cart_count)); ?>"><?php echo rudnikagro_image($favourite_badge, '', ['alt' => '']); ?><span><?php echo esc_html($cart_count); ?></span></span><?php endif; ?></a><?php endif; ?>
            </div>
        </div>
        <div class="l-container l-header__primary" data-factory-section="shared-primary-navigation">
            <?php if ($ra_logo) : ?><a class="l-header__branding" href="<?php echo esc_url(home_url('/')); ?>"><?php echo rudnikagro_image($ra_logo, '', ['loading' => false]); ?></a><?php endif; ?>
            <?php if ($active_menu_labels) : ?>
                <nav class="l-header__menu c-primary-menu" aria-label="<?php echo esc_attr__('Główna nawigacja', 'rudnikagro'); ?>">
                    <?php foreach ($active_menu_labels as $index => $label) : ?>
                        <?php if ($index === 0) : ?><button class="c-primary-menu__toggle" type="button" data-primary-menu-toggle aria-expanded="false" aria-controls="primary-mega-menu"><?php echo esc_html($label); ?></button>
                        <?php else : ?><span class="c-primary-menu__label<?php echo $label === 'Promocje' ? ' c-primary-menu__label--promotion' : ''; ?>"><?php echo esc_html($label); ?></span><?php endif; ?>
                    <?php endforeach; ?>
                </nav>
            <?php else : ?><?php wp_nav_menu(['theme_location' => 'rudnikagro_primary', 'container' => 'nav', 'container_class' => 'l-header__menu', 'fallback_cb' => false]); ?><?php endif; ?>
            <?php get_template_part('partials/menu', 'mobile'); ?>
        </div>
        <?php if ($active_menu_labels && $active_categories && ($active_crops_one || $active_crops_two)) : ?>
            <section id="primary-mega-menu" class="c-primary-mega-menu" data-factory-section="shared-primary-navigation-active" data-factory-component="primary-mega-menu" aria-label="<?php echo esc_attr($active_menu_labels[0]); ?>" hidden>
                <div class="l-container c-primary-mega-menu__inner">
                    <div class="c-primary-mega-menu__brand"><?php echo rudnikagro_image($active_logo ?: $ra_logo, '', ['alt' => '', 'loading' => false]); ?></div>
                    <div class="c-primary-mega-menu__categories" role="tablist" aria-label="<?php echo esc_attr($active_menu_labels[0]); ?>">
                        <?php foreach ($active_categories as $index => $category) : ?><button type="button" role="tab" data-mega-category aria-selected="<?php echo $index === 0 ? 'true' : 'false'; ?>" tabindex="<?php echo $index === 0 ? '0' : '-1'; ?>"><span><?php echo esc_html($category); ?></span><?php echo $active_chevron ? rudnikagro_image($active_chevron, '', ['alt' => '']) : ''; ?></button><?php endforeach; ?>
                    </div>
                    <div class="c-primary-mega-menu__crops" role="tabpanel">
                        <div><?php foreach ($active_crops_one as $index => $crop) : ?><button type="button" data-mega-crop aria-pressed="<?php echo $crop === 'Rzepak' ? 'true' : 'false'; ?>"><?php echo esc_html($crop); ?></button><?php endforeach; ?></div>
                        <div><?php foreach ($active_crops_two as $crop) : ?><button type="button" data-mega-crop aria-pressed="false"><?php echo esc_html($crop); ?></button><?php endforeach; ?></div>
                    </div>
                </div>
            </section>
        <?php endif; ?>
    </header>
<?php return; endif; ?>
<?php $logo = get_field('logo', 'options'); ?>

<header class="l-header js-headroom">
    <div class="l-header__container l-container">

        <?php if ($logo) : ?>
            <a class="l-header__branding" href="<?= get_site_url(); ?>" title="Przejdź do strony głównej">
                <?= wp_get_attachment_image($logo['id'], 'full', false, ['loading' => false]); ?>
            </a>
        <?php endif; ?>

        <div class="l-header__menu">
            <?php wp_nav_menu(['theme_location' => 'header', 'container' => false]); ?>
        </div>

        <?php get_template_part('partials/menu', 'mobile'); ?>

    </div>
</header>
