# RudnikAgro implementation plan — partial source handoff

Snapshot source: factory/project.json, Figma file OwiDXrKMVcaHKB9ryYF6mY, PAGE 0:1.
Scope: this theme and https://autopilot.local only. Language: pl.
Status: BLOCKED / NOT READY FOR OFFLINE BUILD. The manifest remains partial.
No implementation or WordPress changes were made during snapshot discovery.

## Source inventory and execution contract

All 21 top-level frames are classified in manifest.productionFrames and mapped in manifest.routes.
No research/archive frame was excluded. All 21 original full PNGs and source sidecars are retained. Twenty match frame bounds directly; the archive overflow export has a separate unscaled exact-frame crop with provenance. All 21 route references now match actual frame dimensions.
Every frame is 1920 px wide; heights are the actual individual source heights, not browser viewport heights.
QA desktop viewport: 1920 x 900. Mobile is derived; there is no mobile Figma frame or reference.
Route paths are proposed local routing decisions derived from page identities, not claims about source hyperlinks.
The route section lists include outstanding logical sections explicitly. Unknown section IDs must be captured before handoff.
Do not freeze this incomplete manifest as a completed implementation baseline.

## Dependency order and native behavior

1. foundation: resolve source blockers, then load exact DM Sans fonts/weights, shared design styles, sticky header, navigation, footer, ACF options and owned import infrastructure.
2. product-archive: native WooCommerce taxonomy archive, actual products, filtering, sorting and pagination. No invented stock, attributes or product descriptions.
3. product: native WooCommerce product 98899 (Aquatos 5L) and package 99299; gallery, sourced variants, pricing, tabs, related products, inquiry, reviews and downloads. Expanded, inquiry, reviews and files states share the product template. Package relationships and missing variant data require approval from a real source.

### Bundle product — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Pakiet | `rudnikagro_product_bundle` | Group | package composition and purchase labels | Product: package source route |
| Pakiet | `contains_heading`, `savings`, `single_products_price`, `price_per_hectare` | Text | sourced text | Product: package source route |
| Pakiet | `area_options` | Repeater | text label and active state | Product: package source route |
| Pakiet | `items` | Repeater | quantity, title, description, current and previous price | Product: package source route |

The source has no package-item destination URLs. These remain source-backed presentational rows while the actual package product keeps native WooCommerce price, quantity and add-to-cart behavior.
4. home: default and active-elements frames. Reuse native products/posts and shared header/footer. Capture benefits, crops, promotions, packages, catalogues, recommendations, company block, blog and lower knowledge/background composition before implementation.

### Home active navigation — editable field structure

The `home-active` interaction uses the existing global ACF options page, **Nagłówek i nawigacja** tab. It is one primary-navigation component, not a second home template. The importer reads the exact frozen `shared-primary-navigation-active` record and only seeds empty or previously imported project-owned values.

| Label | Field name | Type | Return value | Location |
| --- | --- | --- | --- | --- |
| Active primary labels | `rudnikagro_shared_primary_navigation_active_I574_5_93_29` | textarea | newline-separated source labels | Global options / Nagłówek i nawigacja |
| Protection categories | `rudnikagro_shared_primary_navigation_active_250_754` | textarea | newline-separated source labels | Global options / Nagłówek i nawigacja |
| Crop column one | `rudnikagro_shared_primary_navigation_active_250_762` | textarea | newline-separated source labels | Global options / Nagłówek i nawigacja |
| Crop column two | `rudnikagro_shared_primary_navigation_active_250_763` | textarea | newline-separated source labels | Global options / Nagłówek i nawigacja |
| Active-menu source SVGs | `rudnikagro_shared_primary_navigation_active_media_{250_729,250_752,250_755,250_764,250_765}` | file | attachment ID (SVG) | Global options / Nagłówek i nawigacja |

