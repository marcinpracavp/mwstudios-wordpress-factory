# AURA — Component Map

Strategy order: REUSE → EXTEND → CREATE.

| Figma component/section | Decision | PHP/template target | SCSS | JS |
|---|---|---|---|---|
| Announcement Bar | EXTEND existing topbar ACF/runtime | existing global topbar renderer, moved toward shared behavior | existing `_topbar.scss` + AURA skin | shared dismiss logic |
| Header / Desktop | EXTEND | `partials/header.php` | `_header.scss` | existing headroom mechanism |
| Header / Mobile / drawer | EXTEND | `partials/menu-mobile.php` | `_menu-mobile.scss` | existing mobile menu module, accessibility fixes |
| Footer desktop/mobile | CREATE project markup while reusing menus/options | `partials/footer.php` | `_footer.scss` | none |
| Buttons and icon button | EXTEND base button | helper/semantic anchors/buttons | `_button.scss` | none |
| Inputs/select/checkbox/radio | EXTEND base form controls and Woo/CF7 markup | native forms | base input/select/label + project states | native validation; small shared helpers only |
| Product Badge | CREATE | `partials/aura/product-badge.php` | project component SCSS | none |
| Product Card | CREATE, sourced from WooCommerce | `woocommerce/content-product.php` | project component SCSS | quick add/cart update |
| Quantity Selector | CREATE around native Woo input | Woo quantity template/partial | project component SCSS | increment/decrement |
| Rating | REUSE Woo rating data, CREATE presentation | product/card partial | project component SCSS | none |
| Breadcrumb | REUSE Woo/WordPress hierarchy, CREATE presentation | shared partial/hook | project component SCSS | none |
| Accordion | EXTEND existing accordion | shared semantic partial | `_accordion.scss` | replace/extend shared accessible behavior |
| Collection Card | CREATE | shared ACF card partial | project component SCSS | none |
| USP Item | CREATE | shared ACF repeater partial | project component SCSS | none |
| Review Card | CREATE, data source varies | shared partial | project component SCSS | optional Swiper only where required |
| Newsletter | CREATE reusable CF7/ACF wrapper | shared partial | project component + `_wpcf7.scss` | CF7 only |
| Product Gallery | EXTEND Woo gallery data | product partial | project component SCSS | Swiper 11 shared initializer |
| Add To Cart Module | EXTEND Woo add-to-cart | product partial/hooks | project component SCSS | Woo events + sticky mobile sync |
| Cart Drawer | EXTEND existing modal idea, CREATE accessible Woo drawer | shared cart drawer partial | drawer component + Figma shadow | shared focus/escape/cart-fragment behavior |
| Search Overlay | CREATE | shared search partial | project component SCSS | accessible disclosure/dialog behavior |
| Tabs/filter states | CREATE presentation over native queries | shop partials | project component SCSS | URL/query and drawer state |
| Homepage image/copy splits | EXTEND `section-image.php` only where its contract fits; CREATE semantic project partial where ordering/behavior differs | `partials/aura/sections/*` | homepage SCSS | none unless slider |
| Bestsellers / related products | CREATE reusable query section using Woo card | `partials/aura/product-section.php` | product carousel/grid SCSS | existing Swiper 11 initializer |
| Blog cards | EXTEND existing `partials/blog-item.php` or replace demo markup with reusable project contract | blog partials | `_blog-item.scss` / blog layout | none |
| Promo popup | EXTEND existing ACF capability only if enabled content is imported | existing renderer after markup/JS separation | existing component SCSS | shared modal behavior |
| AOS reveals | REUSE existing AOS package/initializer | data attributes only where justified | reduced-motion override | existing AOS init |
| Lenis | CREATE project initialization because flag is enabled and dependency is absent | n/a | none | shared Lenis initializer with reduced motion/anchors |

The existing 12-column utility grid and spacing utilities remain available. AURA-specific 1312/350 px containers and card grids are focused extensions, not a replacement utility framework.

