CREATE TABLE IF NOT EXISTS daily_metrics (
  day TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('page_view', 'article_read', 'tool_run', 'result_export')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, metric)
) WITHOUT ROWID;
