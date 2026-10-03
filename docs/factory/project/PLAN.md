# EMKO source inventory and implementation handoff

Status: partial global inventory ready for section extraction. No WordPress implementation was changed in this inventory session.

## Source snapshot

- Figma file: `XBiSgFXDfm5YsZSm4lWBUq` (`EMKO.PL`)
- PAGE: `0:1` / `Page 1`
- Source canvas inspected: `50:2` / `Subpages`
- Top-level production frames: 9
- Source width: 1920 px for every discovered frame
- Language: `pl`
- Mobile Figma frames: none; mobile remains derived responsive QA
- Full references: `.factory-cache/figma/latest/references/full/`
- Provenance: every PNG has a matching `.source.json` sidecar with source node identity and SHA-256
- Section inventory: 28 ordered proposed section IDs are recorded in the authoritative manifest; only the six home-section records are detailed at this stage and the remaining 22 are explicit inventory stubs for later extraction.

## Routes and frame identities

The authoritative route/frame inventory is `.factory-cache/figma/latest/manifest.json`. It records exact frame dimensions, source reference, language, build group, and ordered proposed section IDs.

| Route | Source frame | Size | Build group |
| --- | --- | ---: | --- |
| `/` | `50:3` Strona główna | 1920×4949 | `home` |
| `/blog/` | `51:1825` Blog | 1920×3020 | `blog` |
| `/katalogi/` | `61:275` Katalogi | 1920×2277 | `catalogues` |
| `/blog/wpis/` | `51:3889` Blog_wpis | 1920×2973 | `blog-post` |
| `/serwis/` | `68:2` Serwis | 1920×2945 | `service` |
| `/o-nas/` | `89:2` O nas | 1920×4069 | `about` |
| `/kontakt/` | `57:2` Kontakt | 1920×1764 | `contact` |
| `/produkty/` | `64:2` Lista produktow | 1920×2811 | `product-archive` |
| `/produkt/` | `73:2` Opis produktu | 1920×3167 | `product` |

All nine top-level frames are classified as `production`. No separate top-level state frame was present. Nested interactive evidence includes the home slider, product menu, product filters and product gallery; those states must be implemented and verified during their build-group sessions.

## Design system handoff

The compact source-backed tokens are in `.factory-cache/figma/latest/design-system.json`. The primary findings are:

- Inter is the observed type family, with weights 100, 300, 400, 500, 600 and 700 in the shared Header, Slider, product and Footer contexts.
- Core colors are ink `#29313c`, light surface `#f3f3f3`, accent `#fc0144`, border `#e5e7eb`, muted `#6b7280` and light muted `#9ca3af`.
- The common desktop content band is 1440 px wide at x=240 within the 1920 px frame.
- The shared Header is 128 px high: utility band 79 px and primary navigation band 48 px. The shared Footer is 1151 px high in the observed routes.
- Per-section text runs, fills, effects, crop rules and downloadable layer assets remain intentionally deferred; do not treat this global inventory as a visual implementation pass.

## Reuse decisions

`.factory-cache/figma/latest/components.json` maps source components to proposed local paths. Existing theme candidates include:

- `partials/header.php` and `partials/footer.php` for shared chrome.
- `partials/page-banner.php` for breadcrumb/banner composition.
- `partials/section-image.php` for image-and-content sections where the HTML shape matches.
- Existing grid/container/spacing utilities in `src/css/layouts/`, `src/css/abstracts/` and `src/css/utils/`.
- Existing Swiper/AOS/vanilla JavaScript setup in `src/js/_app.js` and `src/js/lib/`.

Do not add new utility systems, breakpoints or duplicate partials before the relevant section extraction confirms they are necessary. Do not edit `dist/`.

## Next sequential work

1. Extract shared Header/Footer/Breadcrumb records once, including exact geometry per route and all source-backed layer assets.
2. Extract each build group’s ordered section records from the proposed route section IDs, preserving actual node identity and full-frame-relative geometry.
3. Capture exact text/style runs and native editable content destinations; keep missing external URLs/files explicit.
4. Import sourced commerce content only after reading `docs/factory/COMMERCE_AND_ICONS.md` for the commerce-owned sections.
5. Implement each route with existing PHP/SCSS/vanilla JS patterns, then build with Webpack and perform fresh frame-width visual QA.

The snapshot remains partial until section records, content mappings and asset exports are complete. This session deliberately does not claim section or visual PASS.
