<?php
/** Read-only ACF/plugin/SVG audit probe. */
if (!defined('ABSPATH')) {
    exit(1);
}

$asset_pattern = '/(icon|media|logo|chevron|image|background|cover|file|banner|surface|pdf)/i';
$external_pattern = '/(pdf|online_url|destination|external_url|document_url)/i';
$asset_mappings = [];
$empty_asset_fields = [];
$external_fields = [];

$attachment_row = static function (int $id, string $path, string $entity): array {
    $file = get_attached_file($id);
    $source_asset = (string) get_post_meta($id, '_rudnikagro_source_asset', true);
    $source_file = $source_asset !== '' ? get_template_directory() . '/.factory-cache/figma/latest/' . ltrim($source_asset, '/') : '';
    $file_hash = is_string($file) && is_file($file) ? hash_file('sha256', $file) : null;
    $source_hash = $source_file !== '' && is_file($source_file) ? hash_file('sha256', $source_file) : null;
    return [
        'entity' => $entity,
        'path' => $path,
        'attachmentId' => $id,
        'mime' => get_post_mime_type($id),
        'url' => wp_get_attachment_url($id),
        'sourceField' => get_post_meta($id, '_rudnikagro_source_field', true),
        'sourceAsset' => $source_asset,
        'sourceNode' => get_post_meta($id, '_rudnikagro_source_node', true),
        'owned' => get_post_meta($id, '_rudnikagro_owned', true),
        'fileExists' => is_string($file) && is_file($file),
        'sha256' => $file_hash,
        'sourceAssetExists' => $source_hash !== null,
        'sourceSha256' => $source_hash,
        'exactSourceBytes' => $file_hash !== null && $source_hash !== null && hash_equals($source_hash, $file_hash),
    ];
};

$walk = function ($value, string $path, string $entity) use (&$walk, &$asset_mappings, &$empty_asset_fields, &$external_fields, $asset_pattern, $external_pattern, $attachment_row): void {
    if (is_array($value)) {
        if (isset($value['ID']) && is_numeric($value['ID']) && preg_match($asset_pattern, $path)) {
            $asset_mappings[] = $attachment_row((int) $value['ID'], $path, $entity);
            return;
        }
        foreach ($value as $key => $child) {
            $walk($child, $path === '' ? (string) $key : $path . '.' . $key, $entity);
        }
        return;
    }

    if (!preg_match($asset_pattern, $path)) {
        if (preg_match($external_pattern, $path)) {
            $external_fields[] = ['entity' => $entity, 'path' => $path, 'value' => $value];
        }
        return;
    }

    if (is_numeric($value) && (int) $value > 0 && get_post_type((int) $value) === 'attachment') {
        $asset_mappings[] = $attachment_row((int) $value, $path, $entity);
    } elseif ($value === null || $value === '' || $value === false || $value === []) {
        $empty_asset_fields[] = ['entity' => $entity, 'path' => $path];
    }

    if (preg_match($external_pattern, $path)) {
        $external_fields[] = ['entity' => $entity, 'path' => $path, 'value' => $value];
    }
};

$entities = [];
if (function_exists('get_fields')) {
    $option_fields = get_fields('option') ?: [];
    $entities[] = ['entity' => 'option', 'fieldCount' => count($option_fields)];
    $walk($option_fields, '', 'option');

    $posts = get_posts([
        'post_type' => ['page', 'post', 'product'],
        'post_status' => ['publish', 'draft', 'private'],
        'posts_per_page' => -1,
        'orderby' => 'ID',
        'order' => 'ASC',
    ]);
    foreach ($posts as $post) {
        $fields = get_fields($post->ID) ?: [];
        if (!$fields) {
            continue;
        }
        $entity = $post->post_type . ':' . $post->ID;
        $entities[] = [
            'entity' => $entity,
            'title' => get_the_title($post),
            'routeId' => get_post_meta($post->ID, '_rudnikagro_route_id', true),
            'fieldCount' => count($fields),
        ];
        $walk($fields, '', $entity);

        foreach (get_post_meta($post->ID) as $meta_key => $meta_values) {
            if (!str_starts_with((string) $meta_key, 'rudnikagro_') || !preg_match($external_pattern, (string) $meta_key)) {
                continue;
            }
            $external_fields[] = [
                'entity' => $entity,
                'path' => (string) $meta_key,
                'value' => maybe_unserialize($meta_values[0] ?? ''),
            ];
        }
    }
}

