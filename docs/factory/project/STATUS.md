# RudnikAgro implementation status

## Home build — 2026-09-13

- Knowledge accordion icon structure: `open_icon` and `closed_icon` are ACF Image fields returning SVG attachment IDs, nested under `rudnikagro_home_knowledge.items` on the front page's **Wiedza** tab. They map respectively to Figma nodes `164:205` and `164:208`; the importer writes only an empty source-owned field, preserving an editor override.
- Home merchandising now uses three source-ordered ACF product relationships: `rudnikagro_home_promoted_products`, `rudnikagro_home_bundle_products` and `rudnikagro_home_recommended_products`. The importer creates the displayed promotion/recommendation cards as native WooCommerce products, retains explicit Figma prices and thumbnails, and preserves later editor changes. The package remains one native product and is intentionally repeated for the four identical source cards.
- The source-price parser now retains grouped thousands before the decimal separator. The refreshed read-only probe verifies the promotion sale prices `1380.00`, `1390.00`, `1290.00` and `1545.00`, matching their respective captured Figma strings.
- Fresh page-only QA has healthy section geometry. Its 11.529% page mismatch is explicitly deferred to the final audit by `comparison.progress.deferred: true` after three changed captures; it is not a visual PASS.

- Added the native static-front-page template `front-page.php`, one scoped page stylesheet `src/css/pages/_home.scss`, and the tabbed local ACF group `group_rudnikagro_home`. Page copy and meaningful crop/benefit/catalogue SVGs are stored as editable native fields or attachment IDs; homepage cards query native WooCommerce products and blog cards query source-ordered native posts.
- Extended the idempotent project importer to hydrate the front-page fields only once and preserve later editor changes. It imports the source hero, benefits, crop selector, product-section labels, catalogue media, company content, blog labels, lower knowledge content and SVG attachments from the frozen snapshot.
- `visual-1789300699627` is the current desktop page-only comparison. It improved the page-owner difference to **25.638%** (from 99.635% before a front-page template), and the hero, benefits and crop-selector geometries now pass. It is not accepted and `comparison.progress.deferred` is false: promotions, bundles, recommended, blog and knowledge geometry remain for correction. Header/footer findings remain for their separate final shared audit.
- Native read-only check currently finds 22 published products, but no imported WooCommerce review comments (only WordPress's default comment). This remains a commerce migration defect to resolve with the source-review importer; no review fixture was created.
- The home-about attachment still resolves to `assets/home/140-292-image2.png` instead of the source-recorded `assets/home/130-140-rectangle41.png`; this wrong source/crop remains a measured defect and must be corrected before accepting the page.
- Continuation correction: the local importer now maps the home-about image to source asset `130-140-rectangle41.png` (media ID 214) and exposes the exact accordion state SVGs through ACF IDs 215/216. Final page-only QA at `visual-1789310913281` reduced the home page-owner mismatch to **13.124%** and fixed blog/recommended geometry, but has not passed or deferred: source-specific product-card composition and remaining internal typography/crop work still dominate. Promotions and bundles retain a 4.40625px height delta; extending their height to force a geometry match shifted every downstream section by 8.8px (`visual-1789310746555`), so that regression was removed.
- Commerce clarification: the current native probe `COMMERCE_PROBE.json` confirms the source-tagged Woo review, category hierarchy and native/proportional variations; the earlier no-review declaration above is historical and resolved. Homepage product cards still require explicit source-backed native relationships instead of their current generic product query.

## Product archive build — 2026-09-13

- Added native WooCommerce taxonomy template `taxonomy-product_cat.php`, with source-ordered cards, category hierarchy, editable archive UI fields, and derived responsive layout in `src/css/pages/_product-archive.scss`.
- Reconciled the current native-content contract: 18 source-backed archive products, the source-tagged Woo review, three native Aquatos size variations with explicit/proportional price provenance, the parent/child product category relation, and the archive pagination SVG attachment-ID field are present. A repeat importer run reports zero mutations.
- Recovered the visible node `303:1276` copy from its preserved exact 1× source reference and imported it into the editable category-description WYSIWYG field with editor-override protection; the collapsed source fade and expand control are implemented in the archive page assets.
- Fresh page-only capture `visual-1789295057176` keeps the filter rail at its source 2227px geometry; its visual mismatch is 31.936%. The description crop still contains the shared footer inside the 2242px overflowing source node, while the native document flow renders that footer after the node. This is a retained source-coordinate conflict, not a header/footer change or a visual pass.
- The idempotent importer now owns the 18 exact source card titles, prices, media and order; it preserves later title, thumbnail and price edits, retains the native parent/child category, and imports the exact pagination SVG as editable ACF media ID 142. The read-only probe also confirms native Aquatos review 2 and its real 1 L/5 L/20 L variations with explicit/proportional provenance.
- Scoped page-only QA is not accepted: `visual-1789294203652` reports 31.636% page mismatch and a 104px archive-filters height delta. The dominant outstanding visible mismatch is the deliberately empty source-unextractable WYSIWYG description/introduction; see source clarification 24. Responsive health passes at all derived widths.

## Cart state repair — 2026-09-13

- The project-owned Woo cart page now migrates the untracked setup-wizard block to the native `[woocommerce_cart]` shortcode once, records that imported baseline, and preserves subsequent editor content changes. The cart uses the source-backed PLN formatting settings with the same manual-override rule.
- The real `qa-state.prepare` flow now waits for the selected native 5 L variation, adds it through the actual WooCommerce form, applies the source coupon, and consumes only the transient success notice on a following native cart request. The cart-template coupon total now uses the current WooCommerce `get_coupon_discount_totals()` API, eliminating the prior fatal error.
- Prepared-state evidence records a healthy page (no critical error or horizontal overflow), exact source values and geometry within the configured 4px tolerance: `cart-heading` 240/264/467/68, `cart-lines` 240/362/953/242 and `cart-totals` 240/362/1440/473. See `.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/059-build-cart/cart-prepared.metrics.json`.
- The fresh host `--page-only` comparison remains unusable for acceptance: `visual.js` invokes `qa-state.prepare` only when the frozen route has `state`, whereas the assigned `cart` route has none. It therefore captures a deliberate anonymous empty cart and reports missing `cart-heading`/`cart-lines`. This is a host state-invocation defect, not missing source data or a visual deferral.

## Cart continuation update — 2026-09-13

- Added the native WooCommerce cart template and its dedicated cart page stylesheet. The source title and labels are ACF Options fields; the exact cart-removal SVG is an ACF attachment-ID field.
- The importer owns the source-backed local cart state only: Aquatos 5 L image/variation, BLACKFRIDAY 50 zł coupon and 22,90 zł shipping method. The related Stomp card products now have native media attachments derived from the frozen product-related source crop with recorded provenance.
- Fresh page-only QA remains `needs_work` at 20.491%. The host only invokes `qa-state.prepare` for manifest routes with `state`; cart is state-less, so it captures an anonymous empty cart and cannot measure the three cart sections. This is not a visual pass or deferral.

## Cart final continuation — 2026-09-13

- The current host invokes the project-owned `qa-state.prepare` hook for canonical cart routes. Its real browser flow selects the native Aquatos 5 L variation, adds it, and applies the sourced BLACKFRIDAY code without submitting an order or payment.
- The importer now resolves the exact field record when multiple cart labels share Figma node `486:52`; the native options retain `Produkty`, `Wysyłka`, and `Rabat` without overwriting editor changes. The read-only commerce probe confirms the native variable product, source/proportional variation provenance, native review, category hierarchy, and editable cart-remove SVG attachment.
- Fresh page-only capture `visual-1789279245819` has healthy geometry and derived responsive renders. Its 6.393% page-owner mismatch is below the approved 13% churn ceiling, but three changed captures improved only 0.142pp; `comparison.progress.deferred` is therefore true. The route is explicitly deferred to the final visual audit, not claimed as a visual pass. Header/footer differences remain shared final-audit ownership.

## Product state verification and commerce reconciliation — 2026-09-12

- The product template now keeps WooCommerce's global product context, so the two imported source-card products are rendered by the native related-products loop. The expanded-description state has its own source wrapper and preserves the corrected source body bounds; the reviews panel uses its measured 446px source height.
- Fresh page-only QA has healthy page geometry for both assigned states. `product-expanded` is 8.921% and `product-files-state` is 8.664%; each is now explicitly `DEFERRED TO FINAL` under the configured three-sample visual-churn rule. `product-expanded` retains the shared `product-tabs` geometry finding; gallery/tabs findings remain separate final-audit work.
- The source rich-text importer now preserves the frozen 700-weight Figma runs in the expanded description while updating only the known legacy import baseline, so later editor content remains protected. A no-op rerun of the project-owned importer confirmed idempotency (`options`, `attachments`, `pages`, `posts`, and `menus` all 0). The fresh read-only probe confirms variable Aquatos product 54; native 1 L/5 L/20 L variations 118/119/120 and their explicit/proportional provenance; card products 121/122; source review comment 2; category 16 under 19; favorite SVG media 123; and intentionally empty download SVG field because the exact source export remains unavailable.

## Product native-content migration — 2026-09-12

- Aquatos now has source-backed 1 L, 5 L and 20 L WooCommerce variations (explicit 5 L pricing plus authorized proportional provenance), a source-tagged native WooCommerce review, the product category hierarchy, and the two related-card products. `COMMERCE_IMPORT.md` records record/media IDs and override behavior. The cached exact favorite SVG is an attachment-ID ACF field; the product download-icon source group has no retained SVG export and remains an explicit final issue rather than a CSS substitute.
- Fresh canonical product QA (`visual-1789243051718`) has healthy page geometry and page-owner acceptance; it is `DEFERRED TO FINAL` under the three-sample visual-churn rule. Shared product-gallery/product-tabs mismatches remain final-audit work. `COMMERCE_PROBE.json` retains the read-only native-record evidence.

## About build — implementation

- Added the native O nas ACF tabs for banner, introduction, agricultural supply, grain trade, insurance and shop CTA, all populated idempotently from frozen source records and exact source assets.
- Reused `page-banner` and `shop-cta`; `page-about.php` adds source-owned content-card markup only, with `src/css/pages/_about.scss` as the dedicated page stylesheet.
- The exact about CTA labels are captured in `SOURCE_CLARIFICATIONS.md` because its legacy shared record represents the careers variant. Its local destination remains the native WooCommerce shop permalink.
- `npm.cmd run build` succeeds with the existing webpack size warnings. Fresh scoped page-only QA `visual-1789221449708` is runtime-healthy and confirms corrected page geometry plus healthy derived responsive renders. Its 9.831% page-owner mismatch is `DEFERRED TO FINAL`: the three latest distinct samples were 12.389%, 10.107% and 9.831%, improving only 2.558pp under the configured 3pp churn threshold. No visual PASS is claimed. Remaining page diagnostics are introduction (19.655%), insurance (14.974%), supply (10.321%) and grain (9.052%); confirmed photo interiors account for 111,810 differing pixels and require final audit rather than blind raster tuning. The `shared-shop-cta` geometry mismatch remains deferred to the later shared audit.

## Contact build — deferred to final audit

- The Kontakt route now renders its source-owned banner/breadcrumb through the reusable `page-banner` component, source-editable contact-card stack, native CF7 presentation and sourced map image.
- Added ACF Local JSON group `group_rudnikagro_contact` and importer coverage for the Kontakt page, map attachment and project-owned CF7 form. The importer does not overwrite populated editor fields.
- The CF7 recipient and privacy-policy destination are intentionally blank because neither is present in the frozen source; no form submission was performed.
- The prior fresh page-only comparison was 92.953% because all four page-owned sections were absent. After assigning the native template, all Contact section geometry and runtime checks pass.
- Final scoped page-only QA is `DEFERRED TO FINAL`: page mismatch 10.081% (target 8.5%). The three distinct implementation samples were 10.242%, 10.242% and 10.081%, an improvement of 0.161pp under the 3pp churn threshold. No PASS is claimed; the remaining Contact card typography/icon fidelity belongs to the final audit.

## Blog verification update — 2026-09-12

- `npm.cmd run build` completed successfully; only the existing Webpack asset-size warnings remain.
- Article content now restores the source-visible list markers/indentation and green emphasis paragraph. Fresh page-only QA is runtime-healthy but remains at 11.705% page mismatch and has a 45px full-frame height difference. The frozen article footer geometry is inconsistent with its 4010px reference frame, so no artificial height spacer was added; this needs final audit.
- Archive fresh page-only QA remains 7.585% page mismatch. It met the configured visual-churn stop condition (three captures at or below 13%, best-to-worst improvement 1.649pp) and is DEFERRED TO FINAL, never passed.

## Blog build — needs correction

- Added native Blog archive and single templates, source-editable Blog ACF tabs, and an idempotent importer for the twelve sourced cards, article header, hero, date and related cards.
- The archive reuses the documented `page-banner` component. Its source geometry now matches exactly and derived responsive renders are healthy; latest page-owner visual mismatch is 7.585%, above the approved 5.0% threshold.
- The project-owned article post (route metadata `blog-article` and Figma provenance) was confirmed to retain the importer baseline. The importer now repairs its deterministic Windows-1252/UTF-8 mojibake only when the body still matches a known source baseline, then records `_rudnikagro_source_content_hash`; subsequent editor changes are preserved.
- The article heading, body and related-post section geometry now matches the frozen source within the 2px tolerance. Latest page-owner mismatch is 11.706%, above the approved 5.0% threshold. The full frame still reports a footer geometry conflict because the frozen article footer record is positioned at y=8363 while the source frame height is 4010; this is retained for shared/final audit.

## Foundation/shared

- Project ACF Local JSON provides source-editable topbar, dual navigation and footer tabs.
- Shared header/footer are rendered from ACF fields and native WordPress menus; the header is sticky.
- DM Sans 400 and 700 are bundled locally. The 1440px, 12-column, 20px-gutter desktop foundation and existing responsive breakpoints are used.
- `scripts/factory/project/import-content.php` is idempotent, snapshot-only and adds RudnikAgro source provenance to owned records.

## Verification — 2026-09-11

- WooCommerce is active, the `slawinsky-boilerplate` theme is active, and ACF loaded `group_rudnikagro_global`.
- The importer is populated and idempotent on rerun; the local front page is ID 62 and native posts page is ID 63.
- `npm.cmd run build` completed successfully (three standard asset-size warnings only).
- Local PHP lint passed for the shared helpers, header, footer and importer. `https://autopilot.local` returned HTTP 200 with the shared header, sourced topbar and footer content, without a visible PHP error marker.

## Current configuration gaps

See `SOURCE_CLARIFICATIONS.md` for the source-backed gaps: CF7 recipient/form configuration, legal/download destinations, WooCommerce pricing/stock/tax/SKU/product data, payment and shipping settings, and missing mobile source.

## Checkout state variants — 2026-09-13

- Empty anonymous checkout now exposes the source-backed native account-entry state: WordPress login, guest checkout continuation, and a WooCommerce registration form. The source registration panel is imported as the editable `rudnikagro_account_registration_dialog_background` SVG attachment field; no guessed close icon was added because the targeted Figma dialog export has no separate close-control node.
- `qa-state.prepare` prepares login/registration through the real empty-cart checkout flow and opens registration with the rendered control; it never creates an account, submits an order, sends email, or attempts payment.
- The current page-only registration check `visual-1789291626866` is runtime-healthy with no non-pixel errors and is explicitly DEFERRED TO FINAL at 10.223%. Its three distinct implementation samples (11.452%, 10.223%, 10.223%) meet the approved churn rule; the fresh geometry report retains only the checkout-heading and shared-footer findings for the final audit. `checkout-login` remains separately deferred at 9.550%; neither state is claimed as a visual PASS.
- `order-confirmed` remains `requires_source_input`: a real approved existing local WooCommerce order identity/access key was not supplied. The route-specific declaration is `063-build-checkout/order-confirmed.source-dependency.json`; no fixture order was created.

## Checkout — 2026-09-13

- The project-owned native checkout renders through the classic WooCommerce shortcode with sourced ACF option labels, native billing/shipping/coupon/totals behavior, and exact checkout control assets as editable attachment-ID fields.
- Page-only QA passes: `visual-1789281083498` records 3.560% owned-page mismatch with no page geometry or runtime errors. Header/footer remain shared final-audit ownership.
- The read-only probe confirms the native Aquatos variations and price provenance, source card media, category parentage, review comment, and nine checkout icon attachments. The unconfigured provider methods remain a real source dependency in `checkout.source-dependency.json`.
- Checkout migration reconciliation was rerun idempotently in the local site (`options`, `attachments`, `pages`, `posts`, and `menus` all `0`). The fresh checkout-group probe records each checkout ACF icon field with its media attachment ID and retains the native source review; the only intentionally empty product icon field is `download_icon`, for which the frozen source has no exact SVG export.

## Product continuation update — 2026-09-12

- Fresh scoped verification retained the expanded state at 8.751% page-owner mismatch (`visual-1789228631768`); its 331px source-content height deficit remains deferred to the final audit under the churn policy. The former missing-review declaration is superseded: Aquatos review comment `2` is now a source-tagged native WooCommerce review (node `425:645`, rating 5, source date `30 lipca 2026`), verified by the current checkout commerce probe.
- The files-tab source boundary now maps to the active tabs-content wrapper, preserving the source panel geometry and the following related/notices flow. Fresh page-only QA `visual-1789228249992` is runtime-healthy and is `DEFERRED TO FINAL` at 8.527% page-owner mismatch under the configured visual-churn rule; no visual PASS is claimed. Shared product-gallery mismatch is deferred to the shared final audit.
- The expanded-description state remains deferred at its best measured 8.751% (`visual-1789227849568`); the final line-height/margin trial regressed to 9.660%, so it was reverted and no further page churn was performed.
- `product-reviews-state` no longer requires a fabricated review or a source-input declaration: the displayed source review is imported natively with provenance. Any remaining review-state visual difference is implementation/final-audit work, not missing business data.

## Product build — deferred to final audit

- Added the native WooCommerce single-product template and product ACF Local JSON group for gallery, benefits, technical data, source tabs/content, notices, downloads and inquiry labels. The idempotent snapshot importer publishes only the two RudnikAgro-owned source products and imports their source image assets and editable fields without overwriting populated editor values.
- Default Aquatos route page geometry and derived responsive runtime checks pass. Fresh page-only capture `visual-1789222699090` has a 5.753% page-owner mismatch; the last three distinct implementations range from 5.626% to 5.877%, an improvement of 0.250pp. It therefore records `DEFERRED TO FINAL` under the approved churn rule, rather than claiming a visual pass.
- Shared product-gallery and product-tabs owners remain final-audit work (17.311% and 12.945% in that capture). Source record `product-related` supplies two related product names/prices but no corresponding frozen media asset; no substitute product imagery was invented. The product files label has no supplied file/destination and the inquiry source has no CF7 recipient/form configuration.
- `scripts/factory/project/qa-state.js` implements real product-state preparation for expanded description, inquiry dialog, reviews, downloads and the native bundle route.
- State verification is incomplete: `visual-1789222939012` confirms expanded-description interaction works but is 9.648% page mismatch with expanded/related/notices geometry differences; `visual-1789222788735` captures the real inquiry dialog but is 30.953% page mismatch. Reviews, downloads and bundle still require scoped capture and correction.
- Product continuation verification: inquiry is page-pass at 6.011% after aligning its tabs/related/notices flow (`visual-1789226054477`). The best expanded-description capture is `visual-1789226218651` (8.751%): its source content bounds match in x/y/width, while its height is 331px short; the next line-height trial regressed, so this state is deferred under the visual-churn rule. The historical reviews capture at 6.908% predated the native review import and is not a missing-data blocker; a later final audit must assess the current review rendering. Downloads remains 8.606% with an unresolved product-files section geometry difference (`visual-1789226618688`); its visible label is retained and its external file destination remains an explicit source configuration gap.
- The native bundle template now uses source-backed package rows, area labels and corrected WooCommerce package pricing. `visual-1789224876928` records a 6.076% page-owner mismatch with healthy derived responsive captures; remaining gallery/tabs differences are shared final-audit work.
- The source inquiry is now an in-page native CF7 panel rather than a modal overlay. Its panel geometry is exact at 467×702 (`visual-1789225429323`), and its page-owner mismatch is 5.962%; the remaining inquiry overview/related placement is deferred final-audit geometry work.

## Careers build — in progress

- The native careers page uses its scoped ACF tabs for banner, vacancies, application form and CTA; the first source vacancy is expanded and the remaining five are semantic disclosure controls.
- The project-owned CF7 application form uses source labels, file upload and consents without a configured external recipient or privacy-policy destination.
- The formerly page-specific careers banner and breadcrumb are now the reusable `page-banner` partial and shared component style, recorded in `REUSABLE_COMPONENTS.md`; its existing native ACF group remains unchanged.
- Current page-only visual QA is page-ready: careers ownership is 4.977% against the approved 5.0% threshold. Header (5.849%), footer (5.859%) and `shared-shop-cta` (6.144%) remain shared-owner findings for the final shared audit.
- The final scoped desktop capture aligns all measured shared, banner, vacancies, application, CTA and footer geometry exactly. Derived 1440/1280/1024/768/390/375px renders are healthy. The latest scoped comparison improved to 5.063%, but remains above the 1% gate; visual QA has not passed.

## Catalogues build — in progress

- Added the native Katalogi ACF group with editable banner, two source-backed catalogue rows and shop CTA content. Its importer is idempotent and does not populate the uncaptured PDF or online-reader destination fields.
- Reused the confirmed `page-banner` partial and extracted a shared shop CTA partial. The catalogue card backgrounds and covers are imported from their frozen source assets.
- Page-only visual QA now passes the assigned `/katalogi/` route at the approved 5.0% page-owner threshold. Its 1440/1280/1024/768/390/375px derived renders are healthy. Header (5.871%) remains a shared-owner finding, and the catalogue frame maps the CTA/footer to careers-sized shared source records; both are deferred to the final shared audit.

## Home active-navigation continuation — deferred to final audit

- The active Home primary navigation is a real keyboard-dismissable menu state prepared by `qa-state.js`, with source-backed ACF labels and exact SVG attachment-ID fields. Its desktop outer group geometry aligns to the source 1440×417 bounds and every derived responsive render is healthy.
- Fresh scoped page-only QA `visual-1789317757086` records a 12.047% page-owner difference. `comparison.progress.deferred` is true after three changed captures (12.488%, 12.071%, 12.047%; 0.441pp improvement), so remaining visual work is explicitly deferred under the approved churn policy. The header owner improved to 5.200% and remains for final shared review.
- The canonical Home QA `visual-1789317854832` is also runtime-healthy at every configured derived width. Its 11.513% page-owner difference is explicitly deferred (`comparison.progress.deferred: true`) after three changed captures; remaining Home content and the footer are final-audit work, not a visual pass.

## Account build — 2026-09-13

- `/moje-konto/` now uses project-owned native WooCommerce login and registration forms. The initial source state contains the two source-backed panels; the registration disclosure exposes a real nonce-protected WooCommerce form without creating an account during QA.
- Account labels, breadcrumb entries and registration benefits are editable ACF Options fields in `group_rudnikagro_account.json`. The importer maps each field to frozen `account-*` source content and retains the normal project-owned editor-override guard.
- Fresh page-only QA `visual-1789318653655` passes the page acceptance scope. Desktop geometry for `account-breadcrumbs`, `account-login` and `account-registration` is exact; all derived responsive captures are healthy. The measured page-owner difference is 4.871% and is explicitly DEFERRED TO FINAL because the three changed captures improved only 0.756pp under the approved churn rule. Header difference (6.358%) remains shared final-audit ownership.
