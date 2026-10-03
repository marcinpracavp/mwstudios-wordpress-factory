<?php
/**
 * Partial: Sekcja z obrazkiem po lewej, treścią po prawej.
 *
 * Oczekiwane argumenty:
 * @type array  $args['image']            Tablica z obrazem (ACF image)
 * @type string $args['title']            Tytuł sekcji
 * @type string $args['content']          Zawartość HTML sekcji.
 * @type array  $args['button']           Tablica z przyciskiem (ACF link)
 * @type array  $args['background']       Tło sekcji (ACF image)
 * @type string $args['section_id']       (opcjonalnie) ID sekcji.
 * @type string $args['section_class']    (opcjonalnie) Dodatkowe klasy dla sekcji.
 * @type string $args['container_class']  (opcjonalnie) Dodatkowe klasy dla kontenera.
 * @type string $args['image_class']      (opcjonalnie) Klasy dla kolumny obrazka (np. 'gc-2/7').
 * @type string $args['content_class']    (opcjonalnie) Klasy dla kolumny treści (np. 'gc-8/14').
 * @type string $args['button_class']     (opcjonalnie) Klasa przycisku (domyślnie 'button-primary').
 *
 * Przykład użycia:
 * get_template_part('partials/section-image', null, [
 *     'image' => get_field('obraz'),
 *     'content' => get_field('tresc'),
 *     'button' => get_field('przycisk'),
 *     'image_class' => 'gc-2/6', 
 *     'content_class' => 'gc-7/14'
 * ]);
 * 
 */
$image          = $args['image'] ?? [];
$title          = $args['title'] ?? '';
$content        = $args['content'] ?? '';
$button         = $args['button'] ?? [];
$background     = $args['background'] ?? [];
$bg_url         = isset($background['url']) ? "style=\"background-image: url({$background['url']});\"" : '';
$section_id     = $args['section_id'] ?? '';
$section_cls    = $args['section_class'] ?? '';
$container_cls  = $args['container_class'] ?? '';
$image_cls      = $args['image_class'] ?? 'gc-2/7';
$content_cls    = $args['content_class'] ?? 'gc-8/14';
$button_cls     = $args['button_class'] ?? 'button-primary';
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : '';
$factory_component = isset($args['factory_component']) ? (string) $args['factory_component'] : '';
$image_source_node = isset($args['image_source_node']) ? (string) $args['image_source_node'] : '';
$title_source_node = isset($args['title_source_node']) ? (string) $args['title_source_node'] : '';
$image_aos = isset($args['image_aos']) ? sanitize_key((string) $args['image_aos']) : '';
$content_aos = isset($args['content_aos']) ? sanitize_key((string) $args['content_aos']) : '';
$content_aos_delay = isset($args['content_aos_delay']) ? max(0, (int) $args['content_aos_delay']) : 0;
$title_tag      = isset($args['title_tag']) && in_array($args['title_tag'], ['h1', 'h2', 'h3'], true) ? $args['title_tag'] : 'div';
?>
<section id="<?php echo esc_attr($section_id); ?>" class="section-image-left <?php echo esc_attr($section_cls); ?>"<?php if ($bg_url !== '') : ?> <?php echo $bg_url; ?><?php endif; ?><?php if ($factory_section !== '') : ?> data-factory-section="<?php echo esc_attr($factory_section); ?>"<?php endif; ?><?php if ($factory_component !== '') : ?> data-factory-component="<?php echo esc_attr($factory_component); ?>"<?php endif; ?>>
    <div class="section-image-container grid align-center <?php echo esc_attr($container_cls); ?>">
        <div class="section-image-container__image <?php echo esc_attr($image_cls); ?>"<?php if ($image_aos !== '') : ?> data-aos="<?php echo esc_attr($image_aos); ?>"<?php endif; ?><?php if ($factory_component !== '') : ?> data-factory-component="<?php echo esc_attr($factory_component); ?>"<?php endif; ?>>
            <div class="image">
                <?php if (isset($image) && !empty($image)) : ?>
                    <?php
                    $attachment_id = is_array($image) ? (int) ($image['id'] ?? 0) : (int) $image;
                    if ($attachment_id) {
                        $image_attributes = [
                            'alt' => is_array($image) ? (string) ($image['alt'] ?? '') : '',
                            'loading' => false,
                        ];
                        if ($image_source_node !== '') {
                            $image_attributes['data-factory-source-node'] = $image_source_node;
                        }
                        echo wp_get_attachment_image($attachment_id, 'full', false, $image_attributes);
                    }
                    ?>
                <?php endif; ?>
            </div>
        </div>
        <div class="section-image-container__content <?php echo esc_attr($content_cls); ?>"<?php if ($content_aos !== '') : ?> data-aos="<?php echo esc_attr($content_aos); ?>" data-aos-delay="<?php echo esc_attr((string) $content_aos_delay); ?>"<?php endif; ?>>
            <?php if(!empty($title)) : ?>
                <div class="section-image-container__title">
                    <<?php echo esc_attr($title_tag); ?><?php if ($title_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($title_source_node); ?>"<?php endif; ?>><?php echo emko_wysiwyg_heading($title); ?></<?php echo esc_attr($title_tag); ?>>
                </div>
            <?php endif; ?>
            <div class="section-image-container__wrapper c-wysiwyg">
                <?php echo emko_wysiwyg_content($content); ?>
            </div>
            <?php if(!empty($button)) : ?>
                <div class="section-image-container__button mt-40">
                    <?= acf_link($button, $button_cls) ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
