# RudnikAgro content import plan

## Shared ACF fields created before import

| Tab | Field names | Type / return | Location |
| --- | --- | --- | --- |
| Topbar | `rudnikagro_topbar_promotion`, `rudnikagro_shared_topbar_media_*` | text; image attachment ID | RudnikAgro options |
| Header and navigation | `rudnikagro_shared_primary_navigation_*`, `rudnikagro_shared_secondary_navigation_*` | text/textarea; image attachment ID | RudnikAgro options |
| Footer | `rudnikagro_shared_footer_*` | text/textarea; image attachment ID | RudnikAgro options |

The field labels and values come from the frozen Figma `content-map.json`; source node IDs remain in that map and imported media gains project-only `_rudnikagro_source_*` provenance metadata. The importer creates a record only once and leaves subsequently populated option fields and owned posts unchanged.

## Native records

- Pages/routes and navigation are derived from frozen manifest routes.
- The supplied blog article is a native post with source title, date, body and feature image.
- WooCommerce owns cart, checkout, account and product archive routing. Products are draft records only until source-backed commerce data is configured; prices, stock, tax, SKUs and payment settings are never derived.
- CF7 is enabled but no form is created because recipient and native form identity are missing.

## Blog source-to-field mapping

| Section tab | Field name | Type / return | Location |
| --- | --- | --- | --- |
| Archiwum / Nagłówek | `rudnikagro_blog_archive_header` (`banner_label`, `breadcrumb`, `banner`) | Group: Text, Text, Image ID | RudnikAgro options page |
| Nagłówek artykułu | `rudnikagro_blog_article_header` (`banner_label`, `breadcrumb`, `banner`) | Group: Text, Text, Image ID | Native post / Nagłówek artykułu tab |
| Treść artykułu | `rudnikagro_blog_article_return_label` | Text | Native post / Treść artykułu tab |
| Powiązane wpisy | `rudnikagro_blog_related_heading`, `rudnikagro_blog_related_posts` | Text; Repeater of Post Object IDs | Native post / Powiązane wpisy tab |
| Karta wpisu | `rudnikagro_blog_card_date`, `rudnikagro_blog_card_label`, `rudnikagro_blog_card_image` | Text; Text; Image ID | Native post / Karta wpisu tab |

The frozen blog list supplies twelve native posts with source title, date, card label and image. Only the supplied potassium article receives the sourced WYSIWYG body and hero media. Card reactions and bodies for the other supplied titles are unavailable, so their local post permalinks are implementation routing only and their bodies remain empty.
