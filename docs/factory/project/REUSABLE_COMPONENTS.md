# Reusable components

## Product list menu

- Route: `product-list` (`/produkty/`); canonical active category is `Cylindry`.
- Partial: `partials/route-skeleton.php` (`product-list-menu` route section) reuses the established route shell.
- Shared style: `src/css/components/_catalogues.scss` (isolated `.c-product-list-menu` selectors).
- Interaction: category links are real WooCommerce `product_cat` term links; `scripts/factory/project/qa-state.js` can click a requested category by its visible label for state preparation.
- Source section: `product-list-menu` (`125:2757`), desktop frame width 1920px, x=242/y=175, 346×481.
- Fields: native option/ACF fields `emko_product_list_menu_heading_125_2809`, `emko_product_list_menu_category_1_125_2760` through `emko_product_list_menu_category_9_125_2805`, and `emko_product_list_menu_category_arrow_125_2762` supply editable labels and the exact replaceable arrow attachment.
- Variant rule: the menu keeps the source order and active-state treatment, resolves destinations from native `product_cat` terms, and marks absent taxonomy terms as explicit source gaps without inventing labels or media.

## Product list items

- Route: `product-list` (`/produkty/`); canonical source grid is the four-card `Cylindry` listing row.
- Partial: `partials/route-skeleton.php` (`product-list-items` route section) reuses the established route shell and native WooCommerce product records.
- Shared style: `src/css/components/_catalogues.scss` (isolated `.c-product-list-items` selectors and route-shell placement).
- Source section: `product-list-items` (`125:2878`), desktop frame width 1920px, x=604/y=373, 1076×388, four columns.
- Fields: imported native product posts preserve source key/node, title, excerpt/description, technical data, CTA label/node, thumbnail attachment/source node, and replaceable CTA-arrow attachment `rudnikagro_product_list_item_cta_arrow_125_2895`.
- Variant rule: the section queries the real native listing relation ordered by menu order, renders four source-backed cards with exact source media annotations, and keeps taxonomy filtering native on `product_cat` routes. Missing native media or URLs remain explicit source gaps.

## Product list filters

- Route: `product-list` (`/produkty/`); source section: `product-list-filters` (`125:2986`), desktop frame width 1920px, x=241/y=674, 347×334.
- Shared shell: `partials/route-skeleton.php` renders the section in the existing `route-section-shell` used by `page-produkty.php` and `taxonomy-product_cat.php`.
- Scoped style: `src/css/components/_catalogues.scss`; the panel uses the established product-list grid and derives a stacked mobile placement at the existing `sm` breakpoint.
- Fields: native scoped options `emko_product_list_filters_{heading,strength_label,strength_unit,strength_min,strength_max,extension_label,extension_unit,extension_min,extension_max,button}_125_*` preserve source copy and editor overrides. The exact search arrow is imported idempotently from `assets/product-list-filters/search-arrow-125-3007.svg` into the replaceable native option `emko_product_list_filters_button_icon_125_3007`.
- Controls: two native range inputs and a GET submit button expose the source-backed `Siła` and `Wysuw` controls; `scripts/factory/project/qa-state.js` prepares requested values through those controls and only submits when the requested state asks for it.
- Variant rule: the canonical desktop state uses the source 0–500 ranges and initial handle value 260; mobile behavior is derived because the source section provides no mobile frame.

## Home FAQ

- Partial: `partials/route-skeleton.php` (`home-faq` route section)
- Shared style: `src/css/components/_home-faq.scss`
- Source section: `home-faq` (`125:1659`), canonical expanded-third-item variant.
- Fields: native option keys `emko_home_faq_heading_125_1659`, `emko_home_faq_item_1_question_125_1665`, `emko_home_faq_item_2_question_125_1666`, `emko_home_faq_item_3_question_125_1667`, `emko_home_faq_item_3_answer_125_1667`, and `emko_home_faq_item_4_question_125_1668` supply editable copy; source-value fallbacks preserve the frozen source when options are empty.
- Variant rule: reuse `faq-list` for the centered 880px four-row composition and keep item 3 open in the canonical home state. Native `<details>` controls provide the interactive closed/open states without a section-specific script.
- Source gap: arrow child nodes `125:1669`, `125:1672`, `125:1675`, and `125:1678` have no cached SVG export, so the fallback arrow character is explicitly marked `data-factory-source-gap="unresolved-arrow-export"` until the source asset is available.

## Site header

- Partial: `partials/header.php`
- Shared style: `src/css/layouts/_header.scss`
- Source section: `shared-header` (`125:3`), canonical two-tier variant.
- Fields: native RudnikAgro options/ACF fields provide the logo, tagline, phone, mobile, email, icon attachments, and primary navigation labels; a configured WordPress `header` menu supplies editable destinations when present.
- Variant rule: reuse `site-header` for the shared 79px dark utility band and 48px light primary navigation band. The frozen source has no destination data, so the label-only fallback remains explicitly unresolved until a native menu is configured.

