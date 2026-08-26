# AURA — Design Audit

Audit date: 2026-08-26  
Figma file: `66uFGBjIWeTAWe5wsssrFG`  
Source: `factory/project.json` and Figma MCP/Plugin API.

## Discovery method

The file-level `get_metadata(fileKey)` response is incomplete for this document and exposes only the first page. The authoritative page inventory was therefore read through a read-only `figma.root.children` Plugin API call. Every returned PAGE was then inspected by its explicit node ID, and every production frame was passed through `get_design_context`.

No writes were made to Figma.

## Pages and principal frames

| Page | Purpose | Principal frames |
|---|---|---|
| `0:1` 00 — Research | competitor research and chosen art direction | `4:2` Research / Competitor Matrix — 1800×4000 |
| `3:60` 01 — Foundations | design tokens and type system | `3:69` Foundations / Documentation — 1440×3000 |
| `3:61` 02 — Components | reusable components and variants | component canvas; see `COMPONENT_MAP.md` |
| `3:62` 03 - Homepage | homepage | `5:2` desktop 1440×7139; `6:182` mobile 390×5461 |
| `3:63` 04 — Shop | product archive | `8:2` desktop 1440×3272; `8:380` mobile 390×2966 |
| `3:64` 05 — Product | product detail | `9:2` desktop 1440×4418; `10:126` mobile 390×3889 |
| `3:65` 06 — About | brand page | `12:2` desktop 1440×4139; `12:102` mobile 390×3938 |
| `3:66` 07 — Checkout | checkout | `13:2` desktop 1440×1960; `13:115` mobile 390×2565 |
| `3:67` 08 — Ecommerce Utilities | WooCommerce states and drawers | Cart 1320×620; Search 900×430; Login 600×570; Register 600×650; Forgot password 600×430; Thank You 900×600; My Account 1100×600; Cart Drawer 420×720; Mobile Menu 390×690; Mobile Filters 390×690; Empty/Error 830×520 |
| `3:68` 09 — Prototype | primary ecommerce flow and behavior notes | `14:706` 2400×900 |
| `35:352` 10 — Blog | listing and article | listing desktop 1440×2785, mobile 390×4815; post desktop 1440×4051, mobile 390×4055 |

Reference QA widths are therefore **1440 px desktop** and **390 px mobile**. Ecommerce utility frames keep their own listed widths.

## Art direction and foundations

Chosen direction: **Chromatic Ritual / Editorial Scent Lab**.

### Color tokens

| Semantic role | Value | Primitive |
|---|---:|---|
| background primary | `#F5F1EA` | Alabaster/100 |
| background secondary | `#E8E0D4` | Sand/200 |
| surface | `#FFFDF8` | Alabaster/50 |
| text primary / ink | `#191713` | Ink/900 |
| text secondary | `#6D655B` | Taupe/600 |
| brand primary / oxblood | `#641B33` | Oxblood/700 |
| brand secondary / moss | `#52604A` | Moss/600 |
| accent / acid | `#D8F04D` | Acid/400 |
| border | `#CDC3B5` | Sand/300 |
| success | `#286148` | Green/700 |
| error | `#B9353B` | Red/600 |
| on-brand | `#FFFFFF` | White |

### Typography

No fluid `clamp()` typography is permitted. The Figma text styles are:

| Style | Family / weight | Size | Line height | Letter spacing |
|---|---|---:|---:|---:|
| Display XL | Cormorant Garamond 500 | 80 px | 84 px | -2.2 px |
| H1 | Cormorant Garamond 500 | 64 px | 68 px | -1.6 px |
| H2 | Cormorant Garamond 500 | 48 px | 54 px | -1 px |
| H3 | Cormorant Garamond 600 | 34 px | 40 px | -0.5 px |
| H4 | Manrope 600 | 22 px | 30 px | -0.2 px |
| Body Large | Manrope 400 | 18 px | 30 px | 0 |
| Body | Manrope 400 | 16 px | 26 px | 0 |
| Small | Manrope 400 | 14 px | 22 px | 0 |
| Label | Manrope 600 | 13 px | 18 px | 0.8 px |
| Button | Manrope 600 | 14 px | 18 px | 0.5 px |
| Caption | Manrope 500 | 12 px | 18 px | 0.2 px |

