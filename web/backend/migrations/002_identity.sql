CREATE FUNCTION dwc.identity(p_subject text, p_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, dwc
AS $function$
DECLARE actor dwc.profiles%ROWTYPE;
BEGIN
  IF p_subject IS NULL OR char_length(p_subject) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_name IS NOT NULL THEN
    INSERT INTO dwc.profiles(subject, name)
    VALUES(p_subject, left(coalesce(nullif(btrim(p_name),''),'Researcher'),100))
    ON CONFLICT (subject) DO NOTHING RETURNING * INTO actor;
    IF FOUND THEN INSERT INTO dwc.outbox(entity_type,entity_id,operation) VALUES('profiles',actor.id,'profile.create'); END IF;
  END IF;
  SELECT * INTO actor FROM dwc.profiles WHERE subject=p_subject;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN to_jsonb(actor) - 'subject';
END
$function$;
