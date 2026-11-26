import {readFileSync} from 'node:fs';
import path from 'node:path';
let cachedSnapshot;
function snapshot() {
  if (!cachedSnapshot) {
    const file = process.env.DWC_CONTENT_SNAPSHOT || path.join(process.cwd(), '.migration/content/published.json');
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const perspective = process.env.DWC_BUILD_TARGET === 'preview' ? 'drafts' : 'published';
    if (data.schema !== 1 || data.source !== 'sanity' || data.perspective !== perspective || data.projectId !== (process.env.SANITY_PROJECT_ID || '0ypa3y83') || data.dataset !== (process.env.SANITY_DATASET || 'production')) throw Error('CMS snapshot does not match this build.');
    cachedSnapshot = data;
  }
  return cachedSnapshot;
}
export const contentTags = () => snapshot().tags;
export function localizedArticles(locale) {
  if (!['en','es'].includes(locale)) throw Error(`Unsupported article locale: ${locale}`);
  const catalogs = snapshot().catalogs;
  return catalogs[locale].map(article => ({...article, availableLocales:['en','es'].filter(lang => catalogs[lang].some(candidate => candidate.id === article.id && candidate.slug === article.slug))}));
}
