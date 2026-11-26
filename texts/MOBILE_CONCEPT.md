# Concept mobile presentation

The English and Spanish Concept pages use the same server-rendered HTML, content,
canonical URLs and language links on desktop and mobile. No duplicate mobile route
or user-agent redirect is introduced.

## Scope

- Any viewport up to 700 CSS pixels wide.
- Touch-oriented devices up to 1000 CSS pixels wide, including landscape phones.
- Only `.concept-page`; Community, Future, Blog, Tools and App retain their existing
  layouts and navigation behavior.

The presentation is defined in `src/styles/concept-mobile.css`, appended to the
utilities layer. Every rule is inside its media query and scoped to Concept.

## Mobile behavior

- Static header, visible brand and a two-row navigation with 48px touch targets.
- No automatic menu folding, fold animation or floating plus button.
- Ordinary document scrolling, without sticky pictures, viewport-height reading
  sections or artificial release padding.
- The introductory text precedes the fern; the audience section follows it.
  Subsequent illustrations sit between their related reading modules.
- Text modules, pictures, disclosures and CTA frames share a 20px gutter on both
  sides, declared once as `--mobile-gutter`. They have no independent width caps.
- Pictures remain uncropped and use their natural aspect ratio. The small audience banner keeps
  its panoramic 7.5:1 slot and existing 80% opacity.
- Disclosures expand in document flow, without overlay positioning, capped text
  height or a nested scrolling region.
- Vertical CTA cards and a compact two-column footer.

The layout uses `display:contents` only on non-semantic content wrappers to place
the existing modules in a simple visual sequence. All text and links remain in the
same HTML; no client-side content cloning is needed.

## Runtime boundaries and verification

`i18n.js` keeps the navigation expanded in mobile Concept and clears interrupted
desktop animation frames when entering that mode. `about-scroll.js` clears desktop
measurement variables and does not read sticky-layout geometry in mobile mode.
Both return to the existing desktop behavior when the viewport changes back.

`npm run build && npm run verify` checks both languages, simulated viewport widths
320, 375, 390, 430, 700, 844 and 932, navigation visibility, touch language controls,
interrupted animation cleanup, static measurement behavior and restoration of
desktop reading reserves. CSS checks enforce page and media-query isolation.

The existing desktop stylesheet remains byte-identical after excluding the newly
appended mobile module. Generated bodies for all 40 localized pages remain equal
to the preceding version. Browser screenshot verification was unavailable because
the preview relay was unavailable; these checks are not pixel-level viewport tests.
