# Block 5 — React and TypeScript in App

November 15, 2026. The first migration boundary for all EN/ES App pages was implemented. The production build completed. In the next iteration, a user-requested review fixed keys/classes/radios and JSDoc; verify, tsc and nine React DOM tests passed. Browser/screenshot verification was blocked by infrastructure. See `BLOCK5_REVIEW.md`. For the requested review of the previous block, see `BLOCK4_REVIEW.md`.

## Implementation

- `frontend/app/Application.tsx` is the application entry point. The static build emits React HTML first; the client hydrates it with the same seed and date. URL parameters and localStorage are restored after hydration.
- `repository.ts` is the typed boundary for local actions and subscriptions. The existing `prototype-core.mjs` remains the single domain model for search, relationships, data validation and local permissions. React subscribes through `useSyncExternalStore`; storage events are handled across tabs.
- The `dwc-connected-prototype-v1` and `dwc-shared-tasks` keys are preserved. Saved data is not renamed or automatically migrated.
- Profile, editor/radar, tasks, search suggestions, the new finding form and dialogs are JSX components with React state. Input focus and form drafts no longer require replacing the entire main element through innerHTML.
- Feed, groups, research, findings and the main listing still use existing escaped templates through `TrustedView`. It converts them to React elements rather than inserting HTML via dangerouslySetInnerHTML. This is a temporary compatibility boundary, not a completed JSX migration of every template. Do not pass arbitrary CMS HTML or raw input to it.
- `location.ts` preserves query/hash, back/forward and current URLs. Ordinary links still navigate to site pages.
- `src/build-app.mjs` builds a server renderer and a content-hashed client. App loads one new React bundle instead of the old business controllers. Old controllers remain in the source for rollback but are not loaded by React pages. Shared navigation remains with `src/site/i18n.js`.
- Original CSS and layer order are preserved. Wrappers use display:contents. The radar's auxiliary aria-label now receives localized text instead of the literal `${copy.radar}`. No design changes were planned; visual equivalence has not been confirmed.

## Boundaries and future work

This remains a browser prototype with the fixed user alan-li. It has no server authentication, shared database or cross-device synchronization. The current repository is synchronous: the block 6 API will need asynchronous operations, loading/error states and server-side permission checks. Simply replacing localStorage with fetch will not solve this.

Some domain model and compatibility templates remain JavaScript. TSX does not mean all legacy code has strict types. As blocks 6–9 migrate, replace TrustedView with individual components and refine types at the legacy model boundary. No new speed measurements were taken; the React bundle adds runtime, so this block does not claim faster loading.

Sanity and external delivery for blocks 3–4 still await account/hosting setup.

## Build and rollback

`npm run build` enables React by default. To build only App in the legacy way while keeping Astro articles: `DWC_APP_RENDERER=legacy npm run build`. Full static generator rollback: `npm run build:rollback`. When publishing a rollback, package that exact build without running a default build again. The saved Sites version 184 is another rollback option.

## Next review — only on explicit request

Standard verify scripts partially execute legacy controllers and do not by themselves prove correctness of the new React client. The next QA request needs separate repository/hydration checks and a real browser pass: EN/ES, query/history/hash, search and keyboard suggestions, finding creation, membership/attach/vote/reset, profile edit/cancel/save, tasks, restoration of both old keys, corrupt/unavailable storage and multiple tabs. Compare desktop/mobile visually against the original without automatically updating baselines. Explicitly note the gap if supported preview is unavailable.

## App interface update — November 2026

Finding creation is now a full page at /en/app/records/new/ and the equivalent
/es/ route. The existing repository, field validation, membership rules and
browser persistence are retained; saving opens the finding detail page.
The Findings navigation's highlighted entry and contextual add links point to
this route. Old #contribute links and /app/contribute/ continue there.