The logo and chevron are rendered from their editable attachment IDs. The remaining source SVG attachment IDs are retained as editable source assets for the active-menu composition; no CSS or font-icon substitute is used.
5. about, catalogues, careers, contact: separate WordPress pages with dedicated page SCSS; real CF7 contact/application integrations and sourced catalogue files.
6. blog: native archive and single post. Import the actual supplied article with its source title, date and content. Grid titles alone do not authorize invented article bodies, authors or destinations.
7. account: native WooCommerce login, registration and password recovery. Register through native customer logic, not an imitation form. Legal documents/consents must have real destinations.
8. cart: native WooCommerce cart line items, quantity changes, coupons and totals using approved real product data.
9. checkout: native customer, payment and shipping fields; login step, registration popup and confirmation states. No fabricated order or payment result. Source provider wording does not establish a configured WooCommerce payment/shipping integration.
10. visual QA: exact route/frame dimensions and each section, then derived responsive captures. A matching screenshot must be measured and visually reviewed; successful commands alone are not acceptance.

WooCommerce was absent from the read-only native plugin list. ACF Pro and CF7 were active.
Installation of enabled missing plugins belongs to implementation, using scripts/factory/autopilot/wp.js.
Snapshot discovery does not install or activate plugins.

## Existing elements to reuse

- partials/section-image.php for real image/content compositions after checking markup and safe output requirements.
- partials/header.php, footer.php, blog-item.php and menu-mobile.php where their structure fits.
- Existing gc/gr grid utilities, align/justify classes and grid/container definitions.
- src/css/abstracts/_margins.scss: extend its existing $xl-min-values list for exact measured spacing; put pt-*, pb-* and related utilities in section markup.
- Existing breakpoints: 480, 576, 768, 992, 1200 and 1560 px; derived responsive decisions must be documented.
- Existing AOS and Swiper imports, accordion, modal, tabs and mobile menu modules; reuse initialization with element guards and reduced-motion handling.
- Existing ACF JSON groups are boilerplate and must be checked for compatible ownership before reuse; do not overwrite unrelated groups.

One SCSS file per page/template family, shared global/header/footer separate. No React, Tailwind, typography clamp, manually edited dist, global component overrides or duplicate utility systems.

## Proposed native ACF field structure — no fields created

These are implementation field structures, not invented visible content.
Each section receives an ACF tab. Group locations and returns must match the table.
The current content-map keeps exact source-node records. Its granular source-record keys must be reconciled to the semantic field structures below before creating Local JSON; it is not yet an executable importer.

