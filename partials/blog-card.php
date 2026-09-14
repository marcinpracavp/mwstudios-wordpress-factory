<?php
/** @var array $args */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
$heading_tag = isset($args['heading_tag']) && in_array($args['heading_tag'], ['h2', 'h3'], true) ? $args['heading_tag'] : 'h2';
$image_id = function_exists('get_field') ? (int) get_field('rudnikagro_blog_card_image', $post_id) : 0;
$date = function_exists('get_field') ? (string) get_field('rudnikagro_blog_card_date', $post_id) : '';
$label = function_exists('get_field') ? (string) get_field('rudnikagro_blog_card_label', $post_id) : '';
if (!$post_id || $image_id === 0 || $date === '' || $label === '') { return; }
?>
<article class="c-blog-card" data-factory-component="blog-post-card">
    <a class="c-blog-card__media" href="<?php echo esc_url(get_permalink($post_id)); ?>">
        <?php echo wp_get_attachment_image($image_id, 'full', false, ['loading' => 'lazy', 'alt' => get_the_title($post_id)]); ?>
    </a>
    <div class="c-blog-card__copy">
        <time class="c-blog-card__date" datetime="<?php echo esc_attr(get_post_time('c', false, $post_id)); ?>"><?php echo esc_html($date); ?></time>
        <<?php echo esc_attr($heading_tag); ?> class="c-blog-card__title"><a href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php echo esc_html(get_the_title($post_id)); ?></a></<?php echo esc_attr($heading_tag); ?>>
        <a class="c-blog-card__link" href="<?php echo esc_url(get_permalink($post_id)); ?>"><?php echo esc_html($label); ?><span aria-hidden="true"> →</span></a>
    </div>
</article>
