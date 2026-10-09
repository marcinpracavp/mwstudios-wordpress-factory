<?php
get_header();
if (is_home()) {
    get_template_part('partials/factory/archive');
} else {
    get_template_part('partials/factory/page', null, ['variant' => 'home']);
}
get_footer();
