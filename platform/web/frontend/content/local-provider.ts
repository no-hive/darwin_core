import { localizedArticles } from '../../src/content/article-catalog.mjs';
import type { Article, ArticleBlock, ArticleKind, Locale, PublishedContentProvider } from './contracts';

// Adapts the published Sanity snapshot for the site's existing page layouts.
interface LocalArticle {
  id: string;
  slug: string;
  title: string;
  dek: string;
  type: ArticleKind;
  date: string;
  isoDate: string;
  tags: string[];
  body?: unknown[];
  relatedArticles?: string[];
  image: string;
  alt: string;
  blocks: Array<{ id: string; kind: string; image?: string; alt?: string; width?: number; height?: number; quote?: string; heading?: string; text?: string }>;
}

function adaptArticle(source: LocalArticle, locale: Locale): Article {
  return {
    ...source,
    id: source.id,
    locale,
    tags: [...source.tags],
    blocks: source.blocks.map((block): ArticleBlock => {
      const id = block.id;
      if (typeof block.image === 'string' && typeof block.alt === 'string') {
        return { kind: 'image', id, image: block.image, alt: block.alt, width: block.width, height: block.height };
      }
      if (typeof block.quote === 'string') return { kind: 'quote', id, quote: block.quote };
      if (typeof block.heading === 'string' && typeof block.text === 'string') {
        return { kind: 'section', id, heading: block.heading, text: block.text };
      }
      throw new Error(`Unsupported article block: ${source.id}/${id}`);
    })
  };
}

const catalogs = new Map<Locale, readonly Article[]>();
export const localContentProvider: PublishedContentProvider = {
  async listArticles(locale) {
    let catalog = catalogs.get(locale);
    if (!catalog) {
      catalog = (localizedArticles(locale) as LocalArticle[]).map(article => adaptArticle(article, locale));
      catalogs.set(locale, catalog);
    }
    return catalog;
  },
  async getArticleBySlug(locale, slug) {
    return (await this.listArticles(locale)).find(article => article.slug === slug) ?? null;
  }
};
