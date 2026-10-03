<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="theme-color" content="#4285f4">
    <link rel="icon" href="<?php echo esc_url(get_theme_file_uri('assets/favicon.svg')); ?>" type="image/svg+xml">
    <?php wp_head(); ?>
</head>

<body <?php body_class('preload'); ?>>
    <?php wp_body_open(); ?>
    <?php get_template_part('partials/header'); ?>

    <main id="main-content" data-factory-component="route-shell">
