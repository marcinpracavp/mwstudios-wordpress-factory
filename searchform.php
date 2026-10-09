<?php $id = wp_unique_id('mwf-search-'); ?>
<form role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>" class="mwf-search flex gap-100 mt-30">
    <label for="<?php echo esc_attr($id); ?>">Szukaj w witrynie</label>
    <input id="<?php echo esc_attr($id); ?>" type="search" name="s" value="<?php echo esc_attr(get_search_query()); ?>">
    <button type="submit">Szukaj</button>
</form>
