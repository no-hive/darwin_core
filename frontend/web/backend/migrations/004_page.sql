CREATE FUNCTION dwc.page(p_subject text,p_kind text,p_after text,p_limit integer,p_id text DEFAULT NULL)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, dwc
AS $function$
DECLARE actor_id text;
BEGIN
  SELECT id INTO actor_id FROM dwc.profiles WHERE subject=p_subject;
  IF NOT FOUND THEN RAISE EXCEPTION 'enrollment_required'; END IF;
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 101 OR char_length(coalesce(p_after,''))>80 THEN RAISE EXCEPTION 'invalid_input'; END IF;
  IF p_kind='profiles' THEN
    RETURN QUERY SELECT (to_jsonb(p)-'subject'-'month'-'year') || CASE WHEN p.id=actor_id THEN jsonb_build_object('month',p.month,'year',p.year) ELSE '{}'::jsonb END
      FROM dwc.profiles p WHERE p.id>coalesce(p_after,'') AND (p_id IS NULL OR p.id=p_id) ORDER BY p.id LIMIT p_limit;
  ELSIF p_kind='groups' THEN
    RETURN QUERY SELECT to_jsonb(g) || jsonb_build_object(
      'member',EXISTS(SELECT 1 FROM dwc.memberships m WHERE m.group_id=g.id AND m.profile_id=actor_id),
      'memberCount',(SELECT count(*) FROM dwc.memberships m WHERE m.group_id=g.id))
      FROM dwc.groups g WHERE g.id>coalesce(p_after,'') AND (p_id IS NULL OR g.id=p_id) ORDER BY g.id LIMIT p_limit;
  ELSIF p_kind='research' THEN
    RETURN QUERY SELECT to_jsonb(r) FROM dwc.research r WHERE r.id>coalesce(p_after,'') AND (p_id IS NULL OR r.id=p_id) ORDER BY r.id LIMIT p_limit;
  ELSIF p_kind='findings' THEN
    RETURN QUERY SELECT to_jsonb(f) FROM dwc.findings f WHERE f.id>coalesce(p_after,'') AND (p_id IS NULL OR f.id=p_id)
      AND (f.author_id=actor_id OR f.visibility='public' OR (f.visibility='group' AND EXISTS(
        SELECT 1 FROM dwc.finding_groups fg JOIN dwc.memberships m ON m.group_id=fg.group_id WHERE fg.finding_id=f.id AND m.profile_id=actor_id)))
      ORDER BY f.id LIMIT p_limit;
  ELSIF p_kind='tasks' THEN
    RETURN QUERY SELECT to_jsonb(t) FROM dwc.tasks t WHERE t.owner_id=actor_id AND t.id>coalesce(p_after,'') AND (p_id IS NULL OR t.id=p_id) ORDER BY t.id LIMIT p_limit;
  ELSIF p_kind='proposals' THEN
    RETURN QUERY SELECT to_jsonb(p) || jsonb_build_object(
      'choice',(SELECT v.choice FROM dwc.votes v WHERE v.proposal_id=p.id AND v.profile_id=actor_id),
      'totals',jsonb_build_object(
        'for',coalesce((SELECT sum(v.weight) FROM dwc.votes v WHERE v.proposal_id=p.id AND v.choice='for'),0),
        'against',coalesce((SELECT sum(v.weight) FROM dwc.votes v WHERE v.proposal_id=p.id AND v.choice='against'),0),
        'abstain',coalesce((SELECT sum(v.weight) FROM dwc.votes v WHERE v.proposal_id=p.id AND v.choice='abstain'),0)))
      FROM dwc.proposals p WHERE p.id>coalesce(p_after,'') AND (p_id IS NULL OR p.id=p_id) ORDER BY p.id LIMIT p_limit;
  ELSE RAISE EXCEPTION 'invalid_input';
  END IF;
END
$function$;
