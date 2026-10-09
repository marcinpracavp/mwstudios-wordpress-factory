<?php
$items = array_filter((array) ($args['items'] ?? []), function ($item) {
    return !empty($item['name']) || !empty($item['address']) || !empty($item['phones']) || !empty($item['emails']) || mwf_has_content($item['hours'] ?? '');
});
foreach ($items as $item) : ?>
<div class="mwf-contact mb-30">
    <?php if (!empty($item['name'])) : ?><h4><?php echo esc_html($item['name']); ?></h4><?php endif; ?>
    <?php if (!empty($item['role'])) : ?><p><?php echo esc_html($item['role']); ?></p><?php endif; ?>
    <?php if (!empty($item['address'])) : ?><p class="mwf-contact__address"><?php echo esc_html($item['address']); ?></p><?php endif; ?>
    <?php foreach ((array) ($item['phones'] ?? []) as $phone) :
        $number = trim($phone['number'] ?? '');
        $dial = preg_replace('/[^0-9+]/', '', $number);
        if (!$dial || !preg_match('/^\+?[0-9]+$/', $dial)) { continue; } ?>
        <p><a href="<?php echo esc_url('tel:' . $dial); ?>"><?php echo esc_html($number); ?><span class="mwf-sr-only"> — <?php echo esc_html($item['name'] ?? 'kontakt'); ?></span></a></p>
    <?php endforeach; ?>
    <?php foreach ((array) ($item['emails'] ?? []) as $email) :
        $address = sanitize_email($email['email'] ?? '');
        if (!is_email($address)) { continue; } ?>
        <p><a href="<?php echo esc_url('mailto:' . $address); ?>"><?php echo esc_html($address); ?><span class="mwf-sr-only"> — <?php echo esc_html($item['name'] ?? 'kontakt'); ?></span></a></p>
    <?php endforeach; ?>
    <?php if (mwf_has_content($item['hours'] ?? '')) : ?><div class="mwf-prose"><?php echo wp_kses_post($item['hours']); ?></div><?php endif; ?>
</div>
<?php endforeach; ?>