## Site footer

- Partial: `partials/footer.php`
- Shared style: `src/css/layouts/_footer.scss`
- Source section: `shared-footer` (`125:1689`), canonical desktop contact-form footer.
- Fields: native RudnikAgro options/ACF fields provide office headings, contact copy, phone/email values, form labels, quick-link labels, legal labels, and copyright HTML. Phone/email/map/icon media are attachment-backed when their source-node fields are populated.
- Variant rule: reuse `site-footer` for the four-office/contact-form composition, with source-node annotations retained on populated images. Legal and quick-link destinations remain label-only because the frozen source exposes no destination URLs; missing footer media remains an explicit source gap until native attachments are available.
- Desktop probe at the source viewport (1920px): footer background `#29313c`, content x=240/width=1440, form x=968/width=712, first input y=146 relative to the footer, and source-backed geometry models the 1151px footer once the 327px map attachment is present. The current local database has no matching footer media attachment, so the live render is 772px and remains a needs-work media dependency.

## Home slider

- Partial: `partials/route-skeleton.php` (the established `route-section-shell` renders the assigned `home-slider` variant).
- Scoped style: `src/css/components/_home-slider.scss`.
- Interaction: `src/js/home-slider.js` keeps the native pagination state and `aria-selected` value synchronized.
- QA behavior: `scripts/factory/project/qa-state.js` clicks the real pagination control when a home route state supplies `slide` or `slideIndex`.
- Source section: `home-slider` (`125:18`), canonical active slide 1 of 2.
- Fields: native scoped options `emko_home_slider_heading_125_625`, `emko_home_slider_button_label_125_623`, `emko_home_slider_tab_1_label_125_616`, `emko_home_slider_tab_2_label_125_619`, plus attachment IDs for the sourced image/layer/arrow fields.
- Variant rule: reuse the shell for the full-width two-slide hero; controls are real buttons and source media remains attachment-backed with `data-factory-source-node` annotations.

## Home product categories

- Partial: `partials/route-skeleton.php` (the existing `route-section-shell` renders the static `home-product-categories` branch).
- Scoped style: `src/css/components/_home-product-categories.scss`, imported from `src/css/components/_index.scss`.
- Interaction: none; the source cluster is a static two-row category-card grid.
- Source section: `home-product-categories` (`50:3`), canonical 1440px content frame at desktop frame x=240/y=509 with height 334px.
- Fields: native source-backed text fields `emko_home_product_categories_item_1_label_125_1785` through `emko_home_product_categories_item_16_label_125_1802`, plus attachment-backed image fields for source nodes `125:1803`–`125:1820`. The reference uses the visible press media field `125:1819`; unused alternate media fields remain editable without being synthesized.
- Variant rule: render the 16 visible source labels and their exact source-node images in a responsive two-row grid; category URLs and taxonomy metadata remain explicit source gaps because the frozen source exposes none.
- Variant rule: the homepage route includes the section immediately after the slider. The immutable reference has 18 physical grid tracks: a blank top-row track at source node `125:1816` and a blank first track on the second row. The remaining 16 tracks render the native labels and exact attachment media in the frozen source order.

## Home popular products

- Partial: `partials/route-skeleton.php` (the established `route-section-shell` renders the assigned `home-popular-products` variant).
- Scoped style: `src/css/components/_home-slider.scss` (shared route-shell stylesheet; selectors are isolated under `.c-home-popular-products`).
- Interaction: `src/js/home-slider.js` keeps the seven native category buttons and `aria-selected` state synchronized.
- QA behavior: `scripts/factory/project/qa-state.js` clicks the real category button when a home route state supplies `popularCategory` or `category`.
- Source section: `home-popular-products` (`125:628`), canonical active category 3 (`125:642`) with the seven-category and four-card variants.
- Fields: native scoped options/ACF fields own the heading, intro, all-products label, seven category labels, four card titles/details, four product image IDs, and the category/all/card arrow attachment IDs. Source gaps remain explicit for product URLs, prices, SKUs, and native category taxonomy.
- Variant rule: reuse `route-section-shell` for the 1440px desktop category-nav/product-grid composition; attachment-backed images and SVGs carry their exact source-node annotations, and no demo product records are synthesized.

## Home intro

