<?php
/** Compact footer used exclusively by the contact page. */
$contact_footer_option = static function (string $field): string {
    $value = function_exists('emko_option') ? emko_option($field) : null;
    if ($value === null || $value === '') {
        $value = get_option('options_' . $field, '');
    }

    return (string) $value;
};
$contact_footer_page_url = static function (string $slug): string {
    $page = get_page_by_path($slug);

    return $page instanceof WP_Post ? get_permalink($page) : home_url('/' . trim($slug, '/') . '/');
};
$contact_footer_labels = array_values(array_filter(array_map('trim', explode('|', $contact_footer_option('emko_shared_footer_quick_links_125_1691')))));
$contact_footer_menu_id = (int) $contact_footer_option('emko_shared_footer_menu_id');
$contact_footer_link = static function (string $field, string $fallback_label, string $fallback_url) use ($contact_footer_option): array {
    $link = $contact_footer_option($field);
    if (is_array($link) && !empty($link['url'])) {
        return [
            'label' => (string) ($link['title'] ?? $fallback_label),
            'target' => (string) ($link['target'] ?? ''),
            'url' => (string) $link['url'],
        ];
    }

    return ['label' => $fallback_label, 'target' => '', 'url' => $fallback_url];
};
$contact_footer_links = [
    [
        'label' => $contact_footer_labels[0] ?? 'Wsparcie techniczne i serwis',
        'url' => $contact_footer_page_url('serwis'),
    ],
    [
        'label' => $contact_footer_labels[1] ?? 'Katalogi',
        'url' => $contact_footer_page_url('katalogi'),
    ],
    [
        'label' => $contact_footer_labels[2] ?? 'Narzędzia w akcji',
        'url' => $contact_footer_page_url('narzedzia-w-akcji'),
    ],
];
$contact_footer_terms_label = $contact_footer_option('emko_shared_footer_terms_label_125_1765') ?: 'Regulamin';
$contact_footer_privacy_label = $contact_footer_option('emko_shared_footer_privacy_link_label_125_1766') ?: 'Polityka prywatności';
$contact_footer_terms_link = $contact_footer_link('emko_shared_footer_terms_link', $contact_footer_terms_label, $contact_footer_page_url('regulamin'));
$contact_footer_privacy_link = $contact_footer_link('emko_shared_footer_privacy_link', $contact_footer_privacy_label, $contact_footer_page_url('polityka-prywatnosci'));
$contact_footer_copyright = $contact_footer_option('emko_shared_footer_copyright_125_1762');
?>
<footer class="l-contact-footer" data-factory-section="contact-footer" data-factory-component="site-footer" data-factory-source-node="125:2328">
    <div class="l-contact-footer__top l-container">
        <nav class="l-contact-footer__quick-links" aria-label="Skróty w stopce" data-factory-source-node="125:2333">
            <ul>
                <?php if ($contact_footer_menu_id) : ?>
                    <?php wp_nav_menu(['menu' => $contact_footer_menu_id, 'container' => false, 'fallback_cb' => false, 'depth' => 1, 'items_wrap' => '%3$s']); ?>
                <?php else : ?>
                    <?php foreach ($contact_footer_links as $link) : ?>
                        <li><a href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html($link['label']); ?></a></li>
                    <?php endforeach; ?>
                <?php endif; ?>
            </ul>
        </nav>
        <nav class="l-contact-footer__legal-links" aria-label="Linki prawne">
            <ul>
                <li><a href="<?php echo esc_url($contact_footer_terms_link['url']); ?>"<?php echo $contact_footer_terms_link['target'] ? ' target="' . esc_attr($contact_footer_terms_link['target']) . '" rel="noopener noreferrer"' : ''; ?> data-factory-source-node="125:2329"><?php echo esc_html($contact_footer_terms_link['label']); ?></a></li>
                <li><a href="<?php echo esc_url($contact_footer_privacy_link['url']); ?>"<?php echo $contact_footer_privacy_link['target'] ? ' target="' . esc_attr($contact_footer_privacy_link['target']) . '" rel="noopener noreferrer"' : ''; ?> data-factory-source-node="125:2330"><?php echo esc_html($contact_footer_privacy_link['label']); ?></a></li>
            </ul>
        </nav>
    </div>
    <div class="l-contact-footer__copyright l-container" data-factory-source-node="125:2332">
        <?php echo wp_kses_post($contact_footer_copyright); ?>
    </div>
</footer>
