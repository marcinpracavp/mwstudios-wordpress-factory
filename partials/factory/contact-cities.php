<?php
$panels = [];
foreach ((array) ($args['cities'] ?? []) as $city) {
    $departments = [];
    foreach ((array) ($city['departments'] ?? []) as $department) {
        ob_start();
        get_template_part('partials/factory/contacts', null, ['items' => $department['items'] ?? []]);
        $departments[] = ['title' => $department['title'] ?? '', 'html' => ob_get_clean()];
    }
    ob_start();
    get_template_part('partials/factory/tabs', null, ['panels' => $departments, 'label' => 'Działy — ' . ($city['title'] ?? '')]);
    $panels[] = ['title' => $city['title'] ?? '', 'html' => ob_get_clean()];
}
ob_start();
get_template_part('partials/factory/tabs', null, ['panels' => $panels, 'label' => 'Miasta']);
$html = ob_get_clean();
if (trim($html) !== '') : ?>
<section class="mwf-contact-cities l-container py-50"><?php echo $html; ?></section>
<?php endif; ?>
