# AURA — Implementation Plan

## 1. Project foundation

1. Align LocalWP development URL and theme identity with `factory/project.json` without restructuring Factory.
2. Add local Cormorant Garamond 500/600 and Manrope 400/500/600 font files from the official source.
3. Map Figma tokens into the existing SCSS abstracts layer; use fixed typography and existing breakpoints.
4. Extend the existing container/grid rather than replace the boilerplate utility system.

## 2. Global components

1. Header, navigation and accessible mobile drawer.
2. Announcement/topbar using existing ACF capability.
3. Footer and newsletter.
4. Buttons/forms/inputs.
5. WooCommerce product card, badges, gallery, add-to-cart and cart drawer.
6. Search overlay and filters.

## 3. Content model and importer

1. Add project ACF Local JSON groups described in `ACF_PLAN.md`.
2. Download and catalogue exact Figma assets.
3. Implement the idempotent WP-CLI importer.
4. Import pages/options/products/posts/media/menus and verify values.

## 4. Pages

Implementation order follows Figma and the project brief:

1. Homepage.
2. Shop archive.
3. Product detail.
4. About.
5. Checkout.
6. Ecommerce utilities/account/cart/search/filter states.
7. Blog listing and post.

Desktop 1440 is implemented first, then the supplied 390 mobile frames. Intermediate widths use existing breakpoints at 1200, 992, 768, 576 and 480 unless a component needs a narrowly scoped transition to preserve the Figma geometry.

## 5. Interaction

- Swiper 11 for product/review/gallery carousels where overflow is required.
- Existing AOS with subtle reveals only.
- Lenis initialized globally with `prefers-reduced-motion` opt-out and anchor/menu/modal compatibility.
- Shared accessible drawers/accordions; Escape, focus restore and visible focus are mandatory.
- WooCommerce events remain the source of cart/product state.

## 6. QA loop

1. `npm.cmd run factory:validate`.
2. PHP lint, JS syntax checks and JSON validation.
3. `npm.cmd run build`.
4. Screenshots at 1440×reference height and 390×reference height for every main frame.
5. Compare section starts/heights, container widths, wrapping, crops, color, radius and type.
6. Correct material differences and repeat screenshots.
7. Functional checks: navigation, menu, search, product query, add-to-cart, drawer, checkout, account, blog links, forms, Swiper, AOS, Lenis, console and PHP logs.

