# Native source content and reusable states

This contract applies to new Factory projects and the current run. The explicit
user policy in factory/autopilot.json supersedes older missing-data handoffs.

## One template, multiple states

Discovery groups frames by native entity/path, language, width and build group.
Record the canonical view, shared section identities, state-only sections and
per-state geometry. Tabs/popups on one product are states of one WooCommerce
product, not separate pages or duplicate products. Different products share the
template but retain their own native data and source differences.

The host creates .factory-cache/autopilot/state-plan.json from existing local
references. Reuse candidates require identical section IDs and exact cropped
source pixels. A canonical state is built first. Variant contexts carry only
changed sections plus the compact family mapping. Source ambiguity remains
visible; matching section names alone never proves equal designs.

After a canonical page passes, unchanged sections can reuse its measured result.
A current rendered crop must match the retained crop byte-for-byte, its source
crop must match, thresholds must match, geometry must pass, and historical evidence
must retain its hash. Changed content, CSS, source pixels or geometry invalidate
reuse. The host performs these cheap checks; workers inspect only changed/failing
regions. Raw full-frame captures remain diagnostic. Existing responsive health
checks remain; final independent audit reviews each unique template/state.

## WooCommerce records

Every distinct product shown in related/recommended cards or listing grids becomes
one native WooCommerce product, even if only title, image and price are available.
Import only those available fields. Do not invent descriptions, SKUs or stock.
Use source identity/provenance to deduplicate repeated cards and preserve native
links to those products. Link related products with native product IDs.

Import category parent/child hierarchy, visible attribute names/options, ordering,
and product-term relationships from Figma. Do not flatten a category tree or create
categories from arbitrary decorative headings. Reuse existing matching terms.

Create native variable products and variations when Figma shows purchasable sizes
such as 1 L / 10 L / 20 L. Every option must exist in WooCommerce attributes and
variations and be selected through the actual variation form. ACF is not a substitute
for native price, selected variation, cart identity or category relationships.

Use a displayed variant price whenever available. For missing prices the user
authorizes proportional calculation from a source-backed price and quantity:
price = base price * target quantity / base quantity. Normalize compatible units
(e.g. L and mL), retain the source base, formula and computed provenance, round at
WooCommerce currency precision, and preserve the source tax basis. Incompatible
units or a missing base price/quantity remain a concrete missing input. Never
label computed prices as captured Figma prices. Native prices stay manually editable.
Idempotent imports only update a source-owned value if it still equals the last
imported value; preserve editor overrides, including zero-valued prices.

Import the reviews actually displayed in Figma as native WooCommerce review
comments with the captured body, author, rating and date where available. This is
now authorized; absence of existing native comments is an implementation task.
Do not invent additional reviews to match an aggregate count, infer missing rating,
or set verified-owner flags without a real purchase. Store Figma provenance on
imported review comments and preserve editorial changes. Source placeholder body
may be retained with a note for editorial review. Default system metadata must
not be claimed as source facts. Do not publish outside the authorized local site.

## Editable SVG icons

Discover every meaningful icon, including controls, benefits, metadata, categories,
tabs, cards and dialogs. Export the exact Figma icon node as SVG once and cache its
original file and provenance. Do not substitute emoji, guessed CSS shapes, font
glyphs or generic icon libraries for missing exports. Reuse one media attachment
for repeated icons. Keep original viewBox, fills, strokes and aspect ratio.

Each icon must be replaceable through an ACF file/image field returning attachment
ID (SVG allowed), grouped on the appropriate page/product/shared options screen.
Use the attachment URL or a controlled SVG renderer. Restrict SVG uploading to
authorized roles and sanitize imported SVGs; never permit arbitrary executable
SVG markup or disable upload checks globally. Use meaningful accessible labels
for controls and decorative empty alt/aria-hidden as appropriate.

## Evidence before completion

Workers retain a compact source-to-native record map and read-only runtime probes:
card product IDs/title/image/price, category parent IDs, attribute/variation IDs
and prices, review comment IDs/provenance, icon source-node/media-ID/ACF-field map.
Check repeated import preserves counts and a real pre-existing editor override;
do not fabricate test commerce records. Update source clarifications when an old
"missing review/product/variation" blocker is resolved under this contract.
Final audit checks native structures as well as their visible representation.