- Partial: `partials/route-skeleton.php` (the established `route-section-shell` renders the assigned `home-intro` variant).
- Scoped style: `src/css/components/_home-slider.scss` (selectors are isolated under `.c-home-intro`).
- Interaction: none; the source section is static and uses no active state.
- Source section: `home-intro` (`125:711`), canonical 1920×501 desktop section at frame y=1312.
- Fields: native scoped options `emko_home_intro_heading_125_1310` and `emko_home_intro_body_125_1309`, plus attachment IDs for `emko_home_intro_mask_125_714`, `emko_home_intro_decorative_left_125_716`, `emko_home_intro_decorative_right_125_1011`, `emko_home_intro_service_photo_125_1307`, and `emko_home_intro_service_photo_overlay_125_1308`.
- Variant rule: reuse the shell for the full-width service introduction; the 1440px content frame, 642px text column, 697×435 layered media, and source-node annotations are preserved without duplicating a page-specific partial.

## Home benefits

- Partial: `partials/route-skeleton.php` (the established `route-section-shell` renders the assigned `home-benefits` variant).
- Scoped style: `src/css/components/_home-slider.scss` (selectors are isolated under `.c-home-benefits`).
- Interaction: none; the source section is static.
- Source section: `home-benefits` (`125:1312`), canonical 1440×842 desktop section at frame x=240/y=1881.
- Fields: native scoped options own the heading, four metric values/prefixes/units/labels, body WYSIWYG, four metric-circle attachment IDs, and the decorative-layer attachment ID. Source SVGs retain their exact `data-factory-source-node` annotations when native media is populated.
- Variant rule: reuse `route-section-shell` for the fixed desktop metrics composition; responsive stacking is derived at smaller widths because no mobile Figma frame exists.

## Home blog

- Partial: `partials/blog-card.php`, rendered by the established `route-section-shell` branch in `partials/route-skeleton.php`.
- Scoped style: `src/css/components/_blog-card.scss` (`.c-home-blog` and `.c-blog-card--home` are the four-card home variant; the base card remains reusable by archive/related routes).
- Interaction: none; the “Wszystkie” control is a native link to the WordPress posts route.
- Source section: `home-blog` (`125:1630`), canonical 1440px content frame at desktop frame y=2758, with four 336.1765px cards and 31.7647px gaps.
- Fields: native scoped options own `emko_home_blog_heading_125_1652`, `emko_home_blog_intro_125_1653`, `emko_home_blog_all_label_125_1655`, and the arrow attachment; four owned native WordPress posts provide the source titles, excerpts, dates, featured images, and source order.
- Variant rule: reuse `blog-card-grid` with the source-backed four-column home variant. Imported posts and media are idempotent and preserve editor overrides; each rendered card image carries its exact Figma source-node annotation.

## Blog post related

- Route: `blog-post` (`/blog/wpis/`); source section: `blog-post-related` (`125:2245`).
- Partial: `partials/route-skeleton.php` renders the related-section shell and reuses `partials/blog-card.php` for the four native cards.
- Scoped style: `src/css/components/_blog-card.scss` (`.c-blog-related`, `.c-blog-grid--related`, and `.c-blog-card--related`).
- Fields: the existing scoped native importer maps the heading, all-posts label/arrow, and four source card title/excerpt/date/image records to editable options and owned WordPress posts with identities `blog-post-related-card-1` through `blog-post-related-card-4`.
- Source media: card nodes `125:2248`, `125:2253`, `125:2258`, `125:2263` and arrow node `125:2271`; rendered card images keep their exact `data-factory-source-node` annotations.
- Variant rule: reuse `blog-card-grid` and `route-section-shell` for the measured 1440px, four-column desktop composition; the related listing is native-content driven and responsive stacking is derived from existing breakpoints.

## Product archive category layout

- Template: `taxonomy-product_cat.php`; scoped style: `src/css/pages/_product-archive.scss`.
- Source sections: `archive-breadcrumbs`, `archive-category-introduction`, `archive-filters`, `archive-sort`, `archive-product-grid`, `archive-pagination`, and `archive-category-description`.
- Fields: product-category ACF WYSIWYG fields own introductory and description content; the RudnikAgro options group `rudnikagro_product_archive` owns sourced controls, filter labels/options, pagination labels, and the editable `pagination_next_icon` attachment ID.
- Variant rule: reuse only for native WooCommerce product-category archives that supply the same sidebar/grid composition; product cards remain native Woo records and are never duplicated into ACF.

## Page banner with breadcrumb

- Partial: `partials/page-banner.php`
- Shared style: `src/css/components/_page-banner.scss`
- Stable wrapper annotation: `data-factory-component="page-banner"`
- Source section: `careers-heading` (`349:1377`), with `careers-heading` retained as `data-factory-section`.
- Fields: existing native ACF group `rudnikagro_page_banner` — `title` (Text), `breadcrumb` (Text), `image` (Image ID); careers location is the **Baner** tab on the Kariera page.
- Variant rule: use only where the source is a rounded, image-backed page banner followed by a separate breadcrumb line. Supply route-specific native ACF title, breadcrumb, and image; do not assume this treatment for a route whose source differs.

