# Block 6 — App server boundary

November 15, 2026. SQL migrations, an API Worker, asynchronous client and operator commands were prepared. Isolated API and client builds succeeded. SQL/API tests, typecheck of the new block and real database requests were not run: the verification request concerned the previous iteration, documented in `BLOCK5_REVIEW.md`.

**No live connection was made.** Sites remained static and users used the prior local demo. No PostgreSQL project, runtime role or secrets were provided. The Worker was outside dist and not deployed; signing in to the private Site did not itself create a server account in App. The asynchronous client was not connected to active screens. This was prepared server code for block 6, not a completed migration of users and data.

## Technical design

- API: TypeScript, standard Request/Response, a Cloudflare Worker module designed for the trusted Sites dispatch boundary. No framework was added for a few JSON routes; the Astro/React static site remains.
- Authentication: existing Sites login and server identity headers. No second OAuth or custom cookie/session system. `oai-authenticated-user-id` supplies the subject; email is not an ID. Writes without identity are forbidden, including service bypass without a user.
- PostgreSQL: Neon HTTP driver 1.2.0 was prepared. HTTPS fits the Sites environment without raw TCP. This is a selected adapter, not a created or paid account.
- SQL uses separate versioned migrations. Business commands execute in a PostgreSQL function: one transaction for the change, outbox and receipt. The runtime role has only schema USAGE and EXECUTE on three functions; tables, DDL, power and subject are not exposed for arbitrary modification through the API.
- The HTTP boundary validates JSON schema/unknown fields, real calendar dates, body size up to 16 KB, same-origin writes and Idempotency-Key. Errors do not expose SQL, credentials or upstream connection strings.
- UUID/id is server assigned. An idempotency key is tied to user, operation and payload. A repeat with the same key returns the previous result; a different payload gives 409. Profile/task version protects against lost updates.
- Lists use keyset cursors and at most 100 records. The full catalog is not loaded into browser bootstrap. Full-text search, outbox queue/worker and additional load-based indexes are block 7.

## Entities and rules

| Data | Storage and server permissions |
| --- | --- |
| Profiles | Subject is unique; registration is separate via enroll; only the owner edits a profile |
| Groups/memberships | Open groups within the Site, self-service join/leave |
| Findings | Author comes from identity; users may attach only their own finding to a group they belong to |
| Research | Reference data and group relationships; finding creation checks research access |
| Proposals/votes | Only active before closes_at and for group members; one vote per user, weight from the database |
| Tasks | Server API tasks are personal; only the owner changes status with the expected version |
| Outbox/receipts | Written atomically; unavailable through client read endpoints |

For future activation, profiles/groups/research/proposals are visible to registered visitors admitted by Sites. Other users' month/year and internal subject are not returned. Findings: private is visible to the author; group to the author and current members of the linked group; public to admitted visitors. Visibility remains within the current Site audience and does not change sharing to public. Findings default to private. Tasks belong to their owner; the previous local board continues as before. Shared team tasks require a separate group/permission model, not a permission granted to every user.

A real new profile is not automatically linked to Alan Li or other demo characters; its voting weight defaults to 0. Assigning weight requires a separate administrative rule. Browser reset applies only to the demo: the API has no shared database delete/reset command. No automatic import of localStorage, demo votes or personal information is provided.

## Contract

Types: `frontend/api/contracts.ts`; transport: `frontend/api/client.ts`. `useApiQuery` stores loading/data/error, cancels stale requests and does not replace server errors with local seed data. Reuse one idempotencyKey with the same payload when retrying a command; create a new key for a new action. Do not silently retry with a new key after timeout.

| Route | Purpose |
| --- | --- |
| GET /api/v1/session | Login state and own profile, or null |
| POST /api/v1/enroll | Create an account from trusted identity, body {} |
| GET /api/v1/entities/:kind?limit=50&cursor=… | Entity page, items/nextCursor |
| GET /api/v1/entities/:kind/:id | One accessible entity; inaccessible entities appear as 404 |
| POST /api/v1/commands | operation/payload plus Idempotency-Key |

