<?php get_header();
the_post();

if (function_exists('is_account_page') && is_account_page() && !is_user_logged_in()) :
    ?><div class="l-container"><?php get_template_part('partials/account-form'); ?></div><?php
elseif (function_exists('is_cart') && (is_cart() || is_checkout())) :
    the_content();
else : ?>
    <div class="l-container">
        <?php the_content(); ?>
    </div>
<?php endif;

get_footer(); ?><?php // Test PHP watcher ptk 11 lip 14:37:57 2025 CEST ?>