### Blog variant

- Routes: `blog-archive` and `blog-article`.
- Source section: `blog-archive` (`125:1916`), with the archive heading configured from the native RudnikAgro options group.
- Fields: `rudnikagro_blog_archive_header` (`banner_label`, `breadcrumb`, `banner` image ID); the source banner media node is `327:3097` when populated.
- Variant rule: `blog-archive` keeps the source compact neutral heading treatment (breadcrumb above the centered H1) while preserving an editor-provided image override. The heading uses `data-factory-section="blog-archive-heading"`; the complete assigned listing uses `data-factory-section="blog-archive"` and keeps source-node annotations on every card image.
- Mapping: `partials/page-banner.php`, `partials/route-skeleton.php`, `partials/blog-card.php`, `src/css/components/_page-banner.scss`, `src/css/components/_blog-card.scss`, and `home.php`; `home.php` is also the native Blog archive page template and falls back to the editable posts-page title only when the scoped banner title is empty.

### Blog post article image crop

- Route: `blog-post`; source section: `blog-post-article` (`125:2243`) with image node `125:2244`.
- Fields: the source section exposes no text or native content fields. The route resolves the source-backed article attachment `125:2244`; on databases imported before that asset was registered it uses the byte-identical native related export `125:2258` without creating a new record.
- Variant rule: `article-image-crop` keeps the source 712×487 frame and renders the 761×526 source image at `(-29,-14)` inside the cropped wrapper. The image is source-tagged as `125:2244` for the article section.
- Mapping: `partials/route-skeleton.php`, `single.php`, and `src/css/components/_page-banner.scss`.

### Contact variant

- Route: `contact`; source section: `contact-heading` (`335:702`).
- Fields: the Kontakt page's `rudnikagro_contact_heading` group provides `title` (Text), `breadcrumb` (Text), and `image` (Image ID).
- Mapping: `partials/page-banner.php`, `src/css/components/_page-banner.scss`, and `template-contact.php`. The wrapper retains `data-factory-section="contact-heading"` and the partial supplies `data-factory-component="page-banner"`.

### Contact overview form

- Route: `contact` (`/kontakt/`); source section: `contact-overview` (`125:2356`), desktop frame 713×387 at the Figma frame placement x=968/y=271.
- Partial: `partials/route-skeleton.php` renders the complete form inside the reusable `route-section-shell`; no new PHP partial or JavaScript is required.
- Fields: the section reads the native source-backed options `emko_contact_overview_name_placeholder_125_2358`, `emko_contact_overview_company_placeholder_125_2363`, `emko_contact_overview_email_placeholder_125_2365`, `emko_contact_overview_phone_placeholder_125_2367`, `emko_contact_overview_message_placeholder_125_2361`, `emko_contact_overview_privacy_consent_125_2369`, `emko_contact_overview_email_usage_note_125_2368`, and `emko_contact_overview_submit_label_125_2372`. The submit arrow resolves from attachment option `emko_contact_overview_submit_arrow_125_2373` and retains source node `125:2373`.
- Variant rule: the form uses real native text, email, telephone, textarea, checkbox, and submit controls. Desktop geometry follows the existing grid (`gc-7/13`); mobile collapses fields to one column as derived responsive QA because the source record has no mobile frame.
- Mapping: `partials/route-skeleton.php`, `src/css/components/_page-banner.scss`, `scripts/factory/project/import-content.php`, and this document. The route preserves unassigned `contact-form` and `contact-background` placeholders for their later section owners.

### About variant

- Route: `about`; source section: `about-heading` (`326:2977`).
- Fields: the O nas page's `rudnikagro_about_banner` group provides `title` (Text), `breadcrumb` (Text), and `image` (Image ID).
- Mapping: `partials/page-banner.php`, `src/css/components/_page-banner.scss`, and `page-about.php`. The route retains `data-factory-section="about-heading"`; the partial supplies `data-factory-component="page-banner"`.

## About hero

- Route: `about` (`/o-nas/`); source section: `about-hero` (`125:3738`), desktop frame 1920×678 at the route content start.
- Partial: `partials/route-skeleton.php` renders the complete assigned section inside the existing `route-section-shell`; no new partial is required for this static decorative composition.
- Fields: native scoped options `emko_about_hero_background_125_3739`, `emko_about_hero_pattern_a_125_3741`, `emko_about_hero_pattern_b_125_4036` (image IDs), and `emko_about_hero_body_125_4334` (textarea). Existing editor values remain authoritative.
- Source media: background node `125:3739` fills the 1920×678 clipped section; decorative pattern nodes `125:3741` and `125:4036` retain their exact source annotations and source rotations/placements. Copy node `125:4334` is rendered at the source desktop text position (x=1083, y=240 in the canonical frame).
- Scoped style: `src/css/components/_page-banner.scss` under `.c-about-hero`; responsive behavior is derived at the existing lg/md/xs breakpoints because no mobile Figma frame exists.
- Variant rule: the section is static and has no QA state or JavaScript. The immutable `about-hero` record exposes only the four fields above. Its reference also visibly contains title node `125:4331`, CTA node `125:4336`, and the overlapping image node `125:4346`; none has a field or import mapping in this component's source record. They remain an explicit source/import scope gap rather than being synthesized from the reference.

