<?php $logo = mwf_field('logo', 'options'); ?>
<header class="mwf-header">
    <?php if (has_nav_menu('utility') || has_nav_menu('lang')) : ?>
    <div class="mwf-header__utility l-container flex justify-between gap-100 py-30">
        <?php if (has_nav_menu('utility')) : ?><nav aria-label="Skróty"><?php wp_nav_menu(['theme_location' => 'utility', 'container' => false, 'fallback_cb' => false]); ?></nav><?php endif; ?>
        <?php if (has_nav_menu('lang')) : ?><nav aria-label="Wybór języka"><?php wp_nav_menu(['theme_location' => 'lang', 'container' => false, 'fallback_cb' => false]); ?></nav><?php endif; ?>
    </div>
    <?php endif; ?>
    <div class="mwf-header__main l-container flex align-center justify-between gap-200 py-30">
        <a class="mwf-header__branding" href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name') . ' — strona główna'); ?>">
            <?php if (mwf_image_id($logo)) { echo mwf_image($logo, 'full', true, ['loading' => 'eager']); } else { echo esc_html(get_bloginfo('name')); } ?>
        </a>
        <?php if (has_nav_menu('header')) : ?>
        <nav class="mwf-nav" aria-label="Nawigacja główna" data-mwf-nav>
            <button type="button" data-mwf-menu-toggle aria-controls="mwf-main-menu" aria-expanded="false" hidden>Menu</button>
            <?php wp_nav_menu(['theme_location' => 'header', 'container' => false, 'menu_id' => 'mwf-main-menu', 'fallback_cb' => false]); ?>
        </nav>
        <?php endif; ?>
    </div>
</header>
