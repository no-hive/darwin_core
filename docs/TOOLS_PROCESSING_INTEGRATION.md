# Block 8 — Tools file processing

November 15, 2026. A client-side pipeline was implemented for four Tools in EN/ES. It is part of normal static publication and does not depend on PostgreSQL/Sanity. Checks were requested and performed in the next iteration; see FINAL_REVIEW.md. Compilation or a production build does not establish functional, load or visual verification.

## Changes

- File reading, CSV/TSV decoding, XLSX parsing and sheet selection run in a dedicated Web Worker. Main receives the table and small workbook metadata; ZIP, shared strings and the parser remain in the Worker. DOMParser is not used for XLSX data; it remains in the UI for the previous language switching.
- XLSX central directory and local headers are checked **before** decompression. The expensive JSZip.loadAsync(checkCRC32:true) no longer runs before limits are checked.
- Selected XML parts are decompressed by pako in chunks up to 64 KiB. Actual byte counts, deflate completion, size agreement and CRC are checked. A SAX parser reads XML without building a DOM for the whole sheet.
- CSV/XLSX/JSON/ZIP export, report generation and recipe import run in the Worker. The UI creates a link to the completed Blob and starts download. Formula-like fields are counted once during processing, without rescanning the table on each results render.
- JSON is assembled in bounded chunks; CSV and XML are built row by row. Unnecessary transfer of the original table/results when exporting a recipe, CSV or report is reduced. ZIP/XLSX compression still uses vendored JSZip in the Worker.
- Cancel terminates the Worker and rejects pending RPCs. A generation guard prevents a late response from replacing the result after cancellation or a new action. An old Worker's error handler does not close the new Worker. After cancellation, sheet selection reopens the workbook from the saved local File.
- Each RPC operation has a 120-second timer; after timeout the Worker closes. Browser scheduling affects the timer, so it is not a strict CPU/RAM limit. The Worker terminates on pagehide; the UI rerenders on BFCache return.
- processing-core 1.1.0 contains shared validation of import options, tables, steps and recipes. The Worker uses the same rules. Sizes are checked before creating a rectangular XLSX table and adding a date column; every step's output is also checked before subsequent transformations.
- Worker/runtime/core hashes and query versions of main Tools scripts bind one pipeline version. The Worker loads core/runtime by hashed names. The build compiles these JS files and then copies artifacts; it does not run tests.

## Limits and deliberate validation changes

| Limit | Implementation |
| --- | --- |
| Input file | Up to 10 MiB; CSV, TSV, XLSX |
| Table | Up to 50000 data rows, 100 columns, 1000000 cells |
| Headers | Up to 4096 characters per name |
| Useful text | Up to 50 MiB UTF-8 across all cells/headers, including repeats and new columns |
| XLSX ZIP | Up to 2000 entries and 50 MiB total declared expanded size |
| XML | Depth up to 64, up to 64 attributes per node, bounded tag count; DTD/entities prohibited |
| Shared strings | Up to 1002000 values; one value up to 10485760 JavaScript string.length units |
| Recipe | Up to 1 MiB JSON, matching headers, 1–8 steps with allowed fields/types |
| Export | Up to 128 MiB total text payload for the selected operation and finished Blob |

The **semantic** volume of cell text is counted: a small XLSX with repeated references to a huge shared string must not turn into an unbounded table during cloning or export. Limits are not total RAM limits: objects, duplicate indexes, cloning, temporary strings and buffers have overhead. Main still stores the input/result table; a fully Worker-resident model with paginated RPC is a separate future improvement.

The ZIP profile is deliberately limited to ordinary single-disk ZIP32 with STORE/DEFLATE. ZIP64, encrypted/multi-disk, VBA, duplicate/overlapping paths, incorrect sizes/CRC and unsupported methods are rejected. Old JSZip supported part of a wider ZIP format; support for all possible XLSX containers is not claimed. Non-UTF8 ZIP filenames may also be rejected; sheet names in XML are Unicode. Only worksheet parts are read; chart sheets are not data tables. Unread media/styles are not decompressed or CRC checked, so this is not a complete OOXML validator. External workbook relationships are not loaded.

