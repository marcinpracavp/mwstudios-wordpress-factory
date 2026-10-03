<?php
get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'product-list',
    'sections' => ['product-list-menu', 'product-list-items', 'product-list-filters'],
]);
get_footer();