| Label/purpose | Field name | Type | Return | Group location |
| --- | --- | --- | --- | --- |
| Section tab | rudnikagro_tab_<section> | tab | none | corresponding group |
| Header/footer options | rudnikagro_global | group | array | dedicated project options page |
| Logo | rudnikagro_logo | image | attachment ID | global/header tab |
| Promotion items | rudnikagro_promotions | repeater: text, link | rows; link array | global/topbar tab |
| Contact details | rudnikagro_contact_items | repeater: label, value, link | rows; strings/link arrays | global/contact tab |
| Navigation | rudnikagro_navigation | repeater: label, link, children | rows; link arrays | global/navigation tab |
| Footer columns | rudnikagro_footer_columns | repeater: heading, links | rows | global/footer tab |
| Footer notice | rudnikagro_footer_notice | wysiwyg | HTML string | global/footer tab |
| Page banner title/image | rudnikagro_page_banner | group: title text, image | string, attachment ID | individual page/banner tab |
| Hero slides | rudnikagro_hero_slides | repeater: heading, image, link | text, attachment ID, link array | front page/hero tab |
| Benefits/crop items | rudnikagro_benefits; rudnikagro_crops | repeater: title, icon/image, link | strings, attachment IDs, link arrays | front page/section tabs |
| Home card collections | rudnikagro_home_promoted_products; rudnikagro_home_bundle_products; rudnikagro_home_recommended_products | relationship limited to product | source-ordered native product IDs | Front page / Sekcje tab; promotion, package and recommendation rows |
| Home card controls | rudnikagro_home_sections.cart_label; cart_icon | text; SVG image | source string; attachment ID | Front page / Sekcje tab |
| Product card presentation | rudnikagro_product_card_presentation | group: badge, lowest_price_note | source strings | Product / Card presentation tab; only when the source card displays either item |
| Image/content section | rudnikagro_<section> | group: heading text, content wysiwyg, image, link | string, HTML, attachment ID, link array | home/about pages; one tab per source section |
| Catalogue cards | rudnikagro_catalogues | repeater: title, cover, background, pdf_label, pdf, online_label, online_url | strings, image IDs, file ID, URL | catalogues page/catalogues tab; reusable source relationship on home |
| Catalogues banner | rudnikagro_page_banner | group: title text, image | string, attachment ID | catalogues page/banner tab |
| Knowledge items | rudnikagro_knowledge_items | repeater: heading text, content wysiwyg | strings/HTML | front page/knowledge tab |
| Home page | rudnikagro_home | tabbed groups: hero (heading, CTA, image), benefits (title, SVG attachment), crops (group label/colour and icon attachment rows), section labels, catalogue assets, about, blog and knowledge accordions | strings, WYSIWYG HTML, attachment IDs, relationship post IDs | front page; every group maps to the like-named frozen `home-*` section |
| Selected blog posts | rudnikagro_featured_posts | relationship limited to post | post IDs | front page/blog tab |
| Vacancies | rudnikagro_vacancies | repeater: title, description, application_form | string, HTML, CF7 post ID | careers page/vacancies tab |
| Application form | rudnikagro_application_form | post_object limited to wpcf7_contact_form | post ID | careers page/application tab |
| Careers banner | rudnikagro_page_banner | group: title text, breadcrumb text, image | strings, attachment ID | careers page/banner tab |
| Careers CTA | rudnikagro_careers_cta | group: heading text, button_label text, background image | strings, attachment ID | careers page/CTA tab |
| Career vacancy offer | rudnikagro_vacancies | repeater: title text, description wysiwyg, application_form post_object | rows; strings, HTML, CF7 post ID | careers page/vacancies tab |
| Contact form | rudnikagro_contact_form | post_object limited to wpcf7_contact_form | post ID | contact page/form tab |
| Branch/contact blocks | rudnikagro_contact_blocks | repeater: heading, content, links | text, HTML, link arrays | contact page/contact tabs |
| Map | rudnikagro_contact_map | image plus approved external URL if sourced | attachment ID, URL | contact page/map tab |
| Product download files | rudnikagro_product_downloads | repeater: label, file | string, attachment ID | product/downloads tab |
| Product display notices | rudnikagro_product_notices | repeater: text | HTML string | product/notices tab |
| Inquiry form | rudnikagro_product_inquiry_form | post_object limited to wpcf7_contact_form | post ID | product/inquiry tab |
| UI labels/consent text | rudnikagro_commerce_labels | group of source-backed text/textarea fields | strings | options/native commerce tabs |

### Product detail source-to-field mapping — no fields created

The product group is discovery-complete only. These semantic fields are the reviewable ACF
mapping for sourced presentation content; WooCommerce continues to own title, SKU, prices,
variations, gallery, reviews, related-product relationships and cart operations.

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Benefits | `rudnikagro_product_benefits` | repeater: icon image, label | attachment ID, string | WooCommerce product / Benefits tab |
| Technical data | `rudnikagro_product_technical_data` | repeater: label, value | strings | WooCommerce product / Technical data tab |
| Legal notices | `rudnikagro_product_notices` | repeater: notice text | HTML string | WooCommerce product / Notices tab |
| Download labels/files | `rudnikagro_product_downloads` | repeater: label, file | string, attachment ID | WooCommerce product / Downloads tab |
| Inquiry labels/privacy/form | `rudnikagro_product_inquiry` | group: heading, field labels, privacy text, form | strings, CF7 post ID | WooCommerce product / Inquiry tab |
| Product UI labels | `rudnikagro_commerce_labels` | group of source-backed labels | strings | dedicated project options / Commerce tab |

The source has no external destination or file for `Pobierz etykietę`, and it does not establish
a Contact Form 7 instance or recipient. Those configuration values remain unset until supplied;
no fake form or download is permitted.
| Legal document references | rudnikagro_legal_pages | group of post_object references | page IDs | global/legal tab |

