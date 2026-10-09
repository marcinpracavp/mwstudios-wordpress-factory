<?php
$s = (array) ($args['section'] ?? []);
$layout = $s['acf_fc_layout'] ?? '';
$tone = in_array($s['tone'] ?? '', ['plain', 'muted', 'dark'], true) ? $s['tone'] : 'plain';
if ($layout === 'image_text') {
    if (!mwf_image_id($s['image'] ?? 0) || !mwf_has_content($s['content'] ?? '')) { return; }
    $right = ($s['image_side'] ?? '') === 'right';
    ob_start(); mwf_heading($s); $heading = ob_get_clean();
    get_template_part('partials/section-image', null, [
        'image' => ['ID' => mwf_image_id($s['image'])], 'decorative' => !empty($s['decorative']),
        'title' => $heading, 'content' => $s['content'], 'button' => $s['link'] ?? [],
        'section_class' => 'mwf-section mwf-prose mwf-section--' . $tone . ' py-50',
        'container_class' => 'gap-200 gap-sm-0 row-gap-sm-200', 'image_class' => ($right ? 'gc-8/14' : 'gc-2/8') . ' gc-sm-2/14 gr-1/2 gr-sm-1/2',
        'content_class' => ($right ? 'gc-2/8' : 'gc-8/14') . ' gc-sm-2/14 gr-1/2 gr-sm-2/3', 'button_class' => 'mwf-button',
    ]);
    return;
}
ob_start();
switch ($layout) :
case 'wysiwyg': case 'cta':
    if (mwf_has_content($s['content'] ?? '')) : ?><div class="mwf-prose"><?php echo wp_kses_post($s['content']); ?></div><?php endif;
    if ($layout === 'cta') { mwf_link($s['link'] ?? null, 'mwf-button mt-30'); }
    break;
case 'tiles':
    $items = array_values(array_filter((array) ($s['items'] ?? []), function ($item) { return !empty($item['title']) && (!empty($item['link']['url']) || mwf_has_content($item['content'] ?? '') || mwf_image_id($item['image'] ?? 0)); }));
    if (!$items) { break; }
    if (!empty($s['sort_open_first'])) { $items = mwf_order_offers($items); }
    ?>
    <div class="grid gap-200 gap-sm-0 row-gap-sm-200">
    <?php foreach ($items as $i => $item) : $col = 2 + ($i % 3) * 4; ?>
        <article class="mwf-tile p-30 gc-<?php echo esc_attr($col . '/' . ($col + 4)); ?> gc-sm-2/14">
            <?php echo mwf_image($item['image'] ?? 0, 'large', !empty($item['decorative'])); ?>
            <h3><?php echo esc_html($item['title']); ?></h3>
            <div class="mwf-prose"><?php echo wp_kses_post($item['content'] ?? ''); ?></div>
            <?php mwf_admission_status($item['admission_status'] ?? ''); mwf_link($item['link'] ?? null, 'mwf-button'); ?>
        </article>
    <?php endforeach; ?>
    </div>
    <?php break;
case 'accordion':
    foreach ((array) ($s['items'] ?? []) as $item) :
        if (empty($item['title']) || !mwf_has_content($item['content'] ?? '')) { continue; } ?>
        <details class="mwf-accordion mb-30">
            <summary class="p-30"><?php echo esc_html($item['title']); ?></summary>
            <div class="mwf-prose p-30"><?php echo wp_kses_post($item['content']); ?></div>
        </details>
    <?php endforeach;
    break;
case 'tabs':
    $panels = [];
    foreach ((array) ($s['items'] ?? []) as $item) {
        if (!mwf_has_content($item['content'] ?? '')) { continue; }
        $panels[] = ['title' => $item['title'] ?? '', 'html' => '<div class="mwf-prose">' . wp_kses_post($item['content']) . '</div>'];
    }
    get_template_part('partials/factory/tabs', null, ['panels' => $panels, 'label' => ($s['heading'] ?? '') ?: 'Zakładki']);
    break;
