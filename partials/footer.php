<?php
$content = mwf_field('mwf_footer_content', 'options');
$columns = (array) mwf_field('mwf_footer_columns', 'options');
$accessibility = mwf_field('mwf_accessibility_link', 'options');
?>
<footer class="mwf-footer py-50">
    <div class="l-container">
        <?php if ($columns) : ?><div class="flex gap-200 mwf-footer__columns mb-40">
            <?php foreach ($columns as $column) :
                $links = array_filter((array) ($column['links'] ?? []), function ($row) { return !empty($row['link']['url']) && !empty($row['link']['title']); });
                if (!$links) { continue; } ?>
                <div>
                    <?php if (!empty($column['title'])) : ?><h2><?php echo esc_html($column['title']); ?></h2><?php endif; ?>
                    <ul><?php foreach ($links as $row) : ?><li><?php mwf_link($row['link']); ?></li><?php endforeach; ?></ul>
                </div>
            <?php endforeach; ?>
        </div><?php endif; ?>
        <?php if (mwf_has_content($content)) : ?><div class="mwf-prose mb-30"><?php echo wp_kses_post($content); ?></div><?php endif; ?>
        <?php if (has_nav_menu('footer')) : ?><nav aria-label="Linki w stopce"><?php wp_nav_menu(['theme_location' => 'footer', 'container' => false, 'fallback_cb' => false]); ?></nav><?php endif; ?>
        <?php mwf_link($accessibility); ?>
    </div>
</footer>
