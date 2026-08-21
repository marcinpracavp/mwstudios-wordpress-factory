<?php

// function taxonomy_specialization() {
//     $labels = array(
//       'name' => _x('Specjalizacje', 'Specjalizacje', 'slawinsky_theme'),
//       'singular_name' => _x('Specjalizacja', 'Specjalizacja', 'slawinsky_theme'),
//     );
  
//     $args = array(
//       'label' => __('Specjalizacja', 'slawinsky_theme'),
//       'labels' => $labels,
//       'hierarchical' => true,
//       'query_var' => true,
//       'rewrite' => array('slug' => 'specjalizacja'),
//       'publicly_queryable' => false,
//     );
  
//     register_taxonomy('specialization', array('trainer'), $args);
// }
// add_action('init', 'taxonomy_specialization');


// Rejestracja taksonomii "Kategoria usługi" dla typu posta "services"
function taxonomy_servicescat() {
    $labels = array(
        'name' => _x('Kategorie usług', 'Kategorie usług', 'slawinsky_theme'),
        'singular_name' => _x('Kategoria usługi', 'Kategoria usługi', 'slawinsky_theme'),
    );
  
    $args = array(
        'label' => __('Kategoria usługi', 'slawinsky_theme'),
        'labels' => $labels,
        'hierarchical' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'kategoria-uslugi'),
        'publicly_queryable' => true,  // Ustawienie na true, jeśli ma być widoczne publicznie
    );
  
    register_taxonomy('kategoria-uslugi', array('services'), $args);
}
add_action('init', 'taxonomy_servicescat');