Native WordPress owns page/post titles, article content/date/taxonomies, attachment data and menus where applicable.
Native WooCommerce owns product title/description/SKU, prices, attributes/variations, package relationships when supported, stock, cart, coupons, shipping, payments, orders, customer authentication and actual reviews.
ACF provides source-specific editable presentation/content; it must not simulate native commerce.
Create ACF Local JSON only after final field/source mapping is reviewable, then import it into native ACF admin through project-owned tooling.

## Catalogues source capture â€” 2026-09-11

The catalogues build group is captured from production frame `347:1120` at 1920Ã—1850. `sections/34-catalogues-heading.json` adds the 1440Ã—220 banner-and-breadcrumb composition at x=240, y=218. Existing `sections/04-catalogues-downloads.json` now has five captured Figma image exports: its two card backgrounds and two covers, plus the banner background. The card section remains placed at x=240, y=466 with its 1444Ã—357 lossless reference crop.

The approved native ACF implementation mapping is `rudnikagro_catalogues_banner` (title Text, breadcrumb Text, image attachment ID) in the Banner tab; `rudnikagro_catalogues` (repeater rows of title Text, cover Image ID, background Image ID, PDF label Textarea, PDF File ID, online label Text, online URL) in the Catalogues tab; and `rudnikagro_catalogues_shop_cta` (heading Text, button label Text) in the CTA sklepu tab. Its group location is the Katalogi page template. The missing PDF and online-reader destinations are downstream configuration, while the Figma typo on the orchard PDF label remains verbatim source content.

## Import ownership and resume

Proposed immutable identity: project slug rudnikagro plus actual Figma node ID and content role.
Store ownership metadata such as _factory_project and _factory_source_key on project-owned records; keep an import ledger with original imported values/hashes.
Before each write verify ownership. If absent, do not adopt or overwrite unrelated content implicitly.
Create missing owned records once. On resume preserve editor changes: update only fields still equal to the previously imported value, otherwise record a conflict.
Deduplicate attachment imports by source identity and hash. Keep source crop metadata separate from original editable image bytes.
Do not seed orders, customers, invented reviews, placeholder copy, missing translations or inferred external links.

## States and source gaps

See SOURCE_CLARIFICATIONS.md and SNAPSHOT_REVIEW.md.
Every state is listed in manifest.routes with its real frame ID.
QA state preparation must use actual native UI and approved source data. It must never send external form mail, place real orders, charge payment, replace the DOM with fixtures or manufacture screenshots.
The completed-order state cannot be claimed captured through native QA until an approved existing order and an allowed navigation path are supplied.
The full source references are preserved even where source text or native behavior is incomplete.

## Remaining capture work

Complete every uncaptured route section, per-section get_design_context, exact styled runs, fills/crops/effects, image and vector bytes, native content destinations and link evidence.
Finish shared header/footer comparison and per-route placement records before reusing them globally.
Capture the continuous lower homepage background and full about-page decorated composition; do not infer coordinates from flipped local vector y values.
Resolve catalogue documents/links, product labels, placeholder review/package text, incomplete variation/product data and the native confirmation-state evidence.
Reconcile semantic ACF names with source records; finish missing content rather than filling it with defaults.
Only then mark complete, run both snapshot gates, freeze the source and allow implementation.

## Careers source capture — 2026-09-11

The careers build group is captured from production frame `349:1267` at 1920×3802. New source records are `sections/30-careers-heading.json` through `sections/33-shared-shop-cta.json`; their references are lossless 1× crops of the original full frame. Existing shared-topbar, secondary navigation, primary navigation and footer section records are reused, with this route’s exact placement recorded in `manifest.json`.

The source presents one expanded vacancy (`355:1423`) and five collapsed offers. The expanded detail, form labels, upload/submit labels and both consent texts are all now granular content-map records. The source typo in `Magazynier/aprzedawca` is preserved verbatim and flagged for editorial review. Mobile remains derived because no mobile Figma route exists.

