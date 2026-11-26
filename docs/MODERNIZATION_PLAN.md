# Darwin Core Protocol — overall development plan

Historical plan, November 15, 2026. At the time, block 2 was published; block 3 implementation was prepared, with Sanity connection awaiting Project ID, dataset and account access. Block 4 integrated responsive media delivery; event receiver and outbox were prepared without an external connection. Details: CONTENT_DELIVERY.md. Block 4 was checked on request, except for unavailable browser preview. Block 5 implemented React/TypeScript in App with a local repository; some templates remained behind an adapter. On the next explicit QA request, block 5 passed after fixes; the visual stage was unavailable. Block 6 server code (PostgreSQL/API/permissions) was prepared, but database, server hosting and React server mode were not activated. See APP_REACT_INTEGRATION.md, BLOCK5_REVIEW.md, SERVER_API_INTEGRATION.md.

Block 7 prepared FTS/GIN and an outbox processor with a published CMS projection; real database, scheduler and React server mode still awaited connection. Block 7 checks were not run. See SEARCH_INDEXING_INTEGRATION.md. Block 8 included XLSX/CSV processing and export in a Worker, ZIP preflight limits, streaming XML and shared cancellation. Blocks 8–9 were completed within local boundaries and checked on explicit request. CSS/DOM/function checks passed; screenshots were blocked by the environment. See TOOLS_PROCESSING_INTEGRATION.md, STYLES_RESOURCES_INTEGRATION.md, FINAL_REVIEW.md. Practical blocks, boundaries and commands: `INTEGRATION_BLOCKS.md`. Basis: source audit of commit `6e01f9a`, architecture/CMS research and QA workflow saved in Site version 180 / commit `4443d99`.

## Goal

Move from a static site with a browser App prototype to a maintainable content platform and application with shared data, search and server permissions. Preserve appearance, URLs, language versions, tools and existing flows. Treat new product features and known-bug fixes as explicitly described behavior changes.

A preference for modern technology was adopted. It does not imply selecting experimental releases, connecting paid services or migrating the entire project in one change. Choose supported stable versions; pin dependencies and record the reasons for architectural decisions.

## Required agreements

- Checks, measurements, browser QA and baseline recording only on explicit user request. Do not run them after ordinary edits, before commit/deploy, via hooks/CI or implicitly inside a build. See `REGRESSION_FLOW.md` and `AGENTS.md`.
- Lack of a run does not block work or publication; mark the result unverified. Do not present planned checks as completed.
- A visual screenshot baseline is not yet available. Capturing it on a separate request is a recommended checkpoint before UI migration, not an automatic requirement for every task.
- Work in small complete increments and preserve the previous version. Where practical, keep the old implementation behind a switch until transition.
- Do not change design, text, translations, URLs or access audience under the guise of technical migration. Fix known bugs as separate tasks.
- Do not create paid accounts, change domain or migrate user data without a specific agreed decision and required access.

## Target architecture

| Area | Main choice | Status and reason |
| --- | --- | --- |
| Public site, articles, entity pages | Astro + TypeScript | Preferred: explicit templates, ready HTML, server rendering where needed |
| App UI | React + TypeScript | Components and state; compatible local adapter first, then server adapter |
| Shared styles | Existing CSS + tokens + component isolation | Migrate design without simultaneously replacing the CSS system |
| Server | Modular TypeScript API | Separate domain modules, keep initial deployment simple |
| App data | Managed PostgreSQL | Entities, relationships, transactions, server constraints and indexes |
| Article CMS | Sanity, primary candidate | Managed content platform; first pilot the schema and editorial workflow |
| Search | PostgreSQL first; Meilisearch if need is demonstrated | Separate search based on quality, volume and latency requirements |
| Files | S3/R2-compatible object storage + CDN | Separate media/attachments from database and site build |
| Import/indexing | Background job queue + processors | Retries, batching and load control |
| Observability | Structured logs, errors, metrics and job statuses | See delays and failures without manually running regression tests |

Server runtime validation of inputs, permissions and limits operates during normal product use. “QA only on request” does not disable it. Observability does not imply automatic test runs either.

Astro/React is the working direction, not a promise that every configuration is compatible with current hosting. In stage 0 decide whether the UI stays on Sites, how SSR routes are published, where API/CMS/database/queue live, and how cache invalidation and editorial preview work. Current Sites is static deployment; Sites server runtime is Cloudflare Workers. Do not assume an ordinary Node process, CMS or search server can run there without adaptation. PostgreSQL access must suit the selected runtime; do not move ordinary TCP connections to Workers without a compatible supported solution.

Next.js + TypeScript remains an alternative if App becomes the main product and a unified full-stack project is more convenient. Decide before a large migration to avoid doing it twice. Reconsider Payload if choosing Next.js. Directus is an alternative to Sanity when a self-owned SQL model and hosting are priorities.

## Stages and dependencies

