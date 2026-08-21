<?php

/**
 * Template Name: Kontakt
 * @package slawinsky_pl
 */

$acf_fields = get_fields();
$acf_globals = get_fields('options');

get_header(); 
get_template_part( 'partials/hero' ); 
?>

<?php $contact = $acf_fields['contact']; if($contact) : ?>

    <section class="contact">
        <div class="contact-container grid">
            <div class="contact-container__content grid">
                <div class="contact-container__wrapper"  data-aoe="fadeIn">
                    <div class="form">
                        <?php $posts = $contact['form'];
                        if ($posts ):
                            foreach ($posts as $form):
                            $cf7_id = $form->ID;
                            echo do_shortcode('[contact-form-7 id="' . $cf7_id . '" ]');
                            endforeach;
                        endif; ?>
                    </div>
                </div>
                
            </div>
        </div>
    </section>

<?php endif; ?>


<?php 

get_footer();