Mobile frames use explicit smaller sizes (commonly 44/48 px headings, 39/41 px section headings, 14–16 px body/labels). They will be implemented with classic breakpoints, not fluid type.

### Spacing and radius

Figma spacing variables: `4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120` px.

Figma radius variables:

- none: 0
- sm: 4 px
- md: 8 px
- lg: 16 px
- xl: 24 px
- pill: 999 px

### Shadows

- Soft: `0 12px 32px rgba(26, 23, 18, 0.10)`
- Drawer: `-8px 0 36px rgba(26, 23, 18, 0.16)`

## Layout and grid

- Desktop canvas: 1440 px.
- Main desktop content: 1312 px, with 64 px side margins.
- Product rows: four 304 px cards with 24 px gaps (1288 px row inside the content area).
- Mobile canvas: 390 px.
- Main mobile content: 350 px, with 20 px side margins.
- Full-bleed editorial sections split 650/790, 720/720, 760/680 depending on the section.
- Desktop header: 84 px; announcement bar: 36 px.
- Mobile header: 64 px; announcement bars vary between 24 and 34 px.
- Existing boilerplate grid remains available, but its 1870 px baseline does not reproduce AURA at 1440. The implementation will extend the existing container with an AURA modifier and use component-local grid only where exact card geometry requires it.

## Page section order

### Homepage

Desktop: announcement → header → hero → bestsellers → brand statement → scent collections → editorial lifestyle → category split → USP → scent finder → featured product → brand story → reviews → newsletter → footer.

Mobile: announcement → header → hero image/copy → bestsellers → brand statement → collections → editorial visual → reviews → newsletter → footer. Desktop-only sections absent from the mobile composition are not forced into the mobile frame.

### Shop

Header → archive intro → category tabs → filter/sort bar → product grid → load more → starter set promo → SEO content → footer. Mobile uses two-column cards, filter/sort drawer triggers and shortened copy.

### Product

Header → product gallery/add-to-cart → scent story and note cards → product facts → story split → care/accordions → reviews → related products → footer. Mobile adds a sticky add-to-cart bar.

### About

Header → hero → manifesto → origin split → process cards → editorial image split → values → shop CTA → footer.

### Checkout

Secure checkout header → progress → contact/address/shipping/payment → consent → order summary/payment CTA → footer. Mobile collapses the order summary behind a disclosure.

### Blog listing

Header → intro → category filters → featured article → article grid → pagination → newsletter → footer.

### Blog post

Announcement/header → breadcrumb/meta/title/hero → article content with quote/list/image/recommendation/author/share → related posts → newsletter → footer.

## Components and states

The file defines primary/secondary button default and hover states; sale/bestseller/new/sold-out badges; product card default/sale/sold-out; input default/focus/error/disabled; accordion closed/open; checkbox and radio states; filter and tab states; desktop/mobile headers and footers; product gallery; add-to-cart; cart drawer; search overlay; newsletter; collection, USP and review cards.

## Images and icons

The production frames expose exact raster assets for product photography, editorial photography, blog imagery and author imagery. Vector exports cover small decorative dividers, arrows, radio indicators and USP marks. These assets are downloaded as source files and then imported into WordPress; content-bound imagery is rendered through attachment IDs/ACF or native WooCommerce featured images, not hardcoded upload URLs.

## Responsive and motion behavior

- Mobile layout is defined explicitly at 390 px and takes precedence over inferred behavior.
- Prototype notes specify 150–250 ms motion for product hover, navigation underline, drawer slide, accordion, sticky header and subtle reveal.
- Touch targets are at least 44 px, focus must remain visible, errors need text plus color, and no action may be hover-only.
- Primary ecommerce journey: discovery → shop → PDP → add/cart drawer → checkout → confirmation.

