CREATE FUNCTION dwc.article_search_sync(p_operation text,p_run text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE run dwc.article_search_runs%ROWTYPE; current_run text; current_revision integer; item jsonb; total integer;
BEGIN
  IF p_operation='begin' THEN
    INSERT INTO dwc.article_search_runs(id,source_project,source_dataset,release_id,expected_count)
    VALUES(p_run,p_payload->>'projectId',p_payload->>'dataset',p_payload->>'release',(p_payload->>'count')::integer);
    RETURN jsonb_build_object('run',p_run);
  END IF;
  -- Lock order agrees for every writer. Multiple staging runs are allowed;
  -- activation compares the revision observed before staging to reject races.
  SELECT active_run,revision INTO current_run,current_revision FROM dwc.article_search_state WHERE singleton FOR UPDATE;
  SELECT * INTO run FROM dwc.article_search_runs WHERE id=p_run FOR UPDATE;
  IF NOT FOUND OR run.status<>'staging' THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF p_operation='stage' THEN
    IF jsonb_typeof(p_payload) IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'invalid_input'; END IF;
    FOR item IN SELECT * FROM jsonb_array_elements(p_payload) LOOP
      INSERT INTO dwc.article_search_rows(run_id,article_id,locale,slug,title,body)
      VALUES(p_run,item->>'id',item->>'locale',item->>'slug',item->>'title',item->>'body')
      ON CONFLICT(run_id,article_id,locale) DO UPDATE SET slug=excluded.slug,title=excluded.title,body=excluded.body;
    END LOOP;
    RETURN jsonb_build_object('staged',jsonb_array_length(p_payload));
  ELSIF p_operation='activate' THEN
    IF current_revision IS DISTINCT FROM (p_payload->>'revision')::integer THEN RAISE EXCEPTION 'version_conflict'; END IF;
    SELECT count(*) INTO total FROM dwc.article_search_rows WHERE run_id=p_run;
    IF total<>run.expected_count OR EXISTS(SELECT 1 FROM dwc.article_search_rows WHERE run_id=p_run GROUP BY article_id HAVING count(*)<>2 OR count(DISTINCT slug)<>1) THEN RAISE EXCEPTION 'invalid_input'; END IF;
    UPDATE dwc.article_search_runs SET status='superseded' WHERE id=current_run;
    UPDATE dwc.article_search_runs SET status='active' WHERE id=p_run;
    UPDATE dwc.article_search_state SET active_run=p_run,revision=revision+1 WHERE singleton;
    PERFORM dwc.index_maintenance('rebuild','articles');
    RETURN jsonb_build_object('run',p_run,'active',true);
  ELSE RAISE EXCEPTION 'invalid_operation';
  END IF;
END
$function$;
