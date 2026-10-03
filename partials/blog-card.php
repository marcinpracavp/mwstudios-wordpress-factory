<?php
/** @var array $args */
$card = isset($args['card']) && is_array($args['card']) ? $args['card'] : [];
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : 0;
$heading_tag = isset($args['heading_tag']) && in_array($args['heading_tag'], ['h2', 'h3'], true) ? $args['heading_tag'] : 'h2';
$title = isset($card['title']) ? (string) $card['title'] : ($post_id ? (string) get_the_title($post_id) : '');
$url = isset($card['url']) ? (string) $card['url'] : ($post_id ? (string) get_permalink($post_id) : '');
$image_id = isset($card['image_id']) ? (int) $card['image_id'] : ($post_id ? (int) get_post_thumbnail_id($post_id) : 0);
$date = isset($card['date']) ? (string) $card['date'] : ($post_id ? (string) get_the_date('', $post_id) : '');
$label = isset($card['label']) ? (string) $card['label'] : '';
$datetime = isset($card['datetime']) ? (string) $card['datetime'] : ($post_id ? (string) get_post_time(DATE_W3C, false, $post_id) : $date);
$factory_section = isset($args['factory_section']) ? (string) $args['factory_section'] : '';
$variant = isset($args['variant']) && is_string($args['variant']) ? sanitize_html_class($args['variant']) : '';
$aos = isset($args['aos']) && is_string($args['aos']) ? sanitize_key($args['aos']) : '';
$aos_delay = isset($args['aos_delay']) ? max(0, (int) $args['aos_delay']) : 0;
$excerpt_from_content = !empty($args['excerpt_from_content']);
$content_excerpt = $post_id
    ? wp_trim_words(wp_strip_all_tags(strip_shortcodes((string) get_post_field('post_content', $post_id))), 24, '…')
    : '';
$excerpt = isset($card['excerpt']) ? (string) $card['excerpt'] : ($post_id ? (string) get_post_field('post_excerpt', $post_id) : '');
if ($excerpt_from_content) {
    $excerpt = $content_excerpt;
} elseif ($excerpt === '') {
    $excerpt = $content_excerpt;
}
$show_excerpt = !empty($args['show_excerpt']);
$loading = isset($args['loading']) && in_array($args['loading'], ['eager', 'lazy'], true) ? $args['loading'] : 'lazy';
$source_node = isset($args['source_node']) ? (string) $args['source_node'] : ($image_id ? (string) get_post_meta($image_id, 'data-factory-source-node', true) : '');
$source_nodes = isset($args['source_nodes']) && is_array($args['source_nodes']) ? $args['source_nodes'] : [];
$title_source_node = isset($source_nodes['title']) ? (string) $source_nodes['title'] : '';
$excerpt_source_node = isset($source_nodes['excerpt']) ? (string) $source_nodes['excerpt'] : '';
$date_source_node = isset($source_nodes['date']) ? (string) $source_nodes['date'] : '';
$meta_parts = array_values(array_filter(array_map('trim', explode('|', $date)), static fn ($part) => $part !== ''));
$meta_date = $meta_parts[0] ?? $date;
$meta_author = $meta_parts[1] ?? ($post_id ? trim((string) get_the_author_meta('display_name', (int) get_post_field('post_author', $post_id))) : '');
if ($title === '' || $url === '' || $date === '') { return; }
$card_class = 'c-blog-card' . ($variant !== '' ? ' c-blog-card--' . $variant : '');
?>
<article class="<?php echo esc_attr($card_class); ?>"<?php if ($factory_section !== '') : ?> data-factory-section="<?php echo esc_attr($factory_section); ?>"<?php endif; ?><?php if ($aos !== '') : ?> data-aos="<?php echo esc_attr($aos); ?>" data-aos-delay="<?php echo esc_attr((string) $aos_delay); ?>"<?php endif; ?> data-factory-component="blog-post-card">
    <a class="c-blog-card__media" href="<?php echo esc_url($url); ?>">
        <?php
        if ($image_id) {
            $image_attributes = ['loading' => $loading, 'alt' => $title];
            if ($source_node !== '') { $image_attributes['data-factory-source-node'] = $source_node; }
            echo wp_get_attachment_image($image_id, 'full', false, $image_attributes);
        }
        ?>
    </a>
    <div class="c-blog-card__copy">
        <?php if ($show_excerpt) : ?>
            <<?php echo esc_attr($heading_tag); ?> class="c-blog-card__title"<?php if ($title_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($title_source_node); ?>"<?php endif; ?>><a href="<?php echo esc_url($url); ?>"><?php echo esc_html($title); ?></a></<?php echo esc_attr($heading_tag); ?>>
            <?php if ($excerpt !== '') : ?><p class="c-blog-card__excerpt"<?php if ($excerpt_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($excerpt_source_node); ?>"<?php endif; ?>><?php echo esc_html($excerpt); ?></p><?php endif; ?>
            <div class="c-blog-card__meta">
                <time class="c-blog-card__date" datetime="<?php echo esc_attr($datetime); ?>"<?php if ($date_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($date_source_node); ?>"<?php endif; ?>><?php echo esc_html($meta_date); ?></time>
                <?php if ($meta_author !== '') : ?><span class="c-blog-card__meta-separator" aria-hidden="true"></span><span class="c-blog-card__author"><?php echo esc_html($meta_author); ?></span><?php endif; ?>
            </div>
        <?php else : ?>
            <div class="c-blog-card__meta">
                <time class="c-blog-card__date" datetime="<?php echo esc_attr($datetime); ?>"<?php if ($date_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($date_source_node); ?>"<?php endif; ?>><?php echo esc_html($meta_date); ?></time>
                <?php if ($meta_author !== '') : ?><span class="c-blog-card__meta-separator" aria-hidden="true"></span><span class="c-blog-card__author"><?php echo esc_html($meta_author); ?></span><?php endif; ?>
            </div>
            <<?php echo esc_attr($heading_tag); ?> class="c-blog-card__title"<?php if ($title_source_node !== '') : ?> data-factory-source-node="<?php echo esc_attr($title_source_node); ?>"<?php endif; ?>><a href="<?php echo esc_url($url); ?>"><?php echo esc_html($title); ?></a></<?php echo esc_attr($heading_tag); ?>>
        <?php endif; ?>
        <?php if ($label !== '') : ?><a class="c-blog-card__link" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?><span aria-hidden="true"> →</span></a><?php endif; ?>
    </div>
</article>
