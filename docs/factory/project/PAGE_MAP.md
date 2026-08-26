# AURA — Page Map

| Figma frame | WordPress / WooCommerce target | Content source |
|---|---|---|
| Homepage desktop/mobile | `front-page.php` | ACF homepage group + native WooCommerce product queries |
| Shop desktop/mobile | `woocommerce/archive-product.php` and archive hooks/partials | native WooCommerce products/categories/prices/images + ACF archive copy/query presentation |
| Product desktop/mobile | `woocommerce/single-product.php` and product partials | native WooCommerce product data + product ACF scent/editorial fields |
| About desktop/mobile | `template-about.php` | ACF About page group |
| Checkout desktop/mobile | WooCommerce checkout templates/hooks | native checkout fields, shipping, payment, cart and totals; surrounding project copy through ACF/options or translatable Woo strings |
| Cart / drawer / empty cart | WooCommerce cart templates + shared drawer partial | native cart data |
| Search overlay | shared header/search partial | native WordPress/WooCommerce product search |
| Login / Register / Forgot password | WooCommerce My Account templates | native WooCommerce account forms/messages |
| Thank You | WooCommerce order received template/hooks | native order data + options copy where project-specific |
| My Account | WooCommerce account templates | native account/order/address data |
| Mobile Menu Drawer | `partials/menu-mobile.php` extended | WordPress menus + global options |
| Mobile Filters Drawer | shop filter partial | WooCommerce taxonomies/attributes/query |
| Blog Listing desktop/mobile | `template-blog.php` / posts page | native posts, categories, dates, excerpts, featured images + ACF intro/featured settings |
| Blog Post desktop/mobile | `single.php` | native post title/content/date/category/author/featured image + optional ACF article modules |
| Research / Foundations / Components / Prototype | no public template | implementation reference only |

Language variants are handled through Polylang-managed pages/options/strings; no Figma copy is embedded as PHP fallback text.

