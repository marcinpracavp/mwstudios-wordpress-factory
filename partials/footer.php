<?php
$footer_option = static function (string $field) {
    $value = function_exists('emko_option') ? emko_option($field) : null;
    if ($value === null || $value === '') {
        $value = get_option('options_' . $field, '');
    }
    return $value;
};
$footer_lines = static function ($value): array {
    if (function_exists('emko_lines')) {
        return emko_lines($value);
    }
    return is_string($value) ? array_values(array_filter(array_map('trim', preg_split('/(?:\R|<br\s*\/?\s*>)/iu', $value)))) : [];
};
$footer_asset_uri = static function (string $source_asset): string {
    $source_asset = ltrim($source_asset, '/');
    if ($source_asset === '') {
        return '';
    }
    $source_path = trailingslashit(get_template_directory()) . '.factory-cache/figma/latest/' . $source_asset;
    if (!is_readable($source_path)) {
        return '';
    }
    return trailingslashit(get_template_directory_uri()) . '.factory-cache/figma/latest/' . $source_asset;
};
$footer_image = static function (string $field, string $source_node, string $alt = '', string $source_asset = '', string $style = '') use ($footer_option, $footer_asset_uri): string {
    $attachment_id = (int) $footer_option($field);
    $attributes = [
        'alt' => $alt,
        'loading' => false,
        'data-factory-source-node' => $source_node,
    ];
    if ($source_asset !== '') {
        $attributes['data-factory-source-asset'] = $source_asset;
    }
    if ($style !== '') {
        $attributes['style'] = $style;
    }
    if (!$attachment_id) {
        $asset_uri = $footer_asset_uri($source_asset);
        if ($asset_uri !== '') {
            $style_attribute = $style !== '' ? ' style="' . esc_attr($style) . '"' : '';
            return '<img src="' . esc_url($asset_uri) . '" alt="' . esc_attr($alt) . '" data-factory-source-node="' . esc_attr($source_node) . '" data-factory-source-asset="' . esc_attr($source_asset) . '"' . $style_attribute . ' decoding="async">';
        }
        return '<span class="l-footer__media-gap" data-factory-source-node="' . esc_attr($source_node) . '" data-factory-source-gap="missing-native-attachment" aria-hidden="true"></span>';
    }
    if (function_exists('emko_image')) {
        return emko_image($attachment_id, '', $attributes);
    }
    return wp_get_attachment_image($attachment_id, 'full', false, $attributes);
};
$footer_phone_href = static function (string $phone): string {
    return preg_replace('/[^+0-9]/', '', $phone);
};
$footer_link = static function (string $field, string $fallback_label, string $fallback_url) use ($footer_option): array {
    $link = $footer_option($field);

    if (is_array($link) && !empty($link['url'])) {
        return [
            'label' => (string) ($link['title'] ?? $fallback_label),
            'target' => (string) ($link['target'] ?? ''),
            'url' => (string) $link['url'],
        ];
    }

    return ['label' => $fallback_label, 'target' => '', 'url' => $fallback_url];
};
$footer_menu_id = (int) $footer_option('emko_shared_footer_menu_id');
$footer_contact_page = get_page_by_path('kontakt') ?: get_page_by_path('contact');
$footer_contact_page_id = $footer_contact_page instanceof WP_Post ? (int) $footer_contact_page->ID : 179;
$footer_contact_form_id = function_exists('get_field') ? (int) get_field('emko_contact_form', $footer_contact_page_id) : 0;
$footer_form_id = (int) $footer_option('emko_shared_footer_contact_form') ?: $footer_contact_form_id;

