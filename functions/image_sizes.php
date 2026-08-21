<?php

/**
 * Add custom wordpress image sizes
 */
function addImageSizes()
{
	add_image_size('fullhd', 1920, 1080, false);
}
add_action('after_setup_theme', 'addImageSizes');