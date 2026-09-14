# Source clarifications and blocking evidence

Source file: OwiDXrKMVcaHKB9ryYF6mY, PAGE 0:1. Snapshot still partial; source reference PNG bytes are preserved.

0. About-page breadcrumb node 326:2765 exposes the labels `Strona główna / O nas`, but no Figma hyperlink/reaction establishes either destination. Preserve those sourced labels; bind any local routes only as an implementation decision, not as captured source link evidence.

0a. The exact green shop CTA visible in the frozen about full-frame reference (`frame-326-2764.png`) reads `Odkryj szeroki wybór produktów w naszym sklepie` / `Sprawdź ofertę`, but the legacy `shared-shop-cta` content record points to a different careers variant. The O nas ACF CTA fields preserve the visible about-frame strings; its local action uses the native WooCommerce shop permalink.

0b. Frozen about raster records conflict with their own source-context content records and the full-frame reference. The page-only QA capture `visual-1789208797419` shows `about-agricultural-supply-reference.png` rendering the grain-trade card, `about-grain-trade-reference.png` rendering the insurance card, and `about-insurance-reference.png` rendering the CTA/footer. The implemented source order follows the scoped section records and `references/full/frame-326-2764.png`; replacing it with the shifted raster slices would falsify native editable content. The frozen source bytes were not changed.
0c. A targeted Figma read was needed because the frozen About records omit the source photo crop transforms and child bounds. Node `519:348` is 588×395px at (240,917) and uses 136.59% × 113.92% media at left -18.3% / top -6.84%; node `519:350` is 588×450px at (1092,1545); node `521:434` is 588×534px at (240,2223) and uses 166.5% media at left -31.69%. Those crop facts are applied only to the desktop About card media; original source assets and frozen references remain unchanged.

1. Catalogue targets are absent. Nodes 349:1253, 349:1255, 431:933 and 431:938 have null hyperlinks and empty reactions. The local native attachment query for application/pdf returned []. Two real PDFs and their approved online-reader destinations remain required. A user clarification request was sent; no answer has been received in this worker.
2. The orchard card repeats the agricultural PDF label. This is actual Figma copy, not a transcription correction. Keep the original source text; obtain an approved change before changing visible content.
3. Resolved by the native-content migration: product review node 425:645 is imported as an explicitly source-tagged local WooCommerce review with its displayed five-star rating and date. Its Lorem ipsum body is retained as source copy and marked for editorial review; no author or verified-owner fact is invented.
4. Package-description node 592:1290 contains Spark Lorem ipsum. Approved product copy is missing.
5. Resolved for Aquatos: source size nodes 496:1781, 496:1787 and 496:1791 are native variations. The explicit 5 L price is retained and the 1 L/20 L prices use the authorized proportional source-price formula with provenance and editor-override protection. Source 586:1200 still does not establish complete native 4/10/12 ha package variation data.
6. Product file-tab source 586:805 includes the label Pobierz etykiete. An actual approved label document and its destination are not established.
6a. Product file-tab icon group 586:1022 is visible in the frozen source, but no exact SVG export is retained under `.factory-cache/figma/latest/assets`. The native `download_icon` ACF attachment-ID field is intentionally empty; a source SVG export is required before an editable icon can be rendered.
6b. Related-card text/price source nodes 326:2271/326:2272 and 326:2289/326:2290 are imported as native products, but the frozen asset cache provides no separable image bytes for either card. Their native featured-image fields remain empty rather than assigning a substitute.
7. Confirmation source 493:1251 explicitly says the order was placed and email sent, and names Przelewy24 and Shoper Przesylki Kurier. This is a completed-order state, not an editable review step. An approved existing native order, allowed state navigation and verified WooCommerce provider mapping have not been supplied or established. Do not manufacture the state.
8. No mobile frame was discovered among the 21 top-level frames. Mobile remains derived.
9. Geometry clarification: catalogue CTA vector 611:320 has local y=1196 but a vertically reflected transform. Its real production-frame top is y=966. Use absolute bounds relative to the production frame for transformed vectors, not uncorrected local x/y. Original full reference is unchanged.
10. Hero original image hash 401c80707ee6caba0e9ff5d58a8eebef1435d029 has source size 1448x720. MCP returned a matching-size image plus a 362x180 image. The smaller image is retained as additional source-returned evidence and must not replace the editable high-resolution image.
11. Font source identifies DM Sans with optical-size setting 14 and actual Regular/Bold styled runs. Font binaries and every other used weight still require source-backed capture. Do not use boilerplate Poppins/GeistMono as a visual substitute.

