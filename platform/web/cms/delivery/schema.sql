CREATE TABLE content_events (
  event_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  operation TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  enqueued INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX content_events_received_at ON content_events(received_at);
CREATE TABLE refresh_jobs (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  claimed_version INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  run_after INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  lease_token TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_deployment TEXT
);
