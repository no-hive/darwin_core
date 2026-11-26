# Agent context archive through November 21, 2026

This document preserves the history of past decisions. It is **not a current instruction**.
It includes superseded and conflicting requirements. Do not apply them automatically
or restore an old UI based on them. Current rules are in the root and nested AGENTS.md
files. Read this archive only for the context of a specific task, and compare historical
decisions with the current request and source code.

---

# Darwin Core Protocol

## Current product scope — user decision, 2026-11-17

Current work is a MOCK UI ONLY: screens, Mantine components, demo fixtures and
in-memory interactions. Do not implement or prepare RPC, blockchain adapters,
wallets, smart contracts, backend, databases, APIs, upload storage, real-time
infrastructure or durable persistence without a later explicit user request.
The future source of findings/votes/rules/roles is blockchain via RPC, but the
user explicitly says NOT to prepare that connection now. Existing backend/CMS
roadmaps below are historical/future context, not current work authorization.
Do not introduce generic RPC-ready architecture as part of a visual task.
Do not delete existing browser data; new demo changes may reset on reload.

Agreed next UI: group tabs Overview / Members / Voting / Journal / Rulesets.
Journal and Main use the same demo entries. New finding: one selected journal,
visible immediately. Form: one friendly compact page, no Additional details;
taxon, basis, combined when, combined where, materials, limited contextual
fields, optional remarks/research. For new self-observation demo records,
recordedBy comes from the submitting profile; preserve historical values.
All profiles currently have only Member role. No investigator/editor/admin UI.
Rulesets edits propose a vote rather than changing active settings directly.
One member = one vote; default rules approval is 2/3 with quorum. Verification
UI includes normal member voting and optimistic confirmation; an objection
starts normal voting. Include first-finding admission as a configurable demo.
These are mock scenarios, not production governance/security functionality.
The prior verification-marker-only idea is superseded by this later request.

Full planning deliverable is a separate Markdown document supplied in chat.
No implementation or deployment is authorized merely by creating this plan.

This Git checkout is the authoritative source. Preserve the current branch and
work from its latest source. Sibling scratch directories may contain obsolete
copies; never replace this checkout's src/ or dist/ from them.

Build: npm run build
Astro migration/rollback and practical blocks: docs/INTEGRATION_BLOCKS.md.
`npm run build` builds all 12 complete Astro article pages, then assembles the
site with React App and the remaining legacy page families. React App is built
by src/build-app.mjs and integrated by src/layouts/react-app.mjs. App migration
and rollback: docs/APP_REACT_INTEGRATION.md. DWC_APP_RENDERER=legacy retains
Astro articles while restoring legacy App. Article documents bypass legacy
DOM finalization. Do not publish .migration/astro as a standalone site.
Astro shell/content contracts live in frontend/. Editorial source of truth:
src/content/article-data.json; article/block IDs are persistent. Translations
are keyed by IDs, never by order. Build rollback: npm run build:rollback.
Verify: npm run check && node src/verify-behavior.mjs
Sanity integration: docs/SANITY_INTEGRATION.md. External connection/import is
PENDING real projectId/dataset/account access; never claim Sanity is live yet.
DWC_CONTENT_SOURCE defaults to local. Explicit sanity mode prepares a published
snapshot before Astro and the legacy Blog assembler; errors must not silently
fall back to local. Studio is an isolated package under cms/studio/.
cms:import:prepare creates a local archive only. Do not import it into an
unidentified project or overwrite existing CMS documents automatically.
Drafts are confined to cms:preview:build and .migration/preview; never publish
that directory or use draft input for production. Secrets belong to secure
server/session configuration, never Studio/public environment variables.
build:rollback forces local content. New tests still require an explicit request.
Content delivery/media: docs/CONTENT_DELIVERY.md. The main build now prepares
responsive WebP variants and a private delivery manifest. This is delivery/cache
bookkeeping, not regression QA. Article/Blog media use srcset; originals remain.
cms/delivery/worker.mjs is a separately compiled, NOT deployed receiver/outbox.
No real Sanity webhook, D1, build runner or automatic deployment is connected.
Do not claim incremental SSR or CDN purge is active on this static Site.
Record cms:delivery:record-publication only after a matching terminal deployment
success. Draft/private resources and local manifests must never be published.
Full verification: npm run verify (also checks runtime data guards and JS syntax).

