<?php
get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'product',
    'sections' => [
        'product-detail',
        'product-specification',
        'product-related',
        'product-contact-cta',
    ],
]);
get_footer();
