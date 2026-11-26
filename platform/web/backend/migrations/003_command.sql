CREATE FUNCTION dwc.command(p_subject text, p_key text, p_operation text, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, dwc
AS $function$
DECLARE
  actor dwc.profiles%ROWTYPE;
  receipt dwc.command_receipts%ROWTYPE;
  proposal dwc.proposals%ROWTYPE;
  target text;
  group_key text;
  research_key text;
  finding dwc.findings%ROWTYPE;
  task dwc.tasks%ROWTYPE;
  outcome jsonb;
  entity text;
BEGIN
  -- Serialise commands for one authenticated actor, including idempotent retries.
  SELECT * INTO actor FROM dwc.profiles WHERE subject=p_subject FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'enrollment_required'; END IF;
  IF p_key IS NULL OR p_key !~ '^[a-zA-Z0-9-]{16,80}$'
    OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'invalid_input'; END IF;
  SELECT * INTO receipt FROM dwc.command_receipts WHERE profile_id=actor.id AND idempotency_key=p_key;
  IF FOUND THEN
    IF receipt.operation<>p_operation OR receipt.payload<>p_payload THEN RAISE EXCEPTION 'idempotency_conflict'; END IF;
    RETURN receipt.result;
  END IF;
  target := p_payload->>'id';
  group_key := nullif(p_payload->>'groupId','');
  research_key := nullif(p_payload->>'researchId','');

  IF p_operation IN ('join','leave') THEN
    PERFORM 1 FROM dwc.groups WHERE id=target FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
    IF p_operation='join' THEN
      INSERT INTO dwc.memberships(group_id,profile_id) VALUES(target,actor.id) ON CONFLICT DO NOTHING;
    ELSE DELETE FROM dwc.memberships WHERE group_id=target AND profile_id=actor.id;
    END IF;
    entity:='groups';outcome:=jsonb_build_object('id',target,'member',p_operation='join');

  ELSIF p_operation='finding.create' THEN
    IF coalesce(p_payload->>'visibility','private') NOT IN ('private','group','public') THEN RAISE EXCEPTION 'invalid_input'; END IF;
    IF p_payload->>'visibility'='group' AND group_key IS NULL THEN RAISE EXCEPTION 'invalid_input'; END IF;
    IF group_key IS NOT NULL THEN
      PERFORM 1 FROM dwc.groups WHERE id=group_key FOR UPDATE;
      IF NOT EXISTS(SELECT 1 FROM dwc.memberships WHERE group_id=group_key AND profile_id=actor.id) THEN RAISE EXCEPTION 'forbidden'; END IF;
    END IF;
    IF research_key IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM dwc.research_groups rg JOIN dwc.memberships m ON m.group_id=rg.group_id
      WHERE rg.research_id=research_key AND m.profile_id=actor.id AND (group_key IS NULL OR rg.group_id=group_key)
    ) THEN RAISE EXCEPTION 'forbidden'; END IF;
    INSERT INTO dwc.findings(author_id,title,scientific_name,description,observed_on,location,evidence,visibility)
    VALUES(actor.id,(p_payload->>'title'),(p_payload->>'scientificName'),(p_payload->>'description'),
      (p_payload->>'date')::date,(p_payload->>'location'),(p_payload->>'evidence'),coalesce(p_payload->>'visibility','private'))
    RETURNING * INTO finding;
    target:=finding.id;
    IF group_key IS NOT NULL THEN INSERT INTO dwc.finding_groups VALUES(target,group_key); END IF;
    IF research_key IS NOT NULL THEN INSERT INTO dwc.finding_research VALUES(target,research_key); END IF;
    entity:='findings';outcome:=to_jsonb(finding);

  ELSIF p_operation='finding.attach' THEN
    PERFORM 1 FROM dwc.groups WHERE id=group_key FOR UPDATE;
    IF NOT EXISTS(SELECT 1 FROM dwc.memberships WHERE group_id=group_key AND profile_id=actor.id) THEN RAISE EXCEPTION 'forbidden'; END IF;
    SELECT * INTO finding FROM dwc.findings WHERE id=target AND author_id=actor.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
    INSERT INTO dwc.finding_groups VALUES(target,group_key) ON CONFLICT DO NOTHING;
    entity:='findings';outcome:=jsonb_build_object('id',target,'groupId',group_key);

  ELSIF p_operation='vote' THEN
    SELECT * INTO proposal FROM dwc.proposals WHERE id=target FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
    IF proposal.status<>'active' OR (proposal.closes_at IS NOT NULL AND proposal.closes_at<=now()) THEN RAISE EXCEPTION 'proposal_closed'; END IF;
    IF NOT EXISTS(SELECT 1 FROM dwc.memberships WHERE group_id=proposal.group_id AND profile_id=actor.id) THEN RAISE EXCEPTION 'forbidden'; END IF;
    IF coalesce(p_payload->>'choice','') NOT IN ('for','against','abstain') THEN RAISE EXCEPTION 'invalid_input'; END IF;
    INSERT INTO dwc.votes(proposal_id,profile_id,choice,weight) VALUES(target,actor.id,p_payload->>'choice',actor.power)
    ON CONFLICT(proposal_id,profile_id) DO UPDATE SET choice=excluded.choice,weight=excluded.weight,updated_at=now();
    entity:='proposals';outcome:=jsonb_build_object('id',target,'choice',p_payload->>'choice','weight',actor.power);

  ELSIF p_operation='profile.update' THEN
    IF actor.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RAISE EXCEPTION 'version_conflict'; END IF;
    UPDATE dwc.profiles SET name=(p_payload->>'name'),job=p_payload->>'job',
      month=(p_payload->>'month')::integer,year=(p_payload->>'year')::integer,scores=p_payload->'scores',version=version+1
    WHERE id=actor.id RETURNING * INTO actor;
    target:=actor.id;entity:='profiles';outcome:=to_jsonb(actor)-'subject';

  ELSIF p_operation='task.create' THEN
    INSERT INTO dwc.tasks(owner_id,title) VALUES(actor.id,(p_payload->>'title')) RETURNING * INTO task;
    target:=task.id;entity:='tasks';outcome:=to_jsonb(task);

  ELSIF p_operation='task.advance' THEN
    SELECT * INTO task FROM dwc.tasks WHERE id=target AND owner_id=actor.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
    IF task.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RAISE EXCEPTION 'version_conflict'; END IF;
    UPDATE dwc.tasks SET status=CASE status WHEN 'next' THEN 'doing' WHEN 'doing' THEN 'review' ELSE 'next' END,version=version+1
    WHERE id=target RETURNING * INTO task;
    entity:='tasks';outcome:=to_jsonb(task);
  ELSE RAISE EXCEPTION 'invalid_operation';
  END IF;
  INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES(entity,target,p_operation);
  INSERT INTO dwc.command_receipts(profile_id,idempotency_key,operation,payload,result) VALUES(actor.id,p_key,p_operation,p_payload,outcome);
  RETURN outcome;
END
$function$;
