<?php

/**
 * Disable gutenberg
 */
add_filter('use_block_editor_for_post_type', '__return_false', 100);

/**
 * Remove admin pages
 */
function remove_admin_menus() {
	// remove_menu_page('edit.php');
	remove_menu_page( 'edit-comments.php' );
	remove_menu_page( 'tools.php' );
	remove_submenu_page( 'options-general.php', 'options-writing.php' );
	remove_submenu_page( 'options-general.php', 'options-discussion.php' );
	remove_submenu_page( 'options-general.php', 'options-media.php' );
	define('DISALLOW_FILE_EDIT', TRUE);
}
add_action( 'admin_menu', 'remove_admin_menus' );

/**
 * Remove 32px margin-top property from logged admin bar
 */
function remove_admin_login_header() {
    remove_action('wp_head', '_admin_bar_bump_cb');
}
add_action('get_header', 'remove_admin_login_header');

/**
 * Change wordpress wp-admin logo image
 */
function change_wp_login_logo_image() { 
    $logo = get_field('logo', 'options');
    ?>
    <style>
        body.login{background:#1a1f22;color:#8d8f9a;}
        body.login form{background:none;border-radius:4px;border:none;}
        body.login form .input, body.login form input[type=checkbox], body.login input[type=text]{background:#212329;border:1px solid #2E3139;color:#ddd;}
        body.login label{font-size:13px;line-height:3;}
        body.login form .forgetmenot, body.login #login form p.submit{margin-top:15px;}
        body.login #language-switcher select, body.login .language-switcher .button{background-color:#212329;border:1px solid #2E3139;}
        body.login #language-switcher select{margin-top:-13px;}
        body.login h1 a {
            background-image: url('<?php echo $logo['url'] ?>') !important;
            background-size: contain;
            width: 320px;
            height: 80px;
            background-position: center;
        }
    </style>
<?php }
add_action( 'login_enqueue_scripts', 'change_wp_login_logo_image' );

/**
 * Change wordpress wp-admin logo behavior
 */
function change_wp_login_logo_url() { ?>
    <script>
        document.getElementById('rememberme').checked = true;
        document.querySelector('.login h1 a').href='<?php echo home_url(); ?>';
    </script>
<?php }
add_action( 'login_footer', 'change_wp_login_logo_url' );

// function move_admin_bar_bottom() {
//     echo '<style>
//     body {
//     margin-top: -28px;
//     padding-bottom: 28px;
//     }
//     body.admin-bar #wphead {
//        padding-top: 0;
//     }
//     body.admin-bar #footer {
//        padding-bottom: 28px;
//     }
//     #wpadminbar {
//         top: auto !important;
//         bottom: 0;
//     }
//     #wpadminbar .quicklinks .menupop ul {
//         bottom: 28px;
//     }
//     </style>';
// }
// // Action to add CSS on WP admin
// add_action( 'admin_head', 'move_admin_bar_bottom' );
// // action to add CSS to frontend
// add_action( 'wp_head', 'move_admin_bar_bottom' );