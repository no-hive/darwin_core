CREATE FUNCTION dwc.index_maintenance(p_operation text,p_kind text DEFAULT NULL,p_ids bigint[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE affected integer;
BEGIN
  IF p_operation='rebuild' THEN
    IF p_kind IS NULL OR p_kind NOT IN ('profiles','groups','research','findings','proposals','tasks','articles') THEN RAISE EXCEPTION 'invalid_input'; END IF;
    -- Always start at the beginning: an older in-flight continuation may have
    -- passed IDs newly introduced by a CMS generation or a restored database.
    INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES('rebuild',p_kind,'search.rebuild');
  ELSIF p_operation='retry' THEN
    IF p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'invalid_input'; END IF;
    UPDATE dwc.outbox SET attempts=0,available_at=now(),last_error_code=NULL WHERE id=ANY(p_ids) AND processed_at IS NULL AND attempts=8;
    GET DIAGNOSTICS affected=ROW_COUNT;
    RETURN jsonb_build_object('retried',affected);
  ELSIF p_operation<>'status' THEN RAISE EXCEPTION 'invalid_operation';
  END IF;
  RETURN jsonb_build_object(
    'pending',(SELECT count(*) FROM dwc.outbox WHERE processed_at IS NULL AND attempts<8),
    'dead',(SELECT count(*) FROM dwc.outbox WHERE processed_at IS NULL AND attempts=8),
    'oldestPendingAt',(SELECT min(created_at) FROM dwc.outbox WHERE processed_at IS NULL AND attempts<8),
    'deadJobs',(SELECT coalesce(jsonb_agg(j),'[]'::jsonb) FROM (SELECT id::text,last_error_code FROM dwc.outbox WHERE processed_at IS NULL AND attempts=8 ORDER BY id LIMIT 100) j));
END
$function$;
