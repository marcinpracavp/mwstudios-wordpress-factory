<?php if (function_exists('rudnikagro_option')) :
    $logo = (int) rudnikagro_option('rudnikagro_shared_footer_media_140_264');
    $facebook = (int) rudnikagro_option('rudnikagro_shared_footer_media_222_58');
    $footer_contact_lines = array_values(array_filter(preg_split('/\R/u', (string) rudnikagro_option('rudnikagro_shared_footer_168_216')), static function ($line) {
        return trim($line) !== '';
    }));
    $ornament_parts = [
        (int) rudnikagro_option('rudnikagro_shared_footer_media_222_88'),
        (int) rudnikagro_option('rudnikagro_shared_footer_media_222_87'),
        (int) rudnikagro_option('rudnikagro_shared_footer_media_222_89'),
        (int) rudnikagro_option('rudnikagro_shared_footer_media_222_90'),
    ];
    $certificate_strip = (int) rudnikagro_option('rudnikagro_shared_footer_media_515_79');
?>
<footer class="l-footer" data-factory-section="shared-footer">
    <div class="l-footer__panel l-container"><div class="l-footer__grid">
        <section class="l-footer__contact"><?php if ($logo) : ?><div class="l-footer__logo"><?php echo rudnikagro_image($logo, '', ['loading' => 'lazy']); ?></div><?php endif; ?><div class="l-footer__contact-copy"><?php foreach ($footer_contact_lines as $index => $line) : ?><p class="l-footer__contact-line l-footer__contact-line--<?php echo esc_attr((string) ($index + 1)); ?>"><?php echo esc_html($line); ?></p><?php endforeach; ?></div><?php if ($facebook) : ?><span class="l-footer__social"><?php echo rudnikagro_image($facebook, '', ['alt' => '']); ?></span><?php endif; ?></section>
        <?php rudnikagro_render_text_column('rudnikagro_shared_footer_168_270', 'l-footer__column'); ?>
        <?php rudnikagro_render_text_column('rudnikagro_shared_footer_168_274', 'l-footer__column'); ?>
        <?php rudnikagro_render_text_column('rudnikagro_shared_footer_168_276', 'l-footer__column'); ?>
        <section class="l-footer__awards"><?php if ($label = rudnikagro_option('rudnikagro_shared_footer_515_80')) : ?><h2><?php echo esc_html($label); ?></h2><?php endif; ?><?php if ($certificate_strip) : ?><div><?php echo rudnikagro_image($certificate_strip, '', ['loading' => 'lazy', 'alt' => '']); ?></div><?php endif; ?></section>
    </div><div class="l-footer__ornament" aria-hidden="true"><?php foreach ($ornament_parts as $ornament_part) { if ($ornament_part) { echo rudnikagro_image($ornament_part, '', ['loading' => 'lazy', 'alt' => '']); } } ?></div><?php if ($legal = rudnikagro_option('rudnikagro_shared_footer_222_60')) : ?><p class="l-footer__legal"><?php echo esc_html($legal); ?></p><?php endif; ?></div>
    <div class="l-footer__bottom l-container"><?php if ($copyright = rudnikagro_option('rudnikagro_shared_footer_168_280')) : ?><span><?php echo esc_html($copyright); ?></span><?php endif; ?><?php if ($credit = rudnikagro_option('rudnikagro_shared_footer_222_113')) : ?><span><?php echo esc_html($credit); ?></span><?php endif; ?></div>
</footer>
<?php return; endif; ?>
<footer class="l-footer">
    <div class="l-footer__container l-container">
        <div class="l-footer__author">
            Cteated by <a href="https://slawinsky.pl" rel="author">Slawinsky.pl - Maciej Sławiński</a>.
        </div>
    </div>
</footer>
