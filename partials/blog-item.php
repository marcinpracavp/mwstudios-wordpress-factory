<article class="mwf-blog-card <?php echo esc_attr($args['class'] ?? ''); ?>">
    <?php if (has_post_thumbnail()) : ?><div><?php the_post_thumbnail('large'); ?></div><?php endif; ?>
    <div class="p-30">
        <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date('d.m.Y')); ?></time>
        <h2><a href="<?php echo esc_url(get_permalink()); ?>"><?php echo esc_html(get_the_title()); ?></a></h2>
        <p><?php echo esc_html(wp_strip_all_tags(get_the_excerpt())); ?></p>
        <a class="mwf-button" href="<?php echo esc_url(get_permalink()); ?>">Zobacz więcej<span class="mwf-sr-only"> — <?php echo esc_html(get_the_title()); ?></span></a>
    </div>
</article>
