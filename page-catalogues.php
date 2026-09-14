<?php
/**
 * Template Name: RudnikAgro — Katalogi
 * Template Post Type: page
 */
get_header();
the_post();

$banner = get_field('rudnikagro_catalogues_banner');
$catalogues = get_field('rudnikagro_catalogues');
$shop_cta = get_field('rudnikagro_catalogues_shop_cta');
?>

<?php if (!empty($banner['title'])) : ?>
    <?php get_template_part('partials/page-banner', null, [
        'banner' => $banner,
        'breadcrumb_current' => $banner['title'],
        'factory_section' => 'catalogues-heading',
        'section_class' => 'c-catalogues-heading mt-24',
    ]); ?>
<?php endif; ?>

<?php if ($catalogues) : ?>
<section class="c-catalogues-downloads l-container mt-28" data-factory-section="catalogues-downloads">
    <div class="c-catalogues-downloads__grid">
        <?php foreach ($catalogues as $catalogue) :
            $title = (string) ($catalogue['title'] ?? '');
            $background_id = (int) ($catalogue['background'] ?? 0);
            $cover_id = (int) ($catalogue['cover'] ?? 0);
            $pdf_label = (string) ($catalogue['pdf_label'] ?? '');
            $pdf_id = (int) ($catalogue['pdf'] ?? 0);
            $online_label = (string) ($catalogue['online_label'] ?? '');
            $online_url = (string) ($catalogue['online_url'] ?? '');
            if ($title === '') { continue; }
            $background_url = $background_id ? wp_get_attachment_image_url($background_id, 'full') : '';
        ?>
        <article class="c-catalogue-card"<?php if ($background_url) : ?> style="--catalogue-background: url('<?php echo esc_url($background_url); ?>');"<?php endif; ?>>
            <div class="c-catalogue-card__content">
                <h2><?php echo esc_html($title); ?></h2>
                <?php if ($pdf_label !== '') : ?>
                    <?php if ($pdf_id) : ?><a class="c-catalogue-card__action" href="<?php echo esc_url(wp_get_attachment_url($pdf_id)); ?>" download><i class="fa-regular fa-file-arrow-down" aria-hidden="true"></i><span><?php echo wp_kses_post($pdf_label); ?></span></a><?php else : ?><span class="c-catalogue-card__action"><i class="fa-regular fa-file-arrow-down" aria-hidden="true"></i><span><?php echo wp_kses_post($pdf_label); ?></span></span><?php endif; ?>
                <?php endif; ?>
                <?php if ($online_label !== '') : ?>
                    <?php if ($online_url !== '') : ?><a class="c-catalogue-card__action" href="<?php echo esc_url($online_url); ?>"><i class="fa-regular fa-book-open" aria-hidden="true"></i><span><?php echo esc_html($online_label); ?></span></a><?php else : ?><span class="c-catalogue-card__action"><i class="fa-regular fa-book-open" aria-hidden="true"></i><span><?php echo esc_html($online_label); ?></span></span><?php endif; ?>
                <?php endif; ?>
            </div>
            <?php if ($cover_id) : ?><div class="c-catalogue-card__cover"><?php echo wp_get_attachment_image($cover_id, 'full', false, ['loading' => 'lazy']); ?></div><?php endif; ?>
        </article>
        <?php endforeach; ?>
    </div>
</section>
<?php endif; ?>

<?php if (!empty($shop_cta['heading'])) : get_template_part('partials/shop-cta', null, ['cta' => $shop_cta]); endif; ?>

<?php get_footer(); ?>
