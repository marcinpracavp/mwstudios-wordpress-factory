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