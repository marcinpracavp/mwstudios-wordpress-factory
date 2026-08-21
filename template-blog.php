<?php

/**
 * Template Name: Blog
 * @package slawinsky_pl
 */

$acf_fields = get_fields();
$acf_globals = get_fields('options');

get_header(); 
get_template_part( 'partials/hero' );
?>


<div class="blog">
    <div class="blog-container">
        <div class="blog-container__items l-container">
            <div class="wrapper">
                <?php
                $args = array(
                    'post_type' => 'post',
                    'posts_per_page' => 6, // Ustaw liczbę postów na stronę
                    'orderby' => 'date',
                    'order' => 'DESC',
                    'paged' => get_query_var('paged') ? get_query_var('paged') : 1 // Obsługa paginacji
                );

                $blogQuery = new WP_Query($args);

                if($blogQuery->have_posts()) :
                    while($blogQuery->have_posts()) : $blogQuery->the_post();
                ?>

                <?php get_template_part('partials/blog-item'); ?>

                <?php endwhile; wp_reset_postdata(); ?>

            </div>

            <div class="pagination">
                <?php

                function slawinsky_paginate_links($blogQuery) {
                    $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
                    $big = 999999999; // Potrzebne dla unikalnego ID
                    $links = paginate_links(array(
                        'base' => str_replace($big, '%#%', esc_url(get_pagenum_link($big))),
                        'format' => '?paged=%#%',
                        'current' => max(1, $paged),
                        'total' => $blogQuery->max_num_pages,
                        'prev_text' => '<img src="' . get_template_directory_uri() . '/dist/img/pagination-arrow.svg" alt="Arrow" class="pagination-arrow pagination-arrow--prev">',
                        'next_text' => '<img src="' . get_template_directory_uri() . '/dist/img/pagination-arrow.svg" alt="Arrow" class="pagination-arrow pagination-arrow--prev">',
                        'type' => 'array', // Zwraca linki jako tablicę
                    ));

                    if (!empty($links)) {
                        if ($paged == 1) { // Jeśli jest to pierwsza strona
                            array_unshift($links, '<span class="prev page-numbers"><img src="' . get_template_directory_uri() . '/dist/img/pagination-arrow.svg" alt="Arrow" class="pagination-arrow pagination-arrow--prev"></span>');
                        }
                        if ($paged == $blogQuery->max_num_pages) { // Jeśli jest to ostatnia strona
                            $links[] = '<span class="next page-numbers"><img src="' . get_template_directory_uri() . '/dist/img/pagination-arrow.svg" alt="Arrow" class="pagination-arrow pagination-arrow--prev"></span>';
                        }
                        echo implode("\n", $links);
                    }
                }

                // Wywołanie funkcji, przekazując odpowiedni obiekt WP_Query
                slawinsky_paginate_links($blogQuery);

                ?>
            </div>

            <?php else: ?>
                <p><?php _e('Sorry, no posts matched your criteria.'); ?></p>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php 

get_footer();
