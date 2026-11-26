DO $migration$
BEGIN
  CREATE TABLE dwc.profiles (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject text NOT NULL UNIQUE,
    handle text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
    job text NOT NULL DEFAULT '' CHECK (char_length(job) <= 200),
    month integer NOT NULL DEFAULT 0 CHECK (month BETWEEN 0 AND 12),
    year integer NOT NULL DEFAULT 0 CHECK (year = 0 OR year BETWEEN 1900 AND 2100),
    scores jsonb NOT NULL DEFAULT '[1,1,1,1,1,1]'::jsonb CHECK (
      jsonb_typeof(scores) = 'array' AND jsonb_array_length(scores) = 6
      AND NOT jsonb_path_exists(scores, '$[*] ? (@.type() != "number" || @ < 1 || @ > 10)')),
    power integer NOT NULL DEFAULT 0 CHECK (power BETWEEN 0 AND 1000000),
    version integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE dwc.groups (
    id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,80}$'),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    description jsonb NOT NULL DEFAULT '{}'::jsonb,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    news jsonb NOT NULL DEFAULT '{}'::jsonb
  );
  CREATE TABLE dwc.memberships (
    group_id text NOT NULL REFERENCES dwc.groups(id),
    profile_id text NOT NULL REFERENCES dwc.profiles(id),
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, profile_id)
  );
  CREATE INDEX memberships_profile_group ON dwc.memberships(profile_id, group_id);
  CREATE TABLE dwc.research (
    id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,80}$'),
    title jsonb NOT NULL,
    description jsonb NOT NULL DEFAULT '{}'::jsonb
  );
  CREATE TABLE dwc.research_groups (
    research_id text NOT NULL REFERENCES dwc.research(id),
    group_id text NOT NULL REFERENCES dwc.groups(id),
    PRIMARY KEY (research_id, group_id)
  );
  CREATE INDEX research_groups_group ON dwc.research_groups(group_id, research_id);
  CREATE TABLE dwc.findings (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    author_id text NOT NULL REFERENCES dwc.profiles(id),
    title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
    scientific_name text NOT NULL CHECK (char_length(btrim(scientific_name)) BETWEEN 1 AND 120),
    description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 3000),
    observed_on date NOT NULL,
    location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 1 AND 200),
    evidence text NOT NULL CHECK (char_length(btrim(evidence)) BETWEEN 1 AND 1000),
    status text NOT NULL DEFAULT 'review' CHECK (status IN ('review','verified')),
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','group','public')),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX findings_author_id ON dwc.findings(author_id, id);
  CREATE TABLE dwc.finding_groups (
    finding_id text NOT NULL REFERENCES dwc.findings(id),
    group_id text NOT NULL REFERENCES dwc.groups(id),
    PRIMARY KEY (finding_id, group_id)
  );
  CREATE INDEX finding_groups_group ON dwc.finding_groups(group_id, finding_id);
  CREATE TABLE dwc.finding_research (
    finding_id text NOT NULL REFERENCES dwc.findings(id),
    research_id text NOT NULL REFERENCES dwc.research(id),
    PRIMARY KEY (finding_id, research_id)
  );
  CREATE TABLE dwc.proposals (
    id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,80}$'),
    group_id text NOT NULL REFERENCES dwc.groups(id),
    title jsonb NOT NULL,
    description jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL CHECK (status IN ('active','executed','defeated','closed')),
    closes_at timestamptz
  );
  CREATE INDEX proposals_group ON dwc.proposals(group_id, id);
  CREATE TABLE dwc.votes (
    proposal_id text NOT NULL REFERENCES dwc.proposals(id),
    profile_id text NOT NULL REFERENCES dwc.profiles(id),
    choice text NOT NULL CHECK (choice IN ('for','against','abstain')),
    weight integer NOT NULL CHECK (weight BETWEEN 0 AND 1000000),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (proposal_id, profile_id)
  );
  CREATE TABLE dwc.tasks (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    owner_id text NOT NULL REFERENCES dwc.profiles(id),
    title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
    status text NOT NULL DEFAULT 'next' CHECK (status IN ('next','doing','review')),
    version integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX tasks_owner ON dwc.tasks(owner_id, id);
  CREATE TABLE dwc.command_receipts (
    profile_id text NOT NULL REFERENCES dwc.profiles(id),
    idempotency_key text NOT NULL,
    operation text NOT NULL,
    payload jsonb NOT NULL,
    result jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, idempotency_key)
  );
  CREATE TABLE dwc.outbox (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    operation text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
  );
  CREATE INDEX outbox_pending ON dwc.outbox(id) WHERE processed_at IS NULL;
  REVOKE ALL ON ALL TABLES IN SCHEMA dwc FROM PUBLIC;
END
$migration$;
