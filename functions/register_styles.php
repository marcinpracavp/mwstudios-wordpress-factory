<?php

/**
 * Load styles
 */
function load_styles() {
	
	wp_enqueue_style('app', get_template_directory_uri() . '/dist/build-style.css', true, '1.0', 'all');
}
add_action('wp_enqueue_scripts', 'load_styles');

function add_custom_editor_styles() {
    add_editor_style(get_template_directory_uri() . '/dist/editor-styles.css');
}
add_action('admin_init', 'add_custom_editor_styles');