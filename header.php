<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<?php $acf_globals = function_exists('get_fields') ? (array) get_fields('options') : []; ?>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
    <?php if (isset($acf_globals['skrypty_header'])) { echo $acf_globals['skrypty_header']; } ?>
</head>
<body <?php body_class('preload mwf-site'); ?>>
    <?php wp_body_open(); ?>
    <a class="mwf-skip-link" href="#main-content">Przejdź do treści</a>
    <?php if (isset($acf_globals['skrypty_header_2'])) { echo $acf_globals['skrypty_header_2']; } ?>
    <?php if (function_exists('global_render_topbar')) { global_render_topbar(); } ?>
    <?php get_template_part('partials/header'); ?>
    <main id="main-content" tabindex="-1">
