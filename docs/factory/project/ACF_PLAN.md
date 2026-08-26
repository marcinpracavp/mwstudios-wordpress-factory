# AURA — ACF Plan

ACF Pro is the content model for project copy and media that do not already have a native WordPress/WooCommerce owner. Image fields return attachment IDs; link fields return arrays; product/post fields return IDs. Every section group is optional and templates perform content-aware conditional rendering.

## Global options — AURA Site Settings

Location: options page `acf-options-opcje-globalne`.

| Group | Label | Field name | Type / return | Required | Rendered in |
|---|---|---|---|---|---|
| Branding | Logo | `aura_logo` | image / ID | optional | header/footer/checkout |
| Header | Announcement | `aura_announcement` | group: enabled, content WYSIWYG, end date, dismiss settings | optional | global topbar |
| Header | Utility labels | `aura_header_labels` | group of text/link fields | optional | search/account/cart accessible labels |
| Footer | Footer intro | `aura_footer_intro` | textarea | optional | footer |
| Footer | Copyright | `aura_footer_copyright` | text | optional | footer |
| Footer | Social links | `aura_social_links` | repeater: label, link | optional | footer/mobile drawer |
| Newsletter | Newsletter | `aura_newsletter` | group: eyebrow, desktop/mobile title, desktop/mobile text, form shortcode | optional | reusable newsletter |
| Ecommerce | Store copy | `aura_store_copy` | group of project-specific labels/messages/CTA links | optional | archive/cart/search/account/checkout wrappers |

Native menu item labels remain WordPress menu content. Native WooCommerce labels/messages remain WooCommerce data or translatable strings rather than duplicated ACF values.

## Homepage — AURA Homepage

Location: front page.

| Section | Fields |
|---|---|
| Hero | `hero_eyebrow` text, `hero_title` text, `hero_text` textarea, `hero_link` link, `hero_image_desktop` image ID, `hero_image_mobile` image ID |
| Bestsellers | `bestsellers_title` text, `bestsellers_link` link, `bestsellers_query` group: source select, category term ID, limit number, orderby select, order select, manual products relationship IDs |
| Brand statement | `brand_statement_eyebrow` text, `brand_statement_title` textarea, `brand_statement_text` textarea |
| Scent collections | heading/text + repeater `scent_collections`: title, link, image ID |
| Editorial lifestyle | eyebrow, title, text, link, image desktop/mobile IDs |
| Category split | repeater: title, text, link, image ID, tone select |
| USP | repeater: icon image ID, title, text |
| Scent finder | eyebrow, desktop/mobile title, desktop/mobile text, link, image desktop/mobile IDs |
| Featured product | product post object / ID, eyebrow override optional, editorial text optional |
| Brand story | eyebrow, title, text |
| Reviews | desktop/mobile title + repeater: quote, author, meta/rating |

## Shop archive — AURA Shop Settings

Location: WooCommerce shop page.

- Intro: eyebrow, title, description.
- Category navigation: optional manual category term selection; otherwise native product categories.
- Filters: enabled taxonomies/attributes, labels and mobile CTA copy.
- Starter set promo: eyebrow, title, text, link, desktop/mobile image IDs.
- SEO block: title and WYSIWYG content.
- Product card badges and prices are native WooCommerce data; scent family/format/intensity use product taxonomies/attributes.

## Product — AURA Product Details

Location: post type `product`.

| Group | Fields |
|---|---|
| Scent identity | `aura_product_eyebrow` text, `aura_scent_families` taxonomy, `aura_intensity` taxonomy/select |
| Scent narrative | `aura_scent_heading` text, `aura_feels_like` textarea, `aura_scent_notes` repeater: stage, title, notes, image ID |
| Facts | `aura_product_facts` repeater: value, label |
| Story | eyebrow, title, WYSIWYG, image ID |
| Care/details | intro title/WYSIWYG + repeater accordion title/WYSIWYG |

Title, price, sale price, stock, SKU, variations, featured image/gallery, short description, reviews and permalink remain native WooCommerce values.

## About — AURA About Page

Location: page template `template-about.php`.

- Hero: eyebrow, title, text, desktop/mobile image IDs.
- Manifest: quote, attribution.
- Origin: eyebrow, title, WYSIWYG, image ID.
- Process: heading + repeater number/title/text.
- Editorial split: two image IDs plus optional eyebrow/title/text/link.
- Values: repeater title/text.
- CTA: title, link.

## Blog settings and post modules

Blog listing location: posts page or blog template.

- Listing intro: eyebrow, title, description.
- Featured post: post object / ID.
- Newsletter uses global options.

Post native model provides title, date, category, author, excerpt, featured image and main content. Optional post ACF fields cover reading time, lead, author quote/bio override, CTA and secondary editorial image/caption. Related posts are queried by category with optional manual relationship override.

## Checkout and ecommerce utilities

Native WooCommerce forms, fields, shipping methods, gateways, totals, orders, account data and notices remain native. Only project-specific wrapper copy and optional promotional messages live in the global `aura_store_copy` group. No transactional data is copied into ACF.

## Schema rules

- No fallback copy from Figma in PHP.
- Empty groups do not render sections.
- Empty repeater rows are skipped.
- Image/link/button elements render only when their field is populated.
- One logical H1 per public page.
- All output is escaped by type (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`, `wp_get_attachment_image`).
