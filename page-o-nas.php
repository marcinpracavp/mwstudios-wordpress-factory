<?php
get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'about',
    'sections' => ['about-hero', 'about-overview', 'about-values', 'about-media-band'],
]);
get_footer();
