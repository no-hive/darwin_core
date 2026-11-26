CREATE FUNCTION dwc.search_allowed(p_actor text,p_kind text,p_id text,p_scope text,p_group text,p_author text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,dwc
AS $function$
BEGIN
  IF p_kind='profiles' THEN RETURN p_author='' AND (p_scope<>'mine' OR p_id=p_actor) AND (p_group='' OR EXISTS(SELECT 1 FROM dwc.memberships WHERE profile_id=p_id AND group_id=p_group));
  ELSIF p_kind='groups' THEN RETURN p_author='' AND (p_group='' OR p_group=p_id)
    AND (p_scope<>'mine' OR EXISTS(SELECT 1 FROM dwc.memberships WHERE profile_id=p_actor AND group_id=p_id))
    AND (p_scope<>'discover' OR NOT EXISTS(SELECT 1 FROM dwc.memberships WHERE profile_id=p_actor AND group_id=p_id));
  ELSIF p_kind='research' THEN RETURN p_author='' AND (p_group='' OR EXISTS(SELECT 1 FROM dwc.research_groups WHERE research_id=p_id AND group_id=p_group))
    AND (p_scope<>'mine' OR EXISTS(SELECT 1 FROM dwc.research_groups rg JOIN dwc.memberships m ON m.group_id=rg.group_id WHERE rg.research_id=p_id AND m.profile_id=p_actor));
  ELSIF p_kind='findings' THEN RETURN EXISTS(SELECT 1 FROM dwc.findings f WHERE f.id=p_id
    AND (f.author_id=p_actor OR f.visibility='public' OR (f.visibility='group' AND EXISTS(SELECT 1 FROM dwc.finding_groups fg JOIN dwc.memberships m ON m.group_id=fg.group_id WHERE fg.finding_id=f.id AND m.profile_id=p_actor)))
    AND (p_scope<>'mine' OR f.author_id=p_actor) AND (p_author='' OR f.author_id=p_author)
    AND (p_group='' OR EXISTS(SELECT 1 FROM dwc.finding_groups WHERE finding_id=f.id AND group_id=p_group)));
  ELSIF p_kind='proposals' THEN RETURN p_author='' AND EXISTS(SELECT 1 FROM dwc.proposals p WHERE p.id=p_id AND (p_group='' OR p.group_id=p_group)
    AND (p_scope<>'mine' OR EXISTS(SELECT 1 FROM dwc.memberships WHERE group_id=p.group_id AND profile_id=p_actor)));
  ELSIF p_kind='tasks' THEN RETURN p_group='' AND p_author='' AND EXISTS(SELECT 1 FROM dwc.tasks WHERE id=p_id AND owner_id=p_actor);
  ELSIF p_kind='articles' THEN RETURN p_scope<>'mine' AND p_group='' AND p_author='';
  END IF;
  RETURN false;
END
$function$;
