<?php

/**
 * Load scripts
 */
function load_scripts()
{
	$script_path = get_template_directory() . '/dist/build-combined.js';
	$script_version = file_exists($script_path) ? (string) filemtime($script_path) : '1.0';
	wp_enqueue_script('app', get_template_directory_uri() . '/dist/build-combined.js', array('jquery'), $script_version, true);

	wp_localize_script( 'app', 'ajax', array(
		'url' => admin_url( 'admin-ajax.php' ),
		'productFiltersNonce' => wp_create_nonce( 'emko_product_filters' ),
	));
}
add_action('wp_footer', 'load_scripts');