Modernization roadmap: docs/MODERNIZATION_PLAN.md. This is a staged plan, not
an instruction to migrate the whole site on an unrelated request. Preserve
current behavior and runtime until the applicable implementation task is requested.

User policy: run tests, visual checks, browser QA, artifact comparisons and
baseline capture ONLY when the user explicitly requests verification. Ordinary
edits, refactoring, saving, committing and publication are not such a request.
Do not automatically check before/after each edit or before publication; do not
add automatic test hooks, CI triggers or testing to build/deploy scripts.
Building/packaging as needed for publication is allowed and is not a QA request.
When no checks were requested, report "Checks were not run, as agreed".
Do not block saving/publication merely because QA was not requested or the visual
baseline is missing. This policy takes precedence over older verification notes.

Preservation workflow: docs/REGRESSION_FLOW.md. On an explicit QA request,
`npm run qa:full` runs the whole flow. `npm run qa:check` builds, runs the existing
suite, and compares deployment files against qa/baseline/artifacts.json.
Browser screenshots are initially PENDING. When visual QA is requested, a missing
or unavailable baseline is reported as BLOCKED for that check, never PASS.
Do not overwrite screenshot baselines to make a technical refactor pass.
Browser automation in managed Linux must use supported Sites preview/CUA; the
portable Playwright runner refuses managed execution.

Shared navigation and footer: src/layouts/chrome.mjs.
Translations: src/locales/ and src/layouts/localize.mjs for legacy pages;
article-data.json and src/locales/articles.mjs for Astro articles.
Articles: src/content/article-data.json and frontend/pages/[locale]/blog/[slug]/.
src/content/articles.mjs and src/layouts/article.mjs are compatibility adapters.
CSS layers: src/styles/. dist/ is generated; do not edit it directly.
CSS source order: src/lib/styles.mjs. Preserve its order when editing layers.
Site/head settings: src/config/site.mjs and src/lib/page-metadata.mjs;
frontend/components/SiteHead.astro renders the model, src/layouts/metadata.mjs
adapts it to legacy documents. Shared route helpers: src/lib/routes.mjs.
Navigation controller for all pages: src/site/i18n.js.
Concept's mobile presentation: src/styles/concept-mobile.css. It intentionally
uses static images, ordinary disclosures and expanded navigation on narrow/touch
viewports; preserve the existing sticky/animated desktop behavior.

Preserve the About sticky visuals and final vertical actions, six blog articles,
Tools viewport composition and 2×2 cards, two-column profile. The task workspace has been removed by user request.
Run verification commands only on an explicit user request, including before deployment.

Connected App prototype:
- Seed content: src/content/prototype.mjs. Two topic groups plus the default Darwin Core Protocol group, four profiles and
  one initial record per profile; use this same source for every app section.
- Shared model, search, local state and permissions: src/site/app/prototype-core.mjs.
- React owner: frontend/app/. Local actions/subscriptions: repository.ts.
- Active App presentation is native Mantine: Application.tsx,
  MantineWorkspace.tsx, FindingViews.tsx, MainFeed.tsx, Contribution/Profile.
  PrototypeWorkspace/TrustedView are retained compatibility code, not active.
  Never pass arbitrary CMS HTML into that old bridge. prototype-app.js/profile.js
  are rollback-only controllers and must not also run on React pages.
- Profile uses the same repository/model. Never add a separate search dataset.
- Main is the source-filtered event feed in MainFeed.tsx/feed.ts. The task board
  and app/tasks/ route have been removed; do not restore their links or storage
  adapter. Existing task storage is left untouched. Voting belongs to group pages.
- Local state uses dwc-connected-prototype-v1; this is a browser-only demo with
  a fixed current profile (alan-li), not authenticated server authorization.
- New views need bilingual labels, usable entity links, and validation in
  src/verify-prototype.mjs. Keep legacy redirects in src/config/redirects.mjs.

Block 4 was explicitly reviewed before block 5; see docs/BLOCK4_REVIEW.md.
Legacy controller tests do not establish React hydration/browser correctness.
Do not mark React verified without scoped tests and supported browser QA.

