<?php
get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'contact',
    'sections' => ['contact-overview', 'contact-form', 'contact-background'],
]);
get_footer();