case 'table':
    $columns = (array) ($s['columns'] ?? []);
    $rows = array_filter((array) ($s['rows'] ?? []), function ($row) { return !empty($row['cells']); });
    if (!$columns || !$rows || array_filter($columns, function ($c) { return empty($c['label']); })) { break; }
    $table_id = wp_unique_id('mwf-table-'); ?>
    <div class="mwf-table-scroll" role="region" tabindex="0" aria-label="<?php echo esc_attr(($s['caption'] ?? '') ?: (($s['heading'] ?? '') ?: 'Tabela danych')); ?>">
    <table class="mwf-table">
        <?php if (!empty($s['caption'])) : ?><caption><?php echo esc_html($s['caption']); ?></caption><?php endif; ?>
        <thead><tr><?php foreach ($columns as $i => $column) : ?><th scope="col" id="<?php echo esc_attr($table_id . '-' . $i); ?>"><?php echo esc_html($column['label']); ?></th><?php endforeach; ?></tr></thead>
        <tbody><?php foreach ($rows as $row_index => $row) : $row_id = $table_id . '-row-' . $row_index; ?><tr><?php foreach ($columns as $i => $column) : $tag = $i === 0 && !empty($s['row_headers']) ? 'th' : 'td'; ?>
            <<?php echo $tag; ?> <?php if ($tag === 'th') : ?>scope="row" id="<?php echo esc_attr($row_id); ?>"<?php else : ?>headers="<?php echo esc_attr($table_id . '-' . $i . (!empty($s['row_headers']) ? ' ' . $row_id : '')); ?>"<?php endif; ?>><?php echo esc_html($row['cells'][$i]['value'] ?? ''); ?></<?php echo $tag; ?>>
        <?php endforeach; ?></tr><?php endforeach; ?></tbody>
    </table>
    </div>
    <?php break;
case 'gallery':
    $items = array_values(array_filter((array) ($s['items'] ?? []), function ($item) { return mwf_image_id($item['image'] ?? 0); }));
    if (!$items) { break; } ?>
    <div class="grid gap-200 gap-sm-0 row-gap-sm-200">
    <?php foreach ($items as $i => $item) : $col = 2 + ($i % 3) * 4; ?>
        <figure class="gc-<?php echo esc_attr($col . '/' . ($col + 4)); ?> gc-sm-2/14">
            <?php echo mwf_image($item['image'], 'large', !empty($item['decorative'])); ?>
            <?php if (!empty($item['caption'])) : ?><figcaption><?php echo esc_html($item['caption']); ?></figcaption><?php endif; ?>
        </figure>
    <?php endforeach; ?></div>
    <?php break;
case 'media':
    $url = $s['url'] ?? '';
    if (!$url || empty($s['title']) || wp_parse_url($url, PHP_URL_SCHEME) !== 'https') { break; } ?>
    <iframe class="mwf-embed" src="<?php echo esc_url($url); ?>" title="<?php echo esc_attr($s['title']); ?>" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <?php if (mwf_has_content($s['transcript'] ?? '')) : ?><div class="mwf-prose mt-30"><?php echo wp_kses_post($s['transcript']); ?></div><?php endif;
    mwf_link($s['accessible_version'] ?? null, 'mwf-button');
    break;
case 'contact':
    get_template_part('partials/factory/contacts', null, ['items' => $s['items'] ?? []]);
    break;
case 'partners':
    foreach ((array) ($s['items'] ?? []) as $item) :
        if (empty($item['name']) || !mwf_image_id($item['image'] ?? 0)) { continue; } ?>
        <div class="mwf-partner mb-30">
            <?php echo mwf_image($item['image'], 'medium', false); ?>
            <p><?php echo esc_html($item['name']); ?></p>
            <?php mwf_link($item['link'] ?? null); ?>
        </div>
    <?php endforeach;
    break;
case 'documents':
    get_template_part('partials/factory/documents', null, ['items' => $s['items'] ?? []]);
    break;
case 'news':
    get_template_part('partials/factory/news', null, ['section' => $s]);
    break;
endswitch;
$body = ob_get_clean();
if (trim($body) === '') { return; }
?>
<section class="mwf-section mwf-section--<?php echo esc_attr($tone); ?> mwf-section--<?php echo esc_attr($layout); ?> py-50">
    <div class="l-container">
        <?php mwf_heading($s, 'mb-30'); ?>
        <?php echo $body; // Each module escapes its own data. ?>
    </div>
</section>
