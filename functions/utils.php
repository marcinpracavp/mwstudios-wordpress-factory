<?php

/**
 * Register user session
 */
function registerSession()
{
	if (!session_id()) {
		session_start();
	}
}
add_action('init', 'registerSession');

/**
 * Hide private pages from nav menu
 */
function wp_nav_menu_hide_private_pages ($items, $args) {
    foreach ($items as $ix => $obj) {
        if (!is_user_logged_in () && 'private' == get_post_status ($obj->object_id)) {
            unset ($items[$ix]);
        }
    }
    return $items;
}
add_filter ('wp_nav_menu_objects', 'wp_nav_menu_hide_private_pages', 10, 2); 



function customize_acf_wysiwyg_toolbar($toolbars) {
    // Przykład: modyfikacja istniejącej grupy narzędzi "Full"
    if (isset($toolbars['Full'])) {
        // Dodanie przycisku "formats" do grupy
        array_unshift($toolbars['Full'][2], 'styleselect');
    }

    return $toolbars;
}
add_filter('acf/fields/wysiwyg/toolbars', 'customize_acf_wysiwyg_toolbar');

function add_custom_styles_to_tinymce($settings) {
    $style_formats = [
        [
            'title' => 'Font Size',
            'items' => [
                ['title' => '24', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-24'],
                ['title' => '34', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-34'],
                ['title' => '60', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-60'],
                ['title' => '80', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-80'],
                ['title' => '100', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-100'],
            ],
        ],
        [
            'title' => 'Font Weight',
            'items' => [
                ['title' => 'Light', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-light'],
                ['title' => 'Regular', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-regular'],
                ['title' => 'Medium', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-medium'],
                ['title' => 'SemiBold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-semibold'],
                ['title' => 'Bold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-bold'],
                ['title' => 'ExtraBold', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-extrabold'],
                ['title' => 'Black', 'selector' => '*', 'inline' => 'span', 'classes' => 'weight-black'],
            ],
        ],
        [
            'title' => 'Font Color',
            'items' => [
                ['title' => 'White', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-white'],
                ['title' => 'Black', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-black'],
                ['title' => 'Accent', 'selector' => '*', 'inline' => 'span', 'classes' => 'color-accent'],
                
                
            ],
        ],
        [
            'title' => 'Font Family',
            'items' => [
                ['title' => 'Base font', 'selector' => '*', 'inline' => 'span', 'classes' => 'font-family-base'],
                ['title' => 'Heading font', 'selector' => '*', 'inline' => 'span', 'classes' => 'font-family-heading'],
            ],
        ],
        [
            'title' => 'Font Transform',
            'items' => [
                ['title' => 'Uppercase', 'selector' => '*', 'inline' => 'span', 'classes' => 'text-uppercase'],
            ],
        ],
        [
            'title' => 'Margins',
            'items' => [
                ['title' => 'Top 30px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-30'],
                ['title' => 'Top 40px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-40'],
                ['title' => 'Top 60px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-60'],
                ['title' => 'Top 90px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-90'],
                ['title' => 'Top 120px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mt-120'],
                ['title' => 'Bottom 30px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-30'],
                ['title' => 'Bottom 40px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-40'],
                ['title' => 'Bottom 60px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-60'],
                ['title' => 'Bottom 90px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-90'],
                ['title' => 'Bottom 120px', 'selector' => '*', 'inline' => 'span', 'classes' => 'mb-120'],
            ],
        ],
    ];

    $settings['style_formats'] = json_encode($style_formats);
    return $settings;
}
add_filter('tiny_mce_before_init', 'add_custom_styles_to_tinymce');


function display_breadcrumbs() {
    $separator = ' / '; // Separator między linkami
    $home = 'Strona główna'; // Nazwa dla linku do strony głównej

    echo '<nav class="breadcrumbs">';
    
    // Link do strony głównej
    echo '<a href="' . home_url() . '">' . $home . '</a>' . $separator;

    // Sprawdza, czy jesteśmy na stronie kategorii lub pojedynczego wpisu
    if (is_category() || is_single()) {
        the_category(', '); // Wypisuje kategorie dla wpisu
        if (is_single()) {
            echo $separator;
            the_title(); // Tytuł dla pojedynczego wpisu
        }
    } elseif (is_page()) { // Dla stron statycznych
        echo the_title();
    } elseif (is_search()) { // Strona wyników wyszukiwania
        echo 'Wyniki wyszukiwania dla: ' . get_search_query();
    } elseif (is_404()) { // Strona błędu 404
        echo 'Strona nie została znaleziona';
    }

    echo '</nav>';
}

// <?php display_breadcrumbs(); ?>