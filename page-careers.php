<?php
/**
 * Template Name: RudnikAgro — Kariera
 * Template Post Type: page
 */
get_header();
the_post();

$banner = get_field('rudnikagro_page_banner');
$vacancies = get_field('rudnikagro_vacancies');
$application_form = (int) get_field('rudnikagro_application_form');
$cta = get_field('rudnikagro_careers_cta');
$cta_background = !empty($cta['background']) ? (int) $cta['background'] : 0;
$cta_url = $cta_background ? wp_get_attachment_image_url($cta_background, 'full') : '';
?>

<?php if (!empty($banner['title'])) : ?>
  <?php get_template_part('partials/page-banner', null, [
    'banner' => $banner,
    'factory_section' => 'careers-heading',
    'section_class' => 'c-careers-heading',
  ]); ?>
<?php endif; ?>

<?php if ($vacancies) : ?>
  <section class="c-careers-vacancies" data-factory-section="careers-vacancies" aria-label="<?php echo esc_attr(get_the_title()); ?>">
    <div class="c-careers-vacancies__list">
      <?php foreach ($vacancies as $index => $vacancy) :
        $title = $vacancy['title'] ?? '';
        $description = $vacancy['description'] ?? '';
        $form_id = !empty($vacancy['application_form']) ? (int) $vacancy['application_form'] : $application_form;
        if ($title === '') { continue; }
      ?>
        <details class="c-career-vacancy"<?php echo $index === 0 ? ' open' : ''; ?>>
          <summary><span><?php echo esc_html($title); ?></span><span class="c-career-vacancy__icon" aria-hidden="true"></span></summary>
          <?php if ($description !== '') : ?>
            <div class="c-career-vacancy__body">
              <div class="c-career-vacancy__description"><?php echo wp_kses_post($description); ?></div>
              <?php if ($form_id) : ?><div class="c-career-application" id="career-application" data-factory-section="careers-application"><?php echo do_shortcode('[contact-form-7 id="' . $form_id . '"]'); ?></div><?php endif; ?>
            </div>
          <?php endif; ?>
        </details>
      <?php endforeach; ?>
    </div>
  </section>
<?php endif; ?>

<?php if (!empty($cta['heading'])) : ?>
  <section class="c-careers-cta" data-factory-section="shared-shop-cta"<?php if ($cta_url) : ?> style="--careers-cta-background: url('<?php echo esc_url($cta_url); ?>');"<?php endif; ?>>
    <div class="c-careers-cta__inner">
      <h2><?php echo esc_html($cta['heading']); ?></h2>
      <?php if (!empty($cta['button_label']) && $application_form) : ?><a href="#career-application" class="c-careers-cta__button"><?php echo esc_html($cta['button_label']); ?></a><?php endif; ?>
    </div>
  </section>
<?php endif; ?>

<?php get_footer(); ?>
