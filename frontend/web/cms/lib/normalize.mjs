const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kinds = new Set(['Article', 'Guide', 'News']);
function string(value, field, max = 10000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(`Invalid CMS field: ${field}`);
  return value;
}
function key(value, field) {
  string(value, field, 160);
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw Error(`Invalid CMS identifier: ${field}`);
  return value;
}
function media(value, config) {
  if (!value || typeof value !== 'object') throw Error('CMS image is required.');
  const alt = string(value.alt, 'image.alt', 1000);
  if (value.asset?.url) {
    const url = new URL(value.asset.url);
    if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith(`/images/${config.projectId}/${config.dataset}/`)) throw Error('Unexpected CMS asset origin.');
    const {width, height} = value.asset.dimensions || {};
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw Error('CMS image requires intrinsic dimensions.');
    return {image: url.href, alt, width, height};
  }
  const file = string(value.localFile, 'image.localFile', 200);
  if (!/^[a-zA-Z0-9_-]+\.(png|webp)$/.test(file)) throw Error('Invalid legacy media filename.');
  return {image: file, alt};
}
export function normalizeArticle(doc, config) {
  const id = key(doc.articleId, 'articleId');
  const locale = doc.locale;
  if (!['en', 'es'].includes(locale)) throw Error(`Unsupported CMS locale: ${locale}`);
  const slug = string(doc.slug, 'slug', 160);
  if (!slugPattern.test(slug)) throw Error('Invalid article slug.');
  if (!kinds.has(doc.kind)) throw Error('Unsupported article kind.');
  if (!['science','tools','blockchain','projects-reviews'].includes(doc.section)) throw Error('Unsupported Blog section.');
  const publishedAt = string(doc.publishedAt, 'publishedAt', 40);
  const isoDate = publishedAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || !Number.isFinite(Date.parse(publishedAt)) || new Date(isoDate).toISOString().slice(0,10) !== isoDate) throw Error('Invalid CMS publication date.');
  const hero = media(doc.hero, config);
  if (!Array.isArray(doc.tags) || !doc.tags.length || doc.tags.some(tag => !tag)) throw Error('Article requires resolved tags.');
  const tags = doc.tags.map(tag => key(tag.key, 'tag.key'));
  if (new Set(tags).size !== tags.length) throw Error('Duplicate CMS article tag.');
  if (!Array.isArray(doc.blocks) || !doc.blocks.length || doc.blocks.length > 200) throw Error('Invalid CMS article blocks.');
  const blocks = doc.blocks.map(block => {
    const blockId = key(block._key, 'block._key');
    if (block._type === 'dwcSection') return {id: blockId, kind: 'section', heading: string(block.heading, 'heading', 500), text: string(block.text, 'text')};
    if (block._type === 'dwcQuote') return {id: blockId, kind: 'quote', quote: string(block.quote, 'quote')};
    if (block._type === 'dwcImageBlock') return {id: blockId, kind: 'image', ...media(block.media, config)};
    throw Error('Unsupported CMS content block.');
  });
  if (new Set(blocks.map(block => block.id)).size !== blocks.length) throw Error('Duplicate CMS block ID.');
  const authors = (doc.authors || []).map(author => ({id: key(author._id, 'author.id'), name: string(author.name, 'author.name', 200)}));
  return {
    id, locale, slug, section:doc.section, type: doc.kind, title: string(doc.title, 'title', 500), dek: string(doc.dek, 'dek', 3000),
    isoDate, date: doc.displayDate ? string(doc.displayDate,'displayDate',40) : `${isoDate.slice(5,7)}-${isoDate.slice(8,10)}-${isoDate.slice(2,4)}`,
    image: hero.image, alt: hero.alt, width: hero.width, height: hero.height, tags, blocks, authors,
    seoTitle: doc.seo?.title ? string(doc.seo.title, 'seo.title', 500) : undefined,
    seoDescription: doc.seo?.description ? string(doc.seo.description, 'seo.description', 3000) : undefined
  };
}
export function normalizeCatalog(documents, config, {preview = false} = {}) {
  const catalogs = {en: [], es: []};
  const pairs = new Map();
  for (const doc of documents) {
    if (!preview && (/^(drafts|versions)\./.test(doc._id) || /^(drafts|versions)\./.test(doc._originalId || ''))) throw Error('Unpublished document in production input.');
    const article = normalizeArticle(doc, config);
    const pair = pairs.get(article.id) || new Map();
    if (pair.has(article.locale)) throw Error('Duplicate localized CMS article.');
    pair.set(article.locale, article);
    pairs.set(article.id, pair);
  }
  for (const pair of pairs.values()) {
    // Publish only existing locale documents; never synthesize translations.
    if (pair.has('en') && pair.has('es') && pair.get('en').slug !== pair.get('es').slug) throw Error('Localized article slugs must match until locale-specific routes are implemented.');
    for (const [locale, article] of pair) catalogs[locale].push(article);
  }
  for (const catalog of Object.values(catalogs)) {
    catalog.sort((a,b) => b.isoDate.localeCompare(a.isoDate) || a.slug.localeCompare(b.slug));
    if (new Set(catalog.map(article => article.slug)).size !== catalog.length) throw Error('Duplicate CMS slug.');
  }
  if (!catalogs.en.length) throw Error('No English articles. Keep the current deployment until content is ready.');
  return catalogs;
}
