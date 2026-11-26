# Technical audit — 2026-11-13

Scope: the current authoritative checkout, 40 localized pages, 12 article pages,
shared navigation/footer, CSS layers, fonts, metadata and browser scripts.
The separate profile preview is not part of this deployment.

## Findings and changes

| Finding | Resolution |
| --- | --- |
| Site identity, route titles and metadata rules were mixed into the build loop. | Public configuration lives in `src/config/site.mjs`; metadata rendering lives in `src/layouts/metadata.mjs`. |
| 32 of 40 pages lacked an Open Graph title and a complete consistent social card. | All pages now have a single description, canonical URL, Open Graph fields and Twitter card. Article cards use their own article image. |
| Several Spanish page titles remained English; head descriptions were not localized by the body translator. | Shared page title/description dictionaries cover the main routes and App. Spanish Tools keep their existing localized source copy; articles use their existing Spanish content. |
| Eight pages lacked a semantic H1 after earlier visual headings had been removed. | Added visually hidden H1 elements. No visible heading was added. |
| 34 images lacked width/height attributes; four localized image instances had incorrect dimensions. | Build derives PNG/WebP dimensions from the actual files. Checks verify all dimensions and alt-attribute presence. |
| Every deployment included unused TTF/OTF masters alongside WOFF2. | Masters stay in source control, but are excluded from `dist/`. Font assets decreased from 3,964 KiB to 224 KiB. Existing font registrations and rendering remain unchanged. |
| The CSS assembly logic was compressed into the main build function. | Extracted `src/lib/styles.mjs`, with explicit ordered source files and CSS syntax validation. Existing visual rules retain their original order and content. |
| A syntactically valid but malformed local task array could crash Coordinate. | Added a documented Task schema and runtime guards for fields, statuses and duplicate IDs. Valid saved tasks and empty boards still work. Rendered task text remains escaped. |
| ArrowDown on About focused the About link again. | It now focuses the first submenu item. Added a regression check. |
| Static pages tried to send metrics to an API absent from the hosting configuration. | Metrics now require an explicitly configured endpoint. The tracker interface remains available to the Tools, without failed background requests on this static deployment. |
| Existing checks could miss duplicated metadata, wrong language targets and invalid script syntax. | Expanded `src/check.mjs`; added `src/verify-runtime.mjs`; `npm run verify` runs structural, behavior and runtime checks. |

## Validation

- `npm run build` — passed.
- `npm run verify` — passed: all 40 pages, 1,422 local references, 12 articles,
  canonical URLs and language counterparts, unique IDs, social metadata, image
  dimensions, WOFF2 packaging and browser-script syntax.
- Existing navigation frame/reversal tests, App manual mode, profile editor and
  About image-release tests — passed.
- Regression cases cover malformed task storage, duplicate task IDs, empty boards,
  HTML-like task text, explicit metrics endpoints and keyboard submenu focus.
- Compared all 40 generated bodies against the pre-audit build. After accounting
  for hidden H1 elements and intrinsic image-size attributes, the bodies are equal.
- Existing visual CSS is byte-identical. The only added visual-system rule hides
  the semantic headings. No colors, typography, breakpoints, panel positions,
  navigation animation geometry or spacing were changed.
- Image header dimensions were cross-checked against Pillow for all 14 local
  PNG/WebP assets.

Browser screenshot validation was unavailable: `sites-preview` reported
`preview relay unavailable`. DOM/CSS equivalence and automated behavior checks
provide the validation for this change; no pixel-level browser comparison is claimed.

## Existing limitations

- This is a static site. Coordinate tasks are stored in the browser, profile edits
  last for the session, and Groups/Contribute are presentation pages. There is no
  shared user database or collaborative backend in this hosting configuration.
- Newsletter submission still reports that the service is not connected. No
  subscription service was added during this audit.
- Analytics remain disabled until a collection endpoint is explicitly configured.
- Some page CSS intentionally contains historical overrides. They were not merged
  or reordered during a visual-preservation audit. A wider CSS simplification
  should require screenshots at agreed desktop/mobile sizes.
- Legacy routes still use the existing HTML refresh redirects, canonical links
  and `noindex`; no server redirect system was introduced.
- The project remains plain JavaScript/MJS. Runtime shape guards and syntax checks
  were added, not a claim of complete TypeScript type checking.

## Maintenance

Edit the shared route/head configuration in `src/config/site.mjs`; metadata in
`src/layouts/metadata.mjs`; navigation/footer in `src/layouts/chrome.mjs`; content
in `src/content/` and `src/locales/`; styles in `src/styles/`. CSS source order is
declared in `src/lib/styles.mjs`. Do not edit generated files in `dist/`.

Current user policy supersedes the earlier automatic verification workflow:
build/package as needed, but run functional or visual checks only when explicitly
requested by the user. See `docs/REGRESSION_FLOW.md` and `AGENTS.md`.
