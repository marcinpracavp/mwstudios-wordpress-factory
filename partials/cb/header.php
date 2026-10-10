<?php
ob_start(); wp_nav_menu(['theme_location'=>'header','container'=>false,'menu_class'=>'menu','fallback_cb'=>false]);$navigation=ob_get_clean();
$html=str_replace('[cb_navigation]', $navigation, (get_field('cb_header','option') ?: get_option('cb_header','')));
?>
<header class="<?php echo is_front_page()?'homepage':''; ?> cb-header"><?php echo cb_html($html);if(!is_front_page())echo cb_html(is_category()?get_option('cb_archive_breadcrumb'):get_post_meta(get_queried_object_id(),'_cb_breadcrumb',true)); ?></header>
