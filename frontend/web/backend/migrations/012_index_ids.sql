CREATE FUNCTION dwc.index_ids(p_kind text,p_after text,p_limit integer)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
  SELECT id FROM (
    (SELECT id FROM dwc.profiles WHERE p_kind='profiles' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT id FROM dwc.groups WHERE p_kind='groups' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT id FROM dwc.research WHERE p_kind='research' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT id FROM dwc.findings WHERE p_kind='findings' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT id FROM dwc.proposals WHERE p_kind='proposals' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT id FROM dwc.tasks WHERE p_kind='tasks' AND id>p_after ORDER BY id LIMIT 100)
    UNION (SELECT DISTINCT a.article_id FROM dwc.article_search_rows a JOIN dwc.article_search_state s ON s.active_run=a.run_id WHERE p_kind='articles' AND a.article_id>p_after ORDER BY a.article_id LIMIT 100)
    UNION (SELECT DISTINCT entity_id FROM dwc.search_documents WHERE kind=p_kind AND entity_id>p_after ORDER BY entity_id LIMIT 100)
  ) candidates ORDER BY id LIMIT greatest(0,least(p_limit,100))
$function$;