15. Catalogues page (frame 347:1120): Figma nodes 349:1253, 349:1255, 431:933 and 431:938 contain neither hyperlinks nor reactions. Both real PDF attachments and both approved online-reader URLs are required before those native actions can be configured. This does not block the captured presentation assets or labels.
16. Catalogues page node 349:1255 visibly repeats `Pobierz katalog rolniczy\nw formacie PDF` on the orchard card. It is source text and is preserved verbatim; the expected editorial correction is not inferred.

No approved corrections or additional source documents have been received. These entries record evidence and gaps; they do not invent replacement copy, links or commerce data.

<!-- factory-checkout-discovery -->
17. Checkout source node 492:994 visibly lists Przelewy24, card payment, Google Pay, Apple Pay, BLIK, traditional transfer and cash on delivery; node 492:995 lists Shoper Przesyłki Kurier. These are visual labels and marks only. Approved WooCommerce gateway credentials, provider setup, supported methods, shipping-zone/rate mapping, and any bank-selection behaviour have not been supplied. Do not create a payment attempt, payment success, or shipment from this source state.
18. The visible checkout totals and completed-order amounts (including BLACKFRIDAY, Aquatos 5L, 411,00 zł, 22,90 zł, 50 zł and 383,90 zł) are frozen design-state evidence. They require real product, coupon, shipping, tax and approved existing-order data before native rendering; no fixture or synthetic order is authorized.

12. Measured export discrepancy for frame 294:3: the REST export is 1920x5875 while the source frame is 1920x4919. Original export bytes and sidecar are retained. Targeted live source bounds were checked; findings: {"id":"294:3","width":1920,"height":4919,"clipsContent":false,"absoluteBoundingBox":{"x":4564,"y":-680,"width":1920,"height":4919},"absoluteRenderBounds":{"x":4564,"y":-680,"width":1920,"height":5874.9599609375},"overflowingChildren":[{"id":"303:1277","name":"tekst","visible":true,"y":3667,"height":2242,"box":{"x":5169,"y":2987,"width":1075,"height":2242},"renderBounds":{"x":5168.49609375,"y":2987,"width":1075.50390625,"height":2242}}]}

The product-archive route now references a separate lossless 1920x4919 frame-bounds crop. The 1920x5875 original export and its sidecar are untouched. This correction follows source geometry only; no implementation exists. Overflowing source child 303:1277 remains an explicit layout issue.

13. Careers application source (frame 349:1267, nodes 434:2/434:4/434:6/435:16/435:21/496:2068/496:2072) establishes the visible field labels, consent copy, CV-upload and send labels, but does not establish a Contact Form 7 form identity, recipient mailbox, file-upload retention policy or a destination for the privacy-policy text. These are downstream native-form configuration gaps. Do not fake a submission, email recipient or privacy URL.
14. Careers collapsed-vacancy node 355:1436 visibly says `Magazynier/aprzedawca - oddział Pyrzyce (aktualne)`. This is exact Figma source copy and has been preserved; it appears to contain an editorial typo and needs an approved correction before any text change.
15. Careers source images show correct Polish glyphs, while the frozen granular text extraction contains deterministic Windows-1252/UTF-8 mojibake (for example `GryfiÅ„ski`). The importer repairs only that reversible byte-encoding defect before writing source-owned native fields; snapshot bytes remain unchanged.

<!-- factory-blog-source-clarifications -->
## Blog discovery gaps

- The Figma archive and related-post cards expose the label “Czytaj całość” but no destination URLs. Bind to native WordPress post permalinks during implementation; do not claim those paths came from Figma.
- The source pagination shows pages 1–7 plus a next chevron, but it supplies no interaction/reaction or page destinations. Use native WordPress pagination behavior.
- Article breadcrumb and return-button destination URLs are absent from Figma. Use site-local archive hierarchy during implementation and mark it as an implementation decision.
- Mobile blog designs are absent; responsive behavior is derived, not a claimed Figma match.

