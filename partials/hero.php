<?php
$hero = (array) ($args['hero'] ?? mwf_field('mwf_hero'));
$slides = array_values(array_filter((array) ($hero['slides'] ?? []), function ($slide) {
    return mwf_image_id($slide['image'] ?? 0) || !empty($slide['title']) || mwf_has_content($slide['content'] ?? '') || !empty($slide['link']['url']);
}));
$id = wp_unique_id('mwf-banner-');
?>
<header class="mwf-hero mb-50">
    <div class="l-container py-40">
        <h1><?php echo esc_html(($hero['title'] ?? '') ?: get_the_title()); ?></h1>
        <?php if (mwf_has_content($hero['intro'] ?? '')) : ?><div class="mwf-prose mt-30"><?php echo wp_kses_post($hero['intro']); ?></div><?php endif; ?>
    </div>
    <?php if ($slides) : ?>
    <div class="mwf-banner" id="<?php echo esc_attr($id); ?>"<?php if (count($slides) > 1) : ?> data-mwf-slider role="region" aria-roledescription="karuzela" aria-label="Banery"<?php endif; ?>>
        <?php foreach ($slides as $i => $slide) : ?>
        <div class="mwf-banner__slide" data-mwf-slide>
            <?php if (mwf_image_id($slide['image'] ?? 0)) : ?>
            <picture>
                <?php if (mwf_image_id($slide['mobile_image'] ?? 0)) : ?>
                <source media="(max-width: 768px)" srcset="<?php echo esc_attr(wp_get_attachment_image_srcset(mwf_image_id($slide['mobile_image']), 'large') ?: wp_get_attachment_image_url(mwf_image_id($slide['mobile_image']), 'large')); ?>">
                <?php endif; ?>
                <?php echo mwf_image($slide['image'], 'full', !empty($slide['decorative']), ['loading' => $i === 0 ? 'eager' : 'lazy']); ?>
            </picture>
            <?php endif; ?>
            <?php if (!empty($slide['title']) || mwf_has_content($slide['content'] ?? '') || !empty($slide['link']['url'])) : ?>
            <div class="mwf-banner__content l-container p-40">
                <?php if (!empty($slide['title'])) : ?><h2><?php echo esc_html($slide['title']); ?></h2><?php endif; ?>
                <div class="mwf-prose"><?php echo wp_kses_post($slide['content'] ?? ''); ?></div>
                <?php mwf_link($slide['link'] ?? null, 'mwf-button'); ?>
            </div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
        <?php if (count($slides) > 1) : ?>
        <div class="mwf-banner__controls l-container py-30" data-mwf-slider-controls hidden>
            <button type="button" data-mwf-prev aria-controls="<?php echo esc_attr($id); ?>">Poprzedni slajd</button>
            <span role="status" aria-live="polite" data-mwf-slider-status></span>
            <button type="button" data-mwf-next aria-controls="<?php echo esc_attr($id); ?>">Następny slajd</button>
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</header>