Server preparation (block 6): docs/SERVER_API_INTEGRATION.md. backend/ SQL and
Sites-dispatch-only Worker are isolated, NOT deployed or wired to live UI.
api:build compiles to .migration/api only. Do not copy this API-only worker into
dist/server or remove static from hosting.json: the static site would break.
No database exists/was selected through this work. Do not apply migrations,
seed, grants or upload browser-local demo data without an identified target.
Runtime roles get function-only grants; keep admin/runtime credentials server-side.
Real profile identity must come from Sites dispatch, never payload/localStorage.
frontend/api is async transport/query state, not a replacement for the existing
synchronous AppRepository. No automatic tests or backend activation in build.
Block 5 reviewed with fixes and 9 React DOM tests; see docs/BLOCK5_REVIEW.md.

Search/indexing preparation (block 7): docs/SEARCH_INDEXING_INTEGRATION.md.
Migrations 006–017 add FTS/GIN, a live-authorized search function, outbox processor
and generation-based published article projection. API/job roles are separate.
Backend builds stay in .migration/api; no live endpoint, cron, migration or search
UI is activated. No new test run was requested for this block. Do not report
measured speedups or a production-ready PostgreSQL implementation from a bundle.
Index jobs commit projection and ack together; no external side effects belong
in this SQL-only processor. Direct admin data changes require an outbox event or
explicit rebuild. Never grant index maintenance or table access to the API role.
CMS search input must be trusted published input matching an approved successful
release, never preview/drafts. Local block 9 is complete in the documented compatibility boundaries.

Tools processing (block 8): docs/TOOLS_PROCESSING_INTEGRATION.md. Main/Worker share
processing-core 1.1.0. Workbook parsing and export modules: frontend/tools/.
src/build-tools.mjs compiles core/UI/Worker and hashes a coherent resource graph;
src/build.mjs invokes it and copies artifacts. Never publish raw worker template
placeholders or .migration/tools as an independent Site. Do not hand-edit dist.
XLSX uses preflight ZIP32 metadata validation, bounded pako inflate/CRC and SAX
parsing in a browser Worker; no main-thread JSZip.loadAsync or XML DOM tree.
Cancel terminates Worker; stale replies must never update a newer operation.
No automatic tests, fixture generation, benchmarks, screenshot or typecheck runs.
Existing verify-tools VM harness was adapted but not executed in block 8.
Core/calendar/date scientific behavior is preserved; new limits and stricter ZIP/
recipe acceptance are documented. Build rollback affects Astro/App, not Tools;
use saved Sites v187 to restore the full previous Tools implementation.

Styles/resources closure: docs/STYLES_RESOURCES_INTEGRATION.md, FINAL_REVIEW.md.
Utilities fragments preserve their exact source order in STYLE_LAYERS. Folder
ownership does not imply moving a file to a different cascade layer. Palette
--dwc-color-* constants must stay root-only. Do not change layers or native form
color-scheme under a technical refactor without explicit design intent.
Default React delivery omits rollback App scripts; source is retained for legacy
builds and VM tests. Tools ZIP writer and XLSX parser load lazily in Worker.
Asset budgets are build bookkeeping, not automatic QA. Scripts qa:tools and
qa:preservation require an explicit verification request as before.
The final user-requested checks passed functional/CSS/DOM/assets stages; browser
screenshots remain BLOCKED (preview relay unavailable), never mark that PASS.
CMS/API/database/search live connections remain pending actual external access.

App object content is immutable with respect to UI locale: names, groups,
findings, research, proposals, news, profile occupations and tasks are authored
strings, never UI translation dictionaries. prototype-core text() ignores UI
locale (legacy values resolve to original/sourceLanguage, otherwise the English
source). Keep model/storage/index content unchanged across locale switches.
Translate only interface copy, enum labels and generated system messages.
Do not trim/rewrite/translate submitted content; validate separately and retain
case, Unicode, spaces and line breaks. data-object-content / translate=no marks
protect authored text; wording/localize passes must skip it. Main App content
also bypasses generic findingNouns rewriting. Existing localStorage keys and
version remain unchanged; do not reset user data to enforce this rule.