## About overview

- Route: `about` (`/o-nas/`); source section: `about-overview` (`125:4344`), rendered by the existing `route-section-shell` branch in `partials/route-skeleton.php`.
- Scoped style: `src/css/components/_about-overview.scss`, forwarded from `src/css/components/_index.scss`; no JavaScript or QA state is required.
- Fields: native options `emko_about_overview_body_125_4335`, `emko_about_overview_background_125_4345`, and `emko_about_overview_image_125_4346` preserve the source copy/media and editor overrides. The two image fields are attachment-backed and rendered with `data-factory-source-node` annotations.
- Variant rule: the section keeps the source 712×461 nested image crop as the media slot. Its desktop outer image (`125:4345`) is clipped at -29,-27 with 878×607 geometry, while the inner image (`125:4346`) is positioned at -76,9 with 823×491 geometry. Below the existing md breakpoint, the same source media derives a contained responsive crop. The source-backed overview copy remains in the route shell's responsive layout. The full-frame heading node `125:4332` and CTA frame `125:4340` have no editable source records in this capsule and remain explicit source gaps.

## About values

- Route: `about` (`/o-nas/`); source section: `about-values` (`125:4351`), desktop frame 1920×501.
- Partial: `partials/route-skeleton.php` renders the complete static section inside the existing `route-section-shell`; no new partial or JavaScript is required.
- Scoped style: `src/css/components/_about-values.scss`, forwarded from `src/css/components/_index.scss`.
- Fields: native scoped options `emko_about_values_body_125_5052`, `emko_about_values_image_125_4947`, `emko_about_values_pattern_a_125_4356`, `emko_about_values_pattern_b_125_4651`, and `emko_about_values_pattern_mask_125_4354`; the section media importer is idempotent and preserves editor overrides.
- Source media: image node `125:4947` is rendered at x=246/y=32 as 700×435 with cover behavior; decorative pattern nodes `125:4356` and `125:4651` retain their source rotations and exact source annotations. The mask attachment remains a replaceable native field for the source mask group.
- Variant rule: the body field is rendered in the source 597px text column at x=1083/y=1807 relative to the canonical route frame. Responsive behavior derives at the existing lg/md breakpoints because no mobile Figma frame is available.

## Service overview

- Route: `service` (`/serwis/`); source section: `service-overview` (`132:63`), with breadcrumb node `132:154` and title node `132:52`.
- Partial: `partials/section-image.php`, rendered by the `service-overview` branch in `partials/route-skeleton.php`; the route uses `partials/page-banner.php` in breadcrumb-only service mode.
- Fields: native option `emko_service_overview_body_132_65` supplies the source body copy; the title and image resolve through `emko_service_overview_heading_132_52` and `emko_service_overview_image_132_64` when populated, with source-node attachment lookup retained for the image.
- Source media: image node `132:64` is rendered as an 800×553 source crop in a 712×553 overflow slot, translated 63px left and source-tagged inside `data-factory-section="service-overview"`.
- Mapping: `page-serwis.php`, `partials/page-banner.php`, `partials/route-skeleton.php`, `partials/section-image.php`, and `src/css/components/_page-banner.scss`. The section has no interactive state, so `scripts/factory/project/qa-state.js` remains unchanged.

## Service contact

- Route: `service` (`/serwis/`); source section: `service-contact` (`132:60`).
- Partial: `partials/catalogue-card.php`, rendered by the `service-contact` branch in `partials/route-skeleton.php`; the route shell remains `partials/route-skeleton.php`.
- Fields: native option image fields `emko_service_contact_image_base_132_61` and `emko_service_contact_image_overlay_132_62`, both returning attachment IDs and preserving editor overrides.
- Source media: base node `132:61` is rendered at 878×607 with centered cover crop in the 712×474 clipped section; overlay node `132:62` is rendered at 837×523, translated to x=-72/y=-12 relative to the section. Both images retain their exact `data-factory-source-node` annotations.
- Variant rule: the catalogue card partial exposes only the reusable layered-media wrapper for this image-only section; no catalogue title, download control, text, icon, or interactive state is synthesized because the source contains none.

## Service media band

