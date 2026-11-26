// A single normalized catalog is shared by Astro and the legacy Blog assembler.
// local-provider adapts either local data or a server-prepared Sanity snapshot.
// Sanity SDKs/tokens are confined to cms/scripts/fetch-content.mjs.
export { localContentProvider as contentProvider } from './local-provider';
export type { Article, ArticleBlock, Locale, PublishedContentProvider } from './contracts';
