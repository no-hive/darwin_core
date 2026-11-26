/** Internal, language-independent topics. Add these IDs to an article's tags. */
export const ARTICLE_TAGS = Object.freeze({
  'projects-reviews':'Projects Reviews',
  desci:'Decentralized science',
  'open-science':'Open science',
  'citizen-science':'Citizen science',
  'darwin-core':'Darwin Core',
  'data-standards':'Shared data standards',
  interoperability:'Interoperability',
  provenance:'Provenance and supporting evidence',
  'field-notes':'Field notes',
  'observation-methods':'Observation methods',
  habitats:'Habitats and environmental conditions',
  plants:'Plants',
  forest:'Forest ecology',
  marine:'Marine observations',
  taxonomy:'Identification and taxonomy'
});

/** Rank by unique shared tags; equal scores prefer newer articles, then slug. */
export function recommendArticles(current,catalog,limit=3){
  const tags=new Set(current.tags||[]);
  return catalog.filter(article=>article.slug!==current.slug)
    .map(article=>({article,sharedTags:[...new Set(article.tags||[])].filter(tag=>tags.has(tag))}))
    .filter(match=>match.sharedTags.length>0)
    .sort((a,b)=>b.sharedTags.length-a.sharedTags.length
      ||b.article.isoDate.localeCompare(a.article.isoDate)
      ||a.article.slug.localeCompare(b.article.slug))
    .slice(0,Math.max(0,limit));
}

export function validateArticleTags(catalog,allowedTags=ARTICLE_TAGS){
  for(const article of catalog){
    if(!Array.isArray(article.tags)||!article.tags.length)throw new Error(`Article needs internal tags: ${article.slug}`);
    if(new Set(article.tags).size!==article.tags.length)throw new Error(`Duplicate article tag: ${article.slug}`);
    for(const tag of article.tags)if(!Object.hasOwn(allowedTags,tag))throw new Error(`Unknown article tag ${tag}: ${article.slug}`);
  }
}
