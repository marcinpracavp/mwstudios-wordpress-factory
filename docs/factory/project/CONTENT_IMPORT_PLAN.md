# AURA — Content Import Plan

## Scope

The one-time importer lives under `scripts/factory/project/` and runs through WP-CLI in the local WordPress instance. It is project-scoped, deterministic and idempotent.

## Records to create/update

1. Pages: Home, About and Blog/Journal, with stable slugs and assigned templates/front-page/posts-page settings.
2. Global ACF options: branding, announcement, footer, newsletter and project-specific ecommerce wrapper copy.
3. Homepage and About ACF groups with the exact Figma copy and attachment IDs.
4. Product categories/attributes needed by the design (format, scent family, intensity).
5. Demo/catalog products visible in Figma, only when they do not already exist by stable SKU/slug; native Woo title, price, stock, variations and images are used.
6. Blog categories, posts, excerpts, dates, author presentation and featured/editorial media visible in Figma.
7. WordPress menus for desktop/mobile/footer, matched by menu slug and location.

## Media pipeline

- Exact temporary Figma asset URLs are downloaded immediately into `assets/img/aura/` with semantic filenames.
- The importer sideloads local files only when an attachment carrying the same `_aura_factory_asset_key` does not already exist.
- Attachment IDs are assigned to ACF image fields, WooCommerce featured/gallery fields and native post thumbnails.
- SVG remains SVG where appropriate; raster photography remains in its source format.
- No placeholder image or hardcoded `/uploads/` URL is used.

## Idempotency and safety

- Pages/posts/products are found by stable slug/SKU before creation.
- ACF values are updated only on records owned by the Aura importer.
- Terms and menus are matched by stable slugs.
- No database reset, bulk delete or unrelated option overwrite is performed.
- The importer prints a structured summary of created, updated and skipped records.
- Re-running produces the same state.

## Verification

After import:

- query each page/product/post and print assigned ACF values;
- verify every attachment exists and is connected to the intended field;
- verify front page/posts page/menu locations;
- verify product queries return the intended products and order;
- inspect the ACF admin and rendered pages locally.