| Stage | Work | Concrete result |
| --- | --- | --- |
| 0. Record decisions | Scale, privacy, CMS, hosting, module boundaries, budgets | Brief architecture decisions and agreed deployment diagram |
| 1. Prepare compatibility | URL/locale/flow registry, data contracts, adapters, old/new map | Explicit behavior-preservation contract and rollback plan |
| 2. Fix local defects | Shared date validation; XLSX limits before full decompression; source formats | Separate small patches with described behavior changes |
| 3. Migrate public shell | Astro/TS, layouts, metadata, keyed i18n, one article as a vertical slice | Pilot route with previous design and independent content source |
| 4. Connect CMS and scale articles | Sanity pilot, translations, preview, webhooks, caches, article migration | Editorial path from draft to published page |
| 5. Migrate App to components | React/TS, separate views, repository interface, URL/state/focus | Existing App flows on component architecture |
| 6. Add server data | Auth, PostgreSQL, API, permissions, attachments, migrations | Shared work across devices and users |
| 7. Add search and background processing | Indexes, queues, outbox, deletion/ACL, reindexing, monitoring | Catalog without loading the entire dataset in the browser |
| 8. Simplify CSS and asset delivery | Consolidate rules, tokens, themes, responsive images, remove excess | Fewer hidden dependencies and unnecessary downloads |
| 9. Switch routes and complete migration | Gradual enablement, agreed data migration, old redirects, legacy removal | New architecture without unnecessary duplicates |

Order: 0 → 1 → 3 → 4 for content; 0 → 1 → 5 → 6 → 7 for App. Stage 2 can be separate tasks after stage 1; stage 8 media optimization can precede complete migration. Clean CSS component by component to avoid redoing the full design twice. Stages are not equivalent to one commit. Checks for each stage are prepared and listed, but run only on separate explicit user request.

## 0. Decisions needed before infrastructure implementation

- Count scale by separate parameters: findings/profiles/articles, attachment sizes, update frequency, bulk imports, concurrent requests.
- Distinguish internal search indexing, database indexes and search-engine URL indexing. Define requirements for each.
- Define public, personal and group data, roles and publication rules.
- Define requirements for public finding pages: SEO, links, preview.
- Choose hosting, storage regions, backups and acceptable monthly costs.
- For CMS define editor count, roles, EN/ES and future languages, article format, preview and when publications appear on the site.
- Record the main stack and data owners: App database, CMS, object storage; the search index is not the source of truth.

## 1. Behavior preservation and migration boundaries

- Document navigation/footer, About sticky/mobile/disclosures, Tools 2×2, articles and related recommendations, profile and editor, search, groups, voting, findings, task workspace, language/query/hash/history.
- Preserve canonical/hreflang, article URLs, legacy redirects and favicon.
- Introduce stable entity, article, translation and block IDs; do not use array position or English HTML as keys.
- Separate the domain model from DOM and localStorage through a repository interface.
- Preserve old local data. Do not automatically send browser data to a server; actual migration needs a separate explicit flow.
- Do not substitute build hashes for a missing screenshot baseline. A new generator naturally changes bytes: artifact diff alone does not prove behavior changed. Update baselines deliberately, not for a green report.

## 2. Confirmed defects

- One date and record validator for creation, restoration and import. Eliminate acceptance of `2026-99-99` during state restoration.
- Check XLSX archive before full decompression/CRC; limit expanded volume, entry count and memory; move XLSX/XML work to a Worker; support cancellation. Checking input extension/size does not replace expanded-size limits.
- Expand compacted sources into readable code; minify the build. Do this in patches separate from logic changes.

## 3–4. Public site and CMS

- Remove page DOM substitutions by CSS selector; use layouts and typed props.
- Build a shared routes/head/i18n registry. Link article translations by ID.
- First read existing content via an adapter, then add a CMS adapter: frontend should not depend on a particular vendor's response shape.
- CMS schema: articles, localized versions, blocks, authors, tags/taxonomy, images/alt/captions, SEO, statuses, dates, relationships and slug history.
- Prefer a structured block editor. Do not allow arbitrary CMS HTML to bypass site styling and restrictions.
- Pilot: one EN/ES article, draft, preview, publication, edit, unpublish, recommendation and search updates. This lists scenarios, not their execution.
- CMS webhook → authentication → idempotent job → page/cache/search update. Duplicate or late events must not roll content back.
- Public pages read published content from cache/generated HTML; drafts are available only in protected preview and excluded from the public index.
- For a large archive choose on-demand rendering with caching and targeted invalidation or supported incremental publication. Do not assume a full rebuild of every article is required after every editorial change.
- Prepare migration of existing articles, IDs, translations, tags, dates and URLs. Preserve the old source until correctness is confirmed by requested QA.

## 5–7. App, API and search

