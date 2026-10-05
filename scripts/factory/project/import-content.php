<?php
/**
 * Project-specific, source-scoped content importer.
 *
 * Autopilot replaces this guard after auditing the frozen Figma content map
 * and native ownership plan. The real importer must remain idempotent and
 * preserve editor overrides.
 */
if (!defined('ABSPATH')) {
    exit(1);
}

throw new RuntimeException('PROJECT_CONTENT_IMPORT_ADAPTER_NOT_CONFIGURED');