Main renders the complete membership feed without group/event filters. Groups
uses Recommended groups and includes a regular-size Search any group! card
linking to /app/search/?types=groups in the current locale instead of its local
search form. Search's hero has one Explorer subtitle and supports a decorative
background via --scan-hero-image: url(...) and --scan-hero-position; its overlay
preserves text contrast. No image has been selected for this background yet.
The demo banner and prototype disclaimer are removed from the App surface;
data persistence remains browser-local. No QA run was requested for this edit.

## Authored object content and UI language

UI locale chooses navigation, labels, actions, enum captions and generated
system messages only. Object content is always the entered source string:
profiles/names/occupation, groups/rules/news, findings/title/scientific name/
description/location/evidence/date, research, proposal text, task title/owner.
The source text is reused in cards, details, Main, profile activity, selections,
search results and suggestions. Search folding is comparison-only and does not
modify displayed or stored values. Switching locale does not reset memberships,
votes, tasks or saved content.

Former translated demonstration fixtures now contain their original English
source once. Compatibility text() never selects a value from UI locale; explicit
original/sourceLanguage values win, with deterministic English/Spanish fallback
for old bilingual fixtures. Existing browser-entered strings are not migrated,
rewritten or replaced; storage key/version remain unchanged.

Data attributes and translate=no protect authored DOM text. App main/title and
metadata are excluded from generic noun rewriting. Field validation may inspect
trimmed text to reject whitespace-only input but saving retains exact strings;
rendering preserves whitespace/line breaks. Existing task defaults are identical
for EN/ES, while already saved tasks retain their entered content. The prepared,
undeployed server command also retains submitted strings; backend activation
and live DB verification are outside this change. Editorial CMS/article locale
handling remains separate from App object content.

No QA was requested or executed for this change. Publication build only.

## Darwin Core Occurrence UI

Findings now use the TDWG 2026-10-13 Occurrence profile documented in
DARWIN_CORE_FINDINGS.md. src/site/app/dwc-occurrence.mjs owns supported fields,
input semantics, labels, validation and non-destructive legacy projection.
src/site/app/dwc-views.mjs owns shared card/detail and legacy form rendering;
React Contribution uses the same registry. Search, suggestions, profile activity
and Main use scientificName/occurrenceID and canonical event/location fields.
App relations remain separate. The full reference, migration mapping, format
limits and inactive API boundary are in the dedicated document. No QA run.

## Search image banner

Search hero keeps a horizontal 4:1 aspect ratio. The replacement fern artwork is used
unchanged at assets/search-shadowed-ferns.png, centered with cover inside the
4:1 viewport. The image layer has opacity 1, i.e. 0% transparency. The artwork is fully visible. Text, input and button remain fully opaque. On narrow
screens copy and input sit side by side within the same ratio. Suggestions
remain outside the banner, without an overflow clip. No QA was requested.

## Navigation first-paint fix

src/lib/initial-paint.mjs adds the destination's canvas color inline immediately
after charset, before external CSS. It covers assembled pages, Astro articles
and locale/legacy redirect documents. Color-scheme and theme-color are also
provided early. A lowest-priority CSS layer allows existing page styles to win;
Tools retains its light theme, App its dark green, and other sections theirs.

Same-origin cross-document View Transitions are opted in without fades or
motion, allowing supporting browsers to hand over page snapshots without an
empty canvas. Unsupported browsers ignore this enhancement and retain the
inline background fallback. No click interception, router rewrite, loading
screen, hidden body or navigation delay was added. Sources:
https://developer.chrome.com/docs/web-platform/view-transitions/cross-document

Only the publication build was run. No browser QA or white-frame reproduction
was requested/performed; the live fix still needs user observation or a later
explicit browser verification request to establish the observed outcome.

## Mantine presentation

The active App view layer is now native React with Mantine core/hooks 9.8.1.
Full scope, navigation preservation, route map, CSS isolation and verification
limits: MANTINE_UI_INTEGRATION.md. No primary navigation replacement was made.
The repository, canonical DwC fields and source-language rules are retained.
