<?php
get_header();
$catalogues_page_id = (int) get_queried_object_id();
$catalogues_banner = function_exists('get_field') ? get_field('emko_catalogues_banner', $catalogues_page_id) : [];
?>
<div class="c-catalogues-page" data-factory-component="catalogues-page">
<?php
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'catalogues',
    'sections' => ['catalogues-primary', 'catalogues-secondary'],
    'catalogues_banner' => is_array($catalogues_banner) ? $catalogues_banner : [],
]);
?>
</div>
<?php
get_footer();