Formulas are not evaluated; cached values are used as before. Sheet/header row selection, Excel 1900/1904, inline/shared strings and warnings about formulas/merged cells are preserved. Styled number/date formatting is not restored. Duplicate cell references are now rejected rather than overwriting values. On import error, the last successfully loaded table and File remain. CSV counts header/preamble of up to 20 rows separately from the data-row limit.

Recipe validation is stricter about allowed option types, fields, sizes and step IDs. Malformed external recipes may be rejected earlier. Version 1 and previously exported recipes are preserved; row-removal decisions still reset on import. Core VERSION changes are reflected in recipe/report.

## Preserved behavior

The eight page routes, text for normal states, DOM classes, CSS and composition were not rewritten. The existing Cancel button now covers import/sheet selection/run/recipes/export. Export shows a busy state with cancellation; after a successful download it shows the existing Done text. EN/ES messages were added for new limits. All transformations are local; files/recipes are not sent to the server or saved in localStorage.

Mapping, dates, duplicates, step order, explicit duplicate removal, safe CSV, text-cell XLSX, separate reports/recipe/original and result packages remain. Scientific validation, formula evaluation, macros and taxonomic matching were not added. Visual/functional equivalence was not yet confirmed by checks at this point.

## Files and build

- `frontend/tools/zip-reader.js`: preflight, bounded inflate, CRC.
- `frontend/tools/workbook.js`: streaming XML and worksheet model.
- `frontend/tools/exports.js`: Worker downloads.
- `src/site/assets/processing-worker.js`: classic Worker RPC entry and workbook cache.
- `src/site/assets/processing-core.js`: shared model/validation/transformations.
- `src/site/assets/workbench.js`: UI, lifecycle and cancellation.
- `src/build-tools.mjs`: esbuild, hashes and coherent Worker imports.
- `.migration/tools/`: intermediate build; do not publish separately.

`npm run build` and the direct assembler automatically compile Tools. `npm run build:tools` builds only the client runtime without QA or publication. pako 3.0.2 and sax 1.6.1 are pinned in the lockfile. Vendored JSZip was not changed; block 9 removed its main-thread script and loads the ZIP writer in the Worker on demand. New dependency licenses: `/assets/vendor/tools-runtime-LICENSES.txt`.

The existing `verify-tools.mjs` was adapted for query versions, asynchronous Worker RPC and new browser globals in the VM. Its scenarios were neither expanded nor run. A test Worker does not replace a real browser Worker or a check that CPU work stops after termination.

## Checks for a future explicit request

All eight previous localized scenarios are needed, plus real Excel/LibreOffice XLSX, UTF-8/UTF-16 XML, shared/inline/boolean/error/formula cells, CRC/sizes, truncated/overlapping/ZIP64/encrypted/VBA containers, shared-string amplification, empty/sparse sheets, row/cell/text and output-column limits, malformed recipes, all downloads and reimport of text-cell XLSX. Separately check cancellation at every stage, stale replies, Worker crash, timeout, language change during an operation, sheet selection after cancellation and retention of prior data after errors. Evaluate load/memory and main-thread responsiveness in a real browser using specified files; this block contains no speedup or peak RAM measurements.

## Rollback and next step

Saved Sites version 187 provides a complete rollback to the previous Tools pipeline. The build:rollback command switches Astro/App, but Tools in the new source still build using the new method. User files are not migrated on rollback: they exist only in the current page's memory. The next practical block 9 is styles/assets and migration completion. At the time of this report, external CMS/backend/search activation in blocks 3–4/6–7 was still awaiting connections.

Sources: [pako API](https://github.com/nodeca/pako), [sax parser](https://github.com/isaacs/sax-js), [JSZip](https://stuk.github.io/jszip/). This change did not run project checks for these libraries.

In block 9 runtime loading became lazy: CSV parse/run loads neither the XLSX parser nor ZIP writer. Checked with real Node threads; the browser stage was BLOCKED.
