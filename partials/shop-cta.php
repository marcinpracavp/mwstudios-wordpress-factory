<?php
/** Reusable native shop CTA. */
$cta = isset($args['cta']) && is_array($args['cta']) ? $args['cta'] : [];
$heading = (string) ($cta['heading'] ?? '');
$button_label = (string) ($cta['button_label'] ?? '');
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : 'shared-shop-cta';
$shop_url = function_exists('wc_get_page_permalink') ? wc_get_page_permalink('shop') : '';
if ($heading === '') { return; }
?>
<section class="c-shop-cta" data-factory-section="<?php echo esc_attr($factory_section); ?>" data-factory-component="shop-cta">
    <div class="c-shop-cta__inner l-container">
        <h2><?php echo esc_html($heading); ?></h2>
        <?php if ($button_label !== '') : ?>
            <?php if ($shop_url) : ?><a class="c-shop-cta__button" href="<?php echo esc_url($shop_url); ?>"><?php echo esc_html($button_label); ?></a><?php else : ?><span class="c-shop-cta__button"><?php echo esc_html($button_label); ?></span><?php endif; ?>
        <?php endif; ?>
    </div>
</section>
