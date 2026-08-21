<?php

/**
 * Remove styles
 *
 * @return void
 */
function removeStyles()
{
	wp_deregister_style('contact-form-7');
	wp_dequeue_style('contact-form-7');
	wp_dequeue_style('wp-block-library');
}
add_action('wp_print_styles', 'removeStyles', 100);

/**
 * Remove default woocommerce styles
 */
// add_filter('woocommerce_enqueue_styles', '__return_empty_array');

/**
 * Disable WPCF7 styles
 */
// add_filter( 'wpcf7_load_css', '__return_false' );