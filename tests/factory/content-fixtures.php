<?php
/** Run ONLY via wp eval-file against an isolated development site. */
if (!defined('WP_CLI') || !WP_CLI || (int) get_option('blog_public') !== 0) {
    throw new RuntimeException('Fixtures require WP-CLI and noindex development site.');
}
if (!function_exists('acf_is_pro') || !acf_is_pro()) { throw new RuntimeException('Real ACF Pro required.'); }
$root = get_template_directory() . '/.factory-cache/content-qa';
wp_mkdir_p($root);
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
$image = (int) get_option('mwf_qa_image_id');
if (!$image || !get_post($image)) {
    $image = media_handle_sideload(['name' => 'factory-qa.png', 'tmp_name' => $root . '/fixture.png'], 0);
    if (is_wp_error($image)) { throw new RuntimeException($image->get_error_message()); }
    update_post_meta($image, '_wp_attachment_image_alt', 'Grafika testowa factory');
    update_option('mwf_qa_image_id', $image);
}
$file = (int) get_option('mwf_qa_document_id');
if (!$file || !get_post($file)) {
    file_put_contents($root . '/document.txt', 'Jawny dokument QA; nie jest treścią klienta.');
    $file = media_handle_sideload(['name' => 'factory-qa.txt', 'tmp_name' => $root . '/document.txt'], 0);
    if (is_wp_error($file)) { throw new RuntimeException($file->get_error_message()); }
    update_option('mwf_qa_document_id', $file);
}
$link = ['url' => home_url('/?s=QA'), 'title' => 'Sprawdź dane QA', 'target' => ''];
$html = '<p>Jawne dane QA do weryfikacji komponentów. To nie jest migracja treści CB.</p><ul><li>Pierwsza pozycja</li><li>Druga pozycja</li></ul><blockquote><p>Cytat testowy.</p></blockquote><p><a href="' . esc_url(home_url('/?s=QA')) . '">Wyszukaj QA</a></p>';
$contact = ['name' => 'Dział QA', 'role' => 'Stanowisko QA', 'address' => "Adres testowy\nMiasto", 'phones' => [['number' => '+48 123 456 789']], 'emails' => [['email' => 'qa@example.test']], 'hours' => '<p>Godziny testowe</p>'];
$category = get_term_by('slug', 'factory-qa', 'category');
if (!$category) { $term = wp_insert_term('Factory QA', 'category', ['slug' => 'factory-qa']); $category = get_term($term['term_id'], 'category'); }
$posts = [];
for ($i = 1; $i <= 3; $i++) {
    $slug = 'factory-qa-post-' . $i;
    $post = get_page_by_path($slug, OBJECT, 'post');
    $id = $post ? $post->ID : wp_insert_post(['post_type' => 'post', 'post_status' => 'publish', 'post_name' => $slug, 'post_title' => 'Wpis QA ' . $i, 'post_content' => '<h2>Nagłówek sekcji</h2>' . $html, 'post_category' => [$category->term_id]], true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    set_post_thumbnail($id, $image);
    $posts[] = $id;
}
$sections = [
    ['acf_fc_layout' => 'wysiwyg', 'heading' => 'Treść QA', 'content' => $html],
    ['acf_fc_layout' => 'image_text', 'heading' => 'Obraz i treść QA', 'image' => $image, 'content' => $html, 'link' => $link, 'image_side' => 'right'],
    ['acf_fc_layout' => 'tiles', 'heading' => 'Oferty QA', 'sort_open_first' => true, 'items' => [
        ['title' => 'Oferta zamknięta QA', 'content' => '<p>Opis QA</p>', 'link' => $link, 'admission_status' => 'closed'],
        ['title' => 'Oferta otwarta QA', 'image' => $image, 'link' => $link, 'admission_status' => 'open'],
        ['title' => 'Oferta nieustalona QA', 'link' => $link, 'admission_status' => ''],
    ]],
    ['acf_fc_layout' => 'cta', 'heading' => 'CTA QA', 'content' => '<p>Treść wezwania QA</p>', 'link' => $link],
    ['acf_fc_layout' => 'accordion', 'heading' => 'Accordion QA', 'items' => [['title' => 'Pytanie QA', 'content' => $html], ['title' => '', 'content' => '']]],
    ['acf_fc_layout' => 'tabs', 'heading' => 'Zakładki QA', 'items' => [['title' => 'Pierwsza QA', 'content' => $html], ['title' => 'Druga QA', 'content' => '<p>Drugi panel QA</p>']]],
    ['acf_fc_layout' => 'table', 'heading' => 'Tabela QA', 'caption' => 'Tabela danych QA', 'row_headers' => true, 'columns' => [['label' => 'Nazwa'], ['label' => 'Wartość']], 'rows' => [['cells' => [['value' => 'Pierwszy'], ['value' => '10']]], ['cells' => [['value' => 'Drugi'], ['value' => '20']]]]],
    ['acf_fc_layout' => 'gallery', 'heading' => 'Galeria QA', 'items' => [['image' => $image, 'caption' => 'Podpis QA'], ['image' => $image, 'decorative' => true]]],
    ['acf_fc_layout' => 'media', 'heading' => 'Media QA', 'url' => 'https://example.com/', 'title' => 'Ramka testowa QA', 'transcript' => '<p>Alternatywa QA</p>'],
    ['acf_fc_layout' => 'contact', 'heading' => 'Kontakt QA', 'items' => [$contact]],
    ['acf_fc_layout' => 'partners', 'heading' => 'Partnerzy QA', 'items' => [['name' => 'Partner QA', 'image' => $image, 'link' => $link]]],
    ['acf_fc_layout' => 'documents', 'heading' => 'Dokumenty QA', 'items' => [['title' => 'Dokument testowy', 'file' => $file, 'accessibility' => 'unverified'], ['title' => 'Dokument zewnętrzny QA', 'external_link' => ['url' => 'https://example.com/document.pdf', 'title' => 'QA', 'target' => '_blank'], 'accessibility' => 'alternative_required', 'alternative' => $link]]],
    ['acf_fc_layout' => 'news', 'heading' => 'Wpisy QA', 'count' => 2, 'categories' => [['label' => 'Kategoria QA', 'term' => $category->term_id, 'archive_link' => ['url' => get_category_link($category), 'title' => 'Archiwum QA', 'target' => '']]]],
    ['acf_fc_layout' => 'accordion', 'heading' => 'EMPTY MUST NOT RENDER', 'items' => []],
];
$variants = ['home' => 'template-homepage.php', 'basic' => 'template-basic.php', 'flexible' => 'template-flexible.php', 'banner-tile' => 'template-banner-tile.php', 'banner-accordion' => 'template-banner-accordion.php', 'course' => 'template-course.php', 'contact' => 'template-contact.php', 'empty' => 'template-flexible.php', 'static' => 'template-banner-accordion.php'];
$manifest = ['createdAt' => gmdate('c'), 'fixtureOnly' => true, 'acfVersion' => acf_get_setting('version'), 'pages' => [], 'posts' => $posts, 'category' => $category->term_id, 'image' => $image];
foreach ($variants as $variant => $template) {
    $slug = 'factory-qa-' . $variant;
    $page = get_page_by_path($slug);
    $id = $page ? $page->ID : wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_name' => $slug, 'post_title' => 'Factory QA — ' . $variant], true);
    if (is_wp_error($id)) { throw new RuntimeException($id->get_error_message()); }
    update_post_meta($id, '_wp_page_template', $template);
    $hero = ['title' => 'Factory QA — ' . $variant, 'slides' => []];
    if ($variant !== 'empty') {
        $hero['slides'][] = ['image' => $image, 'title' => 'Pierwszy baner QA', 'content' => '<p>Treść banera QA</p>', 'link' => $link];
        if (in_array($variant, ['home', 'banner-accordion'])) { $hero['slides'][] = ['image' => $image, 'title' => 'Drugi baner QA', 'link' => $link]; }
    }
    update_field('field_group_mwf_page_mwf_hero', $hero, $id);
    update_field('field_group_mwf_page_mwf_sections', $variant === 'empty' ? [] : $sections, $id);
    if ($variant === 'basic') { update_field('field_group_mwf_mwf_content_mwf_content', $html, $id); update_field('field_group_mwf_mwf_content_mwf_cta', $link, $id); }
    if ($variant === 'banner-tile') { update_field('field_group_mwf_mwf_overlay_mwf_overlay', ['heading' => 'Kafel QA', 'content' => $html, 'link' => $link], $id); }
    if ($variant === 'course') { update_field('field_group_mwf_mwf_course_mwf_course', ['heading' => 'Podsumowanie oferty QA', 'facts' => [['label' => 'Cena QA', 'value' => '100 zł'], ['label' => 'Semestry QA', 'value' => '2']], 'link' => $link], $id); }
    if ($variant === 'contact') {
        update_field('field_group_mwf_mwf_contact_cities_mwf_contact_cities', [['title' => 'Miasto pierwsze QA', 'departments' => [['title' => 'Biuro pierwsze QA', 'items' => [$contact]], ['title' => 'Biuro drugie QA', 'items' => [$contact]]]], ['title' => 'Miasto drugie QA', 'departments' => [['title' => 'Biuro QA', 'items' => [$contact]]]]], $id);
    }
    $manifest['pages'][$variant] = ['id' => $id, 'url' => get_permalink($id), 'template' => $template];
}
$menu = wp_get_nav_menu_object('Factory QA');
$menu_id = $menu ? $menu->term_id : wp_create_nav_menu('Factory QA');
if (!wp_get_nav_menu_items($menu_id)) {
    $parent = wp_update_nav_menu_item($menu_id, 0, ['menu-item-title' => 'Oferta QA', 'menu-item-url' => $manifest['pages']['flexible']['url'], 'menu-item-status' => 'publish']);
    wp_update_nav_menu_item($menu_id, 0, ['menu-item-title' => 'Kontakt QA', 'menu-item-url' => $manifest['pages']['contact']['url'], 'menu-item-parent-id' => $parent, 'menu-item-status' => 'publish']);
}
$locations = get_theme_mod('nav_menu_locations', []);
$locations['header'] = $menu_id;
set_theme_mod('nav_menu_locations', $locations);
file_put_contents($root . '/fixtures.json', wp_json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo wp_json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
