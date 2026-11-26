# Practical integration blocks

Historical plan and status. Source: MODERNIZATION_PLAN.md. Work began November 15, 2026. Checks run only on explicit user request. A production build does not run tests, screenshot comparisons or typecheck. “Implemented” and “verified” are different statuses.

| Block | Integration | Completed result | Dependencies |
| --- | --- | --- | --- |
| 1 | Astro + TypeScript + local content adapter | One EN/ES article pilot in existing publication, compatible pipeline and rollback | No external accounts |
| 2 | Shared Astro layouts and content contracts | Shared shell/metadata, articles and i18n via stable IDs instead of DOM substitutions | 1 |
| 3 | Sanity CMS | Schemas, EN/ES, authors/tags/media, article import, protected preview, publication | 2; CMS project access and chosen plan/hosting |
| 4 | Content and media delivery | Webhooks, targeted cache refresh, responsive images, CDN, correct unpublishing | 3; server runtime and object storage decision |
| 5 | React + TypeScript in App | Incremental screen migration through a shared repository interface, preserving URLs and local flows | 1; can precede CMS completion |
| 6 | Authentication + PostgreSQL + API | Real users, server permissions, shared data, transactions and migrations | 5; access/privacy/hosting decisions |
| 7 | Search + background jobs | Server pagination, PostgreSQL indexes; Meilisearch if required; outbox and queue | 6; agreed volumes and search requirements |
| 8 | Tools file processing | XLSX limits before expensive decompression, Worker, cancellation and shared validation | Independent local block after 1 |
| 9 | Styles, assets and migration completion | Component CSS rules/tokens, remove legacy and excess assets, observability | As components migrate; final after 2–8 |

Each block consists of small commits and separate publications where needed. A new external service first needs an explicit purpose, access model and cost; this plan does not imply creating a paid account.

## Historical result — local blocks 8–9 completed and checked on request

Tools was completed with Worker import/export, guard/cancel and lazy library loading. Styles received a palette/modules without changing the cascade; unused App delivery controllers were excluded while retaining rollback source. Full report: `FINAL_REVIEW.md`; block 9 implementation: `STYLES_RESOURCES_INTEGRATION.md`. Verify, 20 targeted React/Tools/delivery scenarios, TypeScript and CSS/DOM/original asset comparisons passed. Browser/screenshot stage BLOCKED: preview relay unavailable. External connections for blocks 3–4/6–7 were still pending at that time.

## Block 8 result: client-side Tools processing

The normal publication includes Worker XLSX/CSV import, ZIP preflight before inflate, streaming XML, shared validation, cancellation of import/processing/export and coherent asset hashes. Heavy downloads and recipe reading also moved to the Worker. CSS/pages were not rewritten. Checks were performed on the next explicit request; see FINAL_REVIEW.md. Additional limits and rollback: `TOOLS_PROCESSING_INTEGRATION.md`.

## Block 7 result: search and jobs preparation

PostgreSQL FTS/GIN, EN/ES results and suggestions with filters/cursor, live permission and text-freshness checks, bounded-batch outbox processing, retry/dead recovery/rebuild and atomic generation of published CMS articles were implemented. API, client and indexing adapters built. SQL/tests/typecheck were not run. Database, server mode, handler and scheduler were not connected. The UI retained local search. Details: `SEARCH_INDEXING_INTEGRATION.md`.

## Block 6 result: server preparation

The PostgreSQL SQL model, atomic commands/permissions, idempotency/versioning, Sites identity API and async transport were prepared. API/client compiled in isolation; new-block migrations/tests were not run. Backend was not deployed or connected to active React screens. A real database, runtime access, Site server build and async UI integration were needed. Exact status, commands and permissions: `SERVER_API_INTEGRATION.md`.

## Block 5 result

React + TypeScript, static React HTML with hydration, a shared local repository and React profile, task, form and suggestion components were enabled in EN/ES App. Feed and cards used a temporary React adapter for existing templates. CSS and localStorage keys were retained. Backend/auth remained block 6 work. On the next iteration's explicit request, keys/hydration/radios were fixed and verify, tsc and nine React DOM tests for 38 App URLs passed. Browser QA was unavailable. Details: `BLOCK5_REVIEW.md`; implementation and rollback: `APP_REACT_INTEGRATION.md`.

## Block 4 result: external activation pending

The static build included responsive WebP variants for articles/Blog, srcset/sizes, priority for the first illustration and lazy in-text media. Original images remained; CSS/composition were not rewritten. Variant caching by hash and a changed/removed URL delivery manifest were available.

A separate delivery Worker with Sanity signature verification, D1 outbox, event coalescing, lease/retry and runner contract compiled but was not deployed. Sanity, D1, webhook, unattended runner and CDN purge were not connected. Automatic publication was not enabled. On a separate request before block 5, standard and five additional tests passed. Browser QA was blocked by unavailable preview relay; see `BLOCK4_REVIEW.md`. Details and actual limits: `CONTENT_DELIVERY.md`.

## Block 3 result: external connection pending

