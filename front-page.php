<?php
get_header();
get_template_part('partials/route-skeleton', null, [
    'route_id' => 'home',
    'sections' => ['home-slider', 'home-product-categories', 'home-popular-products', 'home-intro', 'home-benefits', 'home-blog', 'home-faq'],
]);
get_footer();
