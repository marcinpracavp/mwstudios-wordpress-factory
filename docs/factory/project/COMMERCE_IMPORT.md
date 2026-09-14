# Product native-content migration

## ACF structure

| Section | Field name | Type | Return | Location |
| --- | --- | --- | --- | --- |
| Ikony | `rudnikagro_product_icons.favorite_icon` | File | attachment ID | WooCommerce product |
| Ikony | `rudnikagro_product_icons.download_icon` | File | attachment ID | WooCommerce product |
| Opinie | `rudnikagro_product_review_summary.average` | Text | text | WooCommerce product |
| Opinie | `rudnikagro_product_review_summary.count` | Text | text | WooCommerce product |
| Opinie | `rudnikagro_product_review_summary.distribution` | Repeater (`rating`, `count`) | source text | WooCommerce product |

## Source-to-native map

- Aquatos is native variable product `54`. Size source nodes `496:1781`, `496:1787`, and `496:1791` map to variations `118` (1 L), `119` (5 L), and `120` (20 L).
- The source price node `323:2087` is 411.00 zł including the source-tax note at `502:3`. The 5 L variation stores this as `figma-explicit`; 1 L is 82.20 zł and 20 L is 1644.00 zł, both `user-authorized-proportional` with their full source/base/formula JSON in `_rudnikagro_price_provenance`.
- Related-card source nodes `326:2271`/`326:2272` and `326:2289`/`326:2290` map to native products `121` and `122` with explicit 45.99 zł and 534.60 zł prices. Their featured images are exact reference-crops from the frozen `references/sections/product-related.png` source (attachment IDs `127` and `128`), with crop provenance stored on the project-owned media; no substitute imagery is used.
- The native category hierarchy is `Środki ochrony roślin` (`19`) → `Fungicydy` (`16`), with the Aquatos product and related products assigned to its child term.
- Review body `425:645` is native review comment `2`, rating 5 from the five star nodes `429:836`–`429:840`, and date `30 lipca 2026` from `429:842`. It deliberately has no author because none appears in the source. The placeholder body remains tagged for editorial review in `_rudnikagro_review_provenance`.
- Exact favorite SVG `I625:179;586:555` is imported as attachment `123` and held by the ACF attachment-ID field. The source download-icon group `586:1022` has no retained SVG export, so `download_icon` deliberately remains empty; the previous CSS-drawn icon was removed.

## Idempotency and overrides

The importer writes only project-owned records and source metadata. A source price is updated only when the stored native value still equals `_rudnikagro_last_imported_regular_price`; editor prices including `0` are retained. Native relation updates follow the same recorded-baseline rule. The importer rejects cached SVGs containing scripts, foreign objects, event attributes, or JavaScript URLs before upload.