Darwin Core findings: docs/DARWIN_CORE_FINDINGS.md. Authoritative field registry
is src/site/app/dwc-occurrence.mjs, based on TDWG 2026-10-13. New findings use
canonical term keys, no title/date/location/description/evidence pseudo-DwC
fields. The Occurrence profile is a documented subset, not the entire standard.
scientificName and basisOfRecord are application-required; no universal DwC
mandatory fields are claimed. occurrenceID is auto-generated only if missing.
Do not infer recordedBy from uploader, basisOfRecord, scientific verification,
datum, detection status or media links. Legacy content is projected without
resetting storage; title/evidence remain separately identified legacy content.
Keep App links/ownership/moderation outside DwC. No tests were requested for
this change; older QA fixtures need adaptation to canonical finding input.
Prepared undeployed API v1 is still legacy and must be adapted before activation.

First paint: src/lib/initial-paint.mjs supplies an early inline canvas color,
color-scheme and same-origin view-transition opt-in without animation. Apply to
legacy/Astro pages and all redirect documents before external CSS. Its first
cascade layer is intentionally overridden by the full stylesheet; don't use a
loading overlay or hide content to mask navigation flashes. Keep section colors
aligned with current CSS. Browser QA still requires an explicit user request.

Mantine UI: docs/MANTINE_UI_INTEGRATION.md. User explicitly requires preserving
ALL current navigation. Do not replace the shared header with a sidebar/AppShell,
reorder links or restyle the navigation. Its HTML/CSS remain in chrome.mjs and
the existing stylesheet. App content has an isolated Mantine stylesheet from
src/build-app.mjs; @scope, Provider variables and portal target stay within
.mantine-app. Public pages must not acquire this CSS/reset. Follow the active
location for content routing; preserve modified clicks, deep links and locales.
Main now has side filters explicitly requested by the user: group checkboxes,
sort and period; creation remains its own page; categories stay buttons;
groups keep Recommended groups and Search any group! Native field registry,
authored-language invariants and storage keys/versions remain authoritative.
No QA was requested for this redesign. Existing browser/DOM fixtures need a
separately requested update/run; no baselines were overwritten.

Main event feed: docs/MAIN_FEED.md. No App breadcrumbs, global workspace settings,
Reset demo/About menu or My workspace panel. Search suggestions are capped at
three randomly sampled matches until a real popularity metric is specified.
Do not present random selection as an established popularity ranking. Feed
preferences use dwc-main-feed-preferences-v1, separate from the object model.
Native article previews come from the published catalog's original English
source and use the existing Blog routes; never embed full article blocks.
No tests/browser QA were requested for this iteration. Old task QA fixtures
refer to intentionally removed pages and need revision on an explicit QA task.

Darwin Core Protocol is the default group (darwin-core-protocol) for every
profile. The model includes all profiles regardless of saved membership flags;
its membership is permanent, while its Main recommendation checkbox is optional.
Blog and global publications belong to this group, not a separate Blog source.
Main has a 720px maximum feed plus 320px sidebar at desktop, bordered event cards,
one shared frame around My groups + chip filters, and no Recommended groups link.
Latest/Oldest/Most popular/Less popular and all/7/30/90-day chips must remain visible without dropdowns.
The shared header/navigation and palette remain unchanged.

Groups directory: use two equally large section headings My groups and
Recommended groups, each with the actual group count (exclude Search any group!
tile). No standalone Groups heading, small duplicate My groups heading or the
old introduction/recommendation subtitles. Every group/search tile has an
explicit solid border matching Main frames. QA remains opt-in.

Small App refinements: Main filter chip selection uses color only, no check icon
and no selected-label padding shift. All My groups entries, including the default
Darwin Core Protocol group, show member counts. Default-group membership already
includes every profile; never create a duplicate group. Search has no Refine
search / Clear search controls or refinement panel. Keep URL group/scope filters
for existing deep links. Remove only the empty-state magnifier; keep the input
search icon. Hero/category spacing matches navigation/hero spacing responsively.
Tools detail shared footer overrides the old scoped width to span 100%.

About top canvas: body.about-scroll-page must retain display:flow-root to contain
the shared header's top margin. Otherwise the html first-paint canvas is exposed
as a differently colored band above navigation. Preserve existing header offset,
page palette/gradient and sticky visuals; do not mask this with an overlay.

Pacific Field Collective has three seeded members: Alan Li, Maya Rivers and
Inés Soler. Leo Hart remains a profile and a default Protocol-group member; his
findings, research links and historical votes are retained. Do not re-add him
to Pacific when deriving counts or render a separate member dataset.

