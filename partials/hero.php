<?php
    $acf_fields = get_fields();
    $acf_globals = get_fields('options');
?>

<?php $hero = $acf_fields['hero']; if(isset($hero) && !empty($hero)) : ?>

    <div class="hero">
        <div class="hero-container">

        </div>
    </div>

<?php endif; ?>