<!-- factory-blog-discovery -->
## Blog — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Article header | blog_article_heading_banner_label, blog_article_heading_breadcrumb | Text | text | Post: blog article |
| Article header | native post title, featured image, publish date | Native WordPress | post values | Post: blog article |
| Article content | native post content | WYSIWYG | HTML | Post: blog article |
| Article content | blog_article_return_label | Text | text | Post: blog article |
| Related posts | blog_related_posts_heading | Text | text | Post: blog article |
| Related posts | blog_related_posts_items | Relationship | post IDs, source selection recorded | Post: blog article |
| Archive header | blog_archive_heading_banner_label, blog_archive_heading_breadcrumb | Text | text | Blog archive options |
| Archive cards | native posts | Native WordPress | title, date, featured image | Blog post collection |

The archive source supplies visible card labels, dates and images but no card destination URLs; implementation will bind those cards to native WordPress permalinks rather than inventing source links. The source article uses four explicit external product links inside its WYSIWYG content; retain their exact captured URLs. Responsive behavior is derived because no mobile source is present.

<!-- factory-contact-discovery -->
## Contact — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Contact heading | rudnikagro_contact_heading_title, rudnikagro_contact_heading_breadcrumb, rudnikagro_contact_heading_image | Text, Text, Image | strings, attachment ID | Page: Kontakt / Heading tab |
| Contact details | rudnikagro_contact_blocks | Repeater: card heading, company, detail textarea and nested department rows | source strings | Page: Kontakt / Contact details tab |
| Contact form presentation | rudnikagro_contact_form_heading, rudnikagro_contact_form_labels, rudnikagro_contact_form_privacy_notice | Text, Group of Text, Textarea | strings | Page: Kontakt / Form tab |
| Contact form binding | rudnikagro_contact_form | Post Object limited to wpcf7_contact_form | post ID | Page: Kontakt / Form tab |
| Contact map | rudnikagro_contact_map_image | Image | attachment ID | Page: Kontakt / Map tab |

The Figma form supplies presentation labels only. The real CF7 form identity, recipient and privacy-policy reference remain unconfigured source gaps; no synthetic form behavior is authorized. The map is a sourced image and has no Figma hyperlink or reaction, so it is not assigned an invented external destination. All four contact section references are unscaled 1x crops from `references/full/frame-335-591.png`; mobile remains derived.

<!-- factory-about-discovery -->
## About — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Banner | rudnikagro_about.banner.title, breadcrumb, image | Text, Repeater, Image | string, label rows, attachment ID | Page: O nas / Banner tab |
| Introduction | rudnikagro_about.introduction.heading, content | Text, WYSIWYG | string, HTML | Page: O nas / Introduction tab |
| Supply | rudnikagro_about.supply.heading, introduction, items, image | Text, Textarea, Repeater (title/icon), Image | strings, attachment IDs | Page: O nas / Supply tab |
| Grain trade | rudnikagro_about.grain_trade.heading, content, image | Text, WYSIWYG, Image | string, HTML, attachment ID | Page: O nas / Grain trade tab |
| Insurance | rudnikagro_about.insurance.heading, content, expert | Text, WYSIWYG, Group (role/name/telephone/email) | string, HTML, source strings | Page: O nas / Insurance tab |

The five about-page source records use exact Figma text, downloaded source assets and lossless 1× crops from `references/full/frame-326-2764.png`. The desktop card geometry is recorded in the route’s `sectionGeometry`; no mobile Figma source exists, so responsive behavior remains derived. The visible expert details are content, not authorization to send email or initiate a call.

<!-- factory-cart-source-mapping -->
### Cart source-to-field mapping

The cart uses WooCommerce cart APIs for items, quantities, coupon processing, shipping, discount and total calculations. The captured state is prepared through a real imported product, native coupon and shipping method; it is never rendered as static cart markup.

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Cart content | `rudnikagro_cart_heading` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_continue_shopping_label` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_coupon_heading` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_coupon_placeholder` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_apply_coupon_label` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_summary_heading` | text | string | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_products_label`, `rudnikagro_cart_shipping_label`, `rudnikagro_cart_discount_label`, `rudnikagro_cart_total_label` | text | strings | ACF Options / Cart content tab |
| Cart content | `rudnikagro_cart_checkout_label` | text | string | ACF Options / Cart content tab |
| Cart media | `rudnikagro_cart_remove_icon_486_96` | File | SVG attachment ID | ACF Options / Cart content tab |
| Native commerce | line product, price, quantity, coupon notice, subtotal, shipping, discount, total | WooCommerce dynamic data | calculated/display values | WooCommerce cart and cart-totals template |