Main Blog previews are horizontal: thumbnail 128×96px desktop / 72×72px mobile,
with title and excerpt alongside (two lines each). Keep explicit image bounds
and object-fit:cover; do not restore a large standalone Blog image block.

Finding creation now uses DCP Finding Core v1 (mock block 2): one selected
journal, taxon, basis, combined date/optional time, combined place, supporting
materials, contextual quantity/method, optional remarks/research. No Additional
details or wizard. Six core blocks are required by the current demo journal
profile, not by Darwin Core universally. Scientific date and locality are required;
coordinates are optional, paired and need an explicitly known datum. Time needs
an explicit UTC offset; unknown time stays absent. Taxa/places are labelled demo
fixtures; never resolve arbitrary IDs or invent geographic/taxonomic metadata.
Native file selections are preview-only and retained in repository memory as App
metadata, separate from canonical associatedMedia/associatedReferences URL values.
No file bytes/blob URLs in DwC fields, localStorage or public build output.
New self-observations fix recordedBy to current profile.name on creation. This is
an explicit product exception to the historical uploader/recorder restriction;
never rewrite historical records or infer recorders in compatibility projection.
New creation requires a member journal and stores exactly that journal. Existing
historical memberships/attachments/scientific fields remain untouched.
See docs/MOCK_FINDING_BLOCK2.md. Checks remain opt-in.

Mock group block 1 is implemented (2026-11-20): GroupWorkspace.tsx owns the
five group tabs, Overview mosaic, Member-only directory, Journal, read-only
Rulesets and existing proposal cards. JournalEntry.tsx is shared by Main and
Journal; feedEvents remains their shared source. group-ui.ts contains explicit
UI fixture statuses and view helpers. Foundation/publication fixture dates are
demo metadata, not inferred scientific data. New interaction state is in memory;
repository.ts reads existing browser data once for compatibility and writes no
domain state. Existing browser keys must not be erased. Current totals count one
profile as one vote, not profile.power. Main filter preferences are unchanged.
Legacy group ?tab=records maps to journal/kind=finding, ?tab=research to Overview
research section. The creation link preselects group even after hydration; the
full creation redesign and Rulesets editor are later blocks. No QA was requested.
Implementation notes and remaining scope: docs/MOCK_GROUP_BLOCK1.md.

Remaining mock-journal plan implemented (20 November 2026): tables show scientific
name / journal / verification / observed / open, with no occurrenceID or dwc links
in compact previews. Technical terms remain in a full-detail disclosure. Three
verification labels come from the same in-memory journal scenario state.
RulesetsPanel provides versioned active rules, draft highlighting, validation,
before/after confirmation and proposals. No draft mutates active settings. Accepted
rules update admission/publication controls and Overview; rejected rules do not.
The explicit small mock scenarios live in frontend/app/journal-mock.ts, composed
by repository.ts without replacing authored fields or touching browser storage.
Voting freezes eligible members, rule version, quorum/minimum and threshold when
opened. One member/one vote; abstentions count toward participation but not the
approval ratio; two-thirds compares integers. Ordinary silence never approves.
Current ballots stay Active until an explicit local end-of-period preview action.
These controls are labelled scenario previews, not a privileged role or real
voting infrastructure. No real deadline scheduler, backend or RPC is prepared.
Verification supports member vote, optimistic wait, confirmations and objection
opening normal voting. Candidate admission follows successful finding review;
no membership or self-vote is granted before that. Open/vote/invitation/first-finding
admission, experience requirements, materials/coordinates/type/news policies are
reflected in UI actions. Invitation is a local preview only, with no delivery.
Historical multi-journal records and old scientific values are preserved; new
findings target one selected journal. Newly created local proposals use an
existing group route with tab=voting&proposal=..., so no dynamic static page is
claimed. Reload may reset the local scene and shows an unavailable message for
a vanished local proposal. Journal/Main share entries, verification, cover and
proposal metrics; pending candidate journals are shown as Main sources explicitly
labelled Candidate. News posting, when allowed, is an in-memory Journal/Main entry.
No QA was requested; builds and publication only. See docs/MOCK_JOURNAL_COMPLETION.md.

