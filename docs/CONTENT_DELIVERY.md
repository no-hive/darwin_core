# Block 4 — content events and media delivery

## Status and boundaries

At the time of this report, the build included responsive media for articles and Blog, variants cached by source hash, and a private manifest of changed/removed URLs. A separate Sanity receiver Worker with D1 outbox had been prepared and compiled. This did not mean that the Worker, D1 or webhooks were connected.

Sanity project ID, dataset and access were still unavailable. No external services, secrets, schedules or automatic publications had been created. The main Site remained static and used local content. Active webhooks required completed block 3, deployment of the delivery endpoint and a trusted build runner. Regression tests, typecheck, browser QA, load measurements and test webhook delivery were neither requested nor run.

## Images available in the build

- `src/build-media.mjs` collects local images from the shared article catalog.
- `src/render-media.py` creates lossless WebP variants up to 480/768/1200/1600 px wide, preserving aspect ratio, transparency and ICC profile. There is no upscaling, cropping or alteration of illustrations. Downscaled variants use resampling, so pixel identity with browser scaling of the original is not claimed.
- Names include the source hash, pipeline version and Pillow version. Each source has its own variants; unchanged variants are not re-encoded.
- Originals and their URLs are preserved. A local img's `src` remains the original; `srcset` lets the browser choose a smaller file. Retained originals may increase the publication package size; no reduction of the complete dist is claimed.
- The early significant article image and Blog featured preview receive eager/high; in-text images are lazy/async. Width/height attributes are retained.
- `sizes` accounts for article width and responsive Blog. When selection changes, Blog updates src, srcset, sizes and dimensions together.
- Connected Sanity images use uniform CDN variants `w`, `fit=max`, `auto=format`, without cropping. CDN images are not downloaded again or processed by Pillow during the build.
- Preview gets its own assets and remains outside public dist.
- About, Tools and App are not visually rewritten by this block. CSS was not changed.

`/assets/optimized/` contains only variants for the current catalog. Old cache files may remain locally in `.migration/media/files`, but are not copied into a new dist. Removing all originals/unused assets is a separate block 9 task.

Fingerprinted URLs support long caching. Actual HTTP Cache-Control on static Sites is determined by the platform: this block does not add unsupported `_headers` or invented manifest fields. With an external CDN, hashed assets can use immutable caching and HTML a short cache/invalidation. Correct headers are not claimed without a real connection.

## Delivery manifest

A build creates `.migration/delivery/candidate.json` and `changes.json`. Hashes of all unversioned pages and assets are tracked, including legacy aliases, sitemap, robots and JS/CSS. Hashed media are listed separately as assets. Removed content disappears from localized pages and its old alias; the old article source template is no longer copied to publication.

The delta uses only a manifest recorded after successful deployment:

```text
DWC_PUBLISHED_DEPLOYMENT_ID=<exact successful Sites deployment id>
```

```sh
npm run cms:delivery:record-publication
```

The command stores a trusted caller's receipt. It does not independently query Sites to verify deployment and must not be called for pending/failed deployments. Before the first receipt all assets are considered new. This compares generated output for delivery/caching, not UI baseline QA. Manual regression checks still require an explicit user request.

Publication remains entirely static. The manifest prepares targeted external cache purging, but does not turn the build into incremental SSR. Automatic purge/revalidation on a real CDN was not performed. An external runner needs persistent storage for the publication receipt: `.migration/` in this checkout is a local cache, not reliable shared cloud storage.

## Receiving Sanity events

Source: `cms/delivery/worker.mjs`; D1 schema: `cms/delivery/schema.sql`. Deployment template: `wrangler.jsonc.example`; real database_id and secrets were not inserted. `npm run cms:delivery:build` creates `.migration/delivery/worker.mjs` but deploys nothing.

POST `/webhooks/sanity`:

1. Limits the body to 64 KiB and verifies the official Sanity HMAC on the raw text before parsing JSON, using `@sanity/webhook` 4.0.4.
2. Validates signature, project/dataset, document type/ID/revision and operation.
3. Ignores drafts/versions. The outbox stores ID/revision/operation, without article text or secrets. The configuration secret must be unique to the webhook.
4. Derives the key from signed values; it does not trust an arbitrary external `idempotency-key`. Redelivery does not create another rebuild.
5. Stores the event and increments the shared job version in one D1 batch transaction. A new job is ready in 10 seconds; later events are coalesced without indefinite postponement during continuous changes.
6. Returns 202 after storage, not after the site build.

Filter/projection template: `cms/delivery/webhook.example.json`. Article, topic, author and image-asset create/update/delete events are processed. Publishing and unpublishing are changes to a published document. After an event a fresh published catalog is fetched; event content is not applied as a patch. Thus a late deletion event must not directly remove a newer version.

The endpoint had no real traffic at the time of this report: blueprint and receiver were not checked by external delivery. The 10-second delay is batching, not proof of Content Lake consistency. A connected runner must allow for eventual consistency: wait for publication/revision availability or retry fetching.

## Trusted runner contract

All `/jobs/*` endpoints require a separate `Authorization: Bearer <DELIVERY_RUNNER_TOKEN>`, distinct from `SANITY_WEBHOOK_SECRET`. The Worker does not accept shell commands, arbitrary deployment URLs or Git/Sites access from webhook payloads.

| Endpoint | Purpose |
| --- | --- |
| POST `/jobs/claim` | Atomically claim a ready job, claimed version and lease token |
| POST `/jobs/renew` | Extend an active lease by 15 minutes |
| POST `/jobs/complete` | Confirm a specific successful deployment |
| POST `/jobs/fail` | Return a job with backoff or mark dead after five attempts |

Renew/complete/fail accept `{leaseToken, version}`. Complete also requires `deploymentId`; fail requires a build_failed/deploy_failed/cancelled code. An expired or reclaimed lease cannot complete another worker's job. New events during a build leave another pending job. After five failures the cause needs investigation; a new event can start another processing cycle.

The runner must:

1. Claim without concurrent deployments of one Site.
2. Obtain current source, server/build secrets and published content.
3. Allow for CMS consistency delay and run a production build.
4. Save/publish the exact commit and matching archive through the supported Sites flow. Wait for terminal success.
5. If needed, apply changed/removed URLs to the chosen external CDN.
6. Only after success, record the publication receipt and complete with the real ID. On failure, call fail; after losing its lease the old runner must stop and not publish after a newer job. The complete endpoint does not itself verify Sites.

The contract prepares publication automation, but **a specific runner, unattended Sites access and persistent publication storage were not yet connected**. The lease protects the queue but does not lock the native Sites API: a future runner must serialize and check freshness immediately before publication. Without that, automatic deployment cannot be called ready. No runner stage should automatically run verify/Playwright/typecheck.

An additional scheduled handler removes dedupe metadata older than 30 days, but cron was not configured. After retention expires, repeating an old event may cause a redundant refresh with current state, not restoration of old text.

## Requirements for activation

- Complete block 3 Sanity integration.
- Select and authorize hosting for the delivery Worker and D1, apply schema.sql once, and set separate webhook/runner secrets in secret storage.
- Assign a trusted runner with legitimate unattended access to sources and Sites.
- Register a real webhook with exact source and signing.
- Choose CDN/invalidation if current hosting is insufficient.
- Check delivery, retry, duplicates, deletion, access and failure only upon a separate request. Do not present prepared code as verified integration.

Changing Site access, configuring schedules, creating accounts and paid resources were not automatically performed by this block.

## Sources

- https://www.sanity.io/docs/content-lake/webhook-best-practices
- https://www.sanity.io/docs/content-lake/webhooks
- https://github.com/sanity-io/webhook-toolkit
- https://www.sanity.io/docs/content-lake/image-urls
