<?php
// Server-first: every panel is readable until JS enhances the tab controls.
$panels = array_values(array_filter((array) ($args['panels'] ?? []), function ($panel) {
    return !empty($panel['title']) && trim($panel['html'] ?? '') !== '';
}));
if (!$panels) { return; }
$id = wp_unique_id('mwf-tabs-');
?>
<div class="mwf-tabs" data-mwf-tabs>
    <?php if (count($panels) > 1) : ?>
    <div class="mwf-tabs__controls flex gap-100 mb-30" data-mwf-tablist aria-label="<?php echo esc_attr($args['label'] ?? 'Zakładki'); ?>" hidden>
        <?php foreach ($panels as $i => $panel) : ?>
        <button type="button" id="<?php echo esc_attr($id . '-tab-' . $i); ?>" data-mwf-tab aria-controls="<?php echo esc_attr($id . '-panel-' . $i); ?>"><?php echo esc_html($panel['title']); ?></button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
    <?php foreach ($panels as $i => $panel) : ?>
    <div id="<?php echo esc_attr($id . '-panel-' . $i); ?>" class="mwf-tabs__panel" data-mwf-panel>
        <h3 data-mwf-panel-heading><?php echo esc_html($panel['title']); ?></h3>
        <?php echo $panel['html']; // Escaped by component renderers or wp_kses_post at source. ?>
    </div>
    <?php endforeach; ?>
</div>
