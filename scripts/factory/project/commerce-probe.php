<?php
/** Read-only project commerce probe, implemented only when WooCommerce is selected. */
if (!defined('ABSPATH')) {
    exit(1);
}

echo wp_json_encode([
    'readOnly' => true,
    'configured' => false,
    'records' => [],
    'errors' => ['PROJECT_COMMERCE_PROBE_NOT_CONFIGURED'],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
