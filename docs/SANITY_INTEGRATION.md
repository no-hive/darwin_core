# Sanity — block 3 (historical status)

This document records the state at the time of block 3; it does not describe the current production integration.

## Actual status at the time

Studio, schemas, a local import package, server adapter, publication pipeline and isolated local preview were prepared. No Sanity project was connected: the available-integration search did not return Sanity, and projectId, dataset and account access were not provided. Neither project nor dataset was created. No data or media were uploaded to Sanity. The public source remained `local`.

The implementation was prepared, but **the block was not complete as an external service connection**. Studio with a real project and draft preview were not run; tests, typecheck, browser and visual checks were neither requested nor performed. The production build in local mode succeeded: 12 article pages and 70 localized pages total. This did not verify Sanity. Creating a paid project was not an automatically executed action.

## Implementation

- Standalone `cms/studio/` application: Sanity 6.23.0, React 19.3.1, styled-components 6.6.0, with its own package.json/lockfile. Its React is not loaded on public pages or App.
- `dwcArticle`, `dwcAuthor`, `dwcTag`, `dwcMedia` schemas and typed text/quote/image blocks. Content contains no arbitrary executable HTML.
- Two article documents per publication: EN/ES share a stable articleId and blocks retain `_key`. Localized slugs remain the same as on the site.
- Authors are optional: no invented authors were attributed to existing articles. Author relationships were prepared in the CMS without adding a new visible site block.
- Topics reference documents with stable keys. Recommendations use the same tag-intersection algorithm. New CMS tags are accepted from the shared snapshot.
- Media are uploaded to Sanity asset storage during import; the adapter supports CDN URLs with known dimensions and previous local images.
- SEO fields can override title/description without changing the visible heading.
- Imported identifiers and URLs are locked in the editor. For new material, the editor assigns articleId, language and slug, then enables the lock. Studio locking does not replace API permissions or a URL migration process.

## Content sources

`DWC_CONTENT_SOURCE=local` was the current mode, without CMS requests.

`DWC_CONTENT_SOURCE=sanity` makes the build fetch documents using `@sanity/client` 8.16.0 with explicit `perspective: published`, normalize input and atomically write `.migration/content/published.json`. Astro and the legacy Blog assembler use the same snapshot: new articles reach pages, Blog categories, recommendations and sitemap.

Queries use pages of 100 documents; the complete site publication remains a static build. Incremental delivery/invalidation and webhooks are block 4. The adapter's implementation limit is 100000 localized documents per build, not a performance claim.

Only visible published material with a reached date and a complete EN/ES pair is published. An incomplete pair remains in CMS. Mismatched slugs, unsupported blocks, invalid dates, unknown media origins or an empty resulting catalog stop the build. There is no automatic fallback to stale local content when Sanity fails; the existing production version is not replaced.

Studio schemas assist the editor; the server normalizer separately handles untrusted API input. Studio validation alone does not protect external mutations. This is product validation, not an automatic QA run.

## Local import preparation

```sh
npm run cms:import:prepare
```

Creates `cms/exports/current-content.tar.gz`: 12 EN/ES article documents, 11 topics and 7 original images. It contains `data.ndjson` and `assets/`; `_sanityAsset` references files within the archive. Import the complete TAR.GZ, not bare NDJSON with relative paths. Stable article/block IDs, URLs, dates, categories and text are retained. The command sends nothing externally. Regeneration replaces only the reproducible local export directory.

## Connecting a real project

Public `Project ID` and `dataset`, editor/administrator access to the selected project, and a decision about dataset visibility and Studio hosting are required. A read token is needed for a private dataset and draft preview; use a separate server token with minimum necessary rights. Do not send tokens in ordinary chat.

Public Studio settings:

```text
SANITY_STUDIO_PROJECT_ID=<real project id>
SANITY_STUDIO_DATASET=<real dataset>
```

Server build settings:

```text
SANITY_PROJECT_ID=<same project id>
SANITY_DATASET=<same dataset>
SANITY_API_READ_TOKEN=<secure session environment, if required>
DWC_CONTENT_SOURCE=sanity
```

Empty values are not replaced with an invented project. Example variable names: `cms/.env.example`; it contains no secrets. These values must be available to the build process itself. Sites production runtime variables are not assumed to be automatically available to a local build. Studio receives only public identifiers; the read token must not have a SANITY_STUDIO_ or PUBLIC_ prefix.

After access to a real account:

1. Select an existing project and dataset; agree on the cost of a new project if none exists. Record real IDs.
2. Install separate Studio dependencies and open the editor: `npm ci --prefix cms/studio`, then `npm run cms:studio` in an authorized environment.
3. Sign in to Sanity CLI/Studio normally; assign roles and exact allowed origins. Do not enable public dataset writes.
4. On a separate user import instruction, run from `cms/studio/`: `npx --no-install sanity datasets import ../exports/current-content.tar.gz <dataset>`. Existing IDs fail by default; do not automatically apply `--replace`. Import creates published documents, not only local files.
5. If needed, deploy Studio separately to Sanity; the public site build does not deploy the administrative panel.
6. Once data is ready, enable `DWC_CONTENT_SOURCE=sanity`, build and publish the specific version. Local remains active until these steps are complete.

All authorized read/write operations must use the correct project and access. Do not guess project IDs or commit secrets.

## Drafts and preview

```sh
npm run cms:preview:build
```

The command requires a server read token, reads `perspective: drafts` without the API CDN and produces a **separate** `.migration/preview/` directory, never `dist/`. The normal production build refuses `DWC_BUILD_TARGET=preview`. The draft snapshot is separate as well. Preview documents include noindex.

For a portable environment:

```sh
npm run cms:preview:serve
```

The server listens only on `127.0.0.1:4322` and requires HTTP Basic authentication: user `preview`, password from the private `DWC_PREVIEW_ACCESS_PASSWORD` variable of at least 24 characters. The password is not printed, stored in the URL or written into the build. Responses use no-store. This is a local article-page preview; links to public sections not yet enabled do not make it a complete site copy.

In managed Linux this server was intentionally disabled in favor of supported Sites preview/CUA. No alternative browser server was started to bypass this. Hosted protected preview and Studio visual editing were not connected; these need a separate hosting/auth solution. Do not publish `.migration/preview` or drafts.json to public hosting.

## Publication and updates

At the time, Sanity did not automatically trigger deployment: editor publication required a new site build and publication. This was an expected block 3 boundary. Block 4 content webhooks update content but must not automatically run tests or visual QA.

Unpublishing/hiding one locale excludes the entire EN/ES pair from the next build. Deleting the last pair stops the build rather than publishing an empty site. Independent locales require a separate URL-contract change.

Rollback to the then-current local content: `npm run build:rollback` selects the old renderer and local source regardless of Sanity variables. A saved Sites version can also restore the public version. CMS documents are not deleted by rollback.

## Sources

- https://www.sanity.io/docs/apis-and-sdks/js-client-querying
- https://www.sanity.io/docs/content-lake/importing-data
- https://www.sanity.io/docs/studio/config-api-reference
- https://www.sanity.io/docs/studio/validation
