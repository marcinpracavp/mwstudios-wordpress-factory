<?php
/**
 *
 * @package slawinsky_pl
 */

define( 'FUNCTIONS_DIR', get_stylesheet_directory() . '/functions/' );

require_once( 'vendor/autoload.php' );
require_once( FUNCTIONS_DIR . 'security.php' );
require_once( FUNCTIONS_DIR . 'register_styles.php' );
require_once( FUNCTIONS_DIR . 'register_scripts.php' );
require_once( FUNCTIONS_DIR . 'deregister_styles.php' );
require_once( FUNCTIONS_DIR . 'deregister_scripts.php' );
require_once( FUNCTIONS_DIR . 'register_post_types.php' );
require_once( FUNCTIONS_DIR . 'register_taxonomies.php' );
require_once( FUNCTIONS_DIR . 'register_custom_strings.php' );
require_once( FUNCTIONS_DIR . 'acf.php' );
require_once( FUNCTIONS_DIR . 'register_nav_menus.php' );
require_once( FUNCTIONS_DIR . 'image_sizes.php' );
require_once( FUNCTIONS_DIR . 'support.php' );
require_once( FUNCTIONS_DIR . 'admin.php' );
require_once( FUNCTIONS_DIR . 'utils.php' );
require_once( FUNCTIONS_DIR . 'helpers.php' );
require_once( FUNCTIONS_DIR . 'optimization.php' );
require_once( FUNCTIONS_DIR . 'rudnikagro.php' );
