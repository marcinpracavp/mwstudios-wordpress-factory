<?php
/**
 * Seeds the editable ACF content for the Serwis page.
 *
 * Run with:
 * node scripts/factory/autopilot/wp.js eval-file scripts/factory/project/import-service-acf.php
 */
if (!function_exists('update_field')) {
    return;
}

$service_page = get_page_by_path('serwis', OBJECT, 'page');
if (!$service_page instanceof WP_Post) {
    return;
}

update_field('field_emko_service_sections', [
    [
        'field_emko_service_section_heading' => 'Serwis hydrauliki siłowej',
        'field_emko_service_section_content' => '<p>Świadczymy profesjonalny serwis narzędzi i układów hydrauliki siłowej wykorzystywanych w przemyśle oraz Utrzymaniu Ruchu. Zapewniamy szybką diagnostykę, naprawy oraz wsparcie techniczne.</p><p>Maecenas aliquam posuere ornare. Sed porta diam sem, et hendrerit elit vehicula et. Nulla ornare lectus ut scelerisque auctor. Mauris faucibus lorem nisl, vitae dapibus eros aliquam eu. Integer efficitur massa quis condimentum imperdiet. Cras tempus felis lorem, nec egestas metus finibus vitae. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque feugiat, sem malesuada pharetra commodo, felis arcu auctor risus, non sodales risus ante et tellus. Nunc nec neque cursus, ultricies quam sit amet, auctor eros. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vestibulum mollis, enim non maximus iaculis, quam ipsum fringilla nibh, sit amet elementum neque velit quis lorem. Phasellus nulla justo, finibus in arcu quis, ullamcorper vestibulum nisi. Nulla consectetur elementum diam nec bibendum. Praesent sit amet felis auctor, hendrerit dolor ac, lobortis dui.</p>',
        'field_emko_service_section_image' => 168,
        'field_emko_service_section_overlay_image' => 0,
        'field_emko_service_section_image_side' => 'right',
        'field_emko_service_section_button' => false,
    ],
    [
        'field_emko_service_section_heading' => 'Zakres usług',
        'field_emko_service_section_content' => '<ul><li>serwis i regeneracja narzędzi hydraulicznych</li><li>naprawa pomp, cylindrów i zasilaczy</li><li>diagnostyka układów hydraulicznych</li><li>przeglądy i konserwacja</li><li>dobór i wymiana części</li><li>uruchomienia i testy urządzeń</li></ul>',
        'field_emko_service_section_image' => 38,
        'field_emko_service_section_overlay_image' => 39,
        'field_emko_service_section_image_side' => 'left',
        'field_emko_service_section_button' => [
            'title' => 'Skontaktuj się',
            'url' => '#contact',
            'target' => '',
        ],
        'field_emko_service_section_content_after_button' => '<h3>Szybki serwis i wsparcie</h3><p>Minimalizujemy przestoje produkcyjne dzięki sprawnej diagnostyce, dostępności części oraz szybkim realizacjom napraw.</p>',
    ],
], $service_page->ID);

update_field('field_emko_service_media_band', [
    'field_emko_service_media_band_heading' => '<strong>Potrzebujesz serwisu lub wsparcia technicznego?</strong><br>Skontaktuj się z nami — pomożemy dobrać najlepsze rozwiązanie i<br>szybko usuniemy usterkę.',
    'field_emko_service_media_band_button' => [
        'title' => 'Skontaktuj się',
        'url' => '#contact',
        'target' => '',
    ],
    'field_emko_service_media_band_image' => 40,
    'field_emko_service_media_band_mask' => 41,
], $service_page->ID);

echo 'Service ACF content imported for page ' . (int) $service_page->ID . PHP_EOL;
