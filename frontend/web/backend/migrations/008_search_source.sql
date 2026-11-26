CREATE FUNCTION dwc.search_source(p_kind text,p_id text,p_locale text)
RETURNS TABLE(title text,body text,href text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
BEGIN
  IF p_locale NOT IN ('en','es') THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF p_kind='profiles' THEN
    RETURN QUERY SELECT p.name,concat_ws(' ',p.job,p.handle),'/'||p_locale||'/app/profile/?profile='||p.id FROM dwc.profiles p WHERE p.id=p_id;
  ELSIF p_kind='groups' THEN
    RETURN QUERY SELECT g.name,left(concat_ws(' ',coalesce(g.description->>p_locale,g.description->>'en'),coalesce(g.rules->>p_locale,g.rules->>'en'),coalesce(g.news->>p_locale,g.news->>'en')),12000),'/'||p_locale||'/app/groups/'||g.id||'/' FROM dwc.groups g WHERE g.id=p_id;
  ELSIF p_kind='research' THEN
    RETURN QUERY SELECT left(coalesce(r.title->>p_locale,r.title->>'en',''),500),left(coalesce(r.description->>p_locale,r.description->>'en',''),12000),'/'||p_locale||'/app/research/'||r.id||'/' FROM dwc.research r WHERE r.id=p_id;
  ELSIF p_kind='findings' THEN
    RETURN QUERY SELECT f.title,left(concat_ws(' ',f.scientific_name,f.description,f.location,f.evidence,p.name),12000),'/'||p_locale||'/app/records/view/?record='||f.id FROM dwc.findings f JOIN dwc.profiles p ON p.id=f.author_id WHERE f.id=p_id;
  ELSIF p_kind='proposals' THEN
    RETURN QUERY SELECT left(coalesce(p.title->>p_locale,p.title->>'en',''),500),left(coalesce(p.description->>p_locale,p.description->>'en',''),12000),'/'||p_locale||'/app/groups/'||p.group_id||'/proposals/'||p.id||'/' FROM dwc.proposals p WHERE p.id=p_id;
  ELSIF p_kind='tasks' THEN
    RETURN QUERY SELECT t.title,t.status,'/'||p_locale||'/app/tasks/' FROM dwc.tasks t WHERE t.id=p_id;
  ELSIF p_kind='articles' THEN
    RETURN QUERY SELECT a.title,a.body,'/'||a.locale||'/blog/'||a.slug||'/' FROM dwc.article_search_rows a JOIN dwc.article_search_state s ON s.active_run=a.run_id WHERE a.article_id=p_id AND a.locale=p_locale;
  ELSE RAISE EXCEPTION 'invalid_input';
  END IF;
END
$function$;
