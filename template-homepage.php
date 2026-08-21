<?php

/**
 * Template Name: Home
 * @package slawinsky_pl
 */

$acf_fields = get_fields();
$acf_globals = get_fields('options');

get_header(); ?>


<div class="l-container" style="margin-top:550px;">
    Home
</div>

<!-- Button to open another modal -->
<button class="open-modal" data-modal-id="mySecondModal">Otwórz Drugi Modal</button>

<!-- The Second Modal -->
<div id="mySecondModal" class="modal">
  <div class="modal-content">
    <span class="close" data-modal-id="mySecondModal">&times;</span>
    <p>Treść drugiego modala</p>
  </div>
</div>

<?php
d($acf_fields, $acf_globals);

foreach($acf_globals['social_media'] as $item) : 

echo $item['link']['title'];

endforeach; ?>

<?php 

get_footer();