- Route: `service` (`/serwis/`); source section: `service-media-band` (`132:66`).
- Partial: `partials/route-skeleton.php` renders the full-width media band inside the established `route-section-shell`; no new partial is required because the section is a native media-only variant.
- Fields: native option image fields `emko_service_media_band_image_132_69` and `emko_service_media_band_mask_132_67`, both returning attachment IDs and preserving editor overrides.
- Source media: image node `132:69` is rendered with its exact source annotation at the desktop source placement (`x=-38`, `y=-594`, `2427×1360`, `0.2` opacity) over the `#29313c` background node `132:68`; mask node `132:67` is applied as the replaceable CSS mask asset.
- The frozen section record exposes no text/button content fields, although the immutable section reference contains the CTA copy; editable native option override points are reserved as `emko_service_media_band_heading_132_66`, `emko_service_media_band_button_label_132_66`, and `emko_service_media_band_button_url_132_66`, with the reference copy retained as the explicit source-backed fallback and missing source-node/destination gaps annotated in the markup.
- Variant rule: the section is static and has no interactive QA state; responsive layouts derive from the source aspect and existing breakpoints.

## About media band

- Route: `about` (`/o-nas/`); source section: `about-media-band` (`125:4964`), desktop frame 1920×373 at y=2526.
- Partial: `partials/route-skeleton.php` renders the complete full-width band inside the established `route-section-shell`; no new partial or JavaScript is required.
- Fields: native option `emko_about_media_band_body_125_4963` supplies the exact source textarea and is retained as `data-factory-source-copy`; image and mask options are resolved through `emko_about_media_band_image_125_4967` and `emko_about_media_band_mask_125_4966` when present, with source-node attachment lookup retained as the native-media fallback. The immutable section reference is media-only; the source text node is recorded outside the section bounds, so it is not painted inside this band.
- Source media: mask node `125:4966` is rendered at x=-32/y=-13 with 2062×406 geometry and image node `125:4967` at x=-38/y=-594 with 2427×1360 geometry and 0.2 opacity. Both retain their source annotations; missing native attachments remain explicit `data-factory-source-gap` markers.
- Variant rule: the section is static and has no interactive QA state. Responsive behavior derives from the existing lg and xs breakpoints because no mobile Figma frame is available.

## Shop CTA

- Partial: `partials/shop-cta.php`
- Shared style: `src/css/pages/_catalogues.scss`
- Stable wrapper annotation: `data-factory-component="shop-cta"`
- Source section: `shared-shop-cta`; catalogue visual variant is supplied by its native `rudnikagro_catalogues_shop_cta` group.
- Fields: `heading` and `button_label` Text fields in the page's CTA sklepu tab.
- Variant rule: reuse the composition only where the source shows the broad rounded green shop prompt; supply page-specific source-backed content and use the native WooCommerce shop permalink as the local destination.

### About variant

- Route: `about`; source section: `shared-shop-cta`.
- Fields: `rudnikagro_about_shop_cta.heading` and `.button_label` in the native O nas CTA sklepu tab.
- Mapping: `partials/shop-cta.php`, `src/css/pages/_catalogues.scss`, and `page-about.php`; the partial retains the stable `data-factory-component="shop-cta"` annotation.

## Product gallery and tabs

- Template: `single-product.php`
- Scoped style and behavior: `src/css/pages/_product.scss`, `src/js/product.js`
- Stable wrapper annotations: `data-factory-component="product-gallery"` and `data-factory-component="product-tabs"`
- Source sections: `product-gallery`/`bundle-gallery` and `product-tabs`/`bundle-tabs`.
- Fields: the native product ACF group `group_rudnikagro_product` supplies gallery, benefits, technical data, source tab labels, product content, notices, downloads and inquiry labels. Native WooCommerce continues to own the product post, price, SKU, cart and reviews.
- Variant rule: the same single-product template serves default, expanded-description, inquiry, reviews, files and bundle states. `scripts/factory/project/qa-state.js` drives the real tab/dialog state for capture; it does not alter markup for screenshots.

## Product detail

- Route: `product` (`/produkt/`); source section: `product-detail` (`125:3211`).
- Shell: `single-product.php` passes the section to `partials/route-skeleton.php`; the section reuses the existing product-list category-menu classes for the source sidebar.
- Native content: `emko_product_detail_title_125_3430`, `emko_product_detail_breadcrumb_home_125_3202`, `emko_product_detail_breadcrumb_category_125_3203`, `emko_product_detail_breadcrumb_current_125_3204`, `emko_product_detail_image_125_3212`, `emko_product_detail_description_125_3431`, `emko_product_detail_contact_label_125_3437`, `emko_product_detail_download_label_125_3433`, `emko_product_detail_benefits_heading_125_3439`, and `emko_product_detail_features_125_3440` are imported idempotently as owned native options and preserve editor overrides. The title, breadcrumb, and visible control copy use the exact frozen source text; the image and PDF icon attachments are exact frozen assets annotated with their source nodes.
- Scoped style: `src/css/components/_catalogues.scss`; desktop geometry uses the existing 1440px container and source-backed 346px / 467px / 469px columns. The route shell remains `data-factory-component="route-section-shell"`; the exact Figma media frame is the `data-factory-section="product-detail"` wrapper so component measurement targets node `125:3211` (469×297 at desktop). Commerce controls remain explicit native gaps because their source nodes are not editable records in this capsule.
- Variant rule: no new interactive state is required; responsive stacking derives from the existing lg/md/xs breakpoints.

