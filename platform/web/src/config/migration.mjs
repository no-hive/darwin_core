/** All article routes use complete Astro documents; legacy remains a build rollback. */
export const ARTICLE_RENDERERS = Object.freeze(['astro', 'legacy']);
export function appRenderer(value=process.env.DWC_APP_RENDERER||'react'){
  if(!['react','legacy'].includes(value))throw Error(`Unsupported DWC_APP_RENDERER: ${value}`);
  return value;
}

export function articleRenderer(value = process.env.DWC_ARTICLE_RENDERER || 'astro') {
  if (!ARTICLE_RENDERERS.includes(value)) {
    throw new Error(`Unsupported DWC_ARTICLE_RENDERER: ${value}`);
  }
  return value;
}
