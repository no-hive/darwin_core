CREATE FUNCTION dwc.index_batch(p_limit integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE job dwc.outbox%ROWTYPE; target text; last_id text; n integer; done integer:=0; failed integer:=0; err text;
BEGIN
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  -- No remote side effects: projection and acknowledgement commit in this one
  -- transaction. Row locks replace cross-request leases; rollback releases them.
  FOR job IN SELECT * FROM dwc.outbox WHERE processed_at IS NULL AND attempts<8 AND available_at<=now()
    ORDER BY available_at,id LIMIT p_limit FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      IF job.entity_type='rebuild' THEN
        IF job.entity_id NOT IN ('profiles','groups','research','findings','proposals','tasks','articles') THEN RAISE EXCEPTION 'invalid_input'; END IF;
        n:=0;last_id:='';
        FOR target IN SELECT dwc.index_ids(job.entity_id,job.source_cursor,100) LOOP
          INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES(job.entity_id,target,'search.reindex');n:=n+1;last_id:=target;
        END LOOP;
        IF n=100 THEN INSERT INTO dwc.outbox(entity_type,entity_id,operation,source_cursor) VALUES('rebuild',job.entity_id,'search.rebuild',last_id); END IF;
      ELSIF job.entity_type='author-findings' THEN
        n:=0;last_id:='';
        FOR target IN SELECT id FROM dwc.findings WHERE author_id=job.entity_id AND id>job.source_cursor ORDER BY id LIMIT 100 LOOP
          INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES('findings',target,'search.reindex');n:=n+1;last_id:=target;
        END LOOP;
        IF n=100 THEN INSERT INTO dwc.outbox(entity_type,entity_id,operation,source_cursor) VALUES('author-findings',job.entity_id,'search.fanout',last_id); END IF;
      ELSE
        PERFORM dwc.index_project(job.entity_type,job.entity_id);
        IF job.entity_type='profiles' AND job.operation='profile.update' THEN
          INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES('author-findings',job.entity_id,'search.fanout');
        END IF;
      END IF;
      UPDATE dwc.outbox SET processed_at=now(),last_error_code=NULL WHERE id=job.id;
      done:=done+1;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err=RETURNED_SQLSTATE;
      -- Per-job subtransaction rolls back partial projections/continuations.
      UPDATE dwc.outbox SET attempts=attempts+1,last_error_code=err,
        available_at=now()+make_interval(secs=>least(3600,30*power(2,attempts+1)::integer)) WHERE id=job.id;
      failed:=failed+1;
    END;
  END LOOP;
  RETURN jsonb_build_object('processed',done,'failed',failed,'claimed',done+failed);
END
$function$;