Kinds: profiles, groups, research, findings, proposals, tasks. Operations: join, leave, finding.create, finding.attach, vote, profile.update, task.create, task.advance. JSON envelope: data/requestId or error.code/requestId. 401 means not signed in; 403 means no account/permission; 409 means replay/version/closed vote; 503 means database not configured or temporarily unavailable. There is no silent fallback.

The existing `AppRepository` returns a synchronous complete model. The new API is intentionally not disguised as that interface: live screen migration needs async queries/commands, server DTOs, loading/error states, registration and pagination. One DATABASE_URL cannot enable it while retaining false local permissions and synchronous optimistic changes.

## Operator commands

The commands below are not invoked by build, CI, hooks or page load. Provide secrets securely in the environment; do not put them in commands/history, source, the client bundle or `.openai/hosting.json`. Names are in `backend/.env.example`. Migrations use a separate admin role; the runtime URL belongs to another restricted role. One dwc schema is intended for one Site, not multiple projects.

```sh
# Compile only; does not deploy or connect to the database
npm run api:build

# Migration plan, without connecting
npm run api:migrate

# After selecting the real database, in an environment with DWC_MIGRATION_DATABASE_URL
npm run api:migrate -- --apply

# Existing separate DWC_RUNTIME_DB_ROLE without ownership or owner inheritance
node backend/scripts/grant-runtime.mjs --apply

# Optional: only missing demo reference data, without users
node backend/scripts/seed-reference.mjs --apply
```

Five migrations use SHA-256 receipts; changing an applied migration stops execution. DDL and its receipt commit together. There is no automatic destructive down; subsequent schema changes use new migrations. Reference seed does not overwrite rows or create memberships, profiles, votes/findings. Arbitrary group/weight administration is not exposed through the user API.

## Requirements for live activation

1. Select a real Neon project/region and access/privacy rules; securely provide admin/runtime connections. Determine cost and data residency for the selected project; no paid resources were created.
2. Apply migrations/permissions to the selected database and store runtime secrets through Sites. DWC_API_ENABLED=true, DWC_DATABASE_URL and DWC_SITE_ORIGIN are server-only.
3. Integrate handleApi into the current Site's server build, preserving static assets, all URLs and Sites dispatch identity. The Worker currently serves only /api/v1 and does not replace whole-site hosting: static cannot simply be removed from the manifest and the Worker deployed instead of pages. Separate API hosting without identity verification is unsafe: an ordinary HTTP client can spoof headers, and Sites supplies the trust boundary.
4. Connect real accounts/async DTOs to React screens and agree on server-mode differences (visibility, tasks, voting rights) before migrating users.
5. On a separate request, verify real PostgreSQL, two users, negative permissions, concurrent commands/rollback/retries, secret isolation, previous interfaces and behavior; measure load after volume requirements are defined.

These are remaining block 6 activation tasks; prepared code is not proof of production readiness. API tests and migrations were not run. The new publication includes block 5 fixes; server mode remains disabled.

Sources: React hydrateRoot/act — https://react.dev/reference/react-dom/client/hydrateRoot, https://react.dev/reference/react/act; Neon driver — https://github.com/neondatabase/serverless/blob/main/CONFIG.md, https://github.com/neondatabase/serverless/blob/main/CHANGELOG.md.

## Block 7 continuation

SEARCH_INDEXING_INTEGRATION.md: migrations 006–017, search endpoint, separate job role and CMS projection building were added. The runtime grant now includes four API functions, including dwc.search; the three mentioned earlier refer to the original block 6 preparation. adminDatabase uses a fresh HTTP timeout for each request; job/API connections likewise do not share one timer across a multistep run. API/job grants set statement/lock timeouts. All new connections remain disabled; migrations and checks were not run.