Future page removed by user request (20 November 2026). Do not restore ocean/
source/output routes, footer link, Future-only copy/styles/OG palette or imagery.
Public About navigation retains a native button that toggles Future/Soon (ES:
Futuro/Pronto) on every click without navigation; controller lives in i18n.js.
The sole retained Future image is renamed community-hardware.png and appears
beneath the final Community story paragraphs. Community's final mission action
now leads to support/, with its existing wording. Shared jellyfish.webp is a Blog
asset and remains. Historical verification fixtures/baselines are not updated or
run on ordinary edits; any expected-route assertions need revision on explicit QA.

Community’s final large/sticky visual now uses the user-supplied original
community-mountain-researcher-goat.png in EN/ES (latest user image). It replaces the governance interface
artwork and has no Governance Preview label. The hardware inline banner stays.

Future/Soon typography shares the dropdown-link font rule, letter spacing and
uppercase transform, including the Concept mobile dropdown override.
Soon/Pronto (aria-pressed=true) uses the App tile's inverse ink/background palette;
clicking back to Future/Futuro restores the regular dropdown style.
Blog selection translates the whole .story-row.selected button 8px right, so title,
type, date, border and highlight move together. It does not indent only the title
or change column padding. Reduced motion disables the transition.

About side-by-side story columns now start at half their visual frame height on
Concept and Community, including the More than a scientist section. The leading
inset no longer subtracts text height; disclosures cannot pull the heading up.
about-scroll.js sets --about-text-start from the image frame, while stacked/mobile
sections keep ordinary document spacing. Existing scrolling and release reserve
remain; this is initial section alignment, not a clamp that pins every paragraph.

About CTA redesign: plain rectangular 1px borders, no bevel/pseudo silhouettes,
numbered eyebrow copy or arrow decoration. Try our app uses the same inverse
ink/bg palette as the App nav tile. CTA titles use the shared heading family;
descriptions use the regular body family at body size, including mobile.
About CTAs use the Tools card hover motion: the whole link shifts left 6px with
background/border/transform transitions of .2s. Keyboard focus has the same effect;
the primary inverted palette is retained and reduced motion disables movement.

CTA follow-up: remove the small description spans entirely. About CTA minimum
height is 84px desktop / 76px mobile with reduced padding. Primary Try our app
uses 50%-alpha ink fill/border (including hover/focus), not element opacity: its
text stays fully opaque. The Tools-like hover shift remains unchanged.

User correction: About text/image alignment is CENTER-TO-CENTER, not text-start
to image midpoint. In each side-by-side section, about-scroll.js subtracts the
actual first reading block height from the visual height before halving the
leading inset. It remeasures fonts/resizes/disclosures. Stacked mobile stays in
document flow; oversized text has zero leading inset rather than negative overlap.
This supersedes the earlier top-edge alignment note.

Latest CTA refinement: Try our app uses exactly the same neutral fill, text and
border as the other CTA (supersedes the inverted/50%-alpha primary styling).
Both Concept and Community CTA links have a broad right-facing SVG chevron at
the far right, with no horizontal shaft, as explicitly requested by the user.
The shared hover shift and compact heights remain.

CTA chevrons match the border: --line normally, --ink on hover/focus, with the
same .2s color transition (disabled for reduced motion).

Community now ends with only Try our app: remove Join our core mission and its
Spanish counterpart entirely (including the support/ CTA destination).

New brand mark (21 November 2026): user-supplied crab/crystal silhouette is
dwc-crab-cylinder.png. Navigation keeps its original CSS mask coloring via the
page --accent / App currentColor; never bake black or one global logo color in.
New slender proportions use auto mask width at the existing 59px/44px heights.
Favicon ICO/32/96/SVG and 180px touch icon use the new upper crystal silhouette,
with the existing #bacb79 green, black favicon background and #08150d touch-icon
background. Original rounded-corner alpha geometry is retained. Favicons remain
the existing shared palette; page-specific navigation palettes are unchanged.
Asset versions are cylinder-8 / green-rounded-cylinder-4. No QA was requested.

Community’s second large visual is now community-mushrooms-amber-v2.png, the
user-approved generated four-mushroom mosaic, in EN/ES. Keep its existing frame
and edge-fade presentation; the first and final visuals remain unchanged.

