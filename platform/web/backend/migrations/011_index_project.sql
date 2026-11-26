CREATE FUNCTION dwc.index_project(p_kind text,p_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
DECLARE language text; source record;
BEGIN
  FOR language IN SELECT unnest(ARRAY['en','es']) LOOP
    SELECT * INTO source FROM dwc.search_source(p_kind,p_id,language);
    IF NOT FOUND THEN DELETE FROM dwc.search_documents WHERE kind=p_kind AND entity_id=p_id AND locale=language;
    ELSE
      INSERT INTO dwc.search_documents(kind,entity_id,locale,title,body,href,source_hash)
      VALUES(p_kind,p_id,language,source.title,source.body,source.href,encode(sha256(convert_to(jsonb_build_array(source.title,source.body,source.href)::text,'UTF8')),'hex'))
      ON CONFLICT(locale,kind,entity_id) DO UPDATE SET title=excluded.title,body=excluded.body,href=excluded.href,source_hash=excluded.source_hash,indexed_at=now();
    END IF;
  END LOOP;
END
$function$;
