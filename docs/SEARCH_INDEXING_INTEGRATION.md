# Block 7 — search and background jobs

November 15, 2026. Isolated server preparation was implemented on block 6: SQL search, outbox indexer, asynchronous client, operator commands and transfer of the published article catalog. API, client and two indexer adapters compiled. Checks were not run, as agreed: no SQL/PostgreSQL, typecheck, functional/load tests or browser/screenshot comparisons.

**External activation was pending.** PostgreSQL, Sanity and App server mode were not connected. New endpoints and handler were not deployed; no schedule was created. The published site retained its interface and local search. Backend builds are in `.migration/api`, outside published dist. Do not present this preparation as a working production queue or measured site speedup.

## Implementation

| Area | Implementation |
| --- | --- |
| Index | PostgreSQL search_documents, GIN on tsvector, separate EN/ES rows |
| Normalization | Unicode NFC, case, main EN/ES diacritics; no additional extension |
| Results | Weighted title/text matches, stable tie resolution, cursor pagination |
| Suggestions | Lexeme prefix match, up to 6 results, at least 2 characters per lexeme |
| Query limits | q up to 200 characters, up to 64 tsquery nodes; queries without a positive indexable part are rejected |
| Permissions | Database checks current author/visibility/membership for every result |
| Queue | Existing transactional outbox, SKIP LOCKED, retries/delay/failed jobs |
| Rebuild | Up to 100 IDs per step, cursor continuation, orphan removal |
| CMS | Published catalog staging in batches of 50 and atomic generation switch |
| Isolation | API role gets search; a separate job role gets only index_batch/index_prune |

Meilisearch is not added before PostgreSQL measurements and clarification of typo/morphology/load requirements. PostgreSQL reduces external systems to operate, pay for and synchronize. This choice does not establish performance at a particular volume.

## Search contract

`GET /api/v1/search` operates within the same Sites identity boundary as the block 6 API. Users must sign in and register a profile. The endpoint does not make the Site or private articles/findings public. Anonymous public article search is a separate future integration; this endpoint is for App.

| Parameter | Value |
| --- | --- |
| q | 2–200 characters; an empty query does not load the full catalog |
| locale | en / es |
| types | profiles, groups, research, findings, proposals, tasks, articles |
| scope | all / mine / discover |
| group | Optional group ID |
| author | Optional finding author ID |
| mode | search / suggest |
| limit | 1–100; suggest 1–6 |
| cursor | Continuation of exactly the same query/filters |

By default, profiles/groups/research/findings are searched. Articles and other entities must be explicitly included. Response: data.items + nextCursor, without an expensive total COUNT. Item: kind/id/locale/title/summary/href/score. Summary is plain text, not HTML. Cursor stores integer score/kind/id and a query fingerprint; it grants no permissions and does not guarantee a snapshot when the index changes between pages. Live changes may cause omissions/duplicates; refreshing from the first page starts current results.

`search` uses websearch_to_tsquery: words, quotes, OR and exclusions. `suggest` uses escaped prefixes of ordinary lexemes. This differs from current browser substring search: behavior must be separately agreed and checked before React server mode is connected. Local search remains unchanged. There is no typo correction or morphological stemming. The simple configuration suits names/scientific terms but does not promise complete linguistic processing.

mine includes the user's own profile/findings/tasks, groups and associated research/proposals. discover excludes the user's own groups. author filters findings rather than searching a person's name across all types. The UI category records will need mapping to server findings through a future adapter.

## Privacy and freshness

The index contains text, including private findings, and is unavailable to the browser or direct SQL through the API role. search_allowed checks current visibility and membership; tasks are visible only to their owner. The index excludes subject, email, month/year and credentials. Private results are not included in a returned COUNT: there is no total counter.

Results compare SHA-256 of current title/body/href with the index and display text from the current source. Deleted and edited records are temporarily excluded until the index catches up. Membership revocation takes effect without waiting for jobs. This also prevents matches on old hidden text after editing. New/changed records may be absent until the outbox is processed; search read-your-writes and a delay SLA are not promised. The ordinary read API remains separate.

## Processor

Block 6 commands already create outbox events in the same transaction as data. Reference seed now does so atomically too. Direct administrative SQL outside these paths must write an outbox event or run rebuild; triggers for arbitrary table changes were not installed.

`index_batch` takes up to 50 ready events using FOR UPDATE SKIP LOCKED. By default one run processes up to 3 batches of 10 events within a 20-second budget. EN/ES projection and processed_at commit in one SQL transaction. Jobs have no external side effects, so a lease between requests is unnecessary. Rollback leaves an event unprocessed; a lost HTTP response does not require blind acknowledgment. Parallel processors skip locked rows.

An individual job error rolls back its suboperations, stores SQLSTATE without error text/data and schedules retries after 60, 120, 240… seconds, up to one hour. After 8 errors explicit retry is required. Statement timeout aborts the entire current SQL batch: its changes/acks roll back. Previously committed batches remain. Runtime/job role configuration sets statement_timeout 8s and lock_timeout 2s; HTTP timeout is 10s. These limits are not latency measurements and need confirmation in the selected database.

