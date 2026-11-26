CREATE FUNCTION dwc.index_prune()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE expired_run text; events integer; articles integer:=0;
BEGIN
  DELETE FROM dwc.outbox WHERE id IN (SELECT id FROM dwc.outbox WHERE processed_at<now()-interval '7 days' ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED);
  GET DIAGNOSTICS events=ROW_COUNT;
  SELECT id INTO expired_run FROM dwc.article_search_runs WHERE status<>'active' AND created_at<now()-interval '7 days' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF FOUND THEN
    DELETE FROM dwc.article_search_rows WHERE (run_id,article_id,locale) IN (
      SELECT a.run_id,a.article_id,a.locale FROM dwc.article_search_rows a WHERE a.run_id=expired_run ORDER BY a.article_id,a.locale LIMIT 500);
    GET DIAGNOSTICS articles=ROW_COUNT;
    IF NOT EXISTS(SELECT 1 FROM dwc.article_search_rows a WHERE a.run_id=expired_run) THEN DELETE FROM dwc.article_search_runs WHERE id=expired_run; END IF;
  END IF;
  RETURN jsonb_build_object('events',events,'articleRows',articles);
END
$function$;
