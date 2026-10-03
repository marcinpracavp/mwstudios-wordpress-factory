<?php
/**
 * Reusable editable page banner with optional dynamic breadcrumbs.
 *
 * @var array $args
 */

$banner = isset($args['banner']) && is_array($args['banner']) ? $args['banner'] : [];
$title = isset($args['title']) ? (string) $args['title'] : (string) ($banner['title'] ?? '');
$image_id = isset($args['image_id']) ? (int) $args['image_id'] : (int) ($banner['image'] ?? 0);
$section_class = isset($args['section_class']) ? (string) $args['section_class'] : '';
$variant = isset($args['variant']) ? (string) $args['variant'] : (string) ($banner['variant'] ?? '');
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : '';
$image_source_node = isset($args['image_source_node']) ? (string) $args['image_source_node'] : '';
$breadcrumb_only = !empty($args['breadcrumb_only']);
$is_fragment = !empty($args['is_fragment']);
$title_tag = isset($args['title_tag']) && in_array($args['title_tag'], ['h1', 'h2'], true) ? $args['title_tag'] : 'h1';
$image_url = $image_id && $variant !== 'catalogues' ? wp_get_attachment_image_url($image_id, 'full') : '';
$wrapper_tag = $is_fragment ? 'div' : 'section';

if ($title === '' && !$breadcrumb_only) {
    return;
}
?>
<<?php echo esc_attr($wrapper_tag); ?> class="c-page-banner l-container <?php echo esc_attr($section_class); ?><?php if ($variant !== '') : ?> c-page-banner--<?php echo esc_attr(sanitize_html_class($variant)); ?><?php endif; ?>"<?php if ($factory_section !== '') : ?> data-factory-section="<?php echo esc_attr($factory_section); ?>"<?php endif; ?> data-factory-component="page-banner">
    <?php if (!$breadcrumb_only) : ?>
        <div class="c-page-banner__media"<?php if ($image_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($image_source_node); ?>"<?php endif; ?><?php if ($image_url) : ?> style="--page-banner-image: url('<?php echo esc_url($image_url); ?>');"<?php endif; ?>>
            <div class="c-page-banner__inner">
                <<?php echo esc_attr($title_tag); ?>><?php echo emko_wysiwyg_heading($title); ?></<?php echo esc_attr($title_tag); ?>>
            </div>
        </div>
    <?php endif; ?>
    <?php emko_render_breadcrumbs('c-page-banner__breadcrumb'); ?>
</<?php echo esc_attr($wrapper_tag); ?>>
