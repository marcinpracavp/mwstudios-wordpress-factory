<?php
$variant = $args['variant'] ?? 'flexible';
while (have_posts()) : the_post();
?>
<div class="mwf-page mwf-page--<?php echo esc_attr($variant); ?>">
    <?php get_template_part('partials/hero', null, ['hero' => mwf_field('mwf_hero'), 'variant' => $variant]); ?>
    <?php if ($variant === 'banner-tile') :
        $overlay = (array) mwf_field('mwf_overlay');
        if (mwf_has_content($overlay['content'] ?? '') || !empty($overlay['link']['url'])) : ?>
        <section class="mwf-overlay l-container p-40 mb-50">
            <?php mwf_heading($overlay); ?>
            <div class="mwf-prose"><?php echo wp_kses_post($overlay['content'] ?? ''); ?></div>
            <?php mwf_link($overlay['link'] ?? null, 'mwf-button'); ?>
        </section>
        <?php endif;
    endif; ?>
    <?php if ($variant === 'course') :
        get_template_part('partials/factory/course', null, ['course' => mwf_field('mwf_course')]);
    endif; ?>
    <?php if ($variant === 'contact') :
        get_template_part('partials/factory/contact-cities', null, ['cities' => mwf_field('mwf_contact_cities')]);
        $contact = (array) mwf_field('kontakt');
        $form = '';
        foreach ((array) ($contact['form'] ?? []) as $selected_form) {
            $form .= mwf_form(is_object($selected_form) ? $selected_form->ID : $selected_form);
        }
        if ($form) : ?>
            <div class="mwf-form l-container py-50"><?php echo $form; // Trusted plugin output; backend validation belongs to the plugin. ?></div>
        <?php endif;
    endif; ?>
    <?php $content = mwf_field('mwf_content');
    if ($variant === 'basic' && mwf_has_content($content)) : ?>
        <div class="l-container mwf-prose py-50"><?php echo wp_kses_post($content); ?></div>
    <?php elseif (mwf_has_content(get_the_content())) : ?>
        <div class="l-container mwf-prose py-50"><?php the_content(); ?></div>
    <?php endif; ?>
    <?php if ($variant === 'basic') :
        $cta = mwf_field('mwf_cta'); if (!empty($cta['url']) && !empty($cta['title'])) : ?>
            <div class="l-container mb-50"><?php mwf_link($cta, 'mwf-button'); ?></div>
        <?php endif;
    endif; ?>
    <?php mwf_render_sections(mwf_field('mwf_sections')); ?>
</div>
<?php endwhile; ?>
