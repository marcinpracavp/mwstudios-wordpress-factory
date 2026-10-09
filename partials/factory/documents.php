<?php
$rows = [];
foreach ((array) ($args['items'] ?? []) as $item) {
    $id = absint($item['file'] ?? 0);
    $url = $id ? wp_get_attachment_url($id) : ($item['external_link']['url'] ?? '');
    if (!$url || empty($item['title'])) { continue; }
    $metadata = $item['metadata'] ?? '';
    if ($id) {
        $file = get_attached_file($id);
        $type = wp_check_filetype($file ?: '');
        $metadata = strtoupper($type['ext'] ?: get_post_mime_type($id));
        if ($file && is_file($file)) { $metadata .= ' · ' . size_format(filesize($file)); }
    }
    $rows[] = ['item' => $item, 'url' => $url, 'metadata' => $metadata];
}
if (!$rows) { return; }
?>
<ul class="mwf-documents">
<?php foreach ($rows as $row) : $item = $row['item']; ?>
    <li class="mb-30">
        <?php mwf_link(['url' => $row['url'], 'title' => $item['title'], 'target' => $item['external_link']['target'] ?? '']); ?>
        <?php if ($row['metadata']) : ?><span> (<?php echo esc_html($row['metadata']); ?>)</span><?php endif; ?>
        <?php $states = ['unverified' => 'Dostępność pliku niezweryfikowana', 'verified' => 'Dostępność pliku zweryfikowana', 'alternative_required' => 'Plik wymaga alternatywnego dostępu']; ?>
        <p><?php echo esc_html($states[$item['accessibility'] ?? 'unverified'] ?? $states['unverified']); ?></p>
        <?php mwf_link($item['alternative'] ?? null); ?>
    </li>
<?php endforeach; ?>
</ul>