## Native checkout

- Template: `woocommerce/checkout/form-checkout.php`; native order data remains WooCommerce-owned.
- Scoped style: `src/css/pages/_checkout.scss`; stable wrapper: `data-factory-component="checkout-template"`.
- Source sections: `checkout-heading`, `checkout-steps`, `checkout-customer-details`, `checkout-payment`, `checkout-delivery`, and `checkout-totals`.
- ACF location: RudnikAgro options page, **Zamówienie** tab, imported from frozen source by the project importer. Text fields: heading, three step numbers/labels, customer heading/type/required/shipping labels, payment and delivery headings, coupon and total labels, and place-order label. Field labels for native WooCommerce billing fields are sourced as `rudnikagro_checkout_customer_details_<source-node>`.
- Icon fields: `rudnikagro_checkout_icon_{payment_card,google_pay,apple_pay,blik,bank_transfer,payment_radio,payment_radio_active,delivery_radio,delivery_radio_active}` are File fields returning attachment IDs; each maps to the matching exported Figma asset and is editable through ACF.
- Variant rule: source labels and assets are editable, but the billing fields, coupon, totals, shipping selection, payment selection, and submit operation retain native WooCommerce semantics. No provider-specific gateway is created without real configuration.

## Contact form map

- Route: `contact` (`/kontakt/`); source section: `contact-form` (`125:2374`), rendered by the `contact-form` branch in `partials/route-skeleton.php`.
- Shared shell: the existing `route-section-shell`; no new partial or JavaScript is required because the source is a static map with positioned markers.
- Fields: native ACF image field `rudnikagro_contact_map_image` owns the map raster. The exact marker SVG is imported idempotently as native media and referenced by the contact page's `rudnikagro_contact_map_marker` metadata because the source exposes no marker ACF fields.
- Source media: map node `125:2374` is rendered as a centered cover crop in a 1440×327 section; marker node `125:2375` is reused for source nodes `125:2378`, `125:2381`, and `125:2384`, with source positions preserved and each rendered image annotated with its exact node identity.
- Variant rule: the desktop section follows the source frame at x=240/y=722; mobile behavior derives from the existing xl/sm breakpoints because no mobile Figma node is present. The source provides no live Google Maps URL or API configuration, so the raster map remains the explicit source-backed media gap for live integration.

## Contact background

- Route: `contact` (`/kontakt/`); source section: `contact-background` (`125:2328`).
- Shared shell: the existing `route-section-shell` branch in `partials/route-skeleton.php`, emitted by `page-kontakt.php`.
- Fields/assets: none; the source node is an empty solid-fill band, so no ACF field or media attachment is required.
- Scoped style: `src/css/components/_catalogues.scss`; desktop geometry is 1920×197 at the end of the contact frame with exact fill `#29313c`. Mobile height derives from the existing `sm` breakpoint because no mobile Figma node exists.

## Catalogues primary

- Route: `catalogues`; source section: `catalogues-primary` (`125:2505`).
- Shell: `page-katalogi.php` passes the editable banner group to `partials/route-skeleton.php`; the registered `catalogues-primary` section owns the banner fragment and its four source cards.
- Partial: `partials/catalogue-card.php`; scoped style: `src/css/components/_catalogues.scss`.
- Fields: the existing `rudnikagro_catalogues` repeater owns each card title, cover, PDF label, and optional PDF; the shared `rudnikagro_catalogues_download_icon` image field owns the exact source download icon.
- Source media: four cover attachments are imported idempotently from `assets/catalogues-primary/`; each rendered image keeps its exact Figma `data-factory-source-node` annotation. Download URLs remain an explicit gap because the source provides none.
- Variant rule: the primary section renders the four source cards at the 1440px desktop content width; smaller layouts derive from the shared responsive breakpoints because no mobile Figma frame exists.

## Catalogues secondary

