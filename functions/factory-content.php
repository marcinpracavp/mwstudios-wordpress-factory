<?php
/** Shared components; client routes and content stay in project data. */
function mwf_field($name, $post_id = false) {
    return function_exists('get_field') ? get_field($name, $post_id) : null;
}
function mwf_image_id($image) {
    return absint(is_array($image) ? ($image['ID'] ?? $image['id'] ?? 0) : $image);
}
function mwf_image($image, $size = 'large', $decorative = false, $attributes = []) {
    $id = mwf_image_id($image);
    if (!$id) { return ''; }
    if ($decorative) { $attributes['alt'] = ''; }
    return wp_get_attachment_image($id, $size, false, $attributes);
}
function mwf_link($link, $class = '') {
    if (!is_array($link) || empty($link['url']) || empty($link['title'])) { return; }
    $new_tab = ($link['target'] ?? '') === '_blank';
    ?>
    <a class="<?php echo esc_attr($class); ?>" href="<?php echo esc_url($link['url']); ?>"<?php if ($new_tab) : ?> target="_blank" rel="noopener noreferrer"<?php endif; ?>><?php echo esc_html($link['title']); ?><?php if ($new_tab) : ?><span class="mwf-sr-only"> (nowa karta)</span><?php endif; ?></a>
    <?php
}
function mwf_heading($data, $class = '') {
    if (empty($data['heading'])) { return; }
    $level = (int) ($data['heading_level'] ?? 2);
    if ($level < 2 || $level > 6) { $level = 2; }
    printf('<h%1$d class="%2$s">%3$s</h%1$d>', $level, esc_attr($class), esc_html($data['heading']));
}
function mwf_has_content($html) {
    return is_string($html) && (trim(wp_strip_all_tags($html)) !== '' || preg_match('/<(img|video|audio|table)\b/i', $html));
}
function mwf_admission_status($status) {
    $labels = ['open' => 'Nabór otwarty', 'closed' => 'Nabór zamknięty'];
    if (isset($labels[$status])) {
        printf('<p class="mwf-admission mwf-admission--%s">%s</p>', esc_attr($status), esc_html($labels[$status]));
    }
}
function mwf_order_offers($items) {
    $groups = ['open' => [], '' => [], 'closed' => []];
    foreach ($items as $item) {
        $status = $item['admission_status'] ?? '';
        $groups[isset($groups[$status]) ? $status : ''][] = $item;
    }
    return array_merge($groups['open'], $groups[''], $groups['closed']);
}
function mwf_render_sections($sections) {
    $allowed = ['wysiwyg', 'image_text', 'tiles', 'cta', 'accordion', 'tabs', 'table', 'gallery', 'media', 'contact', 'partners', 'documents', 'news'];
    foreach ((array) $sections as $section) {
        if (in_array($section['acf_fc_layout'] ?? '', $allowed, true)) {
            get_template_part('partials/factory/section', null, ['section' => $section]);
        }
    }
}
function mwf_form($id) {
    $html = '';
    if ($id && function_exists('wpcf7_contact_form') && get_post_type($id) === 'wpcf7_contact_form') {
        $html = do_shortcode('[contact-form-7 id="' . absint($id) . '"]');
    }
    return apply_filters('mwf_contact_form_html', $html, absint($id));
}
