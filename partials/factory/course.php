<?php
$course = (array) ($args['course'] ?? []);
$facts = array_filter((array) ($course['facts'] ?? []), function ($fact) { return !empty($fact['label']) && isset($fact['value']) && $fact['value'] !== ''; });
if (!$facts && empty($course['link']['url']) && empty($course['admission_status'])) { return; }
?>
<section class="mwf-course l-container p-40 mb-50">
    <?php mwf_heading($course); ?>
    <?php if ($facts) : ?><dl class="mwf-course__facts flex gap-200">
        <?php foreach ($facts as $fact) : ?><div><dt><?php echo esc_html($fact['label']); ?></dt><dd><?php echo esc_html($fact['value']); ?></dd></div><?php endforeach; ?>
    </dl><?php endif; ?>
    <?php mwf_admission_status($course['admission_status'] ?? ''); mwf_link($course['link'] ?? null, 'mwf-button'); ?>
</section>
