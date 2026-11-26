# Block 9 — styles, assets and completion of the local migration

November 15, 2026. Local work on blocks 8–9 was completed. The user requested checks in this iteration; results and limitations are in `FINAL_REVIEW.md`. The status of external integrations is described separately below and does not imply completion of local code.

## Styles

The shared palette in `src/styles/palette.css` defines 16 constant colors with the --dwc-color- prefix; 84 repeated literals were replaced with references. Existing theme variables and color-scheme retain their original values.

The monolithic refinements.css was split into 11 component, page and visual-contract files. The `src/lib/styles.mjs` registry preserves the **same** order of rules and @layer; the owning folder does not change the cascade layer. Final navigation and page overrides remain in utilities in their original positions. This explicitly preserves the existing appearance; it does not move overrides to a weaker layer. Global heading sizes live in contracts/visual.css; responsive rules affecting multiple components live in contracts/responsive.css.

CSS is minified only by removing whitespace; syntax and identifier optimizations are disabled. Media conditions, selectors, declarations, shorthand and values are not reordered. Canonical comparison after expanding the new palette matches the original v179 build. This is a strong check of the CSS program, not a substitute for real-browser screenshot comparison.

Original stylesheet: 140073 bytes; result: 138881 bytes. The reduction is small: the primary objective is explicit ownership and preservation of the cascade.

## Assets and local runtime

- JSZip was removed from the head of all eight Tools pages. The Worker loads the ZIP writer only for XLSX/ZIP exports and the XLSX/parser runtime for XLSX import or export. CSV parsing and processing do not load these libraries.
- Seven rollback-only App controllers and their source modules are excluded from normal React publication. They remain in Git and are included in a legacy App build. Before excluding them, the assembler requires that no script references point to them.
- Legacy VM tests read rollback source directly; the active React runtime is checked by its own hydration/action suite, not the old controller.
- `src/lib/delivery-assets.mjs` writes .migration/delivery/asset-budget.json: file counts/sizes, large assets, page scripts and excluded legacy files. This records build delivery without automatically running regression QA.
- All 106 original PNG/WebP/WOFF2 files match v179 byte for byte. Images with unclear usage were retained; deleting them without reliable evidence is not considered optimization.
- Existing URLs/redirects, App/Tools hashing and adaptive media are preserved. There are no new external requests carrying user files or new telemetry.

A separate audit finding was resolved: local finding creation and restoration use the same validFindingFields. Corrupt dates such as 2026-99-99 or a nonexistent February day are ignored during restoration, like other invalid entries. Valid dates and local data are preserved.

## Remaining architectural boundaries

Astro serves all article documents; React owns App; Tools perform processing in a Worker. The clean App compatibility renderer and existing static assembler for other pages remain explicit boundaries. This block does not claim a complete rewrite into native TSX/Astro. Those sources are required by active screens and are not proven dead code.

At the time of this report, Sanity, the delivery webhook/runner, PostgreSQL/API and the blocks 3–4/6–7 search scheduler were not connected: selected accounts/databases, credentials and server hosting were needed. Publication continued to use local content and local App data. Shared server accounts, the CMS editor round trip and load were not checked. Prepared backend files were not published in place of pages.

The local development plan for blocks 1–2/5/8–9 was completed within these stated limits. External activation remained a separate stage, not a hidden publication action. Rollback points were saved Sites v188 for local changes and v187 for complete prior Tools. The QA policy remained unchanged: subsequent changes were to be checked only on explicit user request.
