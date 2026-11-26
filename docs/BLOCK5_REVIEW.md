# Block 5 review — November 15, 2026

Requested before block 6. The original Sites version was 185, commit
`3487aea7767021d9eafe2cd4485b14bfd542a95d`.

Duplicate React keys in feed events, empty versus whitespace CSS class hydration
mismatches, and a controlled voting checkbox without a handler were found and fixed.
JSDoc clarified the persist contract that prevented strict tsc from accepting the
repository callback. Two outdated test expectations were corrected: data must
precede the active React bundle, not a removed script.

- Build: 70 pages; the standard `npm run verify` passed after updating expectations.
- `tsc --noEmit` passed after clarifying the JSDoc contract.
- `node --test qa/react-regression.test.mjs`: nine scenarios passed. Hydration of
  all 38 App sitemap URLs in EN/ES was checked without recoverable errors or React
  warnings. Coverage included search, focus, hints, categories, history, other and
  own profiles, edit/cancel/save, join/attach/vote/contribute/reset, tasks, escaping,
  restoration of old keys, corrupt storage, quota errors and storage events.
- JSDOM and real react-dom were used, with no network or real browser. Dialogs and
  scrolling are emulated; CSS/layout and actual browser input were not verified.
  Legacy tests were retained separately.
- Artifact diff against v179: 94 differences (70 HTML, 22 optimized media files,
  Blog JS and the new React bundle). CSS matched byte for byte. These are expected
  build changes and do not confirm visual identity. The baseline was not updated;
  the local report is `qa/results/block5-artifact-diff.json`.
- Browser/screenshot stage BLOCKED: start/status reported preview relay unavailable.
  No visual baseline was available, and visual equivalence was not confirmed.

The functional result applies to the corrected block 5 implementation before
block 6. The new backend code, SQL and API were not tested in this request.