global $wpdb;
$raw_options = $wpdb->get_results("SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE 'options_rudnikagro_%'", ARRAY_A);
foreach ($raw_options as $raw_option) {
    $path = substr((string) $raw_option['option_name'], strlen('options_'));
    $value = maybe_unserialize($raw_option['option_value']);
    if (preg_match($asset_pattern, $path) && is_numeric($value) && (int) $value > 0 && get_post_type((int) $value) === 'attachment') {
        $seen = false;
        foreach ($asset_mappings as $mapping) {
            if ($mapping['entity'] === 'option' && $mapping['path'] === $path && (int) $mapping['attachmentId'] === (int) $value) {
                $seen = true;
                break;
            }
        }
        if (!$seen) {
            $asset_mappings[] = $attachment_row((int) $value, $path, 'option');
        }
    } elseif (preg_match($asset_pattern, $path) && ($value === '' || $value === false || $value === null)) {
        $empty_asset_fields[] = ['entity' => 'option', 'path' => $path];
    }
    if (preg_match($external_pattern, $path)) {
        $external_fields[] = ['entity' => 'option', 'path' => $path, 'value' => $value];
    }
}

$svg_attachments = [];
foreach (get_posts([
    'post_type' => 'attachment',
    'post_status' => 'inherit',
    'post_mime_type' => 'image/svg+xml',
    'posts_per_page' => -1,
    'orderby' => 'ID',
    'order' => 'ASC',
]) as $attachment) {
    $file = get_attached_file($attachment->ID);
    $source_asset = (string) get_post_meta($attachment->ID, '_rudnikagro_source_asset', true);
    $source_file = $source_asset !== '' ? get_template_directory() . '/.factory-cache/figma/latest/' . ltrim($source_asset, '/') : '';
    $file_hash = is_string($file) && is_file($file) ? hash_file('sha256', $file) : null;
    $source_hash = $source_file !== '' && is_file($source_file) ? hash_file('sha256', $source_file) : null;
    $svg_attachments[] = [
        'id' => $attachment->ID,
        'title' => $attachment->post_title,
        'sourceField' => get_post_meta($attachment->ID, '_rudnikagro_source_field', true),
        'sourceAsset' => $source_asset,
        'sourceNode' => get_post_meta($attachment->ID, '_rudnikagro_source_node', true),
        'owned' => get_post_meta($attachment->ID, '_rudnikagro_owned', true),
        'fileExists' => is_string($file) && is_file($file),
        'sha256' => $file_hash,
        'sourceAssetExists' => $source_hash !== null,
        'sourceSha256' => $source_hash,
        'exactSourceBytes' => $file_hash !== null && $source_hash !== null && hash_equals($source_hash, $file_hash),
    ];
}

$acf_groups = [];
if (function_exists('acf_get_field_groups')) {
    foreach (acf_get_field_groups() as $group) {
        if (str_contains((string) ($group['key'] ?? ''), 'rudnikagro') || str_contains(strtolower((string) ($group['title'] ?? '')), 'rudnikagro')) {
            $acf_groups[] = ['key' => $group['key'] ?? '', 'title' => $group['title'] ?? '', 'active' => $group['active'] ?? null];
        }
    }
}

$forms = [];
foreach (get_posts(['post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'posts_per_page' => -1]) as $form) {
    $forms[] = ['id' => $form->ID, 'title' => $form->post_title];
}

$gateways = [];
if (class_exists('WC_Payment_Gateways')) {
    foreach (WC_Payment_Gateways::instance()->payment_gateways() as $gateway) {
        $gateways[] = ['id' => $gateway->id, 'title' => $gateway->get_title(), 'enabled' => $gateway->enabled];
    }
}

$allowed_mimes = get_allowed_mime_types();
$plugins = [
    'woocommerce' => is_plugin_active('woocommerce/woocommerce.php'),
    'acfPro' => is_plugin_active('advanced-custom-fields-pro/acf.php'),
    'contactForm7' => is_plugin_active('contact-form-7/wp-contact-form-7.php'),
];

echo wp_json_encode([
    'kind' => 'read-only-editable-content-audit',
    'generatedAt' => gmdate('c'),
    'site' => home_url('/'),
    'siteTitle' => get_bloginfo('name'),
    'plugins' => $plugins,
    'acfGroups' => $acf_groups,
    'entities' => $entities,
    'assetMappings' => $asset_mappings,
    'emptyAssetFields' => $empty_asset_fields,
    'externalFields' => $external_fields,
    'svgAttachments' => $svg_attachments,
    'svgAllowedForCurrentUser' => isset($allowed_mimes['svg']) || in_array('image/svg+xml', $allowed_mimes, true),
    'contactForms' => $forms,
    'paymentGateways' => $gateways,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . PHP_EOL;
