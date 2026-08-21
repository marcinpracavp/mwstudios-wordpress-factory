<?php

/**
 * Load scripts
 */
function load_scripts()
{
	wp_enqueue_script('app', get_template_directory_uri() . '/dist/build-combined.js', array('jquery'), '1.0', true);

	wp_localize_script( 'app', 'ajax', array(
    	'url' => admin_url( 'admin-ajax.php' )
	));
}
add_action('wp_footer', 'load_scripts');