Brand wordmark now uses Cinzel Medium 500 from Google Fonts, locally served at
/assets/fonts/cinzel-500.woff with its OFL license. Only .site-mark span typography
and its wordmark width change: 112px/19px desktop, existing mobile visibility with
110px/18px on mobile Concept. Existing section colors, logo mask, navigation links
and page heading/body families stay unchanged. No browser QA was requested.

Search background is now the user-supplied search-fern-data-mosaic.png in both
React and legacy Search styles. Keep opacity:.7 (30% transparency), center/cover,
4:1 hero geometry and all existing search layout settings unchanged.

Latest logo replacement: dwc-crab-crystal-v2.png is the new user-supplied pointed
crystal/crab, converted to a transparent black mask. Shared navigation and OG
cards use it with existing per-page CSS/spec colors, at unchanged heights and
original aspect ratio. Favicon and touch icons use only the upper 425/806 of the
new mark (reference 1's cap crop), retaining prior green/background palettes
and rounded alpha geometry. Versions: crystal-cap-9 / green-rounded-crystal-cap-5.
This supersedes the cylinder asset note. No QA requested.

Wordmark font reverted by user request: Darwin Core Protocol again uses the
previous Cormorant Garamond styling (72px width, 23px/.79, -.025em tracking;
Concept mobile 110px width, 20px/.95). This supersedes the Cinzel note above.
Keep the new crystal/crab artwork and all per-page colors unchanged.

Brand assets page: localized /en/brand-assets/ and /es/brand-assets/ use the
user-supplied brand-assets.html mosaic template, scoped CSS in
src/styles/pages/brand-assets.css, and shared navigation/footer. All 12 previews
are placeholders; copy/download/ZIP controls are disabled and labeled coming
soon. Do not populate with real assets or claim a license yet. Footer Engage
replaces Discord in the same position with Brand assets / Materiales de marca.
Light initial paint matches this page. QA remains explicit-request only.

Wordmark weight refinement: Cormorant Garamond is now true Semibold 600, locally
served at /assets/fonts/cormorant-garamond-600.woff with OFL license. Existing
wordmark dimensions, spacing, colors and responsive rules remain unchanged.
Only the navigation wordmark uses this new weight; body typography is unchanged.

CTA hover images: About action links fade a background-only pseudo-element to
opacity .7 (30% transparency) on hover or keyboard focus. data-cta-image maps
app to search-fern-data-mosaic.png, community to community-mushrooms-amber-v2.png,
blog to blog-bird.webp. Retain existing borders, colors, chevrons and Tools-like
shift; reduced motion disables transitions. Community now ends with Try our app
and Read our blog / Lee nuestro blog (supersedes the single-CTA note). CTA links
share full group width and fixed height 132px desktop / 112px mobile with room
for two-line headings; preserve both buttons' equal sizing. QA is opt-in.

Future restored at /en/ocean/ and /es/ocean/ from the exact pre-removal
c854977^ content and images (whales, jellyfish, golden eye, inline hardware).
Original blue palette/sticky story retained with current shared brand chrome.
Future/Soon toggle is removed; Future is again an ordinary About-menu/footer
link. Community loses its inline circuit image and now ends with App + Read
about Future (whale hover). Future ends with App + Read our blog (bird hover).
All three About pages share the current equal-height rectangular CTA styles
and .7 hover-image opacity. Supersedes earlier deletion/single-CTA notes.

Shared footer boundary now uses the exact idle navigation border formula:
1px solid color-mix(in srgb,var(--accent) 42%,var(--line)), including mobile
Concept. Newsletter restores its neon chip / dark typed-text mirror using
textContent, synchronized on input/change/focus/scroll/pageshow/resize. Native
input text stays readable until mirror initialization; selection remains
contrasting and long values synchronize horizontal scrolling. No backend
newsletter connection is added. Tests/browser checks remain opt-in.

CTA framing refinement: Community mushroom background uses 50% 30% to frame
the lower three caps; Future whale background uses 50% 13% to frame the upper
whales. Original image assets and .7 hover opacity stay unchanged. About scroll
alignment must use collapsed reading-block height (subtract open explanation
bodies), so toggling a hint expands downward instead of moving its heading and
summary upward. Resize/font measurement stays active without recentering around
expanded text. No automatic QA.
