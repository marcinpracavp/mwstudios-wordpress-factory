<?php

// function post_trainer()  {
//     $labels = array(
//       'name' => _x('Trenerzy', 'Trenerzy', 'slawinsky_theme'),
// 	  'singular_name' => _x('Trener', 'Trener', 'slawinsky_theme'),
// 	  'add_new'               => _x( 'Dodaj nowego trenera', 'slawinsky_theme' ),
// 	  'add_new_item'          => _x( 'Dodaj nowego trenera', 'slawinsky_theme' ),
// 	  'new_item'              => _x( 'Dodaj nowego trenera', 'slawinsky_theme' ),
// 	  'edit_item'             => _x( 'Edytuj trenera', 'slawinsky_theme' ),
// 	  'view_item'             => _x( 'Zobacz trenera', 'slawinsky_theme' ),
// 	  'all_items'             => _x( 'Wszyscy trenerzy', 'slawinsky_theme' ),
// 	  'search_items'          => _x( 'Szukaj trenera', 'slawinsky_theme' ),
//     );
//     $args = array(
//       'label' => __('Trenerzy', 'slawinsky_theme'),
//       'labels' => $labels,
//       'supports' => array('title'),
//       'public' => true,
//       'show_ui' => true,
//       'show_in_menu' => true,
//       'menu_position' =>5,
//       'show_in_admin_bar' => true,
//       'show_in_nav_menus' => true,
//       'can_export' => true,
//       'has_archive' => false,
//       'exclude_from_search' => false,
//       'publicly_queryable' => true,
//       'capability_type' => 'page',
//       'query_var' => true,
//       'rewrite' => array('slug' => 'trenerzy'),
//     );
// 	register_post_type('trainer', $args);
// }
// add_action('init', 'post_trainer');


function post_services()  {
    $labels = array(
      'name' => _x('Usługi', 'Usługi', 'slawinsky_theme'),
	  'singular_name' => _x('Usługa', 'Usługa', 'slawinsky_theme'),
	  'add_new'               => _x( 'Dodaj nową usługę', 'slawinsky_theme' ),
	  'add_new_item'          => _x( 'Dodaj nową usługę', 'slawinsky_theme' ),
	  'new_item'              => _x( 'Dodaj nową usługę', 'slawinsky_theme' ),
	  'edit_item'             => _x( 'Edytuj usługę', 'slawinsky_theme' ),
	  'view_item'             => _x( 'Zobacz usługę', 'slawinsky_theme' ),
	  'all_items'             => _x( 'Wszystkie usługi', 'slawinsky_theme' ),
	  'search_items'          => _x( 'Szukaj usługi', 'slawinsky_theme' ),
    );
    $args = array(
      'label' => __('Usługi', 'slawinsky_theme'),
      'labels' => $labels,
      'supports' => array('title'),
      'public' => true,
      'show_ui' => true,
      'show_in_menu' => true,
      'menu_position' =>5,
      'show_in_admin_bar' => true,
      'show_in_nav_menus' => true,
      'can_export' => true,
      'has_archive' => false,
      'exclude_from_search' => false,
      'publicly_queryable' => true,
      'capability_type' => 'page',
      'query_var' => true,
      'rewrite' => array('slug' => 'uslugi'),
    );
	register_post_type('services', $args);
}
add_action('init', 'post_services');


function post_opinions()  {
  $labels = array(
  'name' => _x('Opinie', 'Opinie', 'slawinsky_theme'),
  'singular_name' => _x('Opinia', 'Opinia', 'slawinsky_theme'),
	  'add_new'               => _x( 'Dodaj nową opinię', 'slawinsky_theme' ),
	  'add_new_item'          => _x( 'Dodaj nową opinię', 'slawinsky_theme' ),
	  'new_item'              => _x( 'Dodaj nową opinię', 'slawinsky_theme' ),
	  'edit_item'             => _x( 'Edytuj opinię', 'slawinsky_theme' ),
	  'view_item'             => _x( 'Zobacz opinię', 'slawinsky_theme' ),
	  'all_items'             => _x( 'Wszystkie opinie', 'slawinsky_theme' ),
	  'search_items'          => _x( 'Szukaj opinii', 'slawinsky_theme' ),
    );
    $args = array(
      'label' => __('Opinie', 'slawinsky_theme'),
      'labels' => $labels,
      'supports' => array('title'),
      'public' => true,
      'show_ui' => true,
      'show_in_menu' => true,
      'menu_position' =>5,
      'show_in_admin_bar' => true,
      'show_in_nav_menus' => true,
      'can_export' => true,
      'has_archive' => false,
      'exclude_from_search' => false,
      'publicly_queryable' => true,
      'capability_type' => 'page',
      'query_var' => true,
      'rewrite' => array('slug' => 'opinions'),
    );
	register_post_type('opinions', $args);
}
add_action('init', 'post_opinions');