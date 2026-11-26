import {createClient} from '@sanity/client';
import {mkdir, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {sanityConfig} from '../lib/config.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const preview = process.env.DWC_BUILD_TARGET === 'preview';
const config = sanityConfig({preview});
const client = createClient(config);
const filter = `_type == "post" && locale in ["en", "es"] && defined(slug.current)`;
const dateFilter = preview ? '' : ' && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now())';
const projection = `_id, _updatedAt, legacyId, locale, "slug": slug.current, title, kicker, subtitle, kind, section, tags, publishedAt, displayDate, sortOrder, seoTitle, seoDescription, sources, body[]{..., _type == "articleImage" => {..., "asset": asset->{_id, url, "dimensions": metadata.dimensions}}},
  cover{alt, caption, "asset": asset->{url, "dimensions": metadata.dimensions}},
  "related": relatedArticles[]->{_id, legacyId, locale}`;
const documents = [];
let after = '';
try {
  while (true) {
    const batch = await client.fetch(`*[${filter}${dateFilter} && _id > $after] | order(_id asc)[0...100]{${projection}}`, {after});
    if (!Array.isArray(batch)) throw Error('Unexpected CMS response');
    documents.push(...batch);
    if (documents.length > 100000) throw Error('CMS build limit reached');
    if (batch.length < 100) break;
    const next = batch.at(-1)._id;
    if (typeof next !== 'string' || next <= after) throw Error('Invalid CMS cursor');
    after = next;
  }
} catch (error) {
  throw Error(`Sanity fetch failed (${error.statusCode || 'invalid response or network error'}). Current deployment was not replaced.`);
}
const catalogs = {en: [], es: []};
const tags = {};
for (const doc of documents) {
  const asset = doc.cover?.asset;
  const url = new URL(asset?.url || 'https://invalid.invalid');
  const dimensions = asset?.dimensions;
  if (url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith(`/images/${config.projectId}/${config.dataset}/`) || !dimensions?.width || !dimensions?.height) throw Error(`Invalid cover for ${doc._id}`);
  if (!doc.title || !doc.publishedAt || !Array.isArray(doc.body) || !Array.isArray(doc.tags) || !doc.tags.length) throw Error(`Missing required article fields: ${doc._id}`);
  for (const tag of doc.tags) tags[tag] = tag;
  const isoDate = doc.publishedAt.slice(0, 10);
  catalogs[doc.locale].push({id:doc.legacyId || doc._id, locale:doc.locale, slug:doc.slug, title:doc.title, dek:doc.subtitle || '', type:doc.kind || 'Article', section:doc.section || 'science', tags:doc.tags,
    isoDate, publishedAt:doc.publishedAt, updatedAt:doc._updatedAt || doc.publishedAt, kicker:doc.kicker || '', coverCaption:doc.cover.caption || '', sortOrder:doc.sortOrder ?? 1000000, date:doc.displayDate || `${isoDate.slice(5,7)}-${isoDate.slice(8,10)}-${isoDate.slice(2,4)}`, image:url.href, alt:doc.cover.alt || '', width:dimensions.width, height:dimensions.height,
    seoTitle:doc.seoTitle || doc.title, seoDescription:doc.seoDescription || doc.subtitle || '', sources:doc.sources || [], blocks:[], body:doc.body,
    relatedArticles:(doc.related || []).filter(item => item && item.locale === doc.locale).map(item => item.legacyId || item._id)});
}
for (const catalog of Object.values(catalogs)) {
  catalog.sort((a,b) => b.isoDate.localeCompare(a.isoDate) || a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
  if (new Set(catalog.map(item => item.slug)).size !== catalog.length) throw Error('Duplicate article slug in the same language.');
}
if (!catalogs.en.length) throw Error('No English articles; current deployment was not replaced.');
const target = path.join(root, '.migration/content', preview ? 'drafts.json' : 'published.json');
await mkdir(path.dirname(target), {recursive:true});
await writeFile(target + '.tmp', JSON.stringify({schema:1, source:'sanity', perspective:preview?'drafts':'published', projectId:config.projectId, dataset:config.dataset, catalogs, tags}) + '\n', {mode:0o600});
await rename(target + '.tmp', target);
console.log(`Prepared ${catalogs.en.length} English and ${catalogs.es.length} Spanish articles from Sanity.`);
