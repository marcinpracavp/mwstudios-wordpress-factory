<?php
/**
 * Reusable editable page banner with an optional source-backed breadcrumb.
 *
 * @var array $args
 */

$banner = isset($args['banner']) && is_array($args['banner']) ? $args['banner'] : [];
$title = isset($args['title']) ? (string) $args['title'] : (string) ($banner['title'] ?? '');
$breadcrumb = isset($args['breadcrumb']) ? (string) $args['breadcrumb'] : (string) ($banner['breadcrumb'] ?? '');
$image_id = isset($args['image_id']) ? (int) $args['image_id'] : (int) ($banner['image'] ?? 0);
$section_class = isset($args['section_class']) ? (string) $args['section_class'] : '';
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : '';
$breadcrumb_current = isset($args['breadcrumb_current']) ? (string) $args['breadcrumb_current'] : '';
$title_tag = isset($args['title_tag']) && in_array($args['title_tag'], ['h1', 'h2'], true) ? $args['title_tag'] : 'h1';
$image_url = $image_id ? wp_get_attachment_image_url($image_id, 'full') : '';

if ($title === '') {
    return;
}
?>
<section class="c-page-banner l-container <?php echo esc_attr($section_class); ?>"<?php if ($factory_section !== '') : ?> data-factory-section="<?php echo esc_attr($factory_section); ?>"<?php endif; ?> data-factory-component="page-banner">
    <div class="c-page-banner__media"<?php if ($image_url) : ?> style="--page-banner-image: url('<?php echo esc_url($image_url); ?>');"<?php endif; ?>>
        <div class="c-page-banner__inner">
            <<?php echo esc_attr($title_tag); ?>><?php echo esc_html($title); ?></<?php echo esc_attr($title_tag); ?>>
        </div>
    </div>
    <?php if ($breadcrumb !== '') : ?>
        <p class="c-page-banner__breadcrumb"><?php
            $current_offset = $breadcrumb_current !== '' ? strrpos($breadcrumb, $breadcrumb_current) : false;
            if ($current_offset !== false) {
                echo esc_html(substr($breadcrumb, 0, $current_offset));
                echo '<span class="c-page-banner__breadcrumb-current">' . esc_html($breadcrumb_current) . '</span>';
            } else {
                echo esc_html($breadcrumb);
            }
        ?></p>
    <?php endif; ?>
</section>
