<?php

/**
 * Disable Dashicons on Front-end
 */
function wpdocs_dequeue_dashicon()
{
    if (current_user_can('update_core')) {
        return;
    }
    wp_deregister_style('dashicons');
}
add_action('wp_enqueue_scripts', 'wpdocs_dequeue_dashicon');

/**
 * Disable emojis
 */
function disable_emojis_tinymce($plugins)
{
    if (is_array($plugins)) {
        return array_diff($plugins, array(
            'wpemoji'
        ));
    } else {
        return array();
    }
}

function disable_emojis_remove_dns_prefetch($urls, $relation_type)
{
    if ('dns-prefetch' == $relation_type) {
        $emoji_svg_url = apply_filters('emoji_svg_url', 'https://s.w.org/images/core/emoji/2/svg/');
        $urls          = array_diff($urls, array(
            $emoji_svg_url
        ));
    }

    return $urls;
}