The observed Aquatos 5L, BLACKFRIDAY, 411,00 zł, 22,90 zł, 50 zł and 383,90 zł values are source-state evidence. The project importer creates the project-owned local coupon/shipping configuration only when absent, with source-node provenance; subsequent editor changes are retained.

<!-- factory-product-archive-source-mapping -->
### Product archive source-to-field mapping — no fields created

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Category introduction | `rudnikagro_archive_category_introduction_title` | Text | string | WooCommerce product category: Fungicydy / Introduction tab |
| Category introduction | `rudnikagro_archive_category_introduction_body` | WYSIWYG | HTML | WooCommerce product category: Fungicydy / Introduction tab |
| Category description | `rudnikagro_archive_category_description` | WYSIWYG | HTML | WooCommerce product category: Fungicydy / Description tab |
| Archive labels | `rudnikagro_archive_expand_label`, `rudnikagro_archive_sort_default_label` | Text | strings | ACF Options / Product archive tab |
| Archive labels | `rudnikagro_archive_filter_labels` | Group | text strings | ACF Options / Product archive tab |
| Native commerce | cards, media, price, category, product attributes, filtering, sort and pagination | WooCommerce native data | dynamic | WooCommerce product-category archive |

The product grid supplies source product labels, prices and exact media only. It does not establish SKU, stock, tax, descriptions, attributes, purchasability or filter relationships; do not invent those data during implementation. The opening category body contains source `Lorem ipsum` and must remain verbatim until editorial approval.

<!-- factory-checkout-source-mapping -->
### Checkout source-to-field mapping

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Checkout content | `rudnikagro_checkout_heading`, `rudnikagro_confirmation_heading`, `rudnikagro_checkout_login_heading` | Text | strings | ACF Options / Checkout content tab |
| Checkout content | `rudnikagro_checkout_steps_*` | Text | strings | ACF Options / Checkout content tab |
| Checkout content | `rudnikagro_checkout_payment_*`, `rudnikagro_checkout_delivery_*` | Text | strings | ACF Options / Checkout content tab |
| Checkout content | `rudnikagro_checkout_totals_*` | Text | strings | ACF Options / Checkout content tab |
| Checkout login choices | `rudnikagro_checkout_login_heading_heading`, `rudnikagro_checkout_login_options_*` | Text; benefits Textarea | source strings / source line list | ACF Options / Checkout login tab |
| Native commerce | customer, payment, shipping, order-confirmation and account-choice state | WooCommerce native data | dynamic | WooCommerce checkout/account templates |
| Registration dialog | `rudnikagro_account_registration_dialog_*` | Text | source strings | ACF Options / Checkout registration tab |
| Registration dialog media | `rudnikagro_account_registration_dialog_background` | File | SVG attachment ID | ACF Options / Checkout registration tab |

WooCommerce renders all live calculated values, account credentials, gateway choices, shipping methods and a real approved confirmation state. The login and registration labels are sourced editable content; the registration panel is the exported source SVG, imported as a controlled attachment. The completed-order state still requires an approved real native order.

## Account — sourced editable structure

| Section tab | Field name | Type | Return/value | Location |
| --- | --- | --- | --- | --- |
| Breadcrumb | `rudnikagro_account_breadcrumb` | Repeater (label, current) | sourced labels/boolean | ACF Options / Account content tab |
| Login labels | `rudnikagro_account_login_labels` | Group (title, email_label, password_label, remember_label, submit_label, reset_label) | strings | ACF Options / Account content tab |
| Registration labels | `rudnikagro_account_registration` | Group (title, benefits WYSIWYG, submit_label) | string, sourced HTML, string | ACF Options / Account content tab |
| Native commerce | account authentication, registration and password recovery | WooCommerce native data/actions | dynamic; no copied credentials | WooCommerce account template |

The account labels are visible Figma source copy. Breadcrumb, password-reset and registration destinations were not captured as Figma hyperlinks/reactions; use native local WooCommerce/WordPress behavior during implementation without claiming those URLs are source facts.
