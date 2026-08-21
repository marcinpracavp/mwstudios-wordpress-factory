<?php
$menu = wp_get_nav_menu_items(2); 
$logo = get_field('logo', 'options'); 
$acf_fields = get_fields();
$acf_globals = get_fields('options');
?>

<div class="c-menu-mobile js-menu-mobile">
    <button class="c-menu-mobile__toggler">
        <span></span>
        <span></span>
        <span></span>
    </button>
    <div class="c-menu-mobile__menu">
        <div class="c-menu-mobile__wrapper">
            <div class="c-menu-mobile__logo">
                <?php if ($logo) : ?>
                    <a class="" href="<?= get_site_url(); ?>" title="Przejdź do strony głównej">
                        <?= wp_get_attachment_image($logo['id'], 'full', false, ['loading' => false]); ?>
                    </a>
                <?php endif; ?>
            </div>
            <?php wp_nav_menu(['theme_location' => 'header', 'container' => false]); ?>
            
            <div class="c-menu-mobile__footer">
                <?php if($acf_globals['social_media']) : ?>
                    <div class="social">
                        <?php foreach($acf_globals['social_media'] as $item) : ?>
                            <div class="box">
                                <a href="<?= $item['link']['url'] ?>" target="<?= $item['link']['target'] ?>"><?= $item['link']['title'] ?></a>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>