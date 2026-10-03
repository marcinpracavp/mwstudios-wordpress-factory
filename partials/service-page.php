<?php
/**
 * Editable service-page content.
 *
 * Each content row combines WYSIWYG, image and an optional link. The image
 * side is selected per row in ACF, while the final media band remains a
 * separate CTA because its visual treatment is fundamentally different.
 */
$service_page_id = (int) get_queried_object_id();
if (!$service_page_id) {
    $service_page_id = (int) get_the_ID();
}
$service_sections = get_field('emko_service_sections', $service_page_id);
$service_media_band = get_field('emko_service_media_band', $service_page_id);

if (empty($service_sections)) {
    get_template_part('partials/route-skeleton', null, [
        'route_id' => 'service',
        'sections' => ['service-overview', 'service-contact', 'service-media-band'],
    ]);

    return;
}

get_template_part('partials/page-banner', null, [
    'variant' => 'service',
    'breadcrumb_only' => true,
    'is_fragment' => true,
]);

foreach ($service_sections as $index => $service_section) {
    $image_side = ($service_section['image_side'] ?? 'left') === 'right' ? 'right' : 'left';
    $has_overlay = !empty($service_section['overlay_image']);
    $heading_tag = $index === 0 ? 'h1' : 'h2';
    $image_classes = $image_side === 'right' ? 'gc-8/15 gc-lg-1/15' : 'gc-1/8 gc-lg-1/15';
    $content_classes = $image_side === 'right' ? 'gc-1/8 gc-lg-1/15' : 'gc-8/15 gc-lg-1/15';
    $media_aos = $image_side === 'right' ? 'fade-left' : 'fade-right';
    $content_aos = $image_side === 'right' ? 'fade-right' : 'fade-left';
    ?>
    <section class="c-service-content-section c-service-content-section--image-<?php echo esc_attr($image_side); ?><?php echo $has_overlay ? ' c-service-content-section--has-overlay' : ''; ?>">
        <div class="c-service-content-section__inner l-container grid align-start">
            <div class="c-service-content-section__media <?php echo esc_attr($image_classes); ?>" data-aos="<?php echo esc_attr($media_aos); ?>">
                <?php if (!empty($service_section['image'])) : ?>
                    <?php echo wp_get_attachment_image((int) $service_section['image'], 'full', false, ['class' => 'c-service-content-section__image', 'loading' => $index === 0 ? false : 'lazy']); ?>
                <?php endif; ?>
                <?php if ($has_overlay) : ?>
                    <?php echo wp_get_attachment_image((int) $service_section['overlay_image'], 'full', false, ['class' => 'c-service-content-section__overlay-image', 'alt' => '', 'aria-hidden' => 'true', 'loading' => 'lazy']); ?>
                <?php endif; ?>
            </div>
            <div class="c-service-content-section__content c-wysiwyg <?php echo esc_attr($content_classes); ?>" data-aos="<?php echo esc_attr($content_aos); ?>" data-aos-delay="100">
                <?php if (!empty($service_section['heading'])) : ?>
                    <<?php echo esc_attr($heading_tag); ?> class="c-service-content-section__heading"><?php echo emko_wysiwyg_heading($service_section['heading']); ?></<?php echo esc_attr($heading_tag); ?>>
                <?php endif; ?>
                <?php if (!empty($service_section['content'])) : ?>
                    <div class="c-service-content-section__body"><?php echo emko_wysiwyg_content($service_section['content']); ?></div>
                <?php endif; ?>
                <?php if (!empty($service_section['button']['url']) && !empty($service_section['button']['title'])) : ?>
                    <a class="c-service-content-section__button" href="<?php echo esc_url($service_section['button']['url']); ?>" target="<?php echo esc_attr(!empty($service_section['button']['target']) ? $service_section['button']['target'] : '_self'); ?>">
                        <span><?php echo esc_html($service_section['button']['title']); ?></span><span aria-hidden="true">→</span>
                    </a>
                <?php endif; ?>
                <?php if (!empty($service_section['content_after_button'])) : ?>
                    <div class="c-service-content-section__body c-service-content-section__body--after-button"><?php echo emko_wysiwyg_content($service_section['content_after_button']); ?></div>
                <?php endif; ?>
            </div>
        </div>
    </section>
    <?php
}

$media_band_heading = !empty($service_media_band['heading']) ? (string) $service_media_band['heading'] : '';
$media_band_button = $service_media_band['button'] ?? [];
$media_band_mask_url = !empty($service_media_band['mask']) ? wp_get_attachment_url((int) $service_media_band['mask']) : '';
$media_band_mask_style = $media_band_mask_url !== '' ? '--service-media-band-mask-image:url("' . esc_url_raw($media_band_mask_url) . '");' : '';
?>
<?php if ($media_band_heading !== '') : ?>
    <section class="c-service-media-band" data-aos="fade-up"<?php if ($media_band_mask_style !== '') : ?> style="<?php echo esc_attr($media_band_mask_style); ?>"<?php endif; ?>>
        <div class="c-service-media-band__clip">
            <div class="c-service-media-band__background" aria-hidden="true"></div>
            <?php if (!empty($service_media_band['image'])) : ?>
                <div class="c-service-media-band__image"><?php echo wp_get_attachment_image((int) $service_media_band['image'], 'full', false, ['alt' => '', 'aria-hidden' => 'true', 'loading' => 'lazy']); ?></div>
            <?php endif; ?>
            <div class="c-service-media-band__content">
                <h2 class="c-service-media-band__heading"><?php echo emko_wysiwyg_heading($media_band_heading); ?></h2>
                <?php if (!empty($media_band_button['url']) && !empty($media_band_button['title'])) : ?>
                    <a class="c-service-media-band__button" href="<?php echo esc_url($media_band_button['url']); ?>" target="<?php echo esc_attr(!empty($media_band_button['target']) ? $media_band_button['target'] : '_self'); ?>"><span><?php echo esc_html($media_band_button['title']); ?></span><span class="c-service-media-band__button-arrow" aria-hidden="true">→</span></a>
                <?php endif; ?>
            </div>
        </div>
    </section>
<?php endif; ?>
