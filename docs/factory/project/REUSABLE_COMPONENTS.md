# Reusable components

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
- Source sections: `blog-archive-heading` and `blog-article-heading`; both use the same 1440×150 rounded banner followed by a 70px breadcrumb line.
- Fields: archive header is editable on the RudnikAgro options page; article header is editable on the native post. Each supplies label, breadcrumb and image ID.
- Mapping: `partials/page-banner.php`, `src/css/components/_page-banner.scss`, with the route wrapper retaining the source `data-factory-section` and the stable `data-factory-component="page-banner"` annotation.

### Contact variant

- Route: `contact`; source section: `contact-heading` (`335:702`).
- Fields: the Kontakt page's `rudnikagro_contact_heading` group provides `title` (Text), `breadcrumb` (Text), and `image` (Image ID).
- Mapping: `partials/page-banner.php`, `src/css/components/_page-banner.scss`, and `template-contact.php`. The wrapper retains `data-factory-section="contact-heading"` and the partial supplies `data-factory-component="page-banner"`.

### About variant

- Route: `about`; source section: `about-heading` (`326:2977`).
- Fields: the O nas page's `rudnikagro_about_banner` group provides `title` (Text), `breadcrumb` (Text), and `image` (Image ID).
- Mapping: `partials/page-banner.php`, `src/css/components/_page-banner.scss`, and `page-about.php`. The route retains `data-factory-section="about-heading"`; the partial supplies `data-factory-component="page-banner"`.

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

## Native checkout

- Template: `woocommerce/checkout/form-checkout.php`; native order data remains WooCommerce-owned.
- Scoped style: `src/css/pages/_checkout.scss`; stable wrapper: `data-factory-component="checkout-template"`.
- Source sections: `checkout-heading`, `checkout-steps`, `checkout-customer-details`, `checkout-payment`, `checkout-delivery`, and `checkout-totals`.
- ACF location: RudnikAgro options page, **Zamówienie** tab, imported from frozen source by the project importer. Text fields: heading, three step numbers/labels, customer heading/type/required/shipping labels, payment and delivery headings, coupon and total labels, and place-order label. Field labels for native WooCommerce billing fields are sourced as `rudnikagro_checkout_customer_details_<source-node>`.
- Icon fields: `rudnikagro_checkout_icon_{payment_card,google_pay,apple_pay,blik,bank_transfer,payment_radio,payment_radio_active,delivery_radio,delivery_radio_active}` are File fields returning attachment IDs; each maps to the matching exported Figma asset and is editable through ACF.
- Variant rule: source labels and assets are editable, but the billing fields, coupon, totals, shipping selection, payment selection, and submit operation retain native WooCommerce semantics. No provider-specific gateway is created without real configuration.
