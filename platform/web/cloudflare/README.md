# Private aggregate metrics on Cloudflare

The browser sends one of four fixed event names to `/api/events`. The Worker immediately increments a daily D1 counter. It does not read or store an IP address, user agent, referrer, cookie, session identifier, URL, uploaded dataset, or article title.

## Deploy

1. Create a D1 database: `npx wrangler d1 create darwin-core-metrics`.
2. Copy `cloudflare/wrangler.jsonc.example` to `wrangler.jsonc` and insert the returned database ID.
3. Apply the schema: `npx wrangler d1 execute darwin-core-metrics --remote --file=cloudflare/schema.sql`.
4. Deploy the Worker and static assets together: `npx wrangler deploy`.

Until `/api/stats` is available, the Stats page visibly labels its numbers as preview data. After deployment it switches automatically to live aggregates.

## Data policy

- Retained fields: UTC day, event name, aggregate count.
- Recommended retention: keep daily rows for 13 months, then delete or roll them up.
- The language preference remains a local browser setting and is not sent with metrics.
- “Articles read” means the visitor reached 60% scroll depth in an article during that page load.
