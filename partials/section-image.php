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
?>
<section id="<?php echo esc_attr($section_id); ?>" class="section-image-left <?php echo esc_attr($section_cls); ?>" <?php echo $bg_url; ?>>
    <div class="section-image-container grid align-center <?php echo esc_attr($container_cls); ?>">
        <div class="section-image-container__image <?php echo esc_attr($image_cls); ?>">
            <div class="image">
                <?= isset($image) && !empty($image) ? acf_image($image) : ''; ?>
            </div>
        </div>
        <div class="section-image-container__content <?php echo esc_attr($content_cls); ?>">
            <?php if(!empty($title)) : ?>
                <div class="section-image-container__title">
                    <?= $title ?>
                </div>
            <?php endif; ?>
            <div class="section-image-container__wrapper">
                <?= $content ?>
            </div>
            <?php if(!empty($button)) : ?>
                <div class="section-image-container__button mt-40">
                    <?= acf_link($button, $button_cls) ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