$central_phones = $footer_lines($footer_option('emko_shared_footer_central_phone_125_1698'));
$quick_links = array_values(array_filter(array_map('trim', explode('|', (string) $footer_option('emko_shared_footer_quick_links_125_1691')))));
$company_contact = (string) $footer_option('emko_shared_footer_company_contact_125_1692');
$address = trim((string) $footer_option('emko_shared_footer_address_125_1693'));
$info_email = trim((string) $footer_option('emko_shared_footer_info_email_125_1750'));
$technical_email = trim((string) $footer_option('emko_shared_footer_technical_email_125_1753'));
$map_address = trim((string) $footer_option('emko_shared_footer_map_address')) ?: 'Kokosowa 26, 72-006 Mierzyn';
$map_embed_url = add_query_arg([
    'output' => 'embed',
    'q' => $map_address,
    't' => 'm',
    'z' => 16,
], 'https://www.google.com/maps');
$terms_link = $footer_link('emko_shared_footer_terms_link', (string) ($footer_option('emko_shared_footer_terms_label_125_1765') ?: 'Regulamin'), home_url('/regulamin/'));
$privacy_link = $footer_link('emko_shared_footer_privacy_link', (string) ($footer_option('emko_shared_footer_privacy_link_label_125_1766') ?: 'Polityka prywatności'), home_url('/polityka-prywatnosci/'));
?>
<footer class="l-footer" data-factory-section="shared-footer" data-factory-component="site-footer" data-factory-source-node="125:1689">
    <div class="l-footer__main l-container">
        <div class="l-footer__offices">
            <section class="l-footer__office l-footer__office--central">
                <?php $heading = trim((string) $footer_option('emko_shared_footer_central_heading_125_1710')); ?>
                <h2 class="l-footer__heading" data-factory-source-node="125:1710"><?php echo function_exists('emko_wysiwyg_heading') ? emko_wysiwyg_heading($heading) : wp_kses_post($heading); ?></h2>
                <div class="l-footer__company-contact" data-factory-source-node="125:1692"><?php echo wp_kses_post($company_contact); ?></div>
                <div class="l-footer__contact-list">
                    <div class="l-footer__contact-row" data-factory-source-node="125:1698">
                        <?php echo $footer_image('emko_shared_footer_media_125_1702', '125:1702', '', 'assets/references/shared-footer/125-1702.svg'); ?>
                        <div data-factory-source-node="125:1698">
                            <span class="l-footer__contact-label" data-factory-source-node="125:1694"><?php echo esc_html((string) $footer_option('emko_shared_footer_central_phone_label_125_1694')); ?></span>
                            <?php foreach ($central_phones as $phone) : ?><a data-factory-source-node="125:1698" href="<?php echo esc_url('tel:' . $footer_phone_href($phone)); ?>"><?php echo esc_html($phone); ?></a><?php endforeach; ?>
                        </div>
                    </div>
                    <div class="l-footer__contact-row" data-factory-source-node="125:1750">
                        <?php echo $footer_image('emko_shared_footer_media_125_1754', '125:1754', '', 'assets/references/shared-footer/125-1754.svg'); ?>
                        <div data-factory-source-node="125:1750">
                            <span class="l-footer__contact-label" data-factory-source-node="125:1746"><?php echo esc_html((string) $footer_option('emko_shared_footer_wroclaw_email_label_125_1746')); ?></span>
                            <?php if ($info_email !== '') : ?><a data-factory-source-node="125:1750" href="<?php echo esc_url('mailto:' . $info_email); ?>"><?php echo esc_html($info_email); ?></a><?php endif; ?>
                        </div>
                    </div>
                </div>
            </section>

            <section class="l-footer__office l-footer__office--service">
                <?php $heading = trim((string) $footer_option('emko_shared_footer_service_heading_125_1713')); ?>
                <h2 class="l-footer__heading" data-factory-source-node="125:1713"><?php echo function_exists('emko_wysiwyg_heading') ? emko_wysiwyg_heading($heading) : wp_kses_post($heading); ?></h2>
                <div class="l-footer__address" data-factory-source-node="125:1693"><?php echo function_exists('emko_wysiwyg_content') ? emko_wysiwyg_content($address) : wp_kses_post($address); ?></div>
                <div class="l-footer__contact-list">
                    <?php $phone = trim((string) $footer_option('emko_shared_footer_service_phone_125_1701')); ?>
                    <div class="l-footer__contact-row" data-factory-source-node="125:1701">
                        <?php echo $footer_image('emko_shared_footer_media_125_1708', '125:1708', '', 'assets/references/shared-footer/125-1708.svg'); ?>
                        <div data-factory-source-node="125:1701">
                            <span class="l-footer__contact-label" data-factory-source-node="125:1697"><?php echo esc_html((string) $footer_option('emko_shared_footer_service_phone_label_125_1697')); ?></span>
                            <?php if ($phone !== '') : ?><a data-factory-source-node="125:1701" href="<?php echo esc_url('tel:' . $footer_phone_href($phone)); ?>"><?php echo esc_html($phone); ?></a><?php endif; ?>
                        </div>
                    </div>
                    <div class="l-footer__contact-row" data-factory-source-node="125:1753">
                        <?php echo $footer_image('emko_shared_footer_media_125_1760', '125:1760', '', 'assets/references/shared-footer/125-1760.svg'); ?>
                        <div data-factory-source-node="125:1753">
                            <span class="l-footer__contact-label" data-factory-source-node="125:1749"><?php echo esc_html((string) $footer_option('emko_shared_footer_service_email_label_125_1749')); ?></span>
                            <?php if ($technical_email !== '') : ?><a data-factory-source-node="125:1753" href="<?php echo esc_url('mailto:' . $technical_email); ?>"><?php echo esc_html($technical_email); ?></a><?php endif; ?>
                        </div>
                    </div>
                </div>
            </section>

            <section class="l-footer__office l-footer__office--wroclaw">
                <?php $heading = trim((string) $footer_option('emko_shared_footer_wroclaw_heading_125_1711')); ?>
                <h2 class="l-footer__heading" data-factory-source-node="125:1711"><?php echo function_exists('emko_wysiwyg_heading') ? emko_wysiwyg_heading($heading) : wp_kses_post($heading); ?></h2>
                <?php $phone = trim((string) $footer_option('emko_shared_footer_wroclaw_phone_125_1699')); ?>
                <div class="l-footer__contact-row" data-factory-source-node="125:1699">
                    <?php echo $footer_image('emko_shared_footer_media_125_1704', '125:1704', '', 'assets/references/shared-footer/125-1704.svg'); ?>
                    <div data-factory-source-node="125:1699">
                        <span class="l-footer__contact-label" data-factory-source-node="125:1695"><?php echo esc_html((string) $footer_option('emko_shared_footer_wroclaw_phone_label_125_1695')); ?></span>
                        <?php if ($phone !== '') : ?><a data-factory-source-node="125:1699" href="<?php echo esc_url('tel:' . $footer_phone_href($phone)); ?>"><?php echo esc_html($phone); ?></a><?php endif; ?>
                    </div>
                </div>
            </section>

            <section class="l-footer__office l-footer__office--warsaw">
                <?php $heading = trim((string) $footer_option('emko_shared_footer_warsaw_heading_125_1712')); ?>
                <h2 class="l-footer__heading" data-factory-source-node="125:1712"><?php echo function_exists('emko_wysiwyg_heading') ? emko_wysiwyg_heading($heading) : wp_kses_post($heading); ?></h2>
                <?php $phone = trim((string) $footer_option('emko_shared_footer_warsaw_phone_125_1700')); ?>
                <div class="l-footer__contact-row" data-factory-source-node="125:1700">
                    <?php echo $footer_image('emko_shared_footer_media_125_1706', '125:1706', '', 'assets/references/shared-footer/125-1706.svg'); ?>
                    <div data-factory-source-node="125:1700">
                        <span class="l-footer__contact-label" data-factory-source-node="125:1696"><?php echo esc_html((string) $footer_option('emko_shared_footer_warsaw_phone_label_125_1696')); ?></span>
                        <?php if ($phone !== '') : ?><a data-factory-source-node="125:1700" href="<?php echo esc_url('tel:' . $footer_phone_href($phone)); ?>"><?php echo esc_html($phone); ?></a><?php endif; ?>
                    </div>
                </div>
            </section>
        </div>

        <section class="l-footer__form-panel">
            <?php $heading = $footer_form_id > 0 ? trim((string) get_the_title($footer_form_id)) : ''; ?>
            <h2 class="l-footer__form-heading" data-factory-source-node="125:1745"><?php echo function_exists('emko_wysiwyg_heading') ? emko_wysiwyg_heading($heading) : wp_kses_post($heading); ?></h2>
            <?php $footer_form_markup = $footer_form_id && shortcode_exists('contact-form-7') ? do_shortcode('[contact-form-7 id="' . $footer_form_id . '"]') : ''; ?>
            <?php
            if ($footer_form_markup !== '') {
                $footer_submit_arrow = $footer_image('emko_shared_footer_media_125_1744', '125:1744', '', 'assets/references/shared-footer/125-1741-vector.svg');
                $footer_form_markup = preg_replace('/(<p class="c-contact-form__submit">.*?)(<\/p>)/s', '$1<span class="l-footer__cf7-arrow" aria-hidden="true">' . $footer_submit_arrow . '</span>$2', $footer_form_markup, 1);
            }
            ?>
            <?php if ($footer_form_markup !== '') : ?>
                <div class="l-footer__form l-footer__form--cf7"><?php echo $footer_form_markup; ?></div>
            <?php endif; ?>
        </section>
    </div>

    <figure class="l-footer__map l-container" data-factory-source-node="125:1720">
        <iframe
            src="<?php echo esc_url($map_embed_url); ?>"
            title="<?php echo esc_attr(sprintf('Mapa satelitarna: %s', $map_address)); ?>"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
        ></iframe>
    </figure>

    <div class="l-footer__links l-container">
        <nav aria-label="Linki stopki" data-factory-source-node="125:1691">
            <?php if ($footer_menu_id) : ?>
                <?php wp_nav_menu(['menu' => $footer_menu_id, 'container' => false, 'fallback_cb' => false, 'depth' => 1]); ?>
            <?php else : ?>
                <ul><?php foreach ($quick_links as $link) : ?><li><span data-factory-source-node="125:1691"><?php echo esc_html($link); ?></span></li><?php endforeach; ?></ul>
            <?php endif; ?>
        </nav>
        <nav aria-label="Linki prawne"><ul>
            <li><a href="<?php echo esc_url($terms_link['url']); ?>"<?php echo $terms_link['target'] ? ' target="' . esc_attr($terms_link['target']) . '" rel="noopener noreferrer"' : ''; ?> data-factory-source-node="125:1765"><?php echo esc_html($terms_link['label']); ?></a></li>
            <li><a href="<?php echo esc_url($privacy_link['url']); ?>"<?php echo $privacy_link['target'] ? ' target="' . esc_attr($privacy_link['target']) . '" rel="noopener noreferrer"' : ''; ?> data-factory-source-node="125:1766"><?php echo esc_html($privacy_link['label']); ?></a></li>
        </ul></nav>
    </div>

    <div class="l-footer__copyright l-container" data-factory-source-node="125:1762">
        <?php echo wp_kses_post((string) $footer_option('emko_shared_footer_copyright_125_1762')); ?>
    </div>
</footer>