<!-- factory-contact-source-clarifications -->
15. Contact frame `335:591` supplies the visual layout, labels and privacy notice, but no Contact Form 7 form identity, recipient mailbox or submission configuration. Do not simulate a submission or send email until these native settings are supplied.
16. Contact map node `431:924` has no Figma reaction or hyperlink. Preserve its sourced map image and request an approved destination only if an interactive map link is required.
17. Contact privacy-notice node `431:907` has no Figma reaction, hyperlink or styled text link. Preserve the visible text exactly; do not invent a Privacy Policy URL.
- Product source gaps: Figma supplies no destination URL/file bytes for “Pobierz etykietę”; configure the downloadable label in WooCommerce/ACF. The bundle contains source placeholder text “Spark Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.” and requires editorial replacement only when approved. Bundle variation SKUs, stock, tax configuration and 4/10 ha prices are not evidenced.

<!-- factory-product-archive-source-clarifications -->
20. Product archive frame `294:3` gives the 18 visible product names, prices, card media and UI labels, but no source evidence for SKU, stock, tax, product descriptions, purchasability, category/attribute assignments or filter-result relationships. Configure those through native WooCommerce data; do not fabricate them from the visual grid.
21. Category introduction text node `295:741` contains exact source `Lorem ipsum` copy. Preserve it verbatim in the discovered source record and obtain editorial approval before replacing it.
22. Product archive pagination shows pages 1–7 and a next chevron without source reactions or destination URLs. Use native WooCommerce pagination behavior as an implementation decision; it is not a captured Figma link.
23. There is no mobile product-archive frame. Responsive behavior is derived and must not be described as a Figma mobile match.
24. The frozen `content-map.json` has no string records for visible WYSIWYG nodes `295:741` (category introduction) or `303:1276` (category description), despite their rendered source references. Node `303:1276` is now transcribed verbatim from the retained exact 1× source crop (`references/full/frame-294-3-bounds.png`, x=605, y=3667) into the native category ACF WYSIWYG field, with source-owned update and editor-override protection. Node `295:741` remains a separate exact-source extraction gap.

<!-- factory-cart-configuration-gap -->
18. Cart source 438:151 visibly shows Aquatos 5L, coupon BLACKFRIDAY, shipping 22,90 zł, discount 50 zł and total 383,90 zł. Under the current native-content contract, the project-owned importer creates a local native `fixed_cart` 50 zł coupon and a local 22,90 zł flat-rate method only when absent, retaining source-node and tax-basis provenance. This is configuration for the captured local state, not a claim about production promotion rules.
19. Cart controls `Kontynuuj zakupy` and `Realizuj zamówienie` have no Figma hyperlink/reaction destination. Configure their native WooCommerce/archive/checkout behavior during implementation; do not invent an external URL.

<!-- factory-checkout-payment-configuration-gap -->
24. Checkout frame `489:483` visually supplies Przelewy24, card, Google Pay, Apple Pay, BLIK and cash-on-delivery choices, but no approved local WooCommerce provider credentials, supported-method mapping, bank-selection configuration or cash-on-delivery surcharge rule. The local source-backed manual-transfer gateway is retained; the remaining provider methods are recorded as `061-build-checkout/checkout.source-dependency.json` and are not fabricated.

<!-- factory-checkout-registration-close-control -->
25. Targeted Figma design context for dialog `496:1722` confirms the exported panel asset (`496:1723`) and all form controls, but exposes no separate node or export for the visible close glyph. The dialog retains keyboard Escape dismissal; no guessed replacement icon is added. A source-exported close control is required before it can be rendered as an editable SVG attachment.

## Account discovery gaps

## Blog discovery gaps

The blog archive and related-post cards contain no captured reactions or destinations. Their titles, dates, labels and media are imported exactly as supplied; local WordPress post permalinks are an implementation decision. Eleven visible card titles have no supplied article body, author, category or destination, so no such content is invented.

The archive source visibly supplies pagination labels 1–7 and a next-chevron, but only the twelve visible cards are supplied. The labels are rendered with native WordPress pagination markup; no unsupplied posts, article bodies, or results are created for later pages.

- Account frame `524:2` supplies visible breadcrumb, password-reset and registration labels but no Figma hyperlink or reaction for their destinations. Implementation may bind local WordPress/WooCommerce routes and native actions; those destinations are not captured Figma facts.