On profile name changes, fanout indexes its findings in steps of 100 IDs. Full rebuild reads bounded ID pages from source and old index, also removing stale records. Business tables are not cleared; valid old projections continue to work. Repeated events may reindex a document again; this is idempotent, not a claim of global exactly-once delivery.

Retention per run: up to 500 processed events older than 7 days and up to 500 rows of one inactive CMS generation older than 7 days. Failed jobs and the active catalog are not removed. Queue counters and up to 100 failed job IDs are available to the operator; there is no public administration endpoint. Scheduling and error monitoring require real hosting; built-in logs contain run ID and counters.

## CMS articles

`api:sync-articles` accepts the existing normalized Sanity snapshot: schema=1/source=sanity/perspective=published. Project/dataset must match the environment. EN/ES pairs, slug/ID, dates and text are validated before writing. DWC_SEARCH_RELEASE_ID of a selected successful Sites publication is required. This is an operator association with a confirmed release, not cryptographic proof that arbitrary JSON was published: use only a trusted snapshot from the same production pipeline. Never pass draft preview here.

File limit: 64 MiB; up to 200000 localized rows. Each document indexes its title and first 12000 characters of dek/text blocks. This is a bounded search projection, not a copy of all media or complete text of long articles. Full-content search of long items requires chunking and separate quality criteria. The Sites build still rebuilds the static catalog; this block does not turn publication of thousands of articles into incremental SSR.

Upload goes to an inactive generation in batches of 50. An error before activate does not change the active catalog. Activate checks count/pair completeness and expected revision so an older concurrent loader cannot overwrite an already activated generation. One pointer changes and a rebuild starts from the beginning. Removed publications stop appearing immediately after the switch even with an old projection. A confirmed empty catalog also requires DWC_SEARCH_ALLOW_EMPTY=true; by default empty input does not deactivate current articles. The CMS build itself refused an empty catalog at the time; changing that policy is separate.

## Connection commands after database selection

At the time, no command with --apply had been run. Migrations 001–005 were retained and 006–017 added. PostgreSQL 15+ with UTF8, separate API/job roles and a schema owner for migrations are required. Migrations are not run by build/CI/page load.

```sh
# Compile the API, client and indexing adapters only
npm run api:build

# First select the real database and server-only credentials
npm run api:migrate -- --apply
node backend/scripts/grant-runtime.mjs --apply
node backend/scripts/grant-indexer.mjs --apply

# Plan without connecting; --apply performs one bounded pass
npm run api:index
npm run api:index -- --apply

# Administrative operations on the selected database
npm run api:index:maintenance -- status --apply
npm run api:index:maintenance -- rebuild findings --apply
npm run api:index:maintenance -- rebuild articles --apply
# retry accepts actual job IDs from status, at most 100

# Only after successful deployment of the corresponding published snapshot
npm run api:sync-articles -- --apply
```

DWC_INDEX_DB_ROLE differs from DWC_RUNTIME_DB_ROLE. Job secret DWC_INDEX_DATABASE_URL is available only to the processor; it has no API/user/search permissions, DDL or direct table access. DWC_MIGRATION_DATABASE_URL remains an operator secret. Search uses the existing DWC_DATABASE_URL through Sites. Scheduler adapter backend/src/indexing-worker.ts has no HTTP commands: fetch returns 404, scheduled runs a turn only with DWC_INDEXING_ENABLED=true. No Cron trigger, ChatGPT automation or new external service was created.

Live activation depends on block 6: Site server build, trusted identity, real database and async DTO connection to React. Then deploy the processor separately, choose frequency/limits based on load, and connect the published CMS pipeline after successful publication. Do not deploy the API-only Worker in place of the static site.

## Further verification — only on request

A real PostgreSQL instance is needed to check migrations, API/job role grants, EN/ES FTS, accent/prefix/phrase queries, cursor/filter mismatch, negative permissions for two users, text/author/membership changes, deleted sources, parallel index_batch, rollback/timeouts, retries/dead recovery, complete rebuild, interrupted/empty/concurrent CMS imports and active-catalog retention. Once volumes are defined, check query plans, p95, indexing delay, backfill speed and writer load. None of these checks had been performed at the time.

Rolling back Sites publication restores the previous static site; its backend was disabled. For future server activation, first disable scheduler/new search mode; do not automatically run schema down or delete business data. The next independent practical block is 8: Tools file processing.

Sources: [PostgreSQL GIN](https://www.postgresql.org/docs/current/gin.html), [text search functions](https://www.postgresql.org/docs/current/functions-textsearch.html), [SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html), [Unicode normalization](https://www.postgresql.org/docs/current/functions-string.html), [Neon configuration](https://github.com/neondatabase/serverless/blob/main/CONFIG.md).
