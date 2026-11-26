# Completion of blocks 8–9 and appearance preservation review

November 15, 2026. The user explicitly requested completion of Tools/the final block and verification that the changes did not affect appearance.

**Result: available functional and structural checks passed. Pixel equivalence in a browser was not confirmed: the browser/screenshot stage was blocked by the environment.** CSS/DOM comparison must not be treated as a screenshot pass.

## Checks performed

| Check | Result |
| --- | --- |
| Production build | 70 localized pages; App/Tools compiled successfully |
| Standard verify | PASS: 70 pages, 2,902 links, 12 articles, metadata/nav/About/App/Tools/profiles |
| React DOM | 9 scenarios PASS; hydration of 38 EN/ES App URLs, forms/search/history/profile/tasks/localStorage |
| Tools, real Node threads | 6 scenarios PASS; XLSX/CSV, all exports, CRC/limits/DTD/shared-string amplification/recipe/terminate |
| Delivery | 5 scenarios PASS on local SQLite; real Sanity/Cloudflare were not checked |
| TypeScript | tsc --noEmit PASS |
| CSS against original v179 | PASS: after expanding 16 new tokens, canonical rules/values/layers/order/media match |
| Body DOM against v188 | PASS: all 70 pages; nonvisual script nodes and data-worker-src excluded |
| Tools UI against v187 before Worker migration | PASS: 20 sample/result/duplicate-review states across eight localized routes |
| Original media and fonts against v179 | PASS: 106 PNG/WebP/WOFF2 files, no changes |
| Exact full-build comparison with v179 | 109 differences; REVIEW, not PASS; baseline not overwritten |
| Browser / screenshots | BLOCKED: preview relay unavailable; 0 screenshot comparisons |

In total, 20 targeted React/Tools/delivery scenarios were checked in addition to standard verify and CSS/DOM checks. Repeated runs of corrected or extended test infrastructure are not counted as additional unique scenarios.

CSS canonical SHA-256 for both versions: `19675811b8cd1674db98e302db40e5c92c891c347e13ab058ff2bad093758f89`. The comparison expands only the new constant --dwc-color- palette, requires one definition per token in :root, and prohibits substitutions inside URLs/strings. The same CSS compiler then normalizes whitespace on both sides, preserving values, conditions, selectors and order. New :root definitions are excluded only as equivalent constant literals.

The Tools DOM comparison uses LinkeDOM/VM with old and new UI code in the same environment; data processing is also checked in real Node threads. This verifies markup and values, not browser layout, font sizes after font loading, or native file-picker behavior. Import was checked with synthetic OOXML fixtures and round trips of the project's text-cell writer, not a collection of files from all Excel/LibreOffice versions. Bulk fuzzing and peak RAM/p95 profiling were not performed.

The 109 byte differences are expected after Astro/React, responsive media, the new Tools runtime, CSS minification and removal of rollback-only delivery files. They remain available for review. Neither artifact nor screenshot baselines were updated. Preserving original media does not establish identical pixels for new responsive WebP variants at every viewport/DPR; that also requires a real browser.

## Visual stage

Both sites-preview start and status returned `preview relay unavailable: No such file or directory (os error 2)`. The supported preview environment was unavailable. No alternate server/browser was used to bypass restrictions. No screenshot baseline existed. Therefore it is not possible to claim that appearance was checked and definitely unchanged.

Completing this visual stage requires a working supported preview/browser environment and comparison of original and final states on desktop/tablet/mobile, including sticky About, navigation, Tools states, articles and App. The original request authorized this check, but unavailable infrastructure does not constitute a pass. Future unrelated changes are not automatically authorized for a new QA run.

## Artifacts and limits

Local reports: qa/results/style-preservation.json, markup-preservation.json, tools-view-preservation.json, original-assets.json, final-artifact-diff.json and functional logs. They are not published on the site. Reproducible commands: npm run verify, npm run qa:react, npm run qa:tools, npm run qa:delivery, npm run qa:preservation, tsc --noEmit. All are run manually; build does not invoke them.

Implementation: TOOLS_PROCESSING_INTEGRATION.md and STYLES_RESOURCES_INTEGRATION.md. At the time of this review, external CMS/backend/search blocks remained prepared but disabled pending access; this report does not confirm their live activation.
