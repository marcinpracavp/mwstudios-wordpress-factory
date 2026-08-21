<?php

/**
 * Remove scripts
 */
function my_deregister_scripts()
{
	wp_deregister_script('wp-embed');
	wp_dequeue_script( 'wp-embed' );
}
add_action('wp_footer', 'my_deregister_scripts');

/**
 * Disable WPCF7 scripts
 */
// add_filter( 'wpcf7_load_js', '__return_false' );