- Migrate screen by screen: shared shell → search → profiles → findings → groups/voting → task workspace. Start with prior semantics via a local adapter.
- Manage form state and focus; do not recreate the whole screen/dialog after every action. Filters and entity selection remain in the URL.
- API contracts, runtime input/output schemas, consistent errors, pagination and limits.
- Database schema: users/profiles, memberships/roles, groups, findings/evidence, research, proposals/votes, tasks, attachments, audit events. CMS articles remain separate.
- Authorization on the server. Client buttons and hidden elements are not permission checks. Voting and related updates are transactional; repeated requests must not create duplicates.
- Moving to real accounts and multi-user data is a separately agreed product change, not an invisible consequence of React migration.
- Requests return a page of required fields. Use suitable cursor pagination and stable ordering; add virtualization for long lists.
- PostgreSQL: indexes for actual filters/relationships, full-text search and pg_trgm if needed. Do not use an arbitrary record-count threshold as the sole reason for a separate search service.
- For Meilisearch: separate documents/indexes for entities and articles, language fields, filters, exact scientific names, deletion and visibility changes. Consider semantic/AI search later as an additional mode.
- Database change → outbox → queue → search index update. Handlers are idempotent, account for versions and retry failures; failed jobs have a separate state and safe full reindexing exists.
- Account for indexing delay in the UI. Check access on the server before returning protected data; public indexes contain no private fields.
- Do not expose private data through suggestions, facets, counts or cache; account for search-index lag when membership/visibility changes.

## 8. CSS, assets and speed

- Migrate existing styles without changing appearance, then simplify by component.
- Review navigation/Blog/Tools/Profile duplication; move component and page rules from the late utilities layer to appropriate layers.
- One source of theme tokens; consistent typography/spacing scale, documented breakpoints, explicit color-scheme for light and dark pages.
- Remove competing global h1–h6 rules and dependencies on patch order.
- Check unreferenced candidates before removal. About 6.48 MB of audit candidates are not proven unnecessary: account for dynamic use.
- Introduce responsive images, srcset/sizes, below-the-fold lazy loading, image dimensions and priority for significant imagery. Preserve originals.
- Reduce client JS on public pages and load App/Tools code on demand.
- Error/API logs, request/background-job duration, index size, queue, cache, slow SQL and resource cost are default observability.

## Audit mapping

| Finding | Planned solution |
| --- | --- |
| 408 repeated selectors and navigation rules in multiple files | Stage 8: consolidate by component |
| Utilities layer overrides pages and global headings | Stage 8: correct distribution of layers and tokens |
| HTML substitution by selector and section index | Stage 3: explicit layouts/props/routes |
| Translation by innerHTML and article/block position | Stages 1, 3–4: stable IDs and CMS translations |
| XLSX expensive decompression before limit checks | Stage 2: preflight limits and Worker |
| Different date validation for creation and restoration | Stage 2: shared runtime schema |
| Large and potentially unnecessary media | Stage 8: inventory and responsive delivery |
| Full App rerender and loss of state/focus | Stage 5: components and local updates |
| Compacted sources | Stages 2–5: formatting and module separation |
| localStorage and fixed user | Stage 6: agreed transition to server data |
| Strong coupling to custom generator | Stage 3: standard content framework |

## Metrics and acceptance criteria

First define scenarios and budgets. Initial targets for later agreement: LCP ≤ 2.5 s for a typical public page; server search p95 ≤ 300 ms; ordinary API p95 ≤ 500 ms without heavy imports; single-change search visibility delay ≤ 10 s. These are design targets, not measurements of the current site or promises at every scale. For each metric record environment, data volume, queries, concurrency, cache hit rate and separate bulk-import conditions. Measurements/load tests themselves run only on request.

For UI migration, criteria are previous flows, appearance and URLs; for CMS, the complete editorial cycle; for backend, cross-device data, server permissions and recovery; for search, result quality, privacy, latency and index recovery. Implementation readiness and confirmation by requested checks have separate statuses.

## Taking work on

First task: stage 0 — deployment diagram and decisions about Astro/React, Sanity, PostgreSQL, API, storage and queue. Then the compatibility contract and one vertical article pilot, without rewriting the entire site.

Each task gets an ID, goal, dependencies, affected routes, permitted behavior changes, rollback method and available checks. Statuses: planned → in progress → implemented → checked on request → published. Publication without checks is allowed by agreement; verification is separately marked “not run.” Order and dates depend on completed stages, data volume, access and selected services; no calendar promises have been made.

## Research sources

- Astro islands: https://docs.astro.build/en/concepts/islands/
- Astro rendering: https://docs.astro.build/en/guides/on-demand-rendering/
- Astro CMS: https://docs.astro.build/en/guides/cms/
- Astro Cloudflare: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Next.js: https://nextjs.org/docs/app/guides/production-checklist
- Sanity drafts: https://www.sanity.io/docs/content-lake/drafts-and-versions
- Sanity localization: https://www.sanity.io/docs/studio/localization
- Sanity webhooks: https://www.sanity.io/docs/http-reference/webhooks
- Directus: https://directus.com/docs/getting-started/overview
- Payload: https://payloadcms.com/docs/getting-started/what-is-payload
- PostgreSQL indexes: https://www.postgresql.org/docs/current/indexes.html
- PostgreSQL pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html
- Meilisearch indexing: https://www.meilisearch.com/docs/capabilities/indexing/tasks_and_batches/async_operations