- Route: `catalogues`; source section: `catalogues-secondary` (`125:2540`).
- Shell: `page-katalogi.php` passes the section to the established `route-section-shell` in `partials/route-skeleton.php`, which also derives native pagination when additional catalogue records exist.
- Partial: `partials/catalogue-card.php`; scoped style: `src/css/components/_catalogues.scss`.
- Fields: source titles and download labels use the native scoped options `rudnikagro_catalogues_secondary_card_{1..4}_{title|download_label}`; source media uses native attachment options for the shared background, four covers, fourth-card overlay, and shared PDF icon. These fields preserve editor overrides and are imported idempotently from the frozen section assets.
- Source media: background node `125:2542`, cover nodes `125:2544`, `125:2548`, `125:2552`, `125:2556`, overlay node `125:2574`, and download icon node `125:2563`; every rendered image keeps its exact `data-factory-source-node` annotation. The source provides no download URLs, so controls remain explicit `missing-download-url` gaps.
- Variant rule: the secondary section reuses the accepted four-card catalogue geometry, adds the source-observed fourth-card layered cover, and derives smaller layouts from the shared responsive breakpoints because no mobile Figma frame exists.

## Product gallery

- Route: `product` (`/produkt/`); source section: `product-gallery` (`125:3213`).
- Shared shell: `single-product.php` passes the section to the established `route-section-shell` in `partials/route-skeleton.php`; the outer section owns the registered `product-gallery` annotation and its two image children.
- Fields: the two native option image fields `emko_product_gallery_image_1_125_3214` and `emko_product_gallery_image_2_125_3216` return attachment IDs and preserve editor overrides through the idempotent importer.
- Source media: nodes `125:3214` and `125:3216` are imported from `assets/product-gallery/gallery-image-125-3214.png` and `assets/product-gallery/gallery-image-125-3216.png`; each rendered image keeps its exact source-node and source-asset annotations.
- Geometry: the section reuses the product detail container columns and places a two-column gallery in the right media column at the source 1920px frame width; the desktop item size is 228.586×138.996px with an 11.828px gap. Smaller layouts derive from the existing project breakpoints because no mobile Figma frame is present.

## Product specification

- Route: `product` (`/produkt/`); source section: `product-specification` (`125:3320` tabs, `125:3411` table header).
- Shell: `single-product.php` passes the section after the native product gallery; `partials/route-skeleton.php` renders it as its own registered section, preserving the route shell and right-column desktop alignment.
- Fields: native options `emko_product_specification_tabs_125_3321`, `emko_product_specification_table_header_125_3420`, and `emko_product_specification_row_{1..8}_125_342{1..8}` supply editable tab labels, header cells, and eight source-backed rows; no new ACF fields were added.
- Behavior: the three tab controls use the existing `src/js/product.js` behavior through the `.c-product` wrapper. Only the source-exposed table panel is populated; the other source tabs remain explicit `source-panel-not-exposed` gaps.
- Scoped style: `src/css/components/_product-specification.scss`; desktop geometry is 1076×429px at the source frame's right-column x=604 position, with the existing md/xs breakpoints deriving the responsive table overflow behavior.

## Product related

- Route: `product` (`/produkt/`); source section: `product-related` (`125:3270`).
- Shared shell: `single-product.php` passes the section to `partials/route-skeleton.php`; the section uses the native WooCommerce upsell relation for its live card list and falls back to the five source-owned related products only when the relation is unavailable.
- Native content: the existing scoped importer owns the related product posts, titles, excerpts, thumbnails, heading, all-products label/icon, and card arrow media. No new ACF fields were added. Editor overrides are preserved by the importer’s owned-value checks.
- Source media: card images keep their exact `data-factory-source-node` and `data-factory-source-asset` annotations; the shared card arrow is the exact SVG export for node `130:14`, repeated across all five native product links.
- Scoped style: `src/css/components/_catalogues.scss`; desktop geometry is 1440×376 at the source frame’s x=240 position, with a 54px header and five source cards in the 322px content band. Smaller layouts derive from the existing md/xs breakpoints because no mobile Figma frame is present.

## Product contact CTA

- Route: `product` (`/produkt/`); source section: `product-contact-cta` (`125:3323`), rendered after `product-related` and before the shared footer.
- Shared shell: `single-product.php` passes the CTA after `product-related`; `partials/route-skeleton.php` keeps the full-width section independent from the 1440px content container used by the related products.
- Fields: native option fields `emko_product_contact_cta_background_125_3326`, `emko_product_contact_cta_arrow_125_3409`, `emko_product_contact_cta_heading_125_3327`, and `emko_product_contact_cta_button_label_125_3408` supply the editable background, exact arrow SVG, two-line heading, and button label.
- Source media: the background image is annotated as node `125:3326` and the button arrow as node `125:3409`; missing native attachments remain explicit source gaps. The button destination is the native `/kontakt/` page route because the source record exposes no URL.
- Scoped style: `src/css/components/_product-contact-cta.scss`; desktop geometry is full viewport width 1920×373 with a 20%-opacity cover image, centered 32px/48px Inter heading, and 165×42px accent button. Smaller layouts derive from the existing sm/xs breakpoints.
