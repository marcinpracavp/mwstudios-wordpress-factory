<?php
$post_id = get_the_ID();
$excerpt = wp_trim_words(
    wp_strip_all_tags(strip_shortcodes((string) get_post_field('post_content', $post_id))),
    24,
    '…'
);
?>
<div class="blog-item" data-aoe="fadeIn">
    <div class="blog-item__container">
        <a href="<?= get_permalink(); ?>">
            <div class="blog-item__image">
                <div class="image">
                    <?= get_the_post_thumbnail(  ); ?>
                </div>
            </div>
            <div class="blog-item__content">
                <div class="date"><?= get_the_date( 'd.m.Y' ) ?></div>
                <div class="title">
                    <h2 class="text-42"><?= the_title() ?></h2>
                </div>
                <div class="excerpt">
                    <?php echo esc_html($excerpt); ?>
                </div>
            </div>
        </a>
        <div class="blog-item__button">
            <a href="<?= get_permalink() ?>" class="link-orange--bold">
                <?= __('Zobacz więcej', 'slawinsky_theme') ?>
            </a>
        </div>
    </div>
</div>
