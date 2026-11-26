DO $migration$
BEGIN
  CREATE TABLE dwc.search_documents (
    kind text NOT NULL CHECK(kind IN ('profiles','groups','research','findings','proposals','tasks','articles')),
    entity_id text NOT NULL,
    locale text NOT NULL CHECK(locale IN ('en','es')),
    title text NOT NULL CHECK(char_length(title)<=500),
    body text NOT NULL CHECK(char_length(body)<=12000),
    href text NOT NULL,
    source_hash text NOT NULL,
    indexed_at timestamptz NOT NULL DEFAULT now(),
    terms tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple'::regconfig,dwc.search_fold(title)),'A') ||
      setweight(to_tsvector('simple'::regconfig,dwc.search_fold(body)),'B')
    ) STORED,
    PRIMARY KEY(locale,kind,entity_id)
  );
  CREATE INDEX search_documents_terms ON dwc.search_documents USING gin(terms);
  CREATE INDEX search_documents_entity ON dwc.search_documents(kind,entity_id);
  ALTER TABLE dwc.outbox ADD COLUMN attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 8);
  ALTER TABLE dwc.outbox ADD COLUMN available_at timestamptz NOT NULL DEFAULT now();
  ALTER TABLE dwc.outbox ADD COLUMN last_error_code text;
  ALTER TABLE dwc.outbox ADD COLUMN source_cursor text NOT NULL DEFAULT '';
  DROP INDEX dwc.outbox_pending;
  CREATE INDEX outbox_ready ON dwc.outbox(available_at,id) WHERE processed_at IS NULL AND attempts<8;
  CREATE INDEX outbox_dead ON dwc.outbox(id) WHERE processed_at IS NULL AND attempts=8;
  -- Published CMS input is staged by generation. Activation is a single pointer
  -- update, so missing/deleted articles disappear from search immediately.
  CREATE TABLE dwc.article_search_runs (
    id text PRIMARY KEY,
    source_project text NOT NULL,
    source_dataset text NOT NULL,
    release_id text NOT NULL,
    expected_count integer NOT NULL CHECK(expected_count BETWEEN 0 AND 200000),
    status text NOT NULL DEFAULT 'staging' CHECK(status IN ('staging','active','superseded')),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE dwc.article_search_rows (
    run_id text NOT NULL REFERENCES dwc.article_search_runs(id),
    article_id text NOT NULL CHECK(article_id ~ '^[a-zA-Z0-9_-]{1,160}$'),
    locale text NOT NULL CHECK(locale IN ('en','es')),
    slug text NOT NULL CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 500),
    body text NOT NULL CHECK(char_length(body)<=12000),
    PRIMARY KEY(run_id,article_id,locale),
    UNIQUE(run_id,locale,slug)
  );
  CREATE TABLE dwc.article_search_state (
    singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
    active_run text REFERENCES dwc.article_search_runs(id),
    revision integer NOT NULL DEFAULT 0
  );
  INSERT INTO dwc.article_search_state(singleton) VALUES(true);
  REVOKE ALL ON ALL TABLES IN SCHEMA dwc FROM PUBLIC;
END
$migration$;
