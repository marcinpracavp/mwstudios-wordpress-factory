<?php

/**
 * Add thumbnail support
 */
add_theme_support('post-thumbnails');

/**
 * Add title support for yoast
 */
add_theme_support( 'title-tag' );

/**
 * Add mime types support
 */
function addMimeTypes($mimes)
{
	$mimes['svg'] = 'image/svg+xml';
	return $mimes;
}
add_filter('upload_mimes', 'addMimeTypes');

/**
 * Remove comment support
 */
function remove_comment_support() {
    remove_post_type_support( 'post', 'comments' );
    remove_post_type_support( 'page', 'comments' );
}
add_action('init', 'remove_comment_support', 100);