An isolated Sanity Studio, article/author/topic/media schemas, EN/ES, import of 12 article documents and 11 topics with 7 images, published adapter and protected local preview were prepared. Exact description and commands: `SANITY_INTEGRATION.md`. No external Sanity project was connected; no dataset was created or data uploaded. Real Project ID, dataset and access were needed. Public source remained local; this was not a completed live CMS connection. QA was not run.

## Block 2 result

Six articles in EN/ES (12 pages) were implemented as complete Astro documents. The production build successfully generated 70 localized pages. The terminal publication result is stored in Sites. QA, typecheck and visual comparison were neither requested nor performed; visual equivalence was not confirmed.

- The then-single editorial source was `src/content/article-data.json`. Articles and blocks had persistent IDs. Translations referenced block IDs; reordering did not change translation relationships. Do not recreate IDs during editing or slug changes. The articleEs array and positional relationship were removed.
- `articles.mjs` became a compatible EN view; `article-catalog.mjs` resolves locales by keys. A real CMS provider was to use the existing contract.
- `SiteLayout`/`ArticleLayout`, `SiteHead`, `SiteHeader`, `SiteFooter` and `ContentImage` produce the complete shell without later DOM substitution.
- Header/footer use trusted shared renderers from chrome.mjs, a single source with pages not yet migrated. This is not CMS HTML.
- `src/lib/page-metadata.mjs` provides a shared pure model for title/description, OG, Twitter, JSON-LD, canonical/hreflang; the legacy adapter uses the same model. `routes.mjs` defines URLs; `presentation.mjs` handles CSS hash and local media dimensions.
- Article UI text uses `ARTICLE_UI` keys; content is escaped. External URLs and article appearance are not intentionally changed.
- Articles are copied to dist without `localize`, `preparePage`, `applyMetadata` or image-fixup passes. The shared build adds static assets, OG PNG, sitemap and redirects. CSS and client scripts were not rewritten.
- About, Blog index, Tools and App still used legacy rendering; this block did not claim migration of the entire interactive site.
- The recommendation test was adapted to the ID/slug catalog instead of articleEs; it was not run. Existing QA baselines were not automatically updated.

## Block 1 — historical first-iteration boundaries

Pilot: `/en/blog/philosophy-behind-darwin-core-protocol/` and the corresponding ES URL. Other articles, Blog, About, Tools and App continued to build as before.

- Astro 7.4.12 and TypeScript 7.0.2 were pinned in dependencies/lockfile.
- `frontend/content/contracts.ts` defines published Article/ArticleBlock, Locale and PublishedContentProvider without depending on a CMS provider.
- The local provider reads existing sources. No editorial copy of data is created; Sanity replaces the adapter, not the pages.
- `src/content/article-catalog.mjs` is the shared entry for localized articles. Spanish tuple data is explicitly linked to slug; the inherited positional relationship of block translations remains inside the compatibility boundary.
- ArticleLayout, ArticleBody and RelatedArticles are real Astro components. Templates escape text; arbitrary content HTML is not executed.
- Existing CSS classes, content, image paths and the related-recommendation algorithm remain. No new client framework scripts are loaded.
- Astro writes intermediate HTML to `.migration/astro/` without deleting `dist/`.
- The existing generator completes pages: navigation/footer, wording, SEO/OG/canonical/hreflang, image dimensions and CSS versioning. Removing this temporary dependency is block 2 work.
- Hosting remains static: the existing project_id and `static.directory=dist`. Audience, domain, external API or database changes are outside block 1.

## Build commands at the time

```sh
# All Astro articles and other pages; normal production build
npm run build

# Complete Astro article documents only; excludes other pages and site assets
npm run build:astro

# Legacy generator: complete dist without the Astro pilot
npm run build:rollback
```

`DWC_ARTICLE_RENDERER=legacy` also disables Astro in the main build. Invalid switch values fail the build; a missing intermediate file does not silently fall back to old HTML. To publish rollback, retain legacy settings in build configuration or build legacy and package that exact output without another default build. Restoring a saved Sites version is an alternative.

No build command runs `verify`, Playwright or the TypeScript checker. Compilation errors are build errors, not a separate QA run.

## Block 1 status

Implemented. The production build succeeded: Astro generated two pilot pages and the shared generator 70 localized pages. Block 1 was prepared for publication; terminal publication status is recorded in Sites. QA/typecheck/browser comparison were neither requested nor run. A visual baseline was still absent; display equivalence was not claimed as confirmed by browser screenshots. Do not automatically update the version 179 artifact baseline: Astro changes HTML serialization.

## Next steps at the time

Complete external connection of blocks 3–4 after obtaining Sanity Project ID, dataset, access and choosing an unattended runner/hosting. Complete live activation of block 6 per SERVER_API_INTEGRATION.md after selecting database/hosting and obtaining access. Block 7 preparation was implemented; live search/jobs connection also awaited block 6 and CMS: SEARCH_INDEXING_INTEGRATION.md. Local blocks 8–9 were implemented and checked in the available environment. External activation and the blocked visual stage remained. See TOOLS_PROCESSING_INTEGRATION.md. Local preview was prepared; hosted network preview required a separate hosting/auth decision. Static Sites publication was preserved.
