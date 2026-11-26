CREATE FUNCTION dwc.search(p_subject text,p_query text,p_locale text,p_types text[],p_scope text,p_group text,p_author text,p_mode text,p_score integer,p_kind text,p_id text,p_limit integer)
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE actor_id text; query tsquery; lexemes text[];
BEGIN
  SELECT id INTO actor_id FROM dwc.profiles WHERE subject=p_subject;
  IF NOT FOUND THEN RAISE EXCEPTION 'enrollment_required'; END IF;
  IF p_query IS NULL OR char_length(btrim(p_query)) NOT BETWEEN 2 AND 200 OR p_locale NOT IN ('en','es')
    OR p_scope NOT IN ('all','mine','discover') OR p_mode NOT IN ('search','suggest')
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 101 OR p_types IS NULL OR cardinality(p_types) NOT BETWEEN 1 AND 7
    OR NOT p_types<@ARRAY['profiles','groups','research','findings','proposals','tasks','articles']::text[]
    OR p_score IS NULL OR p_score NOT BETWEEN -1 AND 1000000 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF p_mode='suggest' THEN
    lexemes:=tsvector_to_array(to_tsvector('simple'::regconfig,dwc.search_fold(p_query)));
    IF cardinality(lexemes) NOT BETWEEN 1 AND 8 OR EXISTS(SELECT 1 FROM unnest(lexemes) l WHERE char_length(l)<2) THEN RAISE EXCEPTION 'query_too_broad'; END IF;
    SELECT to_tsquery('simple'::regconfig,string_agg(quote_literal(l)||':*',' & ')) INTO query FROM unnest(lexemes) l;
  ELSE query:=websearch_to_tsquery('simple'::regconfig,dwc.search_fold(p_query));
  END IF;
  IF numnode(query)>64 OR coalesce(querytree(query),'') IN ('','T') THEN RAISE EXCEPTION 'query_too_broad'; END IF;
  RETURN QUERY
    WITH matching AS NOT MATERIALIZED (
      SELECT d.kind,d.entity_id,d.locale,d.source_hash,round(ts_rank_cd(d.terms,query,32)::numeric*1000000)::integer AS score
      FROM dwc.search_documents d WHERE d.locale=p_locale AND d.kind=ANY(p_types) AND d.terms@@query
    )
    SELECT jsonb_build_object('kind',m.kind,'id',m.entity_id,'locale',m.locale,'title',s.title,'summary',left(s.body,300),'href',s.href,'score',m.score)
    FROM matching m CROSS JOIN LATERAL dwc.search_source(m.kind,m.entity_id,m.locale) s
    WHERE dwc.search_allowed(actor_id,m.kind,m.entity_id,p_scope,coalesce(p_group,''),coalesce(p_author,''))
      -- Never expose an old matching term after content was edited/deleted.
      AND m.source_hash=encode(sha256(convert_to(jsonb_build_array(s.title,s.body,s.href)::text,'UTF8')),'hex')
      AND (p_score=-1 OR m.score<p_score OR (m.score=p_score AND (m.kind,m.entity_id)>(p_kind,p_id)))
    ORDER BY m.score DESC,m.kind,m.entity_id LIMIT p_limit;
END
$function$;
