<?php
/**
 * Native catalogue card.
 *
 * @var array $args
 */
$card = isset($args['card']) && is_array($args['card']) ? $args['card'] : [];
$index = isset($args['index']) ? (int) $args['index'] : 0;
$title = trim((string) ($card['title'] ?? ''));
$title_text = wp_strip_all_tags($title);
$download_label = trim((string) ($card['pdf_label'] ?? ''));
$cover_id = isset($card['cover']) ? (int) $card['cover'] : 0;
$pdf_id = isset($card['pdf']) ? (int) $card['pdf'] : 0;
$image_source_node = isset($args['image_source_node']) ? (string) $args['image_source_node'] : '';
$title_source_node = isset($args['title_source_node']) ? (string) $args['title_source_node'] : '';
$download_source_node = isset($args['download_source_node']) ? (string) $args['download_source_node'] : '';
$download_icon_id = isset($args['download_icon_id']) ? (int) $args['download_icon_id'] : 0;
$download_icon_source_node = isset($args['download_icon_source_node']) ? (string) $args['download_icon_source_node'] : '125:2528';
$background_id = isset($args['background_id']) ? (int) $args['background_id'] : 0;
$background_source_node = isset($args['background_source_node']) ? (string) $args['background_source_node'] : '';
$surface_source_node = isset($args['surface_source_node']) ? (string) $args['surface_source_node'] : '';
$overlay_cover_id = isset($args['overlay_cover_id']) ? (int) $args['overlay_cover_id'] : 0;
$overlay_source_node = isset($args['overlay_source_node']) ? (string) $args['overlay_source_node'] : '';
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : '';
$card_class = isset($args['card_class']) ? (string) $args['card_class'] : '';
$source_identity = isset($args['source_identity']) ? (string) $args['source_identity'] : '';
$demo_clone = !empty($args['demo_clone']);
$clone_of = isset($args['clone_of']) ? (string) $args['clone_of'] : '';
$download_url = $pdf_id ? wp_get_attachment_url($pdf_id) : '';
?>
<article class="c-catalogue-card <?php echo esc_attr($card_class); ?>"<?php if ($factory_section !== '') : ?> data-factory-section="<?php echo esc_attr($factory_section); ?>"<?php endif; ?> data-factory-component="catalogue-card" data-factory-card-index="<?php echo esc_attr((string) ($index + 1)); ?>"<?php if ($source_identity !== '') : ?> data-factory-source-identity="<?php echo esc_attr($source_identity); ?>"<?php endif; ?><?php if ($demo_clone) : ?> data-factory-demo-clone="true"<?php endif; ?><?php if ($clone_of !== '') : ?> data-factory-clone-of="<?php echo esc_attr($clone_of); ?>"<?php endif; ?>>
    <div class="c-catalogue-card__media">
        <?php if ($background_id || $overlay_cover_id) : ?>
            <?php if ($background_id) : ?>
                <div class="c-catalogue-card__background" aria-hidden="true">
                    <?php echo wp_get_attachment_image($background_id, 'full', false, [
                        'alt' => '',
                        'loading' => false,
                        'data-factory-source-node' => $background_source_node,
                    ]); ?>
                </div>
                <div class="c-catalogue-card__surface"<?php if ($surface_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($surface_source_node); ?>"<?php endif; ?> aria-hidden="true"></div>
            <?php endif; ?>
            <div class="c-catalogue-card__cover c-catalogue-card__cover--layered">
                <?php if ($cover_id) : ?>
                    <?php echo wp_get_attachment_image($cover_id, 'full', false, [
                        'alt' => $title_text,
                        'loading' => false,
                        'data-factory-source-node' => $image_source_node,
                    ]); ?>
                <?php endif; ?>
                <?php if ($overlay_cover_id) : ?>
                    <?php echo wp_get_attachment_image($overlay_cover_id, 'full', false, [
                        'alt' => '',
                        'loading' => false,
                        'data-factory-source-node' => $overlay_source_node,
                    ]); ?>
                <?php endif; ?>
            </div>
        <?php elseif ($cover_id) : ?>
            <?php echo wp_get_attachment_image($cover_id, 'full', false, [
                'alt' => $title_text,
                'loading' => false,
                'data-factory-source-node' => $image_source_node,
            ]); ?>
        <?php endif; ?>
    </div>
    <?php if ($title !== '') : ?>
        <h2 class="c-catalogue-card__title" data-factory-source-node="<?php echo esc_attr($title_source_node); ?>"><?php echo emko_wysiwyg_heading($title); ?></h2>
    <?php endif; ?>
    <?php if ($download_label !== '') : ?>
        <?php if ($download_url) : ?>
            <a class="c-catalogue-card__download" href="<?php echo esc_url($download_url); ?>" data-factory-source-node="<?php echo esc_attr($download_source_node); ?>">
        <?php else : ?>
            <span class="c-catalogue-card__download" data-factory-source-node="<?php echo esc_attr($download_source_node); ?>" data-factory-source-gap="missing-download-url" aria-disabled="true">
        <?php endif; ?>
                <?php if ($download_icon_id) : ?>
                    <?php echo wp_get_attachment_image($download_icon_id, 'full', false, ['alt' => '', 'aria-hidden' => 'true', 'data-factory-source-node' => $download_icon_source_node]); ?>
                <?php endif; ?>
                <span><?php echo esc_html($download_label); ?></span>
        <?php echo $download_url ? '</a>' : '</span>'; ?>
    <?php endif; ?>
</article>
