<?php
/**
 * Template Name: RudnikAgro — O nas
 * Template Post Type: page
 */
get_header();
the_post();

$banner = get_field('rudnikagro_about_banner');
$introduction = get_field('rudnikagro_about_introduction');
$supply = get_field('rudnikagro_about_supply');
$grain_trade = get_field('rudnikagro_about_grain_trade');
$insurance = get_field('rudnikagro_about_insurance');
$shop_cta = get_field('rudnikagro_about_shop_cta');

function rudnikagro_about_surface_style(array $section): string {
    $surface_id = !empty($section['surface']) ? (int) $section['surface'] : 0;
    $surface_url = $surface_id ? wp_get_attachment_image_url($surface_id, 'full') : '';
    return $surface_url ? ' style="--about-card-surface: url(\'' . esc_url($surface_url) . '\');"' : '';
}
?>

<?php if (!empty($banner['title'])) : ?>
    <?php get_template_part('partials/page-banner', null, [
        'banner' => $banner,
        'breadcrumb_current' => (string) $banner['title'],
        'factory_section' => 'about-heading',
        'section_class' => 'c-about-heading mt-24',
    ]); ?>
<?php endif; ?>

<?php if (!empty($introduction['heading']) || !empty($introduction['content'])) : ?>
    <section class="c-about-introduction l-container mt-33 pb-24" data-factory-section="about-introduction">
      <div class="c-about-introduction__inner">
        <?php if (!empty($introduction['heading'])) : ?><h2><?php echo esc_html($introduction['heading']); ?></h2><?php endif; ?>
        <?php if (!empty($introduction['content'])) : ?><div class="c-about-introduction__content"><?php echo wp_kses_post($introduction['content']); ?></div><?php endif; ?>
      </div>
    </section>
<?php endif; ?>

<?php if (!empty($supply['heading'])) : ?>
    <section class="c-about-card c-about-card--supply mt-24" data-factory-section="about-agricultural-supply"<?php echo rudnikagro_about_surface_style($supply); ?>>
        <div class="c-about-card__inner">
            <div class="c-about-card__media">
                <?php if (!empty($supply['image'])) { echo wp_get_attachment_image((int) $supply['image'], 'full', false, ['loading' => 'lazy']); } ?>
            </div>
            <div class="c-about-card__content">
                <h2><?php echo esc_html($supply['heading']); ?></h2>
                <?php if (!empty($supply['introduction'])) : ?><p><?php echo nl2br(esc_html($supply['introduction'])); ?></p><?php endif; ?>
                <?php if (!empty($supply['items'])) : ?><div class="c-about-supply-items"><?php foreach ($supply['items'] as $item) : ?>
                    <article class="c-about-supply-item">
                        <?php if (!empty($item['icon'])) { echo wp_get_attachment_image((int) $item['icon'], 'full', false, ['loading' => 'lazy', 'alt' => '']); } ?>
                        <?php if (!empty($item['title'])) : ?><h3><?php echo esc_html($item['title']); ?></h3><?php endif; ?>
                    </article>
                <?php endforeach; ?></div><?php endif; ?>
            </div>
        </div>
    </section>
<?php endif; ?>

<?php if (!empty($grain_trade['heading'])) : ?>
    <section class="c-about-card c-about-card--grain mt-57" data-factory-section="about-grain-trade"<?php echo rudnikagro_about_surface_style($grain_trade); ?>>
        <div class="c-about-card__inner">
            <div class="c-about-card__content">
                <h2><?php echo esc_html($grain_trade['heading']); ?></h2>
                <?php if (!empty($grain_trade['content'])) : ?><div class="c-about-card__rich-text"><?php echo wp_kses_post($grain_trade['content']); ?></div><?php endif; ?>
            </div>
            <div class="c-about-card__media">
                <?php if (!empty($grain_trade['image'])) { echo wp_get_attachment_image((int) $grain_trade['image'], 'full', false, ['loading' => 'lazy']); } ?>
            </div>
        </div>
    </section>
<?php endif; ?>

<?php if (!empty($insurance['heading'])) : ?>
    <section class="c-about-card c-about-card--insurance mt-57" data-factory-section="about-insurance"<?php echo rudnikagro_about_surface_style($insurance); ?>>
        <div class="c-about-card__inner">
            <div class="c-about-card__media">
                <?php if (!empty($insurance['image'])) { echo wp_get_attachment_image((int) $insurance['image'], 'full', false, ['loading' => 'lazy']); } ?>
            </div>
            <div class="c-about-card__content">
                <h2><?php echo esc_html($insurance['heading']); ?></h2>
                <?php if (!empty($insurance['content'])) : ?><div class="c-about-card__rich-text"><?php echo wp_kses_post($insurance['content']); ?></div><?php endif; ?>
                <?php if (!empty($insurance['expert'])) : ?><aside class="c-about-expert">
                    <?php if (!empty($insurance['expert']['role'])) : ?><strong><?php echo esc_html($insurance['expert']['role']); ?></strong><?php endif; ?>
                    <?php if (!empty($insurance['expert']['name'])) : ?><span><?php echo esc_html($insurance['expert']['name']); ?></span><?php endif; ?>
                    <?php if (!empty($insurance['expert']['telephone']) || !empty($insurance['expert']['email'])) : ?><span><?php echo esc_html(trim((!empty($insurance['expert']['telephone']) ? 'tel. ' . $insurance['expert']['telephone'] : '') . (!empty($insurance['expert']['telephone']) && !empty($insurance['expert']['email']) ? ', ' : '') . (!empty($insurance['expert']['email']) ? 'e-mail: ' . $insurance['expert']['email'] : ''))); ?></span><?php endif; ?>
                </aside><?php endif; ?>
            </div>
        </div>
    </section>
<?php endif; ?>

<?php if (!empty($shop_cta['heading'])) : ?>
    <?php get_template_part('partials/shop-cta', null, ['cta' => $shop_cta, 'factory_section' => 'shared-shop-cta']); ?>
<?php endif; ?>

<?php get_footer(); ?>
