# Technical audit — 22 November 2026

Starting source: `03c0fc9ac6a9f8446329291c968e1857e5d50e1a`.
Scope: the currently published static site, 78 localized pages and two redirects,
shared chrome, Community/Future stories, React markup, assets and existing QA.
The audit permits no visual redesign, content edits or changes to user data.

## Changes made

- Split the footer renderer into named App, About, Tools, Engage and Newsletter
  fragments. Preserve the five columns, exact markup, labels, links and form hooks.
- Replace repeated About CTA templates with a shared renderer. Preserve action
  order, CSS classes, escaped labels, URLs and mobile image-swap markup.
- Correct the About renderer comment: both Community and Future use it.
- Remove the unused `ogSpec(document, ...)` wrapper. Both active page renderers
  already call `createOgSpec` through the shared metadata model.
- Trim the authored-content class in React's `Source` component. The build's HTML
  adapter normalizes this attribute, so the client must not reintroduce a trailing
  space during hydration. This fixes that specific mismatch, not every existing
  Mantine hydration warning.
- Update structural checks for current About routes, two story groups, image
  swaps, inline-image ownership, the five-column footer, active React profile,
  current article counts and genuinely available article translations.
- Keep the prohibition on `!important`, but collect all violations so remaining
  reference/font checks still execute before the check reports failure.
- Limit editorial responsive-image assertions to article images. The shared
  footer artwork intentionally has no responsive editorial variants.

## Preservation evidence

A separate pre-audit SHA-256 inventory covered all 289 deployment files. Existing
checked-in QA baselines were not changed or refreshed.

- All 80 HTML files match the pre-audit files after normalizing only the App
  client's content-hashed filename and the existing build-time `now` timestamp
  in its JSON bootstrap. No visible markup, copy, classes or inline styles changed.
- Shared CSS, App CSS, browser controllers, fonts and all images are byte-identical.
- The only replaced executable asset is the App client containing the `Source`
  class normalization. Its 40 App HTML consumers receive the new script filename.
- Footer and About renderer cleanup does not change generated page markup.
- `git diff --check` passes.

These comparisons establish source/output preservation; they are not screenshots.
They cannot prove all post-hydration states look identical in a real browser.

## Actual check results

| Check | Result |
| --- | --- |
| Production build | PASS: 78 localized pages; 289 deployment files |
| Updated structural checks | Examined 78 pages and 3,518 local references; FAIL on four existing Brand Kit `!important` declarations |
| Tools Worker regression tests | PASS: 6 tests |
| Localized Tools behavior | PASS: all eight localized tools boot/import/process/review/export/clear |
| Content delivery regression tests | PASS: 5 tests after correcting the editorial-image scope |
| Artifact guard unit test | PASS: detects changed, added and removed deployment files |
| Existing full React suite before changes | FAIL: 0/9; outdated permissions/selectors, hydration warnings and missing test-environment browser globals |
| React hydration cases after class normalization | FAIL: remaining Mantine empty-class versus missing-class attribute warnings |
| Other legacy verify scripts | FAIL: retired root/About/task routes, old profile DOM, old content and fixture expectations |
| Historical preservation suite | FAIL against older visual baselines predating the current intentional site changes |
| Browser/screenshot QA | BLOCKED: no originating connected browser; managed QA runner also reports that supported preview/CUA is required |

No browser screenshot comparison, desktop/mobile interaction pass or visual PASS
is claimed. No alternative browser or preview server was installed to bypass the
managed environment. The current browser baseline is absent/unapproved.

## Remaining findings

1. Brand Kit's mobile grid still uses four `!important` declarations in
   `src/styles/pages/brand-assets.css`. They predate this audit. They were not
   removed because that is a visual cascade change requiring working browser QA.
2. Several verification scripts target the retired `/deeper/`, `/ocean/` and
   `/app/tasks/` layouts, or old mock permissions and article catalogs. Their
   failures are retained rather than hidden with skipped tests or invented routes.
3. React hydration still encounters Mantine empty-class attribute normalization.
   The broader serializer/client contract needs a focused follow-up with browser
   coverage. No hydration-warning suppression was added.
4. The React test environment lacks browser globals used by Mantine transitions;
   some interaction fixtures also target the retired controls. Restoring the suite
   requires current user-flow fixtures, not changing production permissions to
   satisfy old tests.
5. Historical structural/artifact baselines describe older deliberate designs.
   They must not be re-recorded merely to turn this audit green. Current output
   was instead compared with its own unchanged pre-audit snapshot.
6. Tools' document background and its `--bg` token differ; social cards still use
   the previous mascot mask. These existing presentation choices were left intact.

The site remains a static/mock deployment. No CMS/backend, newsletter service,
analytics endpoint, dependency upgrade, route migration or storage change was made.
