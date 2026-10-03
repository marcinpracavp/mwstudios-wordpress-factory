<?php
get_header();
$service_page_class = 'c-service-page';
?>
<div class="<?php echo esc_attr($service_page_class); ?>" data-factory-component="service-page">
<?php
get_template_part('partials/service-page');
?>
</div>
<?php
get_footer();
