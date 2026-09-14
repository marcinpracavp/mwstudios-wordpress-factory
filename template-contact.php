<?php
/**
 * Template Name: RudnikAgro — Kontakt
 * Template Post Type: page
 */

get_header();
the_post();

$banner = get_field('rudnikagro_contact_heading');
$blocks = get_field('rudnikagro_contact_blocks');
$form_presentation = get_field('rudnikagro_contact_form_presentation');
$form_id = (int) get_field('rudnikagro_contact_form');
$map_id = (int) get_field('rudnikagro_contact_map_image');

function rudnikagro_contact_lines($value): void {
    $value = trim((string) $value);
    if ($value === '') {
        return;
    }
    $lines = preg_split('/\R/u', $value) ?: [];
    foreach ($lines as $index => $line) {
        $line = trim($line);
        if ($line !== '' && is_email($line)) {
            echo '<span class="c-contact-card__email">' . esc_html($line) . '</span>';
        } else {
            echo esc_html($line);
        }
        if ($index < count($lines) - 1) {
            echo '<br>';
        }
    }
}
?>

<?php if (!empty($banner['title'])) : ?>
  <?php get_template_part('partials/page-banner', null, [
      'banner' => $banner,
      'factory_section' => 'contact-heading',
      'section_class' => 'c-contact-heading',
      'breadcrumb_current' => (string) $banner['title'],
  ]); ?>
<?php endif; ?>

<main class="c-contact l-container" data-factory-component="contact-layout">
  <?php if ($blocks) : ?>
    <section class="c-contact__details" data-factory-section="contact-details">
      <?php foreach ($blocks as $index => $block) :
          $heading = (string) ($block['heading'] ?? '');
          $company = (string) ($block['company'] ?? '');
          $content = (string) ($block['content'] ?? '');
          $contacts = !empty($block['contacts']) && is_array($block['contacts']) ? $block['contacts'] : [];
      ?>
        <article class="c-contact-card c-contact-card--<?php echo esc_attr((string) ($index + 1)); ?>">
          <?php if ($heading !== '') : ?><h2><?php echo esc_html($heading); ?></h2><?php endif; ?>
          <?php if ($company !== '') : ?><p class="c-contact-card__company"><?php echo esc_html($company); ?></p><?php endif; ?>
          <?php if ($content !== '') : ?><p class="c-contact-card__content"><?php rudnikagro_contact_lines($content); ?></p><?php endif; ?>
          <?php if ($contacts) : ?><div class="c-contact-card__departments">
            <?php foreach ($contacts as $contact) : ?><section class="c-contact-card__department">
              <?php if (!empty($contact['heading'])) : ?><h3><?php echo esc_html($contact['heading']); ?></h3><?php endif; ?>
              <?php if (!empty($contact['content'])) : ?><p><?php rudnikagro_contact_lines($contact['content']); ?></p><?php endif; ?>
            </section><?php endforeach; ?>
          </div><?php endif; ?>
        </article>
      <?php endforeach; ?>
    </section>
  <?php endif; ?>

  <div class="c-contact__main">
    <?php if (!empty($form_presentation['heading']) && $form_id) : ?>
      <section class="c-contact-form" data-factory-section="contact-form" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title"><?php echo esc_html($form_presentation['heading']); ?></h2>
        <?php echo do_shortcode('[contact-form-7 id="' . $form_id . '"]'); ?>
      </section>
    <?php endif; ?>
    <?php if ($map_id) : ?>
      <section class="c-contact-map" data-factory-section="contact-map">
        <?php echo wp_get_attachment_image($map_id, 'full', false, ['alt' => '', 'loading' => 'lazy']); ?>
      </section>
    <?php endif; ?>
  </div>
</main>

<?php get_footer();
