<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<?php $acf_globals=get_fields('options'); ?>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="theme-color" content="#4285f4">
    <?php wp_head(); ?>
    <?php if(isset($acf_globals['skrypty_header'])) : ?>
        <?php echo $acf_globals['skrypty_header']; ?>
    <?php endif; ?>
</head>

<body <?php body_class('preload'); ?>>
    <?php if(isset($acf_globals['skrypty_header_2'])) : ?>
        <?php echo $acf_globals['skrypty_header_2']; ?>
    <?php endif; ?>
    <?php
    if ( function_exists( 'global_render_topbar' ) ) {
        global_render_topbar();
    }
    ?>
    <?php get_template_part('partials/header'); ?>